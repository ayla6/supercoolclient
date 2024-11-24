import { AppBskyFeedDefs } from "@atcute/client/lexicons";
import { get } from "../elements/blocks/cache";
import { elem } from "../elements/blocks/elem";
import { post } from "../elements/ui/card";
import { rpc } from "../login";
import { thread } from "../elements/page/thread";
import { profileRedirect } from "../router";

let preloadedPost: AppBskyFeedDefs.PostView;
export function setPreloaded(post: AppBskyFeedDefs.PostView) {
  preloadedPost = post;
}
export async function postRoute(currentURL: string, loadedState: string) {
  const splitURL = currentURL.split("/");
  const container = document.getElementById("container");
  container.innerHTML = "";
  const content = elem("div", { id: "content" });
  container.append(content);
  if (
    preloadedPost &&
    preloadedPost.uri.split("/")[4] === splitURL[3] &&
    splitURL[1] === preloadedPost.author.did
  ) {
    const mainPost = post(preloadedPost, true);
    mainPost.classList.add("full");
    content.append(mainPost);
    //scrollTo({ top: -63 });
  }
  const postThread = (
    await rpc.get("app.bsky.feed.getPostThread", {
      params: {
        uri: `at://${splitURL[1]}/app.bsky.feed.post/${splitURL[3]}`,
      },
    })
  ).data;
  if (preloadedPost && "post" in postThread.thread) {
    Object.assign(preloadedPost, postThread.thread.post);
  }
  preloadedPost = null;

  if (
    postThread.thread.$type === "app.bsky.feed.defs#threadViewPost" &&
    splitURL[1] != postThread.thread.post.author.did
  )
    profileRedirect(postThread.thread.post.author.did);

  thread(postThread, content);
}
