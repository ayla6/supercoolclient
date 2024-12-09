// stolen from https://github.com/char/rainbow!!!
/*document.addEventListener("click", e => {
  if (!(e.target instanceof Element)) return;
  const anchor = e.target.closest("a");
  if (anchor === null) return;

  if (e.ctrlKey || e.button !== 0) return;

  // TODO: make sure these open in a new tab
  const url = new URL(anchor.href);
  if (window.location.origin !== url.origin) return; // open external links normally

  e.preventDefault();

  history.pushState(null, "", url);
});*/

import { profileRoute, profileUrlChange } from "./routes/profile";
import { homeRoute, homeUrlChange } from "./routes/home";
import { postRoute } from "./routes/post";
import { elem } from "./elements/utils/elem";
import { notificationsRoute } from "./routes/notifications";
import { likesRoute } from "./routes/likes";
import { repostsRoute } from "./routes/reposts";
import { quotesRoute } from "./routes/quotes";
import { deleteCache } from "./elements/utils/cache";

export let loadedSplitPath: string[] = [];
export let loadedRoute: string = "";

const navbar = document.getElementById("navbar");

const routesBase: { [key: string]: string } = {
  "": "home",
  notifications: "notifications",
  ":": "profile",
  ":/:": "profile",
  ":/post/:": "post",
  ":/post/:/likes": "postLikes",
  ":/post/:/reposts": "postReposts",
  ":/post/:/quotes": "postQuotes",
};
const changeRoutes: { [key: string]: Function } = {
  home: homeRoute,
  profile: profileRoute,
  post: postRoute,
  notifications: notificationsRoute,
  postLikes: likesRoute,
  postReposts: repostsRoute,
  postQuotes: quotesRoute,
};
const localRoutes: { [key: string]: Function } = {
  home: homeUrlChange,
  profile: profileUrlChange,
  post: postRoute,
  postLikes: likesRoute,
  postReposts: repostsRoute,
  postQuotes: quotesRoute,
};

type computedRoutes = [{ key: string[]; routeName: string }];

const routes = computeRoutes(routesBase);
function computeRoutes(routes: { [key: string]: string }) {
  const computedRoutes = [];
  for (const route of Object.keys(routes)) {
    computedRoutes.push({ key: route.split("/"), routeName: routes[route] });
  }
  return computedRoutes as computedRoutes;
}

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

    if (match) return route.routeName;
  }
  return null;
}

export async function updatePage() {
  window.onscroll = null;
  const currentPath = window.location.pathname;
  const currentSplitPath = currentPath.slice(1).split("/");

  let ableToLocal = true;
  if (currentSplitPath[0] !== loadedSplitPath[0]) {
    document.body.setAttribute("style", "");
    ableToLocal = false;
  }
  const route = matchRoute(currentSplitPath);
  if (!ableToLocal || route !== loadedRoute) {
    navbar.querySelector(".active")?.classList.remove("active");
    navbar.querySelector(`[href="${currentPath}"]`)?.classList.add("active");
  }
  if (ableToLocal && route === loadedRoute) {
    localRoutes[route](currentSplitPath, loadedSplitPath);
  } else {
    if (loadedSplitPath[1] === "post" && currentSplitPath[1] !== "post") {
      deleteCache("app.bsky.feed.getPostThread");
      deleteCache("app.bsky.feed.getPosts");
      deleteCache("app.bsky.feed.getRepostedBy");
      deleteCache("app.bsky.feed.getQuotes");
      deleteCache("app.bsky.feed.getLikes");
    }
    document.title = "SuperCoolClient";
    window.scrollTo({ top: 0 });
    document.body.removeChild(document.getElementById("container"));
    document.body.append(elem("div", { id: "container" }));
    changeRoutes[route](currentSplitPath, loadedSplitPath);
  }

  loadedSplitPath = currentSplitPath;
  loadedRoute = route;
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

export function navigateTo(url: URL | string) {
  history.pushState(null, "", url);
  updatePage();
}
