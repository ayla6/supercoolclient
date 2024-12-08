import { get, inCache } from "../utils/cache";
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
  params: { [key: string]: any },
  reload: boolean = false,
  func: (item: any) => HTMLElement = postCard,
): Promise<HTMLElement[]> {
  const dataLocation = dataLocations[nsid] ?? "feed";
  async function _load(reload: boolean = false) {
    return await loadFeed(nsid, params, dataLocation, func, reload);
  }
  let { items, cursor } = await _load(reload);
  params.cursor = cursor;
  if (cursor && inCache(nsid, params)) {
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
  params: { [key: string]: any },
  dataLocation: string,
  func: (item: any) => HTMLElement,
  reload: boolean = false,
): Promise<{ items: HTMLElement[]; cursor: string }> {
  const { data } = await get(nsid, { params: params }, reload);
  const _func = (item: any) => func(item);
  const items = data[dataLocation].map(_func);
  return { items, cursor: data.cursor };
}

let feedBeingLoaded = false;
export async function loadOnScroll(load: Function, params: any) {
  const content = document.getElementById("content");
  return async function (ev) {
    if (
      !feedBeingLoaded &&
      window.innerHeight + Math.round(window.scrollY) + 1000 >=
        document.body.offsetHeight
    ) {
      feedBeingLoaded = true;
      const { items, cursor } = await load();
      content.append(...items);
      params.cursor = cursor;
      if (cursor === undefined) window.onscroll = null;
      feedBeingLoaded = false;
    }
  };
}
