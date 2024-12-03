import {
  AppBskyFeedDefs,
  AppBskyFeedGetPostThread,
} from "@atcute/client/lexicons";
import { postCard } from "../ui/card";
import { elem } from "../blocks/elem";
import { error } from "../ui/error";

function getString(transparentState: boolean) {
  return elem("div", { className: "string-container" }, [
    elem("div", {
      className: "reply-string" + (transparentState ? " transparent" : ""),
    }),
  ]);
}

export function loadThread(
  postThread: AppBskyFeedGetPostThread.Output,
  rootPost: AppBskyFeedDefs.PostView | null,
  outputElement: HTMLElement,
) {
  if (postThread.thread.$type === "app.bsky.feed.defs#threadViewPost") {
    const thread = postThread.thread;

    let mainThreadPosts = document.createDocumentFragment();
    let replyPosts = document.createDocumentFragment();
    let mutedPosts = document.createDocumentFragment();

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
        mainThreadPosts.prepend(parentPost);
      }
      if (
        currentThread.parent &&
        currentThread.parent.$type !== "app.bsky.feed.defs#threadViewPost"
      ) {
        mainThreadPosts.prepend(
          error(
            currentThread.parent.$type === "app.bsky.feed.defs#blockedPost"
              ? "Blocked post"
              : "Post not found",
          ),
        );
        if (rootPost)
          mainThreadPosts.prepend(
            postCard(rootPost, false, {
              isReply: false,
              hasReplies: true,
            }),
          );
      }
    }

    const mainPost = postCard(thread.post, true);
    mainThreadPosts.append(mainPost);
    const mend = Date.now();

    function loadReplies(
      parent: AppBskyFeedDefs.ThreadViewPost,
      parentReplyBuffer: DocumentFragment,
      stringMargin: number,
      wentDownALevel: boolean = false,
      previousReplies:
        | DocumentFragment
        | Node = document.createDocumentFragment(),
    ) {
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

        if (isMainThread) {
          mainThreadPosts.append(replyElem);
          continue;
        }

        let replies = post.replies ? previousReplies.cloneNode(true) : null;
        const replyContainer = elem("div", { className: "reply-container" });
        replyContainer.append(previousReplies);

        if (wentDownALevel) {
          const stringContainer = elem("div", {
            className: "string-container",
          });

          const string = elem("div", { className: "reply-string" });
          if (isLastChild) {
            string.classList.add("transparent");
          }
          replies?.appendChild(getString(isLastChild));
          stringContainer.append(elem("div", { className: "connect-string" }));

          stringContainer.append(string);
          replyContainer.append(stringContainer);
        }
        replyContainer.append(replyElem);

        parentReplyBuffer.append(replyContainer);

        if (post.replies) {
          let replyBuffer = document.createDocumentFragment();
          loadReplies(
            post,
            replyBuffer,
            stringMargin + Number(post.replies.length > 1),
            post.replies.length > 1,
            replies,
          );
          parentReplyBuffer.append(replyBuffer);
        }
      }
    }

    if (thread.replies && thread.replies[0])
      loadReplies(thread, replyPosts, 0, false);

    outputElement.innerHTML = "";
    outputElement.append(mainThreadPosts);
    mainPost.scrollIntoView();
    outputElement.append(replyPosts);
    if (mutedPosts.hasChildNodes())
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

function mutedPostsButton(outputElement: HTMLElement, posts: DocumentFragment) {
  const button = elem(
    "div",
    {
      className: "card show-muted",
      onclick: () => {
        outputElement.removeChild(button);
        outputElement.append(posts);
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
