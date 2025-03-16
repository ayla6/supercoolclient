import { postCard } from "../ui/post_card";
import { rpc, rpcPublic, sessionData } from "../../login";
import { OnscrollFunction } from "../../types";
import { XRPC } from "@atcute/client";
import { settings } from "../../settings";
import {
  AppBskyFeedGetAuthorFeed,
  AppBskyFeedGetFeed,
  AppBskyFeedGetTimeline,
  AppBskyFeedSearchPosts,
  AppBskyFeedDefs,
  AppBskyEmbedRecord,
  AppBskyFeedPost,
} from "@atcute/client/lexicons";

export type feedNSID =
  | "app.bsky.feed.getAuthorFeed"
  | "app.bsky.feed.getFeed"
  | "app.bsky.feed.searchPosts"
  | "app.bsky.feed.getTimeline"
  | "app.bsky.feed.getActorLikes"
  | "app.bsky.feed.getQuotes"
  | "app.bsky.graph.getFollows"
  | "app.bsky.graph.getFollowers"
  | "app.bsky.feed.getLikes"
  | "app.bsky.feed.getRepostedBy"
  | "app.bsky.actor.searchActors"
  | "app.bsky.graph.getKnownFollowers";

type RecursivePost = {
  post:
    | AppBskyFeedDefs.FeedViewPost
    | AppBskyFeedDefs.PostView
    | AppBskyFeedDefs.ThreadViewPost;
  reply?: RecursivePost;
};

const dataLocations = {
  "app.bsky.feed.searchPosts": "posts",
  "app.bsky.graph.getFollows": "follows",
  "app.bsky.graph.getFollowers": "followers",
  "app.bsky.feed.getLikes": "likes",
  "app.bsky.feed.getRepostedBy": "repostedBy",
  "app.bsky.feed.getQuotes": "posts",
  "app.bsky.actor.searchActors": "actors",
  "app.bsky.graph.getKnownFollowers": "followers",
};

type loadBlockedPostsTypes =
  | AppBskyFeedGetTimeline.Output
  | AppBskyFeedGetFeed.Output
  | AppBskyFeedGetAuthorFeed.Output
  | AppBskyFeedSearchPosts.Output;
const loadBlockedPosts = async (
  data: loadBlockedPostsTypes,
  nsid: feedNSID,
) => {
  const posts = data[dataLocations[nsid] ?? "feed"] as (
    | AppBskyFeedDefs.FeedViewPost
    | AppBskyFeedDefs.PostView
    | AppBskyFeedDefs.ThreadViewPost
  )[];
  const postsToLoad: Set<string> = new Set();
  const postsWithBlockedEmbeds: AppBskyFeedDefs.PostView[] = [];
  for (const postHousing of posts) {
    const post = "post" in postHousing ? postHousing.post : postHousing;
    const embedType = post?.embed?.$type;
    if (
      (embedType === "app.bsky.embed.record#view" ||
        embedType === "app.bsky.embed.recordWithMedia#view") &&
      (post.embed as AppBskyEmbedRecord.View).record.$type ===
        "app.bsky.embed.record#viewBlocked"
    ) {
      postsToLoad.add((post.embed as AppBskyEmbedRecord.View).record.uri);
      postsWithBlockedEmbeds.push(post);
    }
  }
  if (postsToLoad.size === 0) return;
  const postsToLoadArray = Array.from(postsToLoad);
  const loadedPosts: { [key: string]: AppBskyFeedDefs.PostView } = {};
  for (let i = 0; i < postsToLoadArray.length; i += 25) {
    const urisBatch = postsToLoadArray.slice(i, i + 25);
    const posts = await rpcPublic.get("app.bsky.feed.getPosts", {
      params: {
        uris: urisBatch,
      },
    });
    for (const post of posts.data.posts) {
      loadedPosts[post.uri] = post;
    }
  }
  for (const post of postsWithBlockedEmbeds) {
    post.embed["isLoadedBlockedPost"] = true;
    (post.embed as AppBskyEmbedRecord.View).record = loadedPosts[
      (post.embed as AppBskyEmbedRecord.View).record.uri
    ] as any;
  }
};

