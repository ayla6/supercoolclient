import {
  AppBskyFeedDefs,
  AppBskyFeedGetPostThread,
} from "@atcute/client/lexicons";
import { post } from "../ui/card";
import { elem } from "../blocks/elem";
import { error } from "../ui/error";

export function loadThread(
  postThread: AppBskyFeedGetPostThread.Output,
  outputElement: HTMLElement,
) {
  if (postThread.thread.$type === "app.bsky.feed.defs#threadViewPost") {
    const thread = postThread.thread;
    const authorDid = thread.post.author.did;

    let mainThreadPosts: HTMLElement[] = [];
    let replyPosts: HTMLElement[] = [];
    let mutedPosts: HTMLElement[] = [];

    if (thread.parent?.$type === "app.bsky.feed.defs#threadViewPost") {
      let currentThread = thread;
      while (
        currentThread.parent &&
        currentThread.parent.$type === "app.bsky.feed.defs#threadViewPost"
      ) {
        currentThread = currentThread.parent;
        const parentPost = post(currentThread.post);
        mainThreadPosts.push(parentPost);
      }
      if (
        currentThread.parent &&
        currentThread.parent.$type !== "app.bsky.feed.defs#threadViewPost"
      ) {
        mainThreadPosts.push(
          error(
            currentThread.parent.$type === "app.bsky.feed.defs#blockedPost"
              ? "Blocked post"
              : "Post not found",
          ),
        );
      }
      mainThreadPosts.reverse();
    }

    const mainPost = post(thread.post, true);
    mainPost.classList.add("full");
    mainThreadPosts.push(mainPost);

    function loadReplies(
      parentPost: AppBskyFeedDefs.ThreadViewPost,
      isAuthorPost: boolean,
      loadNonThread: boolean,
      level: number,
    ) {
      for (const reply of parentPost.replies) {
        if (reply.$type === "app.bsky.feed.defs#threadViewPost") {
          const isThreadContinuation =
            isAuthorPost && reply.post.author.did === authorDid;
          if (loadNonThread || isThreadContinuation) {
            const replyPost = post(reply.post);
            replyPost.style.paddingLeft = level * 24 + "px";
            replyPost.style.width = `calc(100% - ${replyPost.style.paddingLeft})`;

            if (isThreadContinuation) {
              mainThreadPosts.push(replyPost);
            } else if (reply.post.author.viewer.muted) {
              mutedPosts.push(replyPost);
            } else if (isAuthorPost && parentPost.post !== thread.post) {
              mainThreadPosts.push(replyPost);
            } else {
              replyPosts.push(replyPost);
            }

            if (reply.replies) {
              const hasThreadContinuation =
                isThreadContinuation &&
                reply.replies?.some(
                  (reply) =>
                    "post" in reply && reply.post.author.did === authorDid,
                );
              loadReplies(
                reply,
                isThreadContinuation ||
                  (parentPost.post !== thread.post && isAuthorPost),
                !hasThreadContinuation,
                level +
                  Number(!hasThreadContinuation && reply.replies.length > 1),
              );
            }
          }
        }
      }
    }
    if (thread.replies) loadReplies(thread, true, true, 0);

    outputElement.innerHTML = "";
    outputElement.append(...mainThreadPosts);
    mainPost.scrollIntoView();
    outputElement.append(...replyPosts);
    if (mutedPosts.length > 0)
      outputElement.append(mutedPostsButton(outputElement, mutedPosts));
    outputElement.append(elem("div", { className: "buffer" }));
  } else {
    outputElement.append(
      error(
        postThread.thread.$type === "app.bsky.feed.defs#blockedPost"
          ? "Blocked post"
          : "Post not found",
      ),
    );
  }
}

function mutedPostsButton(outputElement: HTMLElement, posts: HTMLElement[]) {
  const button = elem(
    "div",
    {
      className: "card show-muted",
      onclick: () => {
        outputElement.removeChild(button);
        outputElement.append(...posts);
      },
    },
    [
      elem("div", { className: "pfp-holder" }, [
        elem("div", { className: "pfp" }),
      ]),
      elem("div", {
        className: "outputElement",
        innerHTML: "Show muted replies",
      }),
    ],
  );
  return button;
}
