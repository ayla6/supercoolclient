import { post } from "../ui/card";
import { load } from "./load";

export async function feed(
  nsid:
    | "app.bsky.feed.getAuthorFeed"
    | "app.bsky.feed.getFeed"
    | "app.bsky.feed.getActorLikes"
    | "app.bsky.feed.searchPosts"
    | "app.bsky.feed.getTimeline",
  params: any,
) {
  const content = document.getElementById("content");
  const dataLocation = nsid === "app.bsky.feed.searchPosts" ? "posts" : "feed";
  async function _load() {
    return await load(nsid, params, dataLocation, content, post);
  }
  params.cursor = await _load();
  if (params.cursor != undefined) {
    window.onscroll = async function (ev) {
      if (
        window.innerHeight + Math.round(window.scrollY) >=
        document.body.offsetHeight
      )
        params.cursor = await _load();
      if (params.cursor === undefined) {
        window.onscroll = null;
      }
    };
  } else window.onscroll = null;
}
