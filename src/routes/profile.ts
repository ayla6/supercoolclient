import {
  AppBskyActorDefs,
  AppBskyFeedGetAuthorFeed,
  AppBskyGraphFollow,
} from "@atcute/client/lexicons";

import { createFeedManager } from "../elements/ui/local_state_manager";
import { profileCard } from "../elements/ui/profile_card";
import { elem } from "../elements/utils/elem";
import {
  changeImageFormat,
  getFediHandle,
  getRkey,
} from "../elements/utils/link_processing";
import { processText } from "../elements/utils/text_processing";
import { manager, rpc, rpcPublic, sessionData } from "../login";
import {
  beingLoadedSplitPath,
  profileRedirect,
  removeSlashProfile,
  updatePage,
} from "../router";
import { confirmDialog } from "../elements/ui/dialog";
import { editProfileDialog } from "../elements/ui/edit_profile";
import { createSearchBar } from "../elements/ui/search_bar";
import { env } from "../settings";
import { request } from "../elements/utils/request";
import { setTitle } from "../elements/utils/title";

const mediaNavButton = (lastMedia: AppBskyFeedGetAuthorFeed.Output) => {
  const images = elem("div", { className: "images" });
  for (const post of lastMedia.feed) {
    if (images.children.length >= 4) break;

    const embed =
      post.post.embed.$type === "app.bsky.embed.recordWithMedia#view"
        ? post.post.embed.media
        : post.post.embed;

    if (embed.$type === "app.bsky.embed.images#view") {
      for (const image of embed.images) {
        if (images.children.length >= 4) break;
        images.append(elem("img", { src: changeImageFormat(image.thumb) }));
      }
    } else if (embed.$type === "app.bsky.embed.video#view" && embed.thumbnail) {
      images.append(elem("img", { src: embed.thumbnail }));
    }
  }
  return images;
};

