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

import { login } from "./login.ts";
import * as feed from "./elements/feed.ts";
import * as list from "./elements/list.ts";
import { profilePage } from "./elements/profile.ts";
import { urlEquivalents } from "./elements/utils.ts";

let previousURL = window.location.pathname.split("/");
if (window.location.search) previousURL.push(window.location.search);
const originalPushState = history.pushState;
history.pushState = function (state, title, url) {
  previousURL = window.location.pathname.split("/");
  if (window.location.search) previousURL.push(window.location.search);
  originalPushState.apply(history, arguments);
};

export async function updatePage() {
  const currentURL = window.location.pathname.split("/");
  if (currentURL[2] != previousURL[2]) {
    document.body.setAttribute("style", "");
  }
  if (currentURL[1] == "profile") {
    const did = sessionStorage.getItem("currentProfileDID");
    const urlarea = currentURL[3];
    switch (urlarea) {
      case "post":
        break;
      default:
        if (previousURL[1] != "profile") load();
        document.getElementById("content").innerHTML = "";
        const previousValue =
          (previousURL[3] || "posts") +
          (previousURL[3] == "search" ? previousURL[4] : "");
        const currentValue =
          (urlarea || "posts") +
          (urlarea == "search" ? window.location.search : "");
        document
          .querySelector('[value="' + previousValue + '"]')
          .classList.remove("active");
        document
          .querySelector('[value="' + currentValue + '"]')
          .classList.add("active");
        if (currentURL[2] != previousURL[2]) {
          profilePage(currentURL[2]);
        } else
          switch (urlarea) {
            case "following":
            case "followers":
              await list.profiles(urlEquivalents[urlarea], { actor: did });
              break;
            default:
              await feed.userFeed(urlarea, did);
              break;
          }
        break;
    }
  }
  previousURL = window.location.pathname.split("/");
  if (window.location.search) previousURL.push(window.location.search);
}

document.addEventListener("click", (e) => {
  if (!(e.target instanceof Element)) return;
  const anchor = e.target.closest("a");
  if (anchor === null) return;

  if (e.ctrlKey || e.button !== 0) return;

  const url = new URL(anchor.href);
  if (window.location.origin !== url.origin) return;

  e.preventDefault();

  previousURL = window.location.pathname.split("/");
  if (window.location.search) previousURL.push(window.location.search);
  history.pushState(null, "", url);
  updatePage();
});

addEventListener("popstate", () => {
  updatePage();
});

export function load() {
  const path = window.location.pathname.split("/");
  switch (path[1]) {
    case "profile":
      if (path[4]) {
      } else {
        profilePage(path[2]);
      }
      break;
    case "":
      const content = document.createElement("div");
      content.id = "content";
      document.getElementById("container").appendChild(content);
      feed.feed("app.bsky.feed.getTimeline", {});
    default:
      break;
  }
}

/*const record: AppSCCProfile.Record = {
  $type: 'app.scc.profile',
  accentColor: '#f58ea9',
  pinnedSearches: ['#test']
}
rpc.call('com.atproto.repo.putRecord', {data: {record: record, collection: 'app.scc.profile',repo: sessionStorage.getItem('userdid'), rkey: 'self'}})*/

await login();
load();
