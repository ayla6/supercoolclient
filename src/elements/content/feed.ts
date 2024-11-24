import { inCache } from "../blocks/cache";
import { post } from "../ui/card";
import { load, loadOnscroll } from "./load";

export type feedNSID =
  | "app.bsky.feed.getAuthorFeed"
  | "app.bsky.feed.getFeed"
  | "app.bsky.feed.getActorLikes"
  | "app.bsky.feed.searchPosts"
  | "app.bsky.feed.getTimeline";

export async function feed(
  nsid: feedNSID,
  params: any,
  forceReload: boolean = false,
): Promise<HTMLElement[]> {
  const dataLocation = nsid === "app.bsky.feed.searchPosts" ? "posts" : "feed";
  async function _load(forceReload: boolean = false) {
    return await load(nsid, params, dataLocation, post, forceReload);
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

export async function timeline(
  forceReload: boolean = false,
): Promise<HTMLElement[]> {
  let params = { cursor: undefined };
  async function _load(forceReload: boolean = false) {
    return await load(
      "app.bsky.feed.getTimeline",
      params,
      "feed",
      post,
      forceReload,
    );
  }
  let { items, cursor } = await _load(forceReload);
  params.cursor = cursor;
  if (inCache("app.bsky.feed.getTimeline", params)) {
    while (inCache("app.bsky.feed.getTimeline", params)) {
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
