import { get } from "../elements/utils/cache";
import { profileRedirect } from "../router";
import { feedNSID, hydrateFeed } from "../elements/content/feed";
import { profilePage } from "../elements/page/profile";
import { profileCard } from "../elements/ui/profile_card";

const urlEquivalents: { [key: string]: [feedNSID, string?] } = {
  posts: ["app.bsky.feed.getAuthorFeed", "posts_no_replies"],
  media: ["app.bsky.feed.getAuthorFeed", "posts_with_media"],
  replies: ["app.bsky.feed.getAuthorFeed", "posts_with_replies"],
  likes: ["app.bsky.feed.getActorLikes"],
};

export async function profileRoute(currentUrl: string, loadedUrl: string) {
  const splitUrl = currentUrl.split("/");
  const splitLoaded = loadedUrl.split("/");

  let atId = splitUrl[1];
  const profile = (
    await get("app.bsky.actor.getProfile", {
      params: { actor: atId },
    })
  ).data;
  // load this just for the media thingie on the sidebar
  await get("app.bsky.feed.getAuthorFeed", {
    params: {
      actor: profile.did,
      filter: "posts_with_media",
      limit: 4,
    },
  });
  if (window.location.pathname === currentUrl) {
    if (atId != profile.did) profileRedirect(profile.did);
    if (splitLoaded[1] != atId || splitLoaded[2] === "post")
      profilePage(profile);

    profileUrlChange(currentUrl, loadedUrl);
  }
}

export async function profileUrlChange(currentUrl: string, loadedUrl: string) {
  const splitUrl = currentUrl.split("/");
  const splitLoaded = loadedUrl.split("/");
  const currentPlace = splitUrl[2] ?? "posts";
  const lastPlace = splitLoaded[2] ?? "posts";

  const did = splitUrl[1];

  const content = document.getElementById("content");
  document
    .querySelector(
      `[value="${(lastPlace ?? "posts") + (lastPlace === "search" ? splitLoaded[3] : "")}"]`,
    )
    ?.classList.remove("active");
  document
    .querySelector(
      `[value="${currentPlace + (currentPlace === "search" ? window.location.search : "")}"]`,
    )
    ?.classList.add("active");
  if (splitLoaded[2] != splitUrl[2]) content.innerHTML = "";
  let posts: HTMLElement[];
  let forceReload =
    currentPlace === lastPlace && splitLoaded[1]?.slice(0, 3) === "did:";
  const feed = feedConfig[currentPlace] ?? feedConfig.default;
  posts = await hydrateFeed(
    feed.endpoint ?? urlEquivalents[currentPlace][0],
    feed.params(did, currentPlace),
    forceReload,
    feed.type,
  );
  content.innerHTML = "";
  content.append(...posts);
}

export function profileTrim(currentUrl: string, loadedUrl: string) {
  history.pushState(null, "", new URL(window.location.href.slice(0, -1)));
  profileRoute(currentUrl.slice(0, -1), loadedUrl);
}

const feedConfig = {
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
