import {
  AppBskyFeedDefs,
  AppBskyFeedGetPostThread,
  AppBskyFeedPost,
  Brand,
} from "@atcute/client/lexicons";
import { postCard } from "../elements/ui/post_card";
import { stickyHeader } from "../elements/ui/sticky_header";
import { elem } from "../elements/utils/elem";
import {
  getPathFromUri,
  getUriFromSplitPath,
} from "../elements/utils/link_processing";
import { rpc } from "../login";
import { beingLoadedSplitPath, profileRedirect } from "../router";
import { RouteOutput } from "../types";
import { preloadedPost, setPreloaded } from "../elements/utils/preloaded_post";

const mutedPostsButton = (
  outputElement: HTMLElement,
  posts: DocumentFragment,
) => {
  const button = elem(
    "div",
    {
      className: "card-holder show-muted",
      onclick: () => {
        outputElement.removeChild(button);
        outputElement.append(posts);
      },
    },
    undefined,
    [
      elem(
        "div",
        { className: "avatar-holder" },
        elem("div", { className: "avatar" }),
      ),
      elem("div", {
        className: "outputElement",
        textContent: "Show muted replies",
      }),
    ],
  );
  return button;
};

const getString = (isLastChild: boolean) => {
  return elem(
    "div",
    { className: "string-container" },
    elem("div", {
      className: "reply-string" + (isLastChild ? " transparent" : ""),
    }),
  );
};

const loadThread = (
  postThread: AppBskyFeedGetPostThread.Output,
  rootPost: AppBskyFeedDefs.PostView,
): [HTMLDivElement, HTMLDivElement] => {
  let mainPost: HTMLDivElement;
  const content = elem("div", { id: "content" });
  if (postThread.thread.$type === "app.bsky.feed.defs#threadViewPost") {
    const thread = postThread.thread;

    const mainThreadPosts = document.createDocumentFragment();
    const replyPosts = document.createDocumentFragment();
    //let mutedPosts = document.createDocumentFragment();

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
        const post = currentThread.parent;
        mainThreadPosts.prepend(
          elem("a", {
            className: "simple-card",
            href: getPathFromUri(post.uri),
            textContent:
              post.$type === "app.bsky.feed.defs#blockedPost"
                ? "Blocked post"
                : "Post not found",
          }),
        );
        if (rootPost) mainThreadPosts.prepend(postCard(rootPost, false, true));
      }
    }

    mainPost = postCard(thread.post, true);
    mainThreadPosts.appendChild(mainPost);

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
      outputElement = replyPosts,
    ) {
      const lastChild = replies[replies.length - 1];
      for (const post of replies) {
        if (
          lockToAuthor &&
          (post.$type !== "app.bsky.feed.defs#threadViewPost" ||
            post.post.author.did !== thread.post.author.did)
        )
          continue;
        const isLastChild = post === lastChild;

        const replyContainer = elem("div", {
          className: "reply-container" + (stringMargin ? " added-margin" : ""),
        });
        replyContainer.append;
        previousStrings.forEach((stringState: boolean) =>
          replyContainer.appendChild(getString(stringState)),
        );
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
          replyContainer.appendChild(stringContainer);
        }

        if (post.$type === "app.bsky.feed.defs#threadViewPost") {
          const isMainThread =
            wasMainThread && post.post.author.did === thread.post.author.did;

          let newLockToAuthor = isMainThread ? true : lockToAuthor;
          let shownPostReplies: Brand.Union<
            | AppBskyFeedDefs.ThreadViewPost
            | AppBskyFeedDefs.BlockedPost
            | AppBskyFeedDefs.NotFoundPost
          >[];
          if (newLockToAuthor && post.replies) {
            outputElement = mainThreadPosts;
            shownPostReplies = post.replies.filter(
              (reply) =>
                reply.$type === "app.bsky.feed.defs#threadViewPost" &&
                reply.post.author.did === thread.post.author.did,
            );
            if (!shownPostReplies.length) {
              newLockToAuthor = false;
              shownPostReplies = post.replies;
            }
          } else shownPostReplies = post.replies;

          const replyElem = postCard(
            post,
            false,
            Boolean(
              post.replies !== undefined
                ? shownPostReplies?.length
                : post.post.replyCount,
            ),
          );

          replyContainer.appendChild(replyElem);
          outputElement.appendChild(replyContainer);

          if (Boolean(shownPostReplies?.length)) {
            loadReplies(
              shownPostReplies,
              stringMargin + Number(shownPostReplies.length > 1),
              strings,
              newLockToAuthor,
              isMainThread,
              outputElement,
            );
          } else if (post.post.replyCount && !post.replies) {
            const continueThreadContainer = elem("div", {
              className:
                "reply-container" + (stringMargin ? " added-margin" : ""),
            });
            strings.forEach((stringState: boolean) =>
              continueThreadContainer.appendChild(getString(stringState)),
            );
            continueThreadContainer.appendChild(
              elem("a", {
                className: "simple-card",
                textContent: "Continue thread...",
                href: getPathFromUri(post.post.uri),
                onclick: () => setPreloaded(post.post),
              }),
            );
            outputElement.appendChild(continueThreadContainer);
          }
        } else if (post.$type === "app.bsky.feed.defs#blockedPost") {
          replyContainer.appendChild(
            elem("a", {
              className: "simple-card",
              href: getPathFromUri(post.uri),
              textContent: "Blocked post",
            }),
          );
          outputElement.appendChild(replyContainer);
        }
      }
    }
    if (Boolean(thread.replies?.length))
      loadReplies(thread.replies, 0, [], false, true);

    content.append(
      mainThreadPosts,
      replyPosts,
      elem("div", { className: "buffer-bottom" }),
    );
    //if (mutedPosts.hasChildNodes())
    //  outputElement.append(mutedPostsButton(outputElement, mutedPosts));
  } else {
    content.appendChild(
      elem("div", {
        className: "simple-card",
        textContent:
          postThread.thread.$type === "app.bsky.feed.defs#blockedPost"
            ? "Blocked post"
            : "Post not found",
      }),
    );
  }
  return [content, mainPost];
};

