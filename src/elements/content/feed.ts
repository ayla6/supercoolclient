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
): Promise<HTMLElement[]> {
  const dataLocation = nsid === "app.bsky.feed.searchPosts" ? "posts" : "feed";
  async function _load() {
    return await load(nsid, params, dataLocation, post);
  }
  const { items, nextPage } = await _load();
  if (nextPage != undefined)
    window.onscroll = await loadOnscroll(_load, nextPage);
  else window.onscroll = null;
  return items;
}
