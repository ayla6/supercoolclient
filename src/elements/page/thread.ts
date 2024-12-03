import {
  AppBskyFeedDefs,
  AppBskyFeedGetPostThread,
} from "@atcute/client/lexicons";
import { postCard } from "../ui/card";
import { elem } from "../blocks/elem";
import { error } from "../ui/error";

function getStrings(transparentState: boolean[]) {
  let strings: HTMLElement[] = [];
  for (const string of transparentState) {
    strings.push(
      elem("div", { className: "string-container" }, [
        elem("div", {
          className: "reply-string" + (string ? " transparent" : ""),
        }),
      ]),
    );
  }
  return strings;
}

export function loadThread(
  postThread: AppBskyFeedGetPostThread.Output,
  rootPost: AppBskyFeedDefs.PostView | null,
  outputElement: HTMLElement,
) {
  if (postThread.thread.$type === "app.bsky.feed.defs#threadViewPost") {
    const thread = postThread.thread;

    let mainThreadPosts: HTMLElement[] = [];
    let replyPosts: HTMLElement[] = [];
    let mutedPosts: HTMLElement[] = [];

    if (thread.parent) {
      let currentThread = thread;
      while (
        currentThread.parent &&
        currentThread.parent.$type === "app.bsky.feed.defs#threadViewPost"
      ) {
        currentThread = currentThread.parent;
        const parentPost = postCard(currentThread.post, false, {
          isReply: Boolean(currentThread.parent),
          hasReplies: true,
        });
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
        if (rootPost)
          mainThreadPosts.push(
            postCard(rootPost, false, {
              isReply: false,
              hasReplies: true,
            }),
          );
      }
      mainThreadPosts.reverse();
    }

    const mainPost = postCard(thread.post, true);
    mainThreadPosts.push(mainPost);

    function loadReplies(
      parent: AppBskyFeedDefs.ThreadViewPost,
      parentReplyBuffer: HTMLElement[],
      stringMargin: number,
      wentDownALevel: boolean = false,
      previousReplies: boolean[] = [],
    ) {
      let replyBuffer = [];
      for (const post of parent.replies) {
        if (post.$type !== "app.bsky.feed.defs#threadViewPost") continue;

        const isLastChild = post === parent.replies[parent.replies.length - 1];
        const isMainThread =
          parentReplyBuffer === replyPosts &&
          post.post.author.did === thread.post.author.did;

        const replyElem = postCard(post, false, {
          isReply: true,
          hasReplies: post.replies?.length > 0 && !isMainThread,
        });

        let replies = [...previousReplies];
        if (isMainThread) {
          mainThreadPosts.push(replyElem);
        } else {
          const replyContainer = elem("div", { className: "reply-container" });
          replyContainer.append(...getStrings(previousReplies));

          if (wentDownALevel) {
            const stringContainer = elem("div", {
              className: "string-container",
            });

            const string = elem("div", { className: "reply-string" });
            if (isLastChild) {
              string.classList.add("transparent");
              replies.push(true);
            } else replies.push(false);
            stringContainer.append(
              elem("div", { className: "connect-string" }),
            );

            stringContainer.append(string);
            replyContainer.append(stringContainer);
          }
          replyContainer.append(replyElem);

          if (post.post.author.did === parent.post.author.did)
            replyBuffer = [replyContainer, ...replyBuffer];
          else replyBuffer.push(replyContainer);

          if (post.replies) {
            loadReplies(
              post,
              replyBuffer,
              stringMargin + Number(post.replies.length > 1),
              post.replies.length > 1,
              replies,
            );
          }
        }
      }
      parentReplyBuffer.push(...replyBuffer);
    }
    if (thread.replies && thread.replies[0])
      loadReplies(thread, replyPosts, 0, false);

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
