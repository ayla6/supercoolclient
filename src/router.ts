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

let loadedUrl: string = "";

function saveLastLocation() {
  loadedUrl = window.location.pathname;
  if (window.location.search) loadedUrl += "/" + window.location.search;
}

const routes: { [key: string]: string } = {
  "/": "home",
  "/notifications": "notifications",
  "/:did/": "profileTrim",
  "/:did": "profile",
  "/:did/:location": "profile",
  "/:did/post/:rkey": "post",
  "/:did/post/:rkey/likes": "postLikes",
  "/:did/post/:rkey/reposts": "postReposts",
  "/:did/post/:rkey/quotes": "postQuotes",
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
function matchRoute(url: string) {
  const splitUrl = url.split("/");
  for (const route of Object.keys(routes)) {
    const routeParts = route.split("/");
    if (routeParts.length !== splitUrl.length) continue;

    let match = true;
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) continue;
      if (routeParts[i] !== splitUrl[i]) {
        match = false;
        break;
      }
    }

    if (match) return routes[route];
  }
  return null;
}

export async function updatePage() {
  window.onscroll = null;
  const currentUrl = window.location.pathname;
  const splitUrl = window.location.pathname.split("/");
  const splitLoaded = loadedUrl.split("/");
  let ableToLocal = true;
  if (splitUrl[1] != splitLoaded[1]) {
    document.body.setAttribute("style", "");
    ableToLocal = false;
  }
  const route = matchRoute(currentUrl);
  if (ableToLocal && route === matchRoute(loadedUrl)) {
    localRoutes[route](currentUrl, loadedUrl);
  } else {
    if (loadedUrl[2] === "post" && currentUrl[2] !== "post")
      deleteCache("app.bsky.feed.getPostThread");
    document.title = "SuperCoolClient";
    window.scrollTo({ top: 0 });
    document.body.removeChild(document.getElementById("container"));
    document.body.append(elem("div", { id: "container" }));
    changeRoutes[route](currentUrl, loadedUrl);
  }
  saveLastLocation();
}

export function profileRedirect(did: string) {
  let splitUrl = window.location.href.split("/");
  splitUrl[3] = did;
  history.pushState(null, "", new URL(splitUrl.join("/")));
}

export function navigateTo(url: URL | string) {
  history.pushState(null, "", url);
  updatePage();
}