export const postRoute = async (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
): RouteOutput => {
  const atId = currentSplitPath[0];
  const uri = getUriFromSplitPath(currentSplitPath);
  let title: string;

  if (preloadedPost) {
    const loadingContent = elem("div", { id: "content" });
    loadingContent.append(postCard(preloadedPost, true));
    container.append(stickyHeader("Post"), loadingContent);
  }

  const { data: postThread } = await rpc.get("app.bsky.feed.getPostThread", {
    params: { uri },
  });

  let rootPost: AppBskyFeedDefs.PostView;
  if (postThread.thread.$type === "app.bsky.feed.defs#threadViewPost") {
    const post = postThread.thread.post;
    title = `${post.author.handle}: “${(post.record as AppBskyFeedPost.Record).text}” — SuperCoolClient`;

    if (preloadedPost) Object.assign(preloadedPost, post);
    setPreloaded(null);
    if (
      postThread.thread.parent &&
      postThread.thread.parent.$type !== "app.bsky.feed.defs#threadViewPost"
    ) {
      rootPost = (
        await rpc.get("app.bsky.feed.getPosts", {
          params: {
            uris: [
              (postThread.thread.post.record as AppBskyFeedPost.Record).reply
                .root.uri,
            ],
          },
        })
      ).data.posts[0];
    }
  }

  if (currentSplitPath !== beingLoadedSplitPath) return;

  if (
    postThread.thread.$type === "app.bsky.feed.defs#threadViewPost" &&
    atId != postThread.thread.post.author.did
  )
    profileRedirect(postThread.thread.post.author.did);

  const [content, mainPost] = loadThread(postThread, rootPost);
  container.replaceChildren(stickyHeader("Post"), content);

  return { title, scrollToElement: mainPost };
};
