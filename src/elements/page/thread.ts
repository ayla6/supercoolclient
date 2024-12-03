import {
  AppBskyFeedDefs,
  AppBskyFeedGetPostThread,
} from "@atcute/client/lexicons";
import { postCard } from "../ui/card";
import { elem } from "../blocks/elem";
import { error } from "../ui/error";

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
      stringMargin: number,
      previousStrings: boolean[] = [],
    ) {
      for (const post of parent.replies) {
        if (post.$type !== "app.bsky.feed.defs#threadViewPost") continue;

        const isLastChild = post === parent.replies[parent.replies.length - 1];
        const isMainThread =
          thread.post === parent.post &&
          post.post.author.did === thread.post.author.did;

        const replyElem = postCard(post, false, {
          isReply: true,
          hasReplies: post.replies?.length > 0 && !isMainThread,
        });

        if (isMainThread) {
          mainThreadPosts.append(replyElem);
          continue;
        }

        let strings = [...previousStrings];
        const replyContainer = elem("div", { className: "reply-container" });
        replyContainer.append(...strings.map(getString));

        if (stringMargin !== 0 && parent.replies.length !== 1) {
          const stringContainer = elem("div", {
            className: "string-container",
          });

          const string = elem("div", { className: "reply-string" });
          if (isLastChild) {
            string.classList.add("transparent");
          }
          strings.push(isLastChild);
          stringContainer.append(elem("div", { className: "connect-string" }));

          stringContainer.append(string);
          replyContainer.append(stringContainer);
        }
        replyContainer.append(replyElem);

        replyPosts.append(replyContainer);

        if (post.replies) {
          loadReplies(
            post,
            stringMargin + Number(post.replies.length > 1),
            strings,
          );
        }
      }
    }

    if (thread.replies && thread.replies[0]) loadReplies(thread, 0);

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

function getString(isLastChild: boolean) {
  return elem("div", { className: "string-container" }, [
    elem("div", {
      className: "reply-string" + (isLastChild ? " transparent" : ""),
    }),
  ]);
}
