import { AppBskyFeedDefs, AppBskyFeedPost } from "@atcute/client/lexicons";
import { cache, get } from "../elements/utils/cache";
import { elem } from "../elements/utils/elem";
import { postCard } from "../elements/ui/post_card";
import { rpc } from "../login";
import { loadThread } from "../elements/page/thread";
import { profileRedirect } from "../router";
import { stickyHeader } from "../elements/ui/sticky_header";
import {
  getAtIdFromPath,
  getLocationFromPath,
  getUriFromPath,
} from "../elements/utils/link_processing";

let preloadedPost: AppBskyFeedDefs.PostView;
export function setPreloaded(post: AppBskyFeedDefs.PostView) {
  preloadedPost = post;
}
export async function postRoute(currentUrl: string, loadedPath: string) {
  const container = document.getElementById("container");
  const content = elem("div", { id: "content" });

  const atId = getAtIdFromPath(currentUrl);
  const uri = getUriFromPath(currentUrl);
  const lastLocation = getLocationFromPath(loadedPath);

  if (preloadedPost && atId === preloadedPost.author.did) {
    const mainPost = postCard(preloadedPost, true);
    mainPost.classList.add("full");
    content.append(mainPost);
    mainPost.scrollIntoView();
  }

  container.replaceChildren(stickyHeader("Post"), content);

  const postThread = (
    await get(
      "app.bsky.feed.getPostThread",
      {
        params: { uri },
      },
      lastLocation !== "post",
    )
  ).data;

  if ("post" in postThread.thread) {
    const post = postThread.thread.post;
    document.title = `${post.author.handle}: “${(post.record as AppBskyFeedPost.Record).text}” — SuperCoolClient`;

    if (preloadedPost) Object.assign(preloadedPost, post);
    if (!cache["app.bsky.feed.getPosts"]) cache["app.bsky.feed.getPosts"] = {};
    const params = `{"uris":["${uri}"]}`;
    cache["app.bsky.feed.getPosts"][params] = {
      [params]: { data: { posts: [post] } },
    };
  }
  preloadedPost = null;

  let rootPost: AppBskyFeedDefs.PostView;
  if (postThread.thread.$type === "app.bsky.feed.defs#threadViewPost") {
    const record = postThread.thread.post.record as AppBskyFeedPost.Record;
    if (record.reply)
      rootPost = (
        await rpc.get("app.bsky.feed.getPosts", {
          params: {
            uris: [record.reply.root.uri],
          },
        })
      ).data.posts[0];
  }

  if (
    postThread.thread.$type === "app.bsky.feed.defs#threadViewPost" &&
    atId != postThread.thread.post.author.did
  )
    profileRedirect(postThread.thread.post.author.did);

  loadThread(postThread, rootPost, content);
}
