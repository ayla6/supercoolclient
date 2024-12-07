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

import { profileRoute, profileTrim, profileUrlChange } from "./routes/profile";
import { homeRoute, homeUrlChange } from "./routes/home";
import { postRoute } from "./routes/post";
import { elem } from "./elements/utils/elem";
import { notificationsRoute } from "./routes/notifications";
import { likesRoute } from "./routes/likes";
import { repostsRoute } from "./routes/reposts";
import { quotesRoute } from "./routes/quotes";
import { deleteCache } from "./elements/utils/cache";

let loadedPath: string = "";

function saveLastLocation() {
  loadedPath = window.location.pathname;
  if (window.location.search) loadedPath += "/" + window.location.search;
}

const routesBase: { [key: string]: string } = {
  "/": "home",
  "/notifications": "notifications",
  "/:/": "profileTrim",
  "/:": "profile",
  "/:/:": "profile",
  "/:/post/:": "post",
  "/:/post/:/likes": "postLikes",
  "/:/post/:/reposts": "postReposts",
  "/:/post/:/quotes": "postQuotes",
};
const changeRoutes: { [key: string]: Function } = {
  home: homeRoute,
  profile: profileRoute,
  post: postRoute,
  profileTrim: profileTrim,
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

function matchRoute(path: string) {
  const splitPath = path.split("/");
  for (const route of routes) {
    if (splitPath.length !== route.key.length) continue;

    let match = true;
    for (let i = 0; i < route.key.length; i++) {
      if (route.key[i] === ":") continue;
      if (route.key[i] !== splitPath[i]) {
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

  const curFirstSlash = currentPath.indexOf("/", 1);
  const curSecondSlash = currentPath.indexOf("/", curFirstSlash) + 1;
  const curThirdSlash = currentPath.indexOf("/", curSecondSlash);

  const curFirstSubdir = currentPath.slice(1, curFirstSlash);
  const curSecondSubdir = curThirdSlash
    ? currentPath.slice(curSecondSlash, curThirdSlash)
    : currentPath.slice(curSecondSlash);

  const loaFirstSlash = loadedPath.indexOf("/", 1);
  const loaSecondSlash = loadedPath.indexOf("/", loaFirstSlash) + 1;
  const loaThirdSlash = loadedPath.indexOf("/", loaSecondSlash);

  const loaFirstSubdir = loadedPath.slice(1, loaFirstSlash);
  const loaSecondSubdir = loaThirdSlash
    ? loadedPath.slice(loaSecondSlash, loaThirdSlash)
    : loadedPath.slice(loaSecondSlash);

  let ableToLocal = true;
  if (curFirstSubdir !== loaFirstSubdir) {
    document.body.setAttribute("style", "");
    ableToLocal = false;
  }
  const route = matchRoute(currentPath);
  if (ableToLocal && route === matchRoute(loadedPath)) {
    localRoutes[route](currentPath, loadedPath);
  } else {
    if (loaSecondSubdir === "post" && curSecondSubdir !== "post")
      deleteCache("app.bsky.feed.getPostThread");
    document.title = "SuperCoolClient";
    window.scrollTo({ top: 0 });
    document.body.removeChild(document.getElementById("container"));
    document.body.append(elem("div", { id: "container" }));
    changeRoutes[route](currentPath, loadedPath);
  }
  saveLastLocation();
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
