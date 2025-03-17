import { XRPC } from "@atcute/client";
import { rpc } from "../../login";
import { cache } from "../../router";
import {
  Feed,
  feedNSID,
  FeedState,
  OnscrollFunction,
  StateManager,
} from "../../types";
import { elem } from "../utils/elem";
import { hydrateFeed } from "./feed";
import { pullToRefresh } from "../utils/swipe_manager";

export let currentStateManager: StateManager = {
  feedsData: undefined,
  loadFeed: undefined,
  sideBar: undefined,
};

export const createFeedManager = (
  contentHolder: HTMLElement,
  sideBar: HTMLDivElement,
  feedsData: Feed[],
  home: boolean = false,
  _rpc: XRPC = rpc,
) => {
  const path = window.location.pathname;
  feedsData = feedsData.filter(Boolean);

  const setHomeNavButton = (feed: Feed) => {
    (
      document
        .getElementById("navbar")
        .querySelector(`a[href="/"]`) as HTMLLinkElement
    ).onclick = (e) => {
      if (window.location.pathname === "/") {
        e.preventDefault();
        e.stopPropagation();
        loadFeed(feed);
      }
    };
  };

  if (home) {
    const feed = feedsData.find(
      (f) => f.feed === (localStorage.getItem("last-feed") ?? "following"),
    );
    setHomeNavButton(feed);
  }

  const feedNav = elem("div", { className: "side-nav" });
  for (const feed of feedsData) {
    const button = elem("a", {
      textContent: feed.displayName,
      href: `?v=${feed.feed}`,
      onclick: async (e) => {
        e.preventDefault();
        if (home) {
          localStorage.setItem("last-feed", feed.feed);
          setHomeNavButton(feed);
        }
        loadFeed(feed);
      },
    });
    button.setAttribute("ignore", "");
    if (feed.extra) button.append(feed.extra);
    feedNav.append(button);
  }
  sideBar.append(feedNav);

  let loadedFeed: string;
  const feedState: FeedState = Object.create(null);

  const loadFeed = async (feed: {
    feed: string;
    nsid: feedNSID;
    params: { [key: string]: any };
    func?: (item: any) => HTMLDivElement;
  }): Promise<OnscrollFunction> => {
    const clonedParams = Object.assign({}, feed.params);
    window.onscroll = null;

    const currentFeedState = feedState[feed.feed];

    if (feed.feed !== loadedFeed) {
      sideBar.querySelector(".active")?.classList.remove("active");
      sideBar
        .querySelector(`a[href="?v=${feed.feed}"]`)
        ?.classList.add("active");
      sideBar
        .querySelector(`a[href="?v=${feed.feed}"]`)
        ?.scrollIntoView({ block: "center" });
      if (loadedFeed) feedState[loadedFeed].scroll = window.scrollY;
    }

    let oldContent = contentHolder.querySelector("#content");
    if (feed.feed === loadedFeed || !currentFeedState) {
      if (!currentFeedState) {
        const tempChild = elem("div", { id: "content" });
        contentHolder.replaceChild(tempChild, oldContent);
        oldContent.remove();
        oldContent = tempChild;
      }
      window.scrollTo({ top: 0 });
      const content = elem("div", { id: "content" });
      const onscrollFunc: OnscrollFunction = await hydrateFeed(
        content,
        feed.nsid,
        clonedParams,
        feed.func,
        _rpc,
      );
      feedState[feed.feed] = { content, onscrollFunc, scroll: 0 };
    } else {
      window.scrollTo({ top: currentFeedState.scroll });
    }
    const content = feedState[feed.feed].content;
    contentHolder.replaceChild(content, oldContent);
    oldContent.remove();
    oldContent = null;
    const onscrollFunction = feedState[feed.feed].onscrollFunc;
    if (cache.has(path)) {
      const cacheEntry = cache.get(path);
      window.onscroll = onscrollFunction;
      cacheEntry.onscroll = onscrollFunction;
      cacheEntry.feed = feed.feed;
    }
    loadedFeed = feed.feed;
    return onscrollFunction;
  };

  pullToRefresh(
    contentHolder,
    80,
    document.getElementById("search-bar") ? 40 : 0,
    async () => {
      await loadFeed(feedsData.find((f) => f.feed === loadedFeed));
    },
  );

  return {
    feedsData,
    loadFeed,
    sideBar,
  };
};
