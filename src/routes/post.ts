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
import { rpc, rpcPublic } from "../login";
import {
  beingLoadedSplitPath,
  profileRedirect,
  removeSlashProfile,
} from "../router";
import { preloadedPost, setPreloaded } from "../elements/utils/preloaded_post";
import { env } from "../settings";
import { tryCatch } from "../elements/utils/trycatch";
import { createTray } from "../elements/ui/tray";
import { setTitle } from "../elements/utils/title";
import { request } from "../elements/utils/request";

const MAX_PARENT_HEIGHT = 81;

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
  useCache: boolean,
): [HTMLDivElement, HTMLDivElement] => {
  let mainPost: HTMLDivElement;
  const content = elem("div", { id: "content" });
  if (postThread.thread.$type === "app.bsky.feed.defs#threadViewPost") {
    const thread = postThread.thread;

    const mainThreadPosts = elem("div");
    const replyPosts = elem("div");
    //let mutedPosts = document.createDocumentFragment();

    mainPost = postCard(thread.post, { isFullView: true });
    mainThreadPosts.appendChild(mainPost);

    if (thread.parent) {
      const continueThreadCard = (
        currentThread: AppBskyFeedDefs.ThreadViewPost,
      ) => {
        const post = currentThread.parent;
        return elem("a", {
          className: "simple-card",
          href: getPathFromUri(
            post.$type === "app.bsky.feed.defs#threadViewPost"
              ? post.post.uri
              : post.uri,
          ),
          textContent: "Continue thread…",
          onclick: () =>
            post.$type === "app.bsky.feed.defs#threadViewPost" &&
            setPreloaded(post.post),
        });
      };

      let postCount = 1;
      let currentThread = thread;
      if (!env.viewBlockedPosts) {
        while (
          currentThread.parent &&
          currentThread.parent.$type === "app.bsky.feed.defs#threadViewPost"
        ) {
          if (postCount === MAX_PARENT_HEIGHT) {
            mainThreadPosts.prepend(continueThreadCard(currentThread));
            currentThread = currentThread.parent as any;
          } else {
            currentThread = currentThread.parent;
            mainThreadPosts.prepend(
              postCard(currentThread.post, { hasReplies: true }),
            );
          }
          postCount++;
        }
        if (
          currentThread.parent &&
          currentThread.parent.$type !== "app.bsky.feed.defs#threadViewPost"
        ) {
          if (rootPost && rootPost.uri !== currentThread.parent.uri)
            mainThreadPosts.prepend(
              elem("a", {
                className: "simple-card",
                href: getPathFromUri(currentThread.parent.uri),
                textContent:
                  currentThread.parent.$type ===
                  "app.bsky.feed.defs#blockedPost"
                    ? "Blocked post"
                    : "Post not found",
              }),
            );
          if (rootPost)
            mainThreadPosts.prepend(
              postCard(rootPost, {
                hasReplies: true,
                blockedPost:
                  currentThread.parent.$type ===
                    "app.bsky.feed.defs#blockedPost" &&
                  rootPost.uri === currentThread.parent.uri,
              }),
            );
        }
      } else {
        setTimeout(async () => {
          const temporaryPostsArea = elem("div");
          while (currentThread.parent) {
            let postElem: HTMLElement;
            if (
              currentThread.parent.$type === "app.bsky.feed.defs#notFoundPost"
            ) {
              temporaryPostsArea.prepend(
                elem("a", {
                  className: "simple-card",
                  href: getPathFromUri(currentThread.parent.uri),
                  textContent: "Post not found",
                }),
              );
              console.log(rootPost);
              if (rootPost && rootPost.uri !== currentThread.parent.uri)
                temporaryPostsArea.prepend(
                  postCard(rootPost, { hasReplies: true }),
                );
              currentThread = currentThread.parent as any;
            } else if (postCount === MAX_PARENT_HEIGHT) {
              temporaryPostsArea.prepend(continueThreadCard(currentThread));
              currentThread = currentThread.parent as any;
            } else {
              let blockedPost = false;
              let blockedByPost = false;
              if (
                currentThread.parent.$type ===
                "app.bsky.feed.defs#threadViewPost"
              ) {
                currentThread = currentThread.parent;
              } else if (
                currentThread.parent.$type === "app.bsky.feed.defs#blockedPost"
              ) {
                blockedPost = true;
                const hopefullyNextThread = (
                  await request(
                    "app.bsky.feed.getPostThread",
                    {
                      params: {
                        depth: 0,
                        uri: currentThread.parent.uri,
                      },
                    },
                    useCache,
                  )
                ).data.thread;
                if (
                  hopefullyNextThread.$type ===
                  "app.bsky.feed.defs#threadViewPost"
                ) {
                  currentThread = hopefullyNextThread;
                } else if (
                  hopefullyNextThread.$type === "app.bsky.feed.defs#blockedPost"
                ) {
                  blockedByPost = true;
                  const hopefullyNextThread = (
                    await request(
                      "app.bsky.feed.getPostThread",
                      {
                        params: {
                          depth: 0,
                          uri: currentThread.parent.uri,
                        },
                      },
                      useCache,
                      rpcPublic,
                    )
                  ).data.thread;
                  if (
                    hopefullyNextThread.$type ===
                    "app.bsky.feed.defs#threadViewPost"
                  ) {
                    currentThread = hopefullyNextThread;
                  }
                }
              }
              postElem = postCard(currentThread.post, {
                hasReplies: true,
                blockedPost,
                blockedByPost,
              });
              temporaryPostsArea.prepend(postElem);
              postCount++;
            }
          }
          mainThreadPosts.prepend(temporaryPostsArea);
          window.scrollBy({ top: temporaryPostsArea.offsetHeight });
        }, 0);
      }
    }

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

          const replyElem = postCard(post, {
            hasReplies: Boolean(
              post.replies !== undefined
                ? shownPostReplies?.length
                : post.post.replyCount,
            ),
          });

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
                textContent: "Continue thread…",
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
  useCache: boolean = false,
) => {
  if (currentSplitPath[0] === "profile") {
    currentSplitPath.shift();
    removeSlashProfile();
  }

  const atId = currentSplitPath[0];
  const uri = getUriFromSplitPath(currentSplitPath);
  let title: string;

  if (preloadedPost) {
    const loadingContent = elem("div", { id: "content" });
    loadingContent.append(postCard(preloadedPost, { isFullView: true }));
    container.append(stickyHeader("Post"), loadingContent);
  }

  let postThread: AppBskyFeedGetPostThread.Output;

  let { data, error } = await tryCatch(
    request(
      "app.bsky.feed.getPostThread",
      {
        params: { uri, parentHeight: MAX_PARENT_HEIGHT },
      },
      useCache,
    ),
  );

  if (error) {
    if (error.message.startsWith("NotFound")) {
      postThread = {
        thread: {
          $type: "app.bsky.feed.defs#notFoundPost",
          notFound: true,
          uri,
        },
      };
    } else {
      createTray(error.message);
    }
  } else {
    postThread = data.data;
  }

  if (
    env.viewBlockedPosts &&
    postThread.thread.$type === "app.bsky.feed.defs#blockedPost"
  ) {
    postThread = (
      await request(
        "app.bsky.feed.getPostThread",
        {
          params: { uri, parentHeight: 1000 },
        },
        useCache,
      )
    ).data;
  }

  let rootPost: AppBskyFeedDefs.PostView;
  if (postThread.thread.$type === "app.bsky.feed.defs#threadViewPost") {
    const post = postThread.thread.post;
    setTitle(
      `${post.author.handle}: “${(post.record as AppBskyFeedPost.Record).text}”`,
    );

    if (preloadedPost) Object.assign(preloadedPost, post);
    setPreloaded(null);
    if (postThread.thread.parent) {
      rootPost = (
        await request(
          "app.bsky.feed.getPosts",
          {
            params: {
              uris: [
                (postThread.thread.post.record as AppBskyFeedPost.Record).reply
                  .root.uri,
              ],
            },
          },
          useCache,
        )
      ).data.posts[0];
    }
  } else if (postThread.thread.$type === "app.bsky.feed.defs#notFoundPost") {
    setTitle(`Not Found`);
  }

  if (currentSplitPath !== beingLoadedSplitPath) return;

  if (
    postThread.thread.$type === "app.bsky.feed.defs#threadViewPost" &&
    atId != postThread.thread.post.author.did
  )
    profileRedirect(postThread.thread.post.author.did);

  const [content, mainPost] = loadThread(postThread, rootPost, useCache);
  container.replaceChildren(stickyHeader("Post"), content);
};
