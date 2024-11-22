import { get } from "../elements/blocks/cache";
import { elem } from "../elements/blocks/elem";
import { escapeHTML } from "../elements/blocks/textprocessing";
import { feed } from "../elements/content/feed";

let currentFeed: string;

function navButton(title: string, feed: string) {
  return elem("a", {
    innerHTML: escapeHTML(title),
    href: `?feedgen=${feed}&title=${title}`,
  });
}
export async function homeRoute(
  currentURL: Array<string>,
  loadedState: Array<string>,
) {
  if (loadedState[1] != "") {
    const container = document.getElementById("container");
    container.innerHTML = "";
    const leftBar = document.createElement("div");
    leftBar.className = "left-bar sticky";
    const feedNav = document.createElement("div");
    feedNav.className = "side-nav";
    const prefs = await get("app.bsky.actor.getPreferences", { params: {} });
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
    feedNav.append(navButton("Following", "following"));
    for (const feed of feedGens) {
      feedNav.append(navButton(feed.displayName, feed.uri));
    }
    leftBar.append(feedNav);
    container.append(leftBar);

    const content = document.createElement("div");
    content.id = "content";
    container.append(content);
    homeURLChange();
  }
}

export async function homeURLChange(currentURL?: string, loadedState?: string) {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  let feedgen = params.get("feedgen");
  let title = params.get("title");
  if (!feedgen) {
    if (localStorage.getItem("last-feed"))
      [feedgen, title] = JSON.parse(localStorage.getItem("last-feed"));
    else {
      feedgen = "following";
      title = "Following";
    }
  }
  const wasAtHome = loadedState?.split("/")[1] === "";
  const lastFeed = currentFeed;
  currentFeed = feedgen;
  localStorage.setItem("last-feed", JSON.stringify([feedgen, title]));

  document.title = `${title} — SuperCoolClient`;

  params.delete("following");
  params.delete("feedgen");
  params.delete("title");
  window.history.replaceState({}, "", url.toString());

  window.scrollTo({ top: 0 });
  const nsid =
    feedgen === "following"
      ? "app.bsky.feed.getTimeline"
      : "app.bsky.feed.getFeed";
  if (lastFeed !== feedgen || !wasAtHome) {
    document.querySelector(".active")?.classList.remove("active");
    document
      .querySelector(`[href="?feedgen=${feedgen}&title=${title}"]`)
      ?.classList.add("active");
  }
  const content = document.getElementById("content");
  if (currentFeed !== lastFeed) content.innerHTML = "";
  if (currentFeed === feedgen) {
    const items = await feed(
      nsid,
      { feed: feedgen },
      currentFeed === lastFeed && wasAtHome,
    );
    content.innerHTML = "";
    content.append(...items);
  }
}
