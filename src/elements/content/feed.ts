import { get, inCache } from "../blocks/cache";
import { postCard } from "../ui/post_card";

export type feedNSID =
  | "app.bsky.feed.getAuthorFeed"
  | "app.bsky.feed.getFeed"
  | "app.bsky.feed.getActorLikes"
  | "app.bsky.feed.searchPosts"
  | "app.bsky.feed.getTimeline"
  | "app.bsky.graph.getFollows"
  | "app.bsky.graph.getFollowers"
  | "app.bsky.feed.getLikes"
  | "app.bsky.feed.getRepostedBy"
  | "app.bsky.feed.getQuotes";

const dataLocations = {
  "app.bsky.feed.searchPosts": "posts",
  "app.bsky.graph.getFollows": "follows",
  "app.bsky.graph.getFollowers": "followers",
  "app.bsky.feed.getLikes": "likes",
  "app.bsky.feed.getRepostedBy": "repostedBy",
  "app.bsky.feed.getQuotes": "posts",
};

export async function hydrateFeed(
  nsid: feedNSID,
  params: any,
  forceReload: boolean = false,
  type: Function = postCard,
): Promise<HTMLElement[]> {
  const dataLocation = dataLocations[nsid] ?? "feed";
  async function _load(forceReload: boolean = false) {
    return await loadFeed(nsid, params, dataLocation, type, forceReload);
  }
  let { items, cursor } = await _load(forceReload);
  params.cursor = cursor;
  if (cursor && inCache(nsid, params)) {
    console.log("maaaa");
    while (inCache(nsid, params)) {
      const { items: newItems, cursor } = await _load();
      params.cursor = cursor;
      items.push(...newItems);
    }
  }
  if (params.cursor != undefined)
    window.onscroll = await loadOnScroll(_load, params);
  else window.onscroll = null;
  return items;
}

async function loadFeed(
  nsid: feedNSID,
  params: any,
  dataLocation: string,
  func: Function,
  forceReload: boolean = false,
): Promise<{ items: HTMLElement[]; cursor: string }> {
  let items = [];
  const { data } = await get(nsid, { params: params }, forceReload);
  const array = data[dataLocation];
  const cursor = data.cursor;
  for (const item of array) {
    items.push(func(item));
  }
  return { items, cursor };
}

let feedBeingLoaded = false;
export async function loadOnScroll(load: Function, params: any) {
  return async function (ev) {
    if (
      !feedBeingLoaded &&
      window.innerHeight + Math.round(window.scrollY) + 1000 >=
        document.body.offsetHeight
    ) {
      feedBeingLoaded = true;
      const content = document.getElementById("content");
      const { items, cursor } = await load();
      content.append(...items);
      params.cursor = cursor;
      if (cursor === undefined) window.onscroll = null;
      feedBeingLoaded = false;
    }
  };
}
