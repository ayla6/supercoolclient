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

import { login } from "./login";
import { loadNavbar } from "./elements/ui/navbar";
import { profileRoute } from "./routes/profile";
import { homeRoute, homeURLChange } from "./routes/home";
import { postRoute } from "./routes/post";

let loadedState: Array<String> = [""];
function saveLastLocation() {
  loadedState = window.location.pathname.split("/");
  if (window.location.search) loadedState.push(window.location.search);
}
const originalPushState = history.pushState;
history.pushState = function (state, title, url) {
  saveLastLocation();
  originalPushState.apply(history, arguments);
};

const routes = {
  "/": homeRoute,
  "/profile/:handle": profileRoute,
  "/profile/:handle/:location": profileRoute,
  "/profile/:handle/post/:rkey": postRoute,
};
function matchRoute(url: Array<String>) {
  for (const route of Object.keys(routes)) {
    const routeParts = route.split("/");
    if (routeParts.length !== url.length) continue;

    let match = true;
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) continue;
      if (routeParts[i] !== url[i]) {
        match = false;
        break;
      }
    }

    if (match) {
      return routes[route];
    }
  }
  return null;
}

export async function updatePage() {
  window.onscroll = null;
  const currentURL = window.location.pathname.split("/");
  if (currentURL[2] != loadedState[2]) {
    document.body.setAttribute("style", "");
  }
  if (loadedState[1] === "" && currentURL[1] === "") homeURLChange(true);
  else matchRoute(currentURL)(currentURL, loadedState);
  saveLastLocation();
}

document.addEventListener("click", (e) => {
  const anchor = e.target instanceof Element ? e.target.closest("a") : null;
  if (!anchor || e.ctrlKey || e.button !== 0) return;

  const url = new URL(anchor.href);
  if (window.location.origin !== url.origin) return;

  e.preventDefault();
  history.pushState(null, "", url);
  updatePage();
});

addEventListener("popstate", () => {
  updatePage();
});

/*const record: AppSCCProfile.Record = {
  $type: 'app.scc.profile',
  accentColor: '#f58ea9',
  pinnedSearches: ['#test']
}
rpc.call('com.atproto.repo.putRecord', {data: {record: record, collection: 'app.scc.profile',repo: sessionStorage.getItem('userdid'), rkey: 'self'}})*/

login();
loadNavbar();
updatePage();
