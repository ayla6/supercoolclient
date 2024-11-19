import { profile } from "../ui/card";
import { load } from "./load";

export async function profiles(
  nsid: "app.bsky.graph.getFollows" | "app.bsky.graph.getFollowers",
  params: any,
) {
  const content = document.getElementById("content");
  const dataLocation =
    nsid === "app.bsky.graph.getFollows" ? "follows" : "followers";
  async function _load() {
    return await load(nsid, params, dataLocation, content, profile);
  }
  params.cursor = _load();
  if (params.cursor != undefined) {
    window.onscroll = async function (ev) {
      if (
        window.innerHeight + Math.round(window.scrollY) >=
        document.body.offsetHeight
      )
        params.cursor = _load();
      if (params.cursor === undefined) {
        window.onscroll = null;
      }
    };
  } else window.onscroll = null;
}
