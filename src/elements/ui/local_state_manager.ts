import { cache } from "../../router";
import { FeedState, OnscrollFunction } from "../../types";
import { elem } from "../utils/elem";
import { feedNSID, hydrateFeed } from "./feed";

export const createFeedManager = (
  container: HTMLDivElement,
  sideBar: HTMLDivElement,
) => {
  const path = window.location.pathname;

  let loadedFeed: string;
  const feedState: FeedState = Object.create(null);

  const loadFeed = async (
    feed: string,
    nsid: feedNSID,
    params: { [key: string]: any },
    func?: (item: any) => HTMLDivElement,
  ): Promise<OnscrollFunction> => {
    const clonedParams = Object.assign({}, params);
    window.onscroll = null;

    const currentFeedState = feedState[feed];

    if (feed !== loadedFeed) {
      sideBar.querySelector(".active")?.classList.remove("active");
      sideBar.querySelector(`a[href="?feed=${feed}"]`)?.classList.add("active");
      if (loadedFeed) feedState[loadedFeed][2] = window.scrollY;
    }

    let oldContent = container.querySelector("#content");
    if (feed === loadedFeed || !currentFeedState) {
      if (!currentFeedState) {
        const tempChild = elem("div", { id: "content" });
        container.replaceChild(tempChild, oldContent);
        oldContent.remove();
        oldContent = tempChild;
      }
      window.scrollTo({ top: 0 });
      const content = elem("div", { id: "content" });
      const onscrollFunc: OnscrollFunction = await hydrateFeed(
        content,
        nsid,
        clonedParams,
        func,
      );
      feedState[feed] = [content, onscrollFunc, 0];
    } else {
      window.scrollTo({ top: currentFeedState[2] });
    }
    const content = feedState[feed][0];
    container.replaceChild(content, oldContent);
    oldContent.remove();
    oldContent = null;
    const onscrollFunction = feedState[feed][1];
    if (cache.has(path)) {
      const cacheEntry = cache.get(path);
      window.onscroll = onscrollFunction;
      cacheEntry.onscroll = onscrollFunction;
      cacheEntry.feed = feed;
    }
    loadedFeed = feed;
    return onscrollFunction;
  };

  return loadFeed;
};
