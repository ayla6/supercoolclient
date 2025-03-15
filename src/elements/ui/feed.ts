import { postCard } from "../ui/post_card";
import { rpc, rpcPublic } from "../../login";
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

type RecursivePostArray = Array<
  [
    post:
      | AppBskyFeedDefs.FeedViewPost
      | AppBskyFeedDefs.PostView
      | AppBskyFeedDefs.ThreadViewPost,
    replies?: RecursivePostArray,
  ]
>;

const dataLocations = {
  "app.bsky.feed.searchPosts": "posts",
  "app.bsky.graph.getFollows": "follows",
  "app.bsky.graph.getFollowers": "followers",
  "app.bsky.feed.getLikes": "likes",
  "app.bsky.feed.getRepostedBy": "repostedBy",
  "app.bsky.feed.getQuotes": "posts",
  "dataapp.bsky.actor.searchActors": "actors",
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

  const loadFeed = async () => {
    const { data } = await _rpc.get(nsid, {
      params: params,
    });
    if (settings.viewBlockedPosts)
      await loadBlockedPosts(data as loadBlockedPostsTypes, nsid);
    const rearrangedFeed: RecursivePostArray[] = [];
    const postPositions: { [key: string]: RecursivePostArray } = {};
    const hasReplies = new Set<string>();
    // this looks so stupid :/
    for (const post of data[dataLocation] as AppBskyFeedDefs.FeedViewPost[]) {
      if (postPositions[post.post.uri]) continue;
      let position: RecursivePostArray =
        postPositions[post.reply?.parent?.uri] ??
        postPositions[post.reply?.root?.uri];
      if (position) {
        position[1].push(post);
      } else {
        position = [post, []] as any;
        postPositions[post.post.uri] = position;
        if (post.reply) {
          if (
            post.reply.parent &&
            post.reply.parent.$type === "app.bsky.feed.defs#postView"
          ) {
            position = [post.reply.parent, position] as any;
            postPositions[post.reply.parent.uri] = position;
          }
          if (
            post.reply.root &&
            post.reply.root.$type === "app.bsky.feed.defs#postView" &&
            post.reply.root.uri !== post.reply.parent.uri
          ) {
            position = [post.reply.root, position] as any;
            postPositions[post.reply.root.uri] = position;
          }
        }
        rearrangedFeed.push(position);
      }

      hasReplies.add(post.reply?.parent.uri);
      hasReplies.add(post.reply?.root.uri);
    }
    if (!params.cursor) output.replaceChildren();
    rearrangedFeed.flat(100000).forEach((post: any) => {
      if (post[0]) return;
      return output.appendChild(
        postCard(post, {
          hasReplies: hasReplies.has("post" in post ? post.post.uri : post.uri),
        }),
      );
    });
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
