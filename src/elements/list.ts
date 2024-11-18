import { rpc } from "../login";
import { profile } from "./card";

export async function profiles(
  nsid: "app.bsky.graph.getFollows" | "app.bsky.graph.getFollowers",
  params: any,
) {
  const content = document.getElementById("content");
  async function load() {
    const { data } = await rpc.get(nsid, { params: params });
    const profilesArray = "follows" in data ? data.follows : data.followers;
    const { cursor: nextPage } = data;
    for (const _profile of profilesArray) {
      content.append(profile(_profile));
    }
    return nextPage;
  }
  params.cursor = await load();
  if (params.cursor != undefined) {
    window.onscroll = async function (ev) {
      if (
        window.innerHeight + Math.round(window.scrollY) >=
        document.body.offsetHeight
      ) {
        params.cursor = await load();
      }
      if (params.cursor === undefined) {
        window.onscroll = null;
      }
    };
  } else window.onscroll = null;
}
