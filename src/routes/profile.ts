import { get } from "../elements/utils/cache";
import { loadedPath, profileRedirect } from "../router";
import { feedNSID, hydrateFeed } from "../elements/ui/feed";
import { profilePage } from "../elements/page/profile";
import { profileCard } from "../elements/ui/profile_card";

const urlEquivalents: { [key: string]: [feedNSID, string?] } = {
  posts: ["app.bsky.feed.getAuthorFeed", "posts_no_replies"],
  media: ["app.bsky.feed.getAuthorFeed", "posts_with_media"],
  replies: ["app.bsky.feed.getAuthorFeed", "posts_with_replies"],
  likes: ["app.bsky.feed.getActorLikes"],
};

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

async function loadProfileFeed(
  path: string,
  splitPath: string[],
  reload: boolean,
) {
  const sideBar = document.getElementById("side-bar");
  sideBar.querySelector(".active")?.classList.remove("active");
  sideBar.querySelector(`[href="${path}"]`)?.classList.add("active");

  const content = document.getElementById("content");
  if (!reload) content.replaceChildren();

  const feedToLoad = splitPath[1] ?? "posts";
  const feed = feedConfig[feedToLoad] ?? feedConfig.default;

  const posts = await hydrateFeed(
    feed.endpoint ?? urlEquivalents[feedToLoad][0],
    feed.params(splitPath[0], feedToLoad),
    reload,
    feed.type,
  );
  if (path === loadedPath) content.replaceChildren(...posts);
}

export function profileTrim(
  currentPath: string,
  currentSplitPath: string[],
  loadedSplitPath: string[],
) {
  const newPath = currentPath.slice(0, -1);
  delete currentSplitPath[1];
  history.pushState(null, "", newPath);
  profileRoute(newPath, currentSplitPath);
}

export async function profileRoute(
  currentPath: string,
  currentSplitPath: string[],
  previousSplitPath?: string[],
) {
  const atId = currentSplitPath[0];

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
  if (loadedPath === currentPath) {
    if (atId != profile.did) profileRedirect(profile.did);
    profilePage(profile, lastMedia);

    loadProfileFeed(currentPath, currentSplitPath, false);
  }
}

export async function profileUrlChange(
  currentPath: string,
  currentSplitPath: string[],
  previousSplitPath: string[],
) {
  const atSameFeed = currentSplitPath[1] === previousSplitPath[1];
  loadProfileFeed(currentPath, currentSplitPath, atSameFeed);
}
