import { fillMissingSettings, env, updateColors } from "./settings";
import { loadNavbar } from "./elements/ui/navbar";
import { login, rpc, sessionData } from "./login";
import { cleanCache, updatePage } from "./router";
import {
  createSwipeAction,
  pullToRefresh,
} from "./elements/utils/swipe_manager";

document.addEventListener("click", (e) => {
  const anchor =
    e.target instanceof Element
      ? e.target.closest("a") || e.target.closest("[works-as-link]")
      : null;
  if (!anchor || e.ctrlKey || e.button !== 0 || anchor.hasAttribute("ignore"))
    return;
  if (anchor instanceof HTMLDivElement) {
    if (window.getSelection()?.toString()) return;
    if (anchor.closest("a, button")) return;
  }
  const href =
    anchor instanceof HTMLAnchorElement
      ? anchor.href
      : new URL(
          (anchor as HTMLDivElement).getAttribute("href"),
          window.location.origin,
        ).href;
  if (!href) return;

  const url = new URL(href);
  if (window.location.origin !== url.origin) return;

  e.preventDefault();

  history.pushState(null, "", url);
  updatePage(false);
});
document.addEventListener("mousedown", (e) => {
  const anchor =
    e.target instanceof HTMLDivElement
      ? e.target.closest("[works-as-link]")
      : null;
  if (!anchor || e.button !== 1) return;
  if (anchor.closest("a, button")) return;
  const href = new URL(anchor.getAttribute("href"), window.location.origin)
    .href;
  if (!href) return;

  const url = new URL(href);
  if (window.location.origin !== url.origin) return;

  e.preventDefault();
  window.open(url.href, "_blank");
});
window.addEventListener("popstate", (e) => updatePage(true));
setInterval(cleanCache, 5 * 60 * 1000);

const path = window.location.pathname;
if (path.length !== 1 && path.endsWith("/")) {
  const newPath = path.slice(0, -1);
  history.replaceState(null, "", newPath);
}

updateColors();

fillMissingSettings();
{
  const sessions =
    localStorage.getItem("session") &&
    JSON.parse(localStorage.getItem("session"));
  if (sessions && !sessions["accessJwt"]) {
    env.sessionsProfile = (
      await rpc.get("app.bsky.actor.getProfiles", {
        params: { actors: Object.keys(sessions) },
      })
    ).data.profiles;
  }
}
await login();
loadNavbar();
updatePage(false);

createSwipeAction(document.body, (pos) => {
  const csm = env.currentStateManager;
  if (!csm.feedsData) return;
  const swipeDiff = pos.endX - pos.startX;
  const activeItem = csm.sideBar.querySelector(".active");
  if (Math.abs(swipeDiff) > 100 && activeItem) {
    const sibling =
      swipeDiff < 0
        ? activeItem.nextElementSibling
        : activeItem.previousElementSibling;
    if (sibling) {
      const position = Array.prototype.indexOf.call(
        activeItem.parentNode.children,
        sibling,
      );
      csm.loadFeed(csm.feedsData[position]);
      csm.sideBar
        .querySelector(`a[href="?v=${csm.feedsData[position].feed}"]`)
        .scrollIntoView({ block: "center" });
    }
  }
});
