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

import {
  profilePage,
  urlEquivalents,
  userFeed,
  userProfiles,
} from "./loadings";
const script = document.getElementById("script");

let previousURL = window.location.pathname.split("/");
if (window.location.search) previousURL.push(window.location.search);
const originalPushState = history.pushState;
history.pushState = function (state, title, url) {
  previousURL = window.location.pathname.split("/");
  if (window.location.search) previousURL.push(window.location.search);
  originalPushState.apply(history, arguments);
};

function replaceScript(url: string, location: string) {
  const oldScript = document.getElementById("pagescript");
  const script = document.createElement("script");
  script.type = "module";
  script.id = "pagescript";
  script.src = url;
  script.setAttribute("location", location);
  document.body.appendChild(script);
  oldScript.remove();
}

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
        if (previousURL[1] != "post ") replaceScript("/src/post.ts", "post");
        break;
      default:
        if (previousURL[1] != "profile")
          replaceScript("/src/profile.ts", "profile");
        document.getElementById("feed").innerHTML = "";
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
              await userProfiles(urlEquivalents[urlarea], did);
              break;
            default:
              await userFeed(urlarea, did);
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