export const profileRoute = async (
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

  setTitle(atId);

  const { data: profile } = await request(
    "app.bsky.actor.getProfile",
    {
      params: { actor: atId },
    },
    useCache,
  );

  setTitle(profile.handle);

  const blockingInAnyWay =
    profile.viewer?.blockedBy ||
    profile.viewer?.blocking ||
    profile.viewer?.blockingByList?.listItemCount > 0;

  const _rpc = env.viewBlockedPosts && blockingInAnyWay ? rpcPublic : rpc;

  let ogFediLink: HTMLAnchorElement;
  const did = profile.did;
  const handle = !profile.handle.endsWith("brid.gy")
    ? profile.handle
    : (() => {
        const fediDescription = profile.description.match(
          /\n\[bridged from (.*) on the fediverse by https\:\/\/fed.brid.gy\/ \]/,
        );
        profile.description = profile.description.replace(
          fediDescription[0],
          "",
        );
        ogFediLink = elem("a", {
          className: "og-fedi-link",
          textContent: "🔗",
          target: "_blank",
          href: fediDescription[1],
        });
        const fediHandle = getFediHandle(profile.handle);
        return fediHandle;
      })();

  if (profile.did !== atId) profileRedirect(did);

  const { data: lastMedia } =
    !env.viewBlockedPosts && blockingInAnyWay
      ? { data: { feed: [] } }
      : await request(
          "app.bsky.feed.getAuthorFeed",
          {
            params: {
              actor: did,
              filter: "posts_with_media",
              limit: 4,
            },
          },
          useCache,
          _rpc,
        );

  if (currentSplitPath !== beingLoadedSplitPath) return;

  const searchBar = createSearchBar("from:" + (profile.handle ?? profile.did));

  const sideBar = elem(
    "div",
    { id: "side-bar", className: "sticky" },
    searchBar,
  );

  const createKnownFollowers = () => {
    if (!profile.viewer.knownFollowers || profile.did === manager.session.did) {
      return undefined;
    }

    const knownFollowersSpan = elem("span", { className: "known-followers" });
    knownFollowersSpan.appendChild(document.createTextNode("Followed by "));

    const displayedFollowers = profile.viewer.knownFollowers.followers.slice(
      0,
      3,
    );

    displayedFollowers.forEach(
      (follower: AppBskyActorDefs.ProfileViewBasic, index: number) => {
        const followerLink = elem(
          "span",
          { className: "follower-link" },
          null,
          [
            elem("img", {
              className: "mini-avatar",
              src: changeImageFormat(follower.avatar),
            }),
            elem("a", {
              href: `/${follower.did}`,
              textContent:
                follower.handle ?? follower.displayName ?? follower.did,
            }),
          ],
        );
        knownFollowersSpan.appendChild(followerLink);

        const isLast = index === profile.viewer.knownFollowers.count - 1;
        const isSecondToLast =
          index === profile.viewer.knownFollowers.count - 2;

        if (!isLast) {
          const separator = document.createTextNode(
            isSecondToLast ? " and " : ", ",
          );
          knownFollowersSpan.appendChild(separator);
        }
      },
    );

    // Add "and X others" if there are more followers
    if (profile.viewer.knownFollowers.count > 3) {
      const remainingCount = profile.viewer.knownFollowers.count - 3;

      const andSpan = elem("span", { textContent: "and " });

      const othersLink = elem("a", {
        href: "",
        onclick: (e) => {
          e.preventDefault();
          stateManager.loadFeed({
            feed: "known-followers",
            nsid: "app.bsky.graph.getKnownFollowers",
            params: { actor: did },
            func: profileCard,
          });
        },
        textContent: `${remainingCount} others`,
      });
      othersLink.setAttribute("ignore", "");

      andSpan.appendChild(othersLink);
      knownFollowersSpan.appendChild(andSpan);
    }

    return knownFollowersSpan;
  };

  const header = elem("div", { className: "profile-header" }, undefined, [
    elem("div", { className: "info" }, undefined, [
      elem(
        "a",
        { className: "avatar-holder" },
        elem("img", {
          className: "avatar",
          src: changeImageFormat(profile.avatar),
        }),
      ),
      elem("div", { className: "header" }, undefined, [
        elem("span", { className: "container" }, null, [
          elem("span", { className: "handle", innerHTML: handle }),
          ogFediLink,
        ]),
        elem("span", { className: "container" }, null, [
          elem("span", {
            className: "display-name",
            textContent: profile.displayName,
          }),
          profile.viewer?.followedBy
            ? elem("span", { className: "label", textContent: "Follows you" })
            : null,
        ]),
        elem("div", {
          className: "bio",
          innerHTML: profile.description
            ? processText(profile.description)
            : "",
        }),
        manager.session && createKnownFollowers(),
      ]),
    ]),

    elem("div", { className: "stats" }, undefined, [
      manager.session &&
        (() => {
          if (manager.session.did === profile.did)
            return elem("button", {
              textContent: "Edit Profile",
              onclick: async () => {
                if (!(await editProfileDialog())) return;
                Object.assign(
                  sessionData,
                  await request(
                    "app.bsky.actor.getProfile",
                    {
                      params: { actor: manager.session.did },
                    },
                    false,
                  ),
                );
                await profileRoute(
                  currentSplitPath,
                  previousSplitPath,
                  container,
                );
              },
            });
          if (blockingInAnyWay) {
            if (profile.viewer.blockedBy)
              return elem("button", {
                textContent: "You're blocked",
                className: "red-button",
              });
          }
          return elem("button", {
            className: profile.viewer.following ? "" : " follow",
            textContent: profile.viewer.following
              ? "✓ Following"
              : profile.viewer.followedBy
                ? "+ Follow Back"
                : "+ Follow",
            onclick: async (e) => {
              const button = e.target as HTMLButtonElement;
              if (profile.viewer.following) {
                const rkey = getRkey(profile.viewer.following);
                const result = await confirmDialog(
                  "Do you want to unfollow this account?",
                  "Unfollow",
                );
                if (result) {
                  button.textContent = profile.viewer.followedBy
                    ? "+ Follow Back"
                    : "+ Follow";
                  button.classList.add("follow");
                  rpc.call("com.atproto.repo.deleteRecord", {
                    data: {
                      repo: sessionData.did,
                      rkey: rkey,
                      collection: "app.bsky.graph.follow",
                    },
                  });
                  profile.viewer.following = undefined;
                }
              } else {
                button.textContent = "✓ Following";
                button.classList.remove("follow");
                profile.viewer.following = (
                  await rpc.call("com.atproto.repo.createRecord", {
                    data: {
                      record: {
                        $type: "app.bsky.graph.follow",
                        subject: profile.did,
                        createdAt: new Date().toISOString(),
                      } as AppBskyGraphFollow.Record,
                      repo: manager.session.did,
                      collection: "app.bsky.graph.follow",
                    },
                  })
                ).data.uri;
              }
            },
          });
        })(),
      elem("a", { href: `/${did}` }, undefined, [
        elem("b", { textContent: profile.postsCount.toLocaleString() }),
        document.createTextNode(" Posts"),
      ]),
      elem("a", {}, undefined, [
        elem("b", { textContent: profile.followsCount.toLocaleString() }),
        document.createTextNode(" Following"),
      ]),
      elem("a", {}, undefined, [
        elem("b", { textContent: profile.followersCount.toLocaleString() }),
        document.createTextNode(" Followers"),
      ]),
    ]),
  ]);

  container.replaceChildren(
    elem("div", { className: "buffer-top" }),
    header,
    sideBar,
    elem("div", { id: "content-holder" }, elem("div", { id: "content" })),
  );

  const bodyStyle = `background-image:
    url(${changeImageFormat(profile.banner?.replace("img/banner", "img/feed_fullsize"))});`;
  document.body.setAttribute("style", bodyStyle);

  const stateManager = createFeedManager(
    document.getElementById("content-holder"),
    sideBar,
    [
      {
        displayName: "Posts",
        feed: "posts",
        nsid: "app.bsky.feed.getAuthorFeed",
        params: {
          actor: did,
          filter: "posts_and_author_threads",
        },
      },
      {
        displayName: "Posts and replies",
        feed: "replies",
        nsid: "app.bsky.feed.getAuthorFeed",
        params: {
          actor: did,
          filter: "posts_with_replies",
        },
      },
      manager.session?.did === profile.did
        ? {
            displayName: "Likes",
            feed: "likes",
            nsid: "app.bsky.feed.getActorLikes",
            params: {
              actor: did,
            },
          }
        : null,
      {
        displayName: "Following",
        feed: "following",
        nsid: "app.bsky.graph.getFollows",
        params: {
          actor: did,
        },
        func: profileCard,
      },
      {
        displayName: "Followers",
        feed: "followers",
        nsid: "app.bsky.graph.getFollowers",
        params: {
          actor: did,
        },
        func: profileCard,
      },
      {
        displayName: "Media",
        feed: "media",
        nsid: "app.bsky.feed.getAuthorFeed",
        params: {
          actor: did,
          filter: "posts_with_media",
        },
        extra: mediaNavButton(lastMedia),
      },
    ],
    true,
    useCache,
    _rpc,
  );

  if (!env.viewBlockedPosts && blockingInAnyWay) {
    Array.from(sideBar.querySelector(".side-nav").children).forEach((child) =>
      child.classList.add("disabled"),
    );
  }

  window.onscroll =
    !env.viewBlockedPosts && blockingInAnyWay
      ? undefined
      : await stateManager.loadFeed(
          stateManager.cachedFeed ?? {
            feed: "posts",
            nsid: "app.bsky.feed.getAuthorFeed",
            params: {
              actor: did,
              filter: "posts_and_author_threads",
            },
          },
          useCache,
        );
};
