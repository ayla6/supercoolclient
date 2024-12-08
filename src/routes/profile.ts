import { get } from "../elements/utils/cache";
import { profileRedirect } from "../router";
import { feedNSID, hydrateFeed } from "../elements/ui/feed";
import { profilePage } from "../elements/page/profile";
import { profileCard } from "../elements/ui/profile_card";
import {
  getAtIdFromPath,
  getLocationFromPath,
} from "../elements/utils/link_processing";

const urlEquivalents: { [key: string]: [feedNSID, string?] } = {
  posts: ["app.bsky.feed.getAuthorFeed", "posts_no_replies"],
  media: ["app.bsky.feed.getAuthorFeed", "posts_with_media"],
  replies: ["app.bsky.feed.getAuthorFeed", "posts_with_replies"],
  likes: ["app.bsky.feed.getActorLikes"],
};

export async function profileRoute(currentPath: string, loadedPath: string) {
  const atId = getAtIdFromPath(currentPath);

  const { data: profile } = await get("app.bsky.actor.getProfile", {
    params: { actor: atId },
  });
  const { data: lastMedia } = await get("app.bsky.feed.getAuthorFeed", {
    params: {
      actor: profile.did,
      filter: "posts_with_media",
      limit: 4,
    },
  });
  if (window.location.pathname === currentPath) {
    if (atId != profile.did) profileRedirect(profile.did);
    profilePage(profile, lastMedia);

    profileUrlChange(currentPath, loadedPath);
  }
}

export async function profileUrlChange(
  currentPath: string,
  loadedPath: string,
) {
  const currentLocation = getLocationFromPath(currentPath);
  const lastLocation = getLocationFromPath(loadedPath);

  const did = getAtIdFromPath(currentPath);

  const content = document.getElementById("content");
  document
    .querySelector(
      `[value="${lastLocation + (lastLocation === "search" ? "" : "")}"]`,
    )
    ?.classList.remove("active");
  document
    .querySelector(
      `[value="${currentLocation + (currentLocation === "search" ? window.location.search : "")}"]`,
    )
    ?.classList.add("active");

  if (currentLocation !== lastLocation) content.replaceChildren();
  let posts: HTMLElement[];
  let reload = lastLocation !== "post";
  const feed = feedConfig[currentLocation] ?? feedConfig.default;
  posts = await hydrateFeed(
    feed.endpoint ?? urlEquivalents[currentLocation][0],
    feed.params(did, currentLocation),
    reload,
    feed.type,
  );
  content.replaceChildren(...posts);
}

export function profileTrim(currentPath: string, loadedPath: string) {
  const newPath = currentPath.slice(0, -1);
  history.pushState(null, "", newPath);
  profileRoute(newPath, loadedPath);
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
