import { get } from "../elements/utils/cache";
import { elem } from "../elements/utils/elem";
import { hydrateFeed } from "../elements/ui/feed";

let currentFeed: string;
let currentScroll: { [key: string]: number } = {};

function navButton(feed: string, title: string) {
  const button = elem("a", {
    textContent: title,
    href: `?feed=${feed}&title=${title}`,
    onclick: (e) => {
      e.preventDefault();
      currentScroll[currentFeed] = scrollY;
      loadHomeFeed(feed, title);
    },
  });
  button.setAttribute("ignore", "");
  return button;
}

export async function homeRoute(currentPath: string, loadedPath: string) {
  if (loadedPath !== "home") {
    const container = document.getElementById("container");
    const leftBar = document.createElement("div");
    leftBar.id = "side-bar";
    leftBar.className = "sticky";
    const feedNav = document.createElement("div");
    feedNav.className = "side-nav";
    const prefs = await get("app.bsky.actor.getPreferences", { params: {} });
    const { items: feeds } = prefs.data.preferences.find((e) => {
      return e.$type === "app.bsky.actor.defs#savedFeedsPrefV2";
    });
    const { data: feedGens } = await get("app.bsky.feed.getFeedGenerators", {
      params: {
        feeds: (() => {
          let pinned = [];
          for (const feed of feeds.slice(1)) {
            if (feed.pinned) pinned.push(feed.value);
          }
          return pinned;
        })(),
      },
    });

    feedNav.append(navButton("following", "Following"));
    for (const feed of feedGens.feeds) {
      feedNav.append(navButton(feed.uri, feed.displayName));
    }

    leftBar.append(feedNav);

    const content = document.createElement("div");
    content.id = "content";
    container.replaceChildren(leftBar, content);
    homeUrlChange();
  }
}

async function loadHomeFeed(
  feedgen: string,
  title: string,
  wasAtHome: boolean = true,
) {
  if (!feedgen) {
    if (localStorage.getItem("last-feed"))
      [feedgen, title] = JSON.parse(localStorage.getItem("last-feed"));
    else {
      feedgen = "following";
      title = "Following";
    }
  }
  const lastFeed = currentFeed;
  currentFeed = feedgen;
  localStorage.setItem("last-feed", JSON.stringify([feedgen, title]));

  document.title = `${title} — SuperCoolClient`;

  window.scrollTo({ top: 0 });
  if (lastFeed !== feedgen || !wasAtHome) {
    const sideBar = document.getElementById("side-bar");
    sideBar.querySelector(".active")?.classList.remove("active");
    sideBar
      .querySelector(`[href="?feed=${feedgen}&title=${title}"]`)
      ?.classList.add("active");
  }
  const content = document.getElementById("content");
  if (currentFeed !== lastFeed) content.replaceChildren();
  if (currentFeed === feedgen) {
    const reload = currentFeed === lastFeed && wasAtHome;
    const items = await hydrateFeed(
      feedgen === "following"
        ? "app.bsky.feed.getTimeline"
        : "app.bsky.feed.getFeed",
      { feed: feedgen },
      reload,
    );
    if (currentFeed === feedgen) {
      content.replaceChildren(...items);
      if (!reload) window.scrollTo({ top: currentScroll[currentFeed] });
    }
  }
}

export async function homeUrlChange(currentPath?: string, loadedPath?: string) {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  let feedgen = params.get("feed");
  let title = params.get("title");

  history.replaceState({}, "", url.pathname);
  loadHomeFeed(feedgen, title, loadedPath === "/");
}
