import { AppBskyFeedDefs, AppBskyFeedPost } from "@atcute/client/lexicons";
import { rpc } from "../login.ts";
import * as interaction from "./interactionButton.ts";
import * as embed from "./embed.ts";
import {
  elem,
  escapeHTML,
  formatDate,
  idchoose,
  processRichText,
  processText,
} from "./utils.ts";
import { segmentize } from "@atcute/bluesky-richtext-segmenter";

export const imageContainerSize = {
  width: 500,
  height: 250,
};

type feedNSID =
  | "app.bsky.feed.getAuthorFeed"
  | "app.bsky.feed.getFeed"
  | "app.bsky.feed.getActorLikes"
  | "app.bsky.feed.searchPosts"
  | "app.bsky.feed.getTimeline";

export function post(
  post: AppBskyFeedDefs.FeedViewPost | AppBskyFeedDefs.PostView,
) {
  const actualPost: AppBskyFeedDefs.PostView =
    "post" in post ? post.post : post;
  const postRecord = actualPost.record as AppBskyFeedPost.Record;
  const atid = idchoose(actualPost.author);
  if (
    "reason" in post &&
    post.reason.$type === "app.bsky.feed.defs#reasonRepost"
  ) {
    var isRepost = true;
    var repostAtid = idchoose(post.reason.by);
  }
  return elem("div", { className: "card post" }, [
    //profile picture
    elem("div", { className: "pfp-holder" }, [
      elem("a", {
        href: "/profile/" + atid,
        innerHTML: `<img class="pfp" src="${actualPost.author.avatar}"></img>`,
      }),
    ]),
    //content
    elem("div", { className: "content" }, [
      // header
      elem("div", { className: "header" }, [
        elem("span", {
          innerHTML: isRepost
            ? `${interaction.icon.repost} <a class="handle" href="/profile/${repostAtid}">${repostAtid}</a> reposted <a class="handle" href="/profile/${atid}">${atid}</a>`
            : `<a class="handle" href="/profile/${atid}">${atid}</a>`,
        }),
        elem("span", {
          className: "timestamp",
          innerHTML: formatDate(
            new Date(postRecord.createdAt || actualPost.indexedAt),
          ),
        }),
      ]),
      // text content
      elem(
        "div",
        {
          className: "post-content",
          innerHTML: postRecord.text
            ? processRichText(postRecord.text, postRecord.facets)
            : "",
        },
        undefined,
      ),
      // embeds
      elem(
        "div",
        { className: "embeds" },
        postRecord.embed
          ? embed.load(postRecord.embed, actualPost.author.did)
          : undefined,
      ),
      // likes repost and comments
      elem(
        "div",
        { className: "stats" },
        actualPost.viewer
          ? [
              interaction.button("like", actualPost),
              interaction.button("repost", actualPost),
              interaction.button("reply", actualPost),
            ]
          : undefined,
      ),
    ]),
  ]);
}

export async function feed(nsid: feedNSID, params: any) {
  const content = document.getElementById("content");
  async function load() {
    const { data } = await rpc.get(nsid, { params: params });
    let { cursor: nextPage } = data;
    const postsArray = "posts" in data ? data.posts : data.feed;
    for (const _post of postsArray) {
      content.appendChild(post(_post));
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
      if (params.cursor == undefined) {
        window.onscroll = null;
      }
    };
  } else window.onscroll = null;
}

export async function userFeed(nsid: feedNSID, did: string, filter?: string) {
  if (nsid === "app.bsky.feed.searchPosts") {
    return await feed("app.bsky.feed.searchPosts", {
      q: filter,
      author: did,
    });
  } else {
    return await feed(nsid, {
      actor: did,
      filter: filter,
    });
  }
}
