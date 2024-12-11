import { AppBskyFeedGetAuthorFeed } from "@atcute/client/lexicons";
import { feedNSID } from "../elements/ui/feed";
import { createLocalStateManager } from "../elements/ui/local_state_manager";
import { profileCard } from "../elements/ui/profile_card";
import { elem } from "../elements/utils/elem";
import { changeImageFormat } from "../elements/utils/link_processing";
import { processText } from "../elements/utils/text_processing";
import { manager, rpc } from "../login";
import { beingLoadedSplitPath, profileRedirect } from "../router";
import { RouteOutput } from "../types";

const urlEquivalents: { [key: string]: [feedNSID, string?] } = {
  posts: ["app.bsky.feed.getAuthorFeed", "posts_no_replies"],
  media: ["app.bsky.feed.getAuthorFeed", "posts_with_media"],
  replies: ["app.bsky.feed.getAuthorFeed", "posts_with_replies"],
  likes: ["app.bsky.feed.getActorLikes"],
};

const feedConfigs = {
  following: {
    endpoint: "app.bsky.graph.getFollows",
    params: (did: string) => ({ actor: did }),
    type: profileCard,
  },
  followers: {
    endpoint: "app.bsky.graph.getFollowers",
    params: (did: string) => ({ actor: did }),
    type: profileCard,
  },
  search: {
    endpoint: "app.bsky.feed.searchPosts",
    params: (did: string) => ({
      author: did,
      q: decodeURIComponent(window.location.search).slice(1),
    }),
  },
  default: {
    endpoint: null,
    params: (did: string, place: string) => ({
      actor: did,
      filter: urlEquivalents[place][1],
    }),
  },
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

  const sideBar = elem("div", { id: "side-bar" });

  const loadProfileFeed = createLocalStateManager(container, sideBar);

  const navButton = (feed: string, text: string) => {
    const button = elem("a", {
      href: `?feed=${feed}`,
      textContent: text,
      onclick: (e) => {
        e.preventDefault();
        const feedConfig = feedConfigs[feed] ?? feedConfigs.default;
        loadProfileFeed(
          feed,
          feedConfig.endpoint ?? urlEquivalents[feed][0],
          feedConfig.params(atId, feed),
          feedConfig.type,
        );
      },
    });
    button.setAttribute("ignore", "");
    return button;
  };

  const mediaNavButton = (
    button: HTMLAnchorElement,
    lastMedia: AppBskyFeedGetAuthorFeed.Output,
  ) => {
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
      } else if (
        embed.$type === "app.bsky.embed.video#view" &&
        embed.thumbnail
      ) {
        images.append(elem("img", { src: embed.thumbnail }));
      }
    }
    button.append(images);
    return button;
  };

  sideBar.appendChild(
    elem("div", { className: "side-nav" }, undefined, [
      navButton("posts", "Posts"),
      navButton("replies", "Posts and replies"),
      manager.session?.did === profile.did
        ? navButton("likes", "Favourites")
        : undefined,
      navButton("following", "Following"),
      navButton("followers", "Followers"),
      mediaNavButton(navButton("media", "Media"), lastMedia),
    ]),
  );

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
      elem("a", { href: `/${did}/following` }, undefined, [
        elem("b", { textContent: profile.followsCount.toLocaleString() }),
        document.createTextNode(" Following"),
      ]),
      elem("a", { href: `/${did}/followers` }, undefined, [
        elem("b", { textContent: profile.followersCount.toLocaleString() }),
        document.createTextNode(" Followers"),
      ]),
    ]),
  ]);

  const hasContainerLoaded = container.hasChildNodes()
    ? false
    : container.replaceChildren(header, sideBar);

  const customCss = `background-image:
    url(${profile.banner?.replace("img/banner", "img/feed_fullsize").replace("jpeg", "webp")});`;
  document.body.setAttribute("style", customCss);

  const params = new URLSearchParams(window.location.search);
  const feed = params.get("feed") ?? "posts";
  const feedConfig = feedConfigs[feed] ?? feedConfigs.default;
  const [onscrollFunc, content] = await loadProfileFeed(
    feed,
    feedConfig.endpoint ?? urlEquivalents[feed][0],
    feedConfig.params(atId, feed),
    feedConfig.type,
  );
  if (!hasContainerLoaded) container.replaceChildren(header, sideBar);
  container.appendChild(content);

  return [onscrollFunc, profile.handle, undefined, customCss];
};
