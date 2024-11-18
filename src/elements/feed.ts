import { rpc } from "../login.ts";
import { post } from "./card.ts";

export const imageContainerSize = {
  width: 500,
  height: 500,
};

type feedNSID =
  | "app.bsky.feed.getAuthorFeed"
  | "app.bsky.feed.getFeed"
  | "app.bsky.feed.getActorLikes"
  | "app.bsky.feed.searchPosts"
  | "app.bsky.feed.getTimeline";

export async function feed(nsid: feedNSID, params: any) {
  const content = document.getElementById("content");
  async function load() {
    const { data } = await rpc.get(nsid, { params: params });
    let { cursor: nextPage } = data;
    const postsArray = "posts" in data ? data.posts : data.feed;
    for (const _post of postsArray) {
      content.append(post(_post));
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

export async function userFeed(nsid: feedNSID, did: string, filter?: string) {
  return await feed(
    nsid,
    nsid === "app.bsky.feed.searchPosts"
      ? {
          q: filter,
          author: did,
        }
      : {
          actor: did,
          filter: filter,
        },
  );
}
