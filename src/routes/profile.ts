import { AppBskyFeedGetAuthorFeed } from "@atcute/client/lexicons";
import { feedNSID } from "../elements/ui/feed";
import { createFeedManager } from "../elements/ui/local_state_manager";
import { profileCard } from "../elements/ui/profile_card";
import { elem } from "../elements/utils/elem";
import { changeImageFormat } from "../elements/utils/link_processing";
import { processText } from "../elements/utils/text_processing";
import { manager, rpc } from "../login";
import { beingLoadedSplitPath, profileRedirect, updatePage } from "../router";
import { RouteOutput } from "../types";

const urlEquivalents: { [key: string]: [feedNSID, string?] } = {
  posts: ["app.bsky.feed.getAuthorFeed", "posts_no_replies"],
  media: ["app.bsky.feed.getAuthorFeed", "posts_with_media"],
  replies: ["app.bsky.feed.getAuthorFeed", "posts_with_replies"],
  likes: ["app.bsky.feed.getActorLikes"],
};

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
): RouteOutput => {
  const atId = currentSplitPath[0];

  const { data: profile } = await rpc.get("app.bsky.actor.getProfile", {
    params: { actor: atId },
  });

  const did = profile.did;
  const handle = profile.handle;

  if (profile.did !== atId) profileRedirect(did);

  const { data: lastMedia } = await rpc.get("app.bsky.feed.getAuthorFeed", {
    params: {
      actor: did,
      filter: "posts_with_media",
      limit: 4,
    },
  });

  if (currentSplitPath !== beingLoadedSplitPath) return;

  const searchBar = elem("input", {
    id: "search-bar",
    placeholder: "Search…",
  });
  searchBar.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && searchBar.value) {
      history.pushState(
        null,
        "",
        `/search?q=from:${profile.handle ?? profile.did} ${searchBar.value}`,
      );
      updatePage(false);
    }
  });

  const sideBar = elem("div", { id: "side-bar" }, searchBar);

  const header = elem("div", { className: "profile-header" }, undefined, [
    elem("div", { className: "info" }, undefined, [
      elem(
        "a",
        { className: "pfp-holder" },
        elem("img", {
          className: "pfp",
          src: changeImageFormat(profile.avatar),
        }),
      ),
      elem("div", { className: "header" }, undefined, [
        elem("span", {
          className: "display-name",
          textContent: profile.displayName,
        }),
        elem("span", { className: "handle", innerHTML: "@" + handle }),
        elem("div", {
          className: "bio",
          innerHTML: profile.description
            ? processText(profile.description)
            : "",
        }),
      ]),
    ]),

    elem("div", { className: "stats" }, undefined, [
      elem("button", { className: "button follow", textContent: "+ Follow" }),
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

  container.append(
    elem("div", { className: "buffer-top" }),
    header,
    sideBar,
    elem("div", { id: "content-holder" }, elem("div", { id: "content" })),
  );

  const bodyStyle = `background-image:
    url(${profile.banner?.replace("img/banner", "img/feed_fullsize").replace("jpeg", "webp")});`;
  document.body.setAttribute("style", bodyStyle);

  const loadProfileFeed = createFeedManager(
    document.getElementById("content-holder"),
    sideBar,
    [
      {
        displayName: "Posts",
        feed: "posts",
        nsid: "app.bsky.feed.getAuthorFeed",
        params: {
          actor: did,
          filter: "posts",
        },
      },
      {
        displayName: "Posts and replies",
        feed: "replies",
        nsid: "app.bsky.feed.getAuthorFeed",
        params: {
          actor: did,
          filter: "replies",
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
        : undefined,
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
  );

  const onscrollFunction = await loadProfileFeed({
    feed: "posts",
    nsid: "app.bsky.feed.getAuthorFeed",
    params: {
      actor: did,
      filter: "posts",
    },
  });
  return { onscrollFunction, title: profile.handle, bodyStyle };
};
