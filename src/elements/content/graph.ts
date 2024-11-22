import { profile } from "../ui/card";
import { load, loadOnscroll } from "./load";

export async function profiles(
  nsid: "app.bsky.graph.getFollows" | "app.bsky.graph.getFollowers",
  params: any,
  forcereload: boolean = false,
): Promise<HTMLElement[]> {
  const dataLocation =
    nsid === "app.bsky.graph.getFollows" ? "follows" : "followers";
  async function _load() {
    return await load(nsid, params, dataLocation, profile);
  }
  const { items, cursor } = await _load();
  params.cursor = cursor;
  if (cursor != undefined) window.onscroll = await loadOnscroll(_load, params);
  else window.onscroll = null;
  return items;
}
