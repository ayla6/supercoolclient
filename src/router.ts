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
import { profileRoute, profileURLChange } from "./routes/profile";
import { homeRoute, homeURLChange } from "./routes/home";
import { postRoute } from "./routes/post";
import { elem } from "./elements/blocks/elem";

let loadedState: string = "";

function saveLastLocation() {
  loadedState = window.location.pathname;
  if (window.location.search) loadedState += "/" + window.location.search;
}
const originalPushState = history.pushState;
history.pushState = function (state, title, url) {
  saveLastLocation();
  originalPushState.apply(history, arguments);
};

const routes: { [key: string]: string } = {
  "/": "home",
  "/profile/:handle": "profile",
  "/profile/:handle/:location": "profile",
  "/profile/:handle/post/:rkey": "post",
};
const changeRoutes: { [key: string]: Function } = {
  home: homeRoute,
  profile: profileRoute,
  post: postRoute,
};
const localRoutes: { [key: string]: Function } = {
  home: homeURLChange,
  profile: profileURLChange,
  post: postRoute,
};
function matchRoute(url: string) {
  const splitURL = url.split("/");
  for (const route of Object.keys(routes)) {
    const routeParts = route.split("/");
    if (routeParts.length !== splitURL.length) continue;

    let match = true;
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) continue;
      if (routeParts[i] !== splitURL[i]) {
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
  const currentURL = window.location.pathname;
  const splitURL = window.location.pathname.split("/");
  const splitLoaded = loadedState.split("/");
  if (splitURL[2] != splitLoaded[2]) {
    document.body.setAttribute("style", "");
  }
  const route = matchRoute(currentURL);
  if (route === matchRoute(loadedState)) {
    localRoutes[route](currentURL, loadedState);
  } else {
    window.scrollTo({ top: 0 });
    document.body.removeChild(document.getElementById("container"));
    document.body.append(elem("div", { id: "container" }));
    changeRoutes[route](currentURL, loadedState);
  }
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
