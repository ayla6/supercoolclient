import { createFeedManager } from "../elements/ui/local_state_manager";
import { elem } from "../elements/utils/elem";
import { rpc } from "../login";
import { RouteOutput } from "../types";

export const homeRoute = async (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
): RouteOutput => {
  const sideBar = elem("div", { id: "side-bar", className: "sticky" });

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

  const feedsData = [];
  for (const feedGen of [
    { uri: "following", displayName: "Following" },
    ...feedGens.feeds,
  ]) {
    feedsData.push({
      displayName: feedGen.displayName,
      feed: feedGen.uri,
      nsid:
        feedGen.uri !== "following"
          ? "app.bsky.feed.getFeed"
          : "app.bsky.feed.getTimeline",
      params: { feed: feedGen.uri },
      setLastFeed: true,
    });
  }

  container.append(
    sideBar,
    elem("div", { id: "content-holder" }, elem("div", { id: "content" })),
  );

  const loadHomeFeed = createFeedManager(
    document.getElementById("content-holder"),
    sideBar,
    feedsData,
  );

  const params = new URLSearchParams(window.location.search);
  let uri: string = params.get("feed");
  history.replaceState(null, "", window.location.pathname);
  if (!uri) {
    if (localStorage.getItem("last-feed"))
      uri = localStorage.getItem("last-feed");
    else {
      uri = "following";
    }
  }

  const feedToLoad = feedsData.find((f) => f.feed === uri);
  const onscrollFunction = await loadHomeFeed(feedToLoad);

  return { onscrollFunction };
};
