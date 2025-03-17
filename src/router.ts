import { elem } from "./elements/utils/elem";
import { postCard } from "./elements/ui/post_card";
import { profileCard, statProfile } from "./elements/ui/profile_card";
import { OnscrollFunction, RouteOutput, StateManager } from "./types";

import { homeRoute } from "./routes/home";
import { notificationsRoute } from "./routes/notifications";
import { postRoute } from "./routes/post";
import { profileRoute } from "./routes/profile";
import { createStatsRoute } from "./routes/stats";
import { searchRoute } from "./routes/search";
import { settingsRoute } from "./routes/settings";
import { currentStateManager } from "./elements/ui/local_state_manager";

type CacheEntry = {
  expirationDate: number;
  container: HTMLDivElement;
  title?: string;
  feed?: string;
  onscroll?: OnscrollFunction;
  bodyStyle?: string;
  scrollToElement?: HTMLElement;
  stateManager?: StateManager;
};
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
  search: searchRoute,
  settings: settingsRoute,
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
const routes: computedRoutes = (() => {
  const computedRoutes = [];
  for (const route of Object.keys(routesBase)) {
    computedRoutes.push({ key: route.split("/"), route: routesBase[route] });
  }
  return computedRoutes as computedRoutes;
})();

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

export const updatePage = async (useCache: boolean) => {
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
    (useCache && cachePage && Date.now() < cachePage.expirationDate) ||
    (currentPath === "/" && cachePage)
  ) {
    document.body.appendChild(cachePage.container);
    document.title = cachePage.title;
    window.onscroll = cachePage.onscroll;
    document.body.setAttribute("style", cachePage.bodyStyle);
  } else {
    let container: HTMLDivElement;
    container = elem("div", { id: "container" });
    document.body.appendChild(container);

    const route = matchRoute(currentSplitPath);
    const {
      onscrollFunction,
      title,
      scrollToElement,
      bodyStyle,
      stateManager,
    } = await route(currentSplitPath, loadedSplitPath, container);
    if (document.body.contains(container)) {
      if (title) document.title = title + " — SuperCoolClient";
      if (bodyStyle) document.body.setAttribute("style", bodyStyle);
      if (scrollToElement) scrollToElement.scrollIntoView();
      if (onscrollFunction) window.onscroll = onscrollFunction;
      if (stateManager) Object.assign(currentStateManager, stateManager);
      else
        Object.assign(currentStateManager, {
          feedsData: undefined,
          loadFeed: undefined,
          sideBar: undefined,
        });

      const expiration =
        currentPath !== "/" ? Date.now() + CACHE_DURATION : Infinity;
      cache.delete(currentPath);
      cache.set(currentPath, {
        expirationDate: expiration,
        container: container,
        title: document.title,
        onscroll: onscrollFunction,
        bodyStyle: document.body.getAttribute("style"),
        scrollToElement: scrollToElement,
      });
    }
  }

  loadedSplitPath = currentSplitPath;
  loadedPath = currentPath;
  if (window.location.search) loadedSplitPath.push(window.location.search);
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

export const cleanCache = () => {
  console.time("Time to clean cache");
  const now = Date.now();
  const currentPath = window.location.pathname;
  for (const [path, entry] of cache.entries()) {
    if (entry.expirationDate < now && path !== currentPath) {
      cache.delete(path);
      console.log("deleted " + path);
    } else if (entry[0] < Infinity) break;
  }
  console.timeEnd("Time to clean cache");
};
