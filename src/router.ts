import { elem } from "./elements/utils/elem";
import { postCard } from "./elements/ui/post_card";
import { profileCard, statProfile } from "./elements/ui/profile_card";
import { Route } from "./types";
env;
import { homeRoute } from "./routes/home";
import { notificationsRoute } from "./routes/notifications";
import { postRoute } from "./routes/post";
import { profileRoute } from "./routes/profile";
import { createStatsRoute } from "./routes/stats";
import { searchRoute } from "./routes/search";
import { settingsRoute } from "./routes/settings";
import { env } from "./settings";
import { sessionData } from "./login";

export let loadedPath: string = "";
export let loadedSplitPath: string[] = [];
export let beingLoadedSplitPath: string[] = [];

const navbar = document.getElementById("navbar");

const routesBase: { [key: string]: Route } = {
  "": homeRoute,
  notifications: notificationsRoute,
  search: searchRoute,
  settings: settingsRoute,
  "profile/:": profileRoute,
  ":": profileRoute,
  "profile/:/post/:": postRoute,
  ":/post/:": postRoute,
  ":/post/:/likes": createStatsRoute(
    "Likes",
    "app.bsky.feed.getLikes",
    statProfile,
  ),
  ":/post/:/reposts": createStatsRoute(
    "Reposts",
    "app.bsky.feed.getRepostedBy",
    profileCard,
  ),
  ":/post/:/quotes": createStatsRoute(
    "Quotes",
    "app.bsky.feed.getQuotes",
    postCard,
  ),
};
type computedRoutes = { key: string[]; route: Route }[];
const routes: computedRoutes = Object.keys(routesBase).map((route) => ({
  key: route.split("/"),
  route: routesBase[route],
}));

const matchRoute = (path: string[]) => {
  for (const route of routes) {
    if (path.length !== route.key.length) continue;

    let match = true;
    for (let i = 0; i < route.key.length; i++) {
      if (route.key[i] === ":") continue;
      if (route.key[i] !== path[i]) {
        match = false;
        break;
      }
    }

    if (match) return route.route;
  }
  return null;
};

export const updatePage = async (useCache: boolean = false) => {
  window.onscroll = null;

  const currentPath = window.location.pathname;
  const currentSplitPath = currentPath.slice(1).split("/");
  beingLoadedSplitPath = currentSplitPath;

  document.title = "SuperCoolClient";
  document.body.removeAttribute("style");

  navbar.querySelector(".active")?.classList.remove("active");
  (currentSplitPath[0] === sessionData?.did && !currentSplitPath[1]
    ? navbar.querySelector("#profile-button")
    : navbar.querySelector(`a[href="${currentPath}"]`)
  )?.classList.add("active");

  if (!useCache) window.scrollTo({ top: 0 });

  const container = elem("div", { id: "container" });
  const route = matchRoute(currentSplitPath);

  loadedSplitPath = currentSplitPath;
  loadedPath = currentPath;
  if (window.location.search) loadedSplitPath.push(window.location.search);

  route(currentSplitPath, loadedSplitPath, container, useCache);

  document.body.removeChild(document.getElementById("container"));
  document.body.appendChild(container);
};

export const profileRedirect = (did: string) => {
  const path = window.location.pathname;
  const indexOfSlash = path.indexOf("/", 1);
  history.replaceState(
    null,
    "",
    "/" + did + (indexOfSlash === -1 ? "" : path.slice(indexOfSlash)),
  );
};

export const removeSlashProfile = () => {
  const path = window.location.pathname;
  if (path.startsWith("/profile/")) {
    const newPath = "/" + path.substring("/profile/".length);
    history.replaceState(null, "", newPath);
  }
};
