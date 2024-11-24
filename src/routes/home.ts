import { get, inCache } from "../elements/blocks/cache";
import { elem } from "../elements/blocks/elem";
import { escapeHTML } from "../elements/blocks/textProcessing";
import { hydrateFeed } from "../elements/content/feed";

let currentFeed: string;

function navButton(feed: string, title: string) {
  const button = elem("a", {
    innerHTML: escapeHTML(title),
    href: `?feed=${feed}&title=${title}`,
    onclick: (e) => {
      e.preventDefault();
      loadFeed(feed, title);
    },
  });
  button.setAttribute("ignore", "");
  return button;
}
export async function homeRoute(
  currentURL: Array<string>,
  loadedState: Array<string>,
) {
  if (loadedState[1] != "") {
    const container = document.getElementById("container");
    container.innerHTML = "";
    const leftBar = document.createElement("div");
    leftBar.className = "side-bar sticky";
    const feedNav = document.createElement("div");
    feedNav.className = "side-nav";
    const prefs = await get("app.bsky.actor.getPreferences", {});
    const feeds = prefs.data.preferences.find((e) => {
      return e.$type === "app.bsky.actor.defs#savedFeedsPrefV2";
    }).items;
    const feedGens = (
      await get("app.bsky.feed.getFeedGenerators", {
        params: {
          feeds: (() => {
            let pinned = [];
            for (const feed of feeds.slice(1)) {
              if (feed.pinned) pinned.push(feed.value);
            }
            return pinned;
          })(),
        },
      })
    ).data.feeds;
    feedNav.append(navButton("following", "Following"));
    for (const feed of feedGens) {
      feedNav.append(navButton(feed.uri, feed.displayName));
    }
    leftBar.append(feedNav);
    container.append(leftBar);

    const content = document.createElement("div");
    content.id = "content";
    container.append(content);
    homeURLChange();
  }
}

async function loadFeed(
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
    document.querySelector(".active")?.classList.remove("active");
    document
      .querySelector(`[href="?feed=${feedgen}&title=${title}"]`)
      ?.classList.add("active");
  }
  const content = document.getElementById("content");
  if (currentFeed !== lastFeed) content.innerHTML = "";
  if (currentFeed === feedgen) {
    const forceReload = currentFeed === lastFeed && wasAtHome;
    const items = await hydrateFeed(
      "app.bsky.feed.getFeed",
      feedgen === "following" ? {} : { feed: feedgen },
      forceReload,
    );
    content.innerHTML = "";
    content.append(...items);
  }
}

export async function homeURLChange(currentURL?: string, loadedState?: string) {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  let feedgen = params.get("feed");
  let title = params.get("title");

  history.replaceState({}, "", window.location.href.split("?")[0]);

  loadFeed(feedgen, title, loadedState?.split("/")[1] === "");
}
