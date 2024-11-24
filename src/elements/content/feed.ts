import { get, inCache } from "../blocks/cache";
import { post, profile } from "../ui/card";

export type feedNSID =
  | "app.bsky.feed.getAuthorFeed"
  | "app.bsky.feed.getFeed"
  | "app.bsky.feed.getActorLikes"
  | "app.bsky.feed.searchPosts"
  | "app.bsky.feed.getTimeline"
  | "app.bsky.graph.getFollows"
  | "app.bsky.graph.getFollowers";

export async function hydrateFeed(
  nsid: feedNSID,
  params: any,
  forceReload: boolean = false,
): Promise<HTMLElement[]> {
  const type = nsid.split(".")[2] === "feed";
  const dataLocation = type
    ? nsid === "app.bsky.feed.searchPosts"
      ? "posts"
      : "feed"
    : nsid === "app.bsky.graph.getFollows"
      ? "follows"
      : "followers";
  async function _load(forceReload: boolean = false) {
    return await load(
      nsid,
      params,
      dataLocation,
      type ? post : profile,
      forceReload,
    );
  }
  let { items, cursor } = await _load(forceReload);
  params.cursor = cursor;
  if (cursor && inCache(nsid, params)) {
    while (inCache(nsid, params)) {
      const { items: newItems, cursor } = await _load();
      params.cursor = cursor;
      items.push(...newItems);
    }
  }
  if (params.cursor != undefined)
    window.onscroll = await loadOnscroll(_load, params);
  else window.onscroll = null;
  return items;
}

type QueryWithCursor =
  | "app.bsky.graph.getFollows"
  | "app.bsky.graph.getFollowers"
  | "app.bsky.feed.getAuthorFeed"
  | "app.bsky.feed.getFeed"
  | "app.bsky.feed.getActorLikes"
  | "app.bsky.feed.searchPosts"
  | "app.bsky.feed.getTimeline";

export async function load(
  nsid: QueryWithCursor,
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

export async function loadOnscroll(load: Function, params: any) {
  return async function (ev) {
    if (
      window.innerHeight + Math.round(window.scrollY) >=
      document.body.offsetHeight
    ) {
      const content = document.getElementById("content");
      const { items, cursor } = await load();
      content.append(...items);
      params.cursor = cursor;
      if (cursor === undefined) window.onscroll = null;
    }
  };
}
