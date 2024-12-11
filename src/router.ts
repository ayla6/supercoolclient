import { elem } from "./elements/utils/elem";
import { postCard } from "./elements/ui/post_card";
import { profileCard, statProfile } from "./elements/ui/profile_card";
import { OnscrollFunction, RouteOutput } from "./types";

import { homeRoute } from "./routes/home";
import { notificationsRoute } from "./routes/notifications";
import { postRoute } from "./routes/post";
import { profileRoute } from "./routes/profile";
import { createStatsRoute } from "./routes/stats";

type CacheEntry = [
  expirationDate: number,
  content: HTMLDivElement,
  title: string,
  onscroll: OnscrollFunction,
  bodyStyle: string,
  scrollToElement: HTMLElement,
];
type PageCache = Map<string, CacheEntry>;
export const cache: PageCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

export let loadedPath: string = "";
export let loadedSplitPath: string[] = [];
export let beingLoadedSplitPath: string[] = [];

const navbar = document.getElementById("navbar");

type Route = (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
) => RouteOutput;
const routesBase: { [key: string]: Route } = {
  "": homeRoute,
  notifications: notificationsRoute,
  ":": profileRoute,
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
type computedRoutes = [{ key: string[]; route: Route }];
function computeRoutes(routes: { [key: string]: Function }): computedRoutes {
  const computedRoutes = [];
  for (const route of Object.keys(routes)) {
    computedRoutes.push({ key: route.split("/"), route: routes[route] });
  }
  return computedRoutes as computedRoutes;
}
const routes = computeRoutes(routesBase);

function matchRoute(path: string[]) {
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
}

export async function updatePage(useCache: boolean) {
  {
    const container = document.getElementById("container");
    document.body.removeChild(container);
    window.onscroll = null;
  }

  const currentPath = window.location.pathname;
  const currentSplitPath = currentPath.slice(1).split("/");
  beingLoadedSplitPath = currentSplitPath;

  document.title = "SuperCoolClient";
  document.body.removeAttribute("style");
  if (currentSplitPath[0] !== loadedSplitPath[0]) {
    navbar.querySelector(".active")?.classList.remove("active");
    navbar.querySelector(`a[href="${currentPath}"]`)?.classList.add("active");
  }
  window.scrollTo({ top: 0 });

  const cachePage = cache.get(currentPath);
  if (
    (useCache && cachePage && Date.now() < cachePage[0]) ||
    (currentPath === "/" && cachePage)
  ) {
    document.body.appendChild(cachePage[1]);
    document.title = cachePage[2];
    window.onscroll = cachePage[3];
    document.body.setAttribute("style", cachePage[4]);
  } else {
    const container = cachePage
      ? cachePage[1]
      : elem("div", { id: "container" });
    document.body.appendChild(container);
    if (cachePage) {
      if (cachePage[4]) document.body.setAttribute("style", cachePage[4]);
      if (cachePage[5]) cachePage[5].scrollIntoView();
    }

    const route = matchRoute(currentSplitPath);
    const [onscrollFunc, title, scrollToElement, css] = await route(
      currentSplitPath,
      loadedSplitPath,
      container,
    );
    if (document.body.contains(container)) {
      if (title) document.title = title + " — SuperCoolClient";
      if (css) document.body.setAttribute("style", css);
      if (scrollToElement) scrollToElement.scrollIntoView();
      if (onscrollFunc) window.onscroll = onscrollFunc;

      const expiration =
        currentPath !== "/" ? Date.now() + CACHE_DURATION : Infinity;
      cache.delete(currentPath);
      cache.set(currentPath, [
        expiration,
        container,
        document.title,
        onscrollFunc,
        document.body.getAttribute("style"),
        scrollToElement,
      ]);
    }
  }

  loadedSplitPath = currentSplitPath;
  loadedPath = currentPath;
  if (window.location.search) loadedSplitPath.push(window.location.search);
}

export function profileRedirect(did: string) {
  const path = window.location.pathname;
  const indexOfSlash = path.indexOf("/", 1);
  history.pushState(
    null,
    "",
    "/" + did + (indexOfSlash === -1 ? "" : path.slice(indexOfSlash)),
  );
}

export function cleanCache() {
  console.time("Time to clean cache");
  const now = Date.now();
  for (const [path, entry] of cache.entries()) {
    if (entry[0] < now) {
      cache.delete(path);
      console.log("deleted " + path);
    } else if (entry[0] < Infinity) break;
  }
  console.timeEnd("Time to clean cache");
}
