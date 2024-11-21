import { profile } from "../ui/card";
import { load, loadOnscroll } from "./load";

export async function profiles(
  nsid: "app.bsky.graph.getFollows" | "app.bsky.graph.getFollowers",
  params: any,
): Promise<HTMLElement[]> {
  const dataLocation =
    nsid === "app.bsky.graph.getFollows" ? "follows" : "followers";
  async function _load() {
    return await load(nsid, params, dataLocation, profile);
  }
  const { items, nextPage } = await _load();
  if (nextPage != undefined)
    window.onscroll = await loadOnscroll(_load, nextPage);
  else window.onscroll = null;
  return items;
}
