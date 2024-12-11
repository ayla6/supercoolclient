import { cache } from "../../router";
import { FeedState, OnscrollFunction } from "../../types";
import { elem } from "../utils/elem";
import { feedNSID, hydrateFeed } from "./feed";

export const createLocalStateManager = (
  container: HTMLDivElement,
  sideBar: HTMLDivElement,
) => {
  const path = window.location.pathname;
  let currentFeed: string;
  const feedState: FeedState = Object.create(null);

  const loadFeedState = async (
    feed: string,
    nsid: feedNSID,
    params: { [key: string]: any },
    func?: (item: any) => HTMLDivElement,
  ): Promise<[OnscrollFunction, HTMLDivElement]> => {
    window.onscroll = null;
    const lastFeed = currentFeed;
    currentFeed = feed;

    const currentFeedState = feedState[currentFeed];
    const content = currentFeedState?.[0] ?? elem("div", { id: "content" });
    if (feed !== lastFeed) {
      sideBar.querySelector(".active")?.classList.remove("active");
      sideBar.querySelector(`a[href="?feed=${feed}"]`)?.classList.add("active");
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
        nsid,
        params,
        func,
      );
      feedState[feed] = [content, onscrollFunc, 0];
    } else {
      window.scrollTo({ top: currentFeedState[2] });
    }
    const onscrollFunction = feedState[feed][1];
    if (cache.has(path)) {
      window.onscroll = onscrollFunction;
      const cacheEntry = cache.get(path);
      cacheEntry.onscroll = onscrollFunction;
      cacheEntry.feed = feed;
    }
    return [onscrollFunction, content];
  };
  return loadFeedState;
};
