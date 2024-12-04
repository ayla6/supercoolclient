import { AppBskyFeedDefs, AppBskyFeedPost } from "@atcute/client/lexicons";
import { cache, get } from "../elements/blocks/cache";
import { elem } from "../elements/blocks/elem";
import { postCard } from "../elements/ui/post_card";
import { rpc } from "../login";
import { loadThread } from "../elements/page/thread";
import { profileRedirect } from "../router";
import { stickyHeader } from "../elements/ui/sticky_header";

let preloadedPost: AppBskyFeedDefs.PostView;
export function setPreloaded(post: AppBskyFeedDefs.PostView) {
  preloadedPost = post;
}
export async function postRoute(currentURL: string, loadedURL: string) {
  const splitURL = currentURL.split("/");
  const splitLoaded = loadedURL.split("/");
  const container = document.getElementById("container");
  container.innerHTML = "";
  container.append(stickyHeader("Post"));
  const content = elem("div", { id: "content" });
  container.append(content);

  if (
    preloadedPost &&
    preloadedPost.uri.split("/")[4] === splitURL[3] &&
    splitURL[1] === preloadedPost.author.did
  ) {
    const mainPost = postCard(preloadedPost, true);
    mainPost.classList.add("full");
    content.append(mainPost);
    mainPost.scrollIntoView();
  }

  const postThread = (
    await get(
      "app.bsky.feed.getPostThread",
      {
        params: {
          uri: `at://${splitURL[1]}/app.bsky.feed.post/${splitURL[3]}`,
        },
      },
      splitLoaded[2] !== "post",
    )
  ).data;

  if ("post" in postThread.thread) {
    if (preloadedPost) Object.assign(preloadedPost, postThread.thread.post);
    if (!cache["app.bsky.feed.getPosts"]) cache["app.bsky.feed.getPosts"] = {};
    cache["app.bsky.feed.getPosts"][
      `{"uris":["at://${splitURL[1]}/app.bsky.feed.post/${splitURL[3]}"]}`
    ] = { data: { posts: [postThread.thread.post] } };
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
    splitURL[1] != postThread.thread.post.author.did
  )
    profileRedirect(postThread.thread.post.author.did);

  loadThread(postThread, rootPost, content);
}
