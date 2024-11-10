import {
  AppBskyFeedDefs,
  AppBskyFeedGetTimeline,
  AppBskyFeedPost,
  Queries,
} from "@atcute/client/lexicons";
import { rpc } from "../login.ts";
import * as interaction from "./interactionButton.ts";
import * as embed from "./embed.ts";
import { urlEquivalents, formatDate } from "./utils.ts";

export const enum imageContainerSize {
  width = 500,
  height = 250,
}

export function post(post) {
  const html = document.createElement("div");
  html.className = "card post";
  const actualPost: AppBskyFeedDefs.PostView = post.post || post;
  const postRecord = actualPost.record as AppBskyFeedPost.Record;
  //html.id = actualPost.cid;
  const postDate = formatDate(
    new Date(postRecord.createdAt || actualPost.indexedAt),
  );
  const holderPfp = document.createElement("div");
  holderPfp.className = "pfp-holder";
  const linkPfp = document.createElement("a");
  linkPfp.href = "/profile/" + actualPost.author.handle;
  linkPfp.innerHTML = `<img class="pfp" src="${actualPost.author.avatar}"></img>`;
  holderPfp.appendChild(linkPfp);
  html.appendChild(holderPfp);
  const content = document.createElement("div");
  content.className = "content";
  const header = document.createElement("div");
  header.className = "header";
  let headerHtml = `<a class="handle" href="/profile/${actualPost.author.handle}">
    ${actualPost.author.handle}</a>
    <a class="timestamp" href="/profile/${actualPost.author.handle}/post/${
      actualPost.uri.split("/")[4]
    }">${postDate}</span>`;
  if (post.reason?.$type === "app.bsky.feed.defs#reasonRepost")
    headerHtml =
      `${interaction.icon.repost} <a class="handle" href="/profile/${post.reason.by?.handle}">
      ${post.reason.by?.handle}</a> reposted ` + headerHtml;
  header.innerHTML = headerHtml;
  content.appendChild(header);
  const postContent = document.createElement("div");
  postContent.className = "post-content";
  if (postRecord.text) {
    postContent.innerText = postRecord.text;
  }
  content.appendChild(postContent);
  if (postRecord.embed) {
    const embeds = document.createElement("div");
    embeds.className = "embeds";
    switch (postRecord.embed.$type) {
      case "app.bsky.embed.images":
        for (const img of postRecord.embed.images) {
          embeds.appendChild(embed.image(img, actualPost.author.did));
        }
        break;
      default:
        break;
    }
    content.appendChild(embeds);
  }
  const stats = document.createElement("div");
  stats.className = "stats";
  stats.appendChild(interaction.button("like", actualPost));
  stats.appendChild(interaction.button("repost", actualPost));
  stats.appendChild(interaction.button("reply", actualPost));
  content.appendChild(stats);
  html.appendChild(content);
  return html;
}

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

export async function userFeed(filter: string, did: string) {
  filter = filter || "";
  if (filter === "search") {
    const search = decodeURIComponent(window.location.search.slice(1));
    return await feed("app.bsky.feed.searchPosts", {
      q: search,
      author: did,
    });
  } else {
    return await feed(
      filter == "likes"
        ? "app.bsky.feed.getActorLikes"
        : "app.bsky.feed.getAuthorFeed",
      {
        actor: did,
        filter: urlEquivalents[filter],
      },
    );
  }
}
