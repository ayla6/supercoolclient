import { get } from "../elements/blocks/cache";
import { profileRedirect } from "../router";
import { feedNSID, hydrateFeed } from "../elements/content/feed";
import { profilePage } from "../elements/page/profile";
import { profileCard } from "../elements/ui/card";

const urlEquivalents: { [key: string]: [feedNSID, string?] } = {
  posts: ["app.bsky.feed.getAuthorFeed", "posts_no_replies"],
  media: ["app.bsky.feed.getAuthorFeed", "posts_with_media"],
  replies: ["app.bsky.feed.getAuthorFeed", "posts_with_replies"],
  likes: ["app.bsky.feed.getActorLikes"],
};

export async function profileRoute(currentURL: string, loadedState: string) {
  const splitURL = currentURL.split("/");
  const splitLoaded = loadedState.split("/");

  let atid = splitURL[1];
  const profile = (
    await get("app.bsky.actor.getProfile", {
      params: { actor: atid },
    })
  ).data;
  if (window.location.pathname === currentURL) {
    if (atid != profile.did) profileRedirect(profile.did);
    if (splitLoaded[1] != atid || splitLoaded[2] === "post")
      atid = profilePage(profile);

    profileURLChange(currentURL, loadedState);
  }
}

export async function profileURLChange(
  currentURL: string,
  loadedState: string,
) {
  const splitURL = currentURL.split("/");
  const splitLoaded = loadedState.split("/");
  const atid = splitURL[1];
  const currentPlace = splitURL[2] ?? "posts";
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
  if (splitLoaded[2] != splitURL[2]) content.innerHTML = "";
  let posts: HTMLElement[];
  let forceReload =
    currentPlace === lastPlace && splitLoaded[1]?.slice(0, 3) === "did:";
  const feed = feedConfig[currentPlace] ?? feedConfig.default;
  posts = await hydrateFeed(
    feed.endpoint ?? urlEquivalents[currentPlace][0],
    feed.params(atid, currentPlace),
    forceReload,
    feed.type,
  );
  content.innerHTML = "";
  content.append(...posts);
}

export function profileTrim(currentURL: string, loadedState: string) {
  history.pushState(null, "", new URL(window.location.href.slice(0, -1)));
  profileRoute(currentURL.slice(0, -1), loadedState);
}

const feedConfig = {
  following: {
    endpoint: "app.bsky.graph.getFollows",
    params: (atid: string) => ({ actor: atid }),
    type: profileCard,
  },
  followers: {
    endpoint: "app.bsky.graph.getFollowers",
    params: (atid: string) => ({ actor: atid }),
    type: profileCard,
  },
  search: {
    endpoint: "app.bsky.feed.searchPosts",
    params: (atid: string) => ({
      author: atid,
      q: decodeURIComponent(window.location.search).slice(1),
    }),
  },
  default: {
    endpoint: null,
    params: (atid: string, place: string) => ({
      actor: atid,
      filter: urlEquivalents[place][1],
    }),
  },
};