let feedBeingLoaded = false;
export const hydrateFeed = async (
  output: HTMLElement,
  nsid: feedNSID,
  params: { [key: string]: any },
  func: (item: any) => HTMLDivElement = postCard,
  _rpc: XRPC = rpc,
): Promise<OnscrollFunction> => {
  if (
    nsid === "app.bsky.feed.getFeed" ||
    nsid === "app.bsky.feed.getAuthorFeed" ||
    nsid === "app.bsky.feed.searchPosts" ||
    nsid === "app.bsky.feed.getTimeline"
  )
    return hydratePostFeed(output, nsid, params, _rpc);
  const dataLocation = dataLocations[nsid] ?? "feed";

  const loadFeed = async () => {
    const { data } = await _rpc.get(nsid, { params: params });
    //if (settings.viewBlockedPosts && func === postCard)
    //  await loadBlockedPosts(data as loadBlockedPostsTypes, nsid);
    if (!params.cursor) output.replaceChildren();
    data[dataLocation].forEach((item: Object) =>
      output.appendChild(func(item)),
    );
    return data;
  };

  const data = await loadFeed();

  if (data.cursor === undefined) return;
  params.cursor = data.cursor;
  return async () => {
    if (feedBeingLoaded) return;

    const bottomPosition = window.innerHeight + Math.round(window.scrollY);
    const shouldLoad = bottomPosition + 2000 >= document.body.offsetHeight;

    if (!shouldLoad) return;

    try {
      feedBeingLoaded = true;
      const data = await loadFeed();
      params.cursor = data.cursor;
      if (params.cursor === undefined) window.onscroll = null;
    } finally {
      feedBeingLoaded = false;
    }
  };
};

export const hydratePostFeed = async (
  output: HTMLElement,
  nsid: feedNSID,
  params: { [key: string]: any },
  _rpc: XRPC = rpc,
): Promise<OnscrollFunction> => {
  const dataLocation = dataLocations[nsid] ?? "feed";
  const hideNonFollowingRepliesOnTimeline =
    settings.showNonFollowingRepliesOnTimeline ||
    nsid !== "app.bsky.feed.getTimeline";

  const loadFeed = async () => {
    const { data } = await _rpc.get(nsid, {
      params: params,
    });
    if (settings.viewBlockedPosts)
      await loadBlockedPosts(data as loadBlockedPostsTypes, nsid);
    const rearrangedFeed: Map<string, boolean> = new Map();
    const posts: { [key: string]: RecursivePost } = {};
    for (const postHousing of data[
      dataLocation
    ] as AppBskyFeedDefs.FeedViewPost[]) {
      const post = "post" in postHousing ? postHousing.post : postHousing;
      const postUri = post.uri;
      if (posts[postUri]) posts[postUri].post = post;
      else posts[postUri] = { post };
      rearrangedFeed.set(postUri, true);
      if (
        !postHousing.reason &&
        postHousing.reply &&
        postHousing.reply.parent &&
        postHousing.reply.parent.$type === "app.bsky.feed.defs#postView"
      ) {
        const parentUri = postHousing.reply.parent.uri;
        if (posts[parentUri]?.reply) {
          const toBeChangedPost = posts[parentUri].reply.post;
          rearrangedFeed.set(
            "post" in toBeChangedPost
              ? toBeChangedPost.post.uri
              : toBeChangedPost.uri,
            true,
          );
          rearrangedFeed.set(parentUri, true);
          posts[parentUri].reply = posts[postUri];
        } else {
          if (
            hideNonFollowingRepliesOnTimeline ||
            postHousing.reply.parent.author?.viewer.following ||
            postHousing.reply.parent.author.did === sessionData.did
          ) {
            const reply = (
              postHousing.reply.parent.record as AppBskyFeedPost.Record
            )?.reply;
            const record = {
              post: postHousing.reply.parent,
            } as AppBskyFeedDefs.FeedViewPost;
            if (reply) {
              record.reply = reply as any;
              if (record.reply.parent) {
                record.reply.parent.$type = "app.bsky.feed.defs#postView";
                (record.reply.parent as any).author =
                  postHousing.reply.grandparentAuthor;
              }
            }
            posts[parentUri] = {
              post: record,
              reply: posts[postUri],
            };
            rearrangedFeed.delete(parentUri);
            rearrangedFeed.set(parentUri, true);
          }
        }
        rearrangedFeed.set(postUri, false);
      }
    }
    if (!params.cursor) output.replaceChildren();
    for (const postUri of rearrangedFeed.keys()) {
      if (!rearrangedFeed.get(postUri)) continue;
      const post = posts[postUri].post;
      output.appendChild(
        postCard(post, {
          hasReplies: Boolean(
            posts["post" in post ? post.post.uri : post.uri].reply,
          ),
        }),
      );
      let currentPost = posts[postUri];
      while (currentPost.reply) {
        const replyPost = currentPost.reply.post;
        output.appendChild(
          postCard(replyPost, {
            hasReplies: Boolean(currentPost.reply.reply),
          }),
        );
        currentPost = currentPost.reply;
      }
    }
    return data;
  };

  const data = await loadFeed();

  if (data.cursor === undefined) return;
  params.cursor = data.cursor;
  return async () => {
    if (feedBeingLoaded) return;

    const bottomPosition = window.innerHeight + Math.round(window.scrollY);
    const shouldLoad = bottomPosition + 2000 >= document.body.offsetHeight;

    if (!shouldLoad) return;

    try {
      feedBeingLoaded = true;
      const data = await loadFeed();
      params.cursor = data.cursor;
      if (params.cursor === undefined) window.onscroll = null;
    } finally {
      feedBeingLoaded = false;
    }
  };
};
