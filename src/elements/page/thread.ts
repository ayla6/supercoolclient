import {
  AppBskyFeedDefs,
  AppBskyFeedGetPostThread,
} from "@atcute/client/lexicons";
import { postCard } from "../ui/card";
import { elem } from "../blocks/elem";
import { Brand } from "@atcute/client/lexicons";
import { setPreloaded } from "../../routes/post";

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
        mainThreadPosts.prepend(postCard(currentThread.post, false, true));
      }
      if (
        currentThread.parent &&
        currentThread.parent.$type !== "app.bsky.feed.defs#threadViewPost"
      ) {
        mainThreadPosts.prepend(
          elem("div", {
            className: "simple-card",
            innerHTML:
              currentThread.parent.$type === "app.bsky.feed.defs#blockedPost"
                ? "Blocked post"
                : "Post not found",
          }),
        );
        if (rootPost) mainThreadPosts.prepend(postCard(rootPost, false, true));
      }
    }

    const mainPost = postCard(thread.post, true);
    mainThreadPosts.append(mainPost);

    function loadReplies(
      replies: Brand.Union<
        | AppBskyFeedDefs.ThreadViewPost
        | AppBskyFeedDefs.BlockedPost
        | AppBskyFeedDefs.NotFoundPost
      >[],
      stringMargin: number,
      previousStrings: boolean[],
      lockToAuthor: boolean,
      wasMainThread = false,
    ) {
      const lastChild = replies[replies.length - 1];
      for (const post of replies) {
        if (
          post?.$type === "app.bsky.feed.defs#threadViewPost" &&
          !(lockToAuthor && post.post.author.did !== thread.post.author.did)
        ) {
          const isLastChild = post === lastChild;
          const isMainThread =
            wasMainThread && post.post.author.did === thread.post.author.did;
          const outputElement = isMainThread ? mainThreadPosts : replyPosts;

          const newLockToAuthor = isMainThread ? true : lockToAuthor;
          const filteredPostReplies = newLockToAuthor ? [] : post.replies;
          if (newLockToAuthor && post.replies) {
            filteredPostReplies.push(
              ...post.replies.filter(
                (reply) =>
                  reply.$type === "app.bsky.feed.defs#threadViewPost" &&
                  reply.post.author.did === thread.post.author.did,
              ),
            );
          }
          console.log(filteredPostReplies);
          const replyElem = postCard(
            post,
            false,
            Boolean(
              post.replies !== undefined
                ? filteredPostReplies?.length > 0
                : post.post.replyCount,
            ),
          );

          const replyContainer = elem("div", {
            className: "reply-container",
          });
          replyContainer.append(...previousStrings.map(getString));

          let strings: boolean[] = previousStrings;
          if (stringMargin && replies?.length > 1) {
            const stringContainer = elem("div", {
              className: "string-container",
            });
            strings = previousStrings.slice();
            strings.push(isLastChild);
            stringContainer.append(
              elem("div", { className: "connect-string" }),
              elem("div", {
                className: "reply-string" + (isLastChild ? " transparent" : ""),
              }),
            );
            replyContainer.append(stringContainer);
          }
          replyContainer.append(replyElem);
          outputElement.append(replyContainer);

          if (Boolean(filteredPostReplies?.length)) {
            loadReplies(
              filteredPostReplies,
              stringMargin + Number(filteredPostReplies.length > 1),
              strings,
              newLockToAuthor,
              isMainThread,
            );
          } else if (post.post.replyCount && !post.replies) {
            const splitURI = post.post.uri.split("/");
            console.log(splitURI);
            const continueThreadContainer = elem("div", {
              className: "reply-container",
            });
            continueThreadContainer.append(
              ...strings.map(getString),
              elem("a", {
                className: "simple-card",
                innerHTML: "Continue thread...",
                href: `/${splitURI[2]}/post/${splitURI[4]}`,
                onclick: () => setPreloaded(post.post),
              }),
            );
            outputElement.append(continueThreadContainer);
          }
        }
      }
    }
    if (Boolean(thread.replies?.length))
      loadReplies(thread.replies, 0, [], false, true);

    outputElement.innerHTML = "";
    outputElement.append(mainThreadPosts);
    mainPost.scrollIntoView();
    outputElement.append(replyPosts);
    if (mutedPosts.hasChildNodes())
      outputElement.append(mutedPostsButton(outputElement, mutedPosts));
    outputElement.append(elem("div", { className: "buffer" }));
  } else {
    outputElement.append(
      elem("div", {
        className: "simple-card",
        innerHTML:
          postThread.thread.$type === "app.bsky.feed.defs#blockedPost"
            ? "Blocked post"
            : "Post not found",
      }),
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
