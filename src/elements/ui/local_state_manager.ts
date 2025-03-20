import { XRPC } from "@atcute/client";
import { rpc, sessionData } from "../../login";
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

export const createFeedManager = (
  contentHolder: HTMLElement,
  sideBar: HTMLDivElement,
  _feedsData: Feed[],
  profile: boolean = false,
  _rpc: XRPC = rpc,
): StateManager => {
  const atHome = window.location.pathname === "/";
  _feedsData = _feedsData.filter(Boolean);
  const feedsData = new Map<string, Feed>();

  const navbar = document.getElementById("navbar");
  if (atHome) {
    (navbar.querySelector(`a[href="/"]`) as HTMLLinkElement).onclick = (e) => {
      if (window.location.pathname === "/") {
        e.preventDefault();
        e.stopPropagation();
        loadFeed(feedsData.get(loadedFeed));
      }
    };
  }

  const feedNav = elem("div", { className: "side-nav" });
  for (const feed of _feedsData) {
    const button = elem("a", {
      textContent: feed.displayName,
      href: `?v=${feed.feed}`,
      onclick: async (e) => {
        e.preventDefault();
        if (atHome) localStorage.setItem("last-feed", feed.feed);
        loadFeed(feed);
      },
    });
    button.setAttribute("ignore", "");
    if (feed.extra) button.append(feed.extra);
    feedNav.append(button);
    feedsData.set(feed.feed, feed);
  }
  sideBar.append(feedNav);
  if (atHome) {
    const feed = feedsData.get(
      localStorage.getItem("last-feed") ?? "following",
    );
  }

  let loadedFeed: string;
  const feedState: FeedState = Object.create(null);

  const loadFeed = async (feed: {
    feed: string;
    nsid: feedNSID;
    params: { [key: string]: any };
    func?: (item: any) => HTMLDivElement;
  }): Promise<OnscrollFunction> => {
    const clonedParams = Object.assign({}, feed.params);
    let onscrollFunc: OnscrollFunction;
    window.onscroll = null;

    const currentFeedState = feedState[feed.feed];
    const headerEnd =
      document.querySelector(".profile-header")?.clientHeight + 10;

    if (feed.feed !== loadedFeed) {
      sideBar.querySelector(".active")?.classList.remove("active");
      sideBar
        .querySelector(`a[href="?v=${feed.feed}"]`)
        ?.classList.add("active");
      if (window.innerWidth <= 920)
        sideBar
          .querySelector(`a[href="?v=${feed.feed}"]`)
          ?.scrollIntoView({ block: "center" });
      if (loadedFeed) feedState[loadedFeed].scroll = window.scrollY;
    }

    const oldContent = contentHolder.querySelector(
      "#content",
    ) as HTMLDivElement;
    const scrollTop = profile
      ? currentFeedState?.scroll > headerEnd
        ? currentFeedState?.scroll
        : scrollY > headerEnd
          ? headerEnd
          : scrollY
      : (currentFeedState?.scroll ?? 0);
    window.scrollTo({ top: scrollTop });
    if (feed.feed === loadedFeed || !currentFeedState) {
      if (!currentFeedState) oldContent.style.opacity = "0";
      const content = elem("div", { id: "content" });
      onscrollFunc = await hydrateFeed(
        content,
        feed.nsid,
        clonedParams,
        feed.func,
        _rpc,
      );
      feedState[feed.feed] = { content, onscrollFunc, scroll: scrollTop };
      if (!currentFeedState) oldContent.removeAttribute("style");
      window.onscroll = onscrollFunc;
    }
    window.scrollTo({ top: scrollTop });

    const content = feedState[feed.feed].content;
    contentHolder.replaceChild(content, oldContent);
    oldContent.remove();
    loadedFeed = feed.feed;
    return onscrollFunc;
  };

  pullToRefresh(
    contentHolder,
    80,
    document.getElementById("search-bar") ? 40 : 0,
    async () => {
      await loadFeed(feedsData.get(loadedFeed));
    },
  );

  return {
    feedsData: _feedsData,
    loadFeed,
    sideBar,
  };
};
