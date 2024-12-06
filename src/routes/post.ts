import { AppBskyFeedDefs, AppBskyFeedPost } from "@atcute/client/lexicons";
import { cache, get } from "../elements/utils/cache";
import { elem } from "../elements/utils/elem";
import { postCard } from "../elements/ui/post_card";
import { rpc } from "../login";
import { loadThread } from "../elements/page/thread";
import { profileRedirect } from "../router";
import { stickyHeader } from "../elements/ui/sticky_header";

let preloadedPost: AppBskyFeedDefs.PostView;
export function setPreloaded(post: AppBskyFeedDefs.PostView) {
  preloadedPost = post;
}
export async function postRoute(currentUrl: string, loadedUrl: string) {
  const splitUrl = currentUrl.split("/");
  const splitLoaded = loadedUrl.split("/");
  const container = document.getElementById("container");
  container.innerHTML = "";
  container.append(stickyHeader("Post"));
  const content = elem("div", { id: "content" });
  container.append(content);

  if (
    preloadedPost &&
    preloadedPost.uri.split("/")[4] === splitUrl[3] &&
    splitUrl[1] === preloadedPost.author.did
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
          uri: `at://${splitUrl[1]}/app.bsky.feed.post/${splitUrl[3]}`,
        },
      },
      splitLoaded[2] !== "post",
    )
  ).data;

  if ("post" in postThread.thread) {
    const post = postThread.thread.post;
    document.title = `${post.author.handle}: “${(post.record as AppBskyFeedPost.Record).text}” — SuperCoolClient`;

    if (preloadedPost) Object.assign(preloadedPost, post);
    if (!cache["app.bsky.feed.getPosts"]) cache["app.bsky.feed.getPosts"] = {};
    const params = `{"uris":["at://${splitUrl[1]}/app.bsky.feed.post/${splitUrl[3]}"]}`;
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
    splitUrl[1] != postThread.thread.post.author.did
  )
    profileRedirect(postThread.thread.post.author.did);

  loadThread(postThread, rootPost, content);
}
