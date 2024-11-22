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
  forcereload: boolean = false,
): Promise<HTMLElement[]> {
  const dataLocation = nsid === "app.bsky.feed.searchPosts" ? "posts" : "feed";
  async function _load() {
    return await load(nsid, params, dataLocation, post, forcereload);
  }
  let { items, cursor } = await _load();
  params.cursor = cursor;
  if (inCache(nsid, params)) {
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
