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
  console.log("hello");
  const dataLocation = dataLocations[nsid] ?? "feed";

  const loadFeed = async () => {
    const { data } = await _rpc.get(nsid, {
      params: params,
    });
    if (settings.viewBlockedPosts)
      await loadBlockedPosts(data as loadBlockedPostsTypes, nsid);
    const rearrangedFeed: AppBskyFeedDefs.FeedViewPost[][] = [];
    const postPositions: { [key: string]: number } = {};
    const hasReplies = new Set<string>();
    // this looks so stupid :/
    for (const post of data[dataLocation].reverse()) {
      let replyPosition =
        postPositions[post.reply?.parent?.uri] ??
        postPositions[post.reply?.root?.uri] ??
        rearrangedFeed.length;
      if (rearrangedFeed[replyPosition]) {
        rearrangedFeed[replyPosition].push(post);
      } else rearrangedFeed.push([post]);
      postPositions[post.post.uri] = replyPosition;
      if (post.reply) {
        hasReplies.add(post.reply.parent.uri);
        hasReplies.add(post.reply.root.uri);
      }
    }
    if (!params.cursor) output.replaceChildren();
    rearrangedFeed
      .reverse()
      .flat()
      .forEach((item: AppBskyFeedDefs.FeedViewPost) =>
        output.appendChild(
          postCard(item, { hasReplies: hasReplies.has(item.post.uri) }),
        ),
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
