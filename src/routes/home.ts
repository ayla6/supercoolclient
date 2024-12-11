import { elem } from "../elements/utils/elem";
import { hydrateFeed } from "../elements/ui/feed";
import { rpc } from "../login";
import { FeedState, OnscrollFunction, RouteOutput } from "../types";
import { cache } from "../router";

export const homeRoute = async (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
): RouteOutput => {
  let currentFeed: string;
  const feedState: FeedState = Object.create(null);

  const sideBar = elem("div", { id: "side-bar", className: "sticky" });
  const feedNav = elem("div", { className: "side-nav" });

  const prefs = await rpc.get("app.bsky.actor.getPreferences", { params: {} });
  const { items: feeds } = prefs.data.preferences.find((e) => {
    return e.$type === "app.bsky.actor.defs#savedFeedsPrefV2";
  });

  const { data: feedGens } = await rpc.get("app.bsky.feed.getFeedGenerators", {
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

  const loadHomeFeed = async (feed: string, title: string) => {
    window.onscroll = null;
    const lastFeed = currentFeed;
    currentFeed = feed;
    localStorage.setItem("last-feed", JSON.stringify([feed, title]));

    document.title = `${title} — SuperCoolClient`;

    const currentFeedState = feedState[currentFeed];
    const content = currentFeedState?.[0] ?? elem("div", { id: "content" });
    if (feed !== lastFeed) {
      sideBar.querySelector(".active")?.classList.remove("active");
      sideBar
        .querySelector(`a[href="?feed=${feed}&title=${title}"]`)
        ?.classList.add("active");
      if (lastFeed) {
        feedState[lastFeed][2] = window.scrollY;
        container.replaceChild(content, feedState[lastFeed][0]);
      } else {
        container.append(content);
      }
    }
    if (feed === lastFeed || !currentFeedState) {
      window.scrollTo({ top: 0 });
      const onscrollFunc: OnscrollFunction = await hydrateFeed(
        content,
        feed === "following"
          ? "app.bsky.feed.getTimeline"
          : "app.bsky.feed.getFeed",
        { feed: feed },
      );
      feedState[feed] = [content, onscrollFunc, 0];
    } else {
      window.scrollTo({ top: currentFeedState[2] });
    }
    const onscrollFunc = feedState[feed][1];
    if (cache.has("/")) {
      window.onscroll = onscrollFunc;
      cache.get("/")[3] = onscrollFunc;
    }
    return onscrollFunc;
  };

  for (const feedGen of [
    { uri: "following", displayName: "Following" },
    ...feedGens.feeds,
  ]) {
    const { uri, displayName } = feedGen;
    const button = elem("a", {
      textContent: displayName,
      href: `?feed=${uri}&title=${displayName}`,
      onclick: async (e) => {
        e.preventDefault();
        loadHomeFeed(uri, displayName);
      },
    });
    button.setAttribute("ignore", "");
    feedNav.append(button);
  }
  sideBar.append(feedNav);

  const params = new URLSearchParams(window.location.search);
  let feedgen: string = params.get("feed");
  let title: string = params.get("title");
  history.replaceState(null, "", window.location.pathname);
  if (!feedgen) {
    if (localStorage.getItem("last-feed"))
      [feedgen, title] = JSON.parse(localStorage.getItem("last-feed"));
    else {
      feedgen = "following";
      title = "Following";
    }
  }

  container.append(sideBar);

  const onscrollFunction = await loadHomeFeed(feedgen, title);

  return [onscrollFunction];
};
