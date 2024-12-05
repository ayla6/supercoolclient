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
  if (window.location.pathname === currentUrl) {
    if (atId != profile.did) profileRedirect(profile.did);
    if (splitLoaded[1] != atId || splitLoaded[2] === "post")
      atId = profilePage(profile);

    profileUrlChange(currentUrl, loadedUrl);
  }
}

export async function profileUrlChange(currentUrl: string, loadedUrl: string) {
  const splitUrl = currentUrl.split("/");
  const splitLoaded = loadedUrl.split("/");
  const atId = splitUrl[1];
  const currentPlace = splitUrl[2] ?? "posts";
  const lastPlace = splitLoaded[2] ?? "posts";
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
    feed.params(atId, currentPlace),
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
    params: (atId: string) => ({ actor: atId }),
    type: profileCard,
  },
  followers: {
    endpoint: "app.bsky.graph.getFollowers",
    params: (atId: string) => ({ actor: atId }),
    type: profileCard,
  },
  search: {
    endpoint: "app.bsky.feed.searchPosts",
    params: (atId: string) => ({
      author: atId,
      q: decodeURIComponent(window.location.search).slice(1),
    }),
  },
  default: {
    endpoint: null,
    params: (atId: string, place: string) => ({
      actor: atId,
      filter: urlEquivalents[place][1],
    }),
  },
};
