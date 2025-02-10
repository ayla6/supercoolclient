import { cache } from "../../router";
import { FeedState, OnscrollFunction } from "../../types";
import { elem } from "../utils/elem";
import { createSwipeAction } from "../utils/swipe_manager";
import { feedNSID, hydrateFeed } from "./feed";

interface Feed {
  displayName: string;
  feed: string;
  nsid: feedNSID;
  params: { [key: string]: any };
  func?: (item: any) => HTMLDivElement;
  extra?: HTMLElement;
}

export const createFeedManager = (
  contentHolder: HTMLElement,
  sideBar: HTMLDivElement,
  feedsData: Feed[],
  home: boolean = false,
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
      if (loadedFeed) feedState[loadedFeed][2] = window.scrollY;
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
      );
      feedState[feed.feed] = [content, onscrollFunc, 0];
    } else {
      window.scrollTo({ top: currentFeedState[2] });
    }
    const content = feedState[feed.feed][0];
    contentHolder.replaceChild(content, oldContent);
    oldContent.remove();
    oldContent = null;
    const onscrollFunction = feedState[feed.feed][1];
    if (cache.has(path)) {
      const cacheEntry = cache.get(path);
      window.onscroll = onscrollFunction;
      cacheEntry.onscroll = onscrollFunction;
      cacheEntry.feed = feed.feed;
    }
    loadedFeed = feed.feed;
    return onscrollFunction;
  };

  createSwipeAction(contentHolder, (pos) => {
    const swipeDiff = pos.endX - pos.startX;
    const activeItem = sideBar.querySelector(".active");
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
        loadFeed(feedsData[position]);
        sideBar
          .querySelector(`a[href="?v=${feedsData[position].feed}"]`)
          .scrollIntoView({ block: "center" });
      }
    }
  });

  return loadFeed;
};
