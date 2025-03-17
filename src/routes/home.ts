import { AppBskyFeedGetFeedGenerators } from "@atcute/client/lexicons";
import { createFeedManager } from "../elements/ui/local_state_manager";
import { createSearchBar } from "../elements/ui/search_bar";
import { elem } from "../elements/utils/elem";
import { manager, rpc, feeds } from "../login";
import { RouteOutput } from "../types";
import { unsignedHomeRoute } from "./unsigned_home";

export const homeRoute = async (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
): RouteOutput => {
  if (!manager.session) {
    return unsignedHomeRoute(undefined, undefined, container);
  }

  const sideBar = elem(
    "div",
    { id: "side-bar", className: "sticky" },
    createSearchBar(undefined, true),
  );

  const { data: feedGens } = await (async () => {
    try {
      return await rpc.get("app.bsky.feed.getFeedGenerators", {
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
    } catch (err) {
      return {
        data: {
          feeds: [],
        } as AppBskyFeedGetFeedGenerators.Output,
      };
    }
  })();

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
    });
  }

  container.append(
    sideBar,
    elem("div", { id: "content-holder" }, elem("div", { id: "content" })),
  );

  const stateManager = createFeedManager(
    document.getElementById("content-holder"),
    sideBar,
    feedsData,
    true,
  );

  sideBar.append(
    elem("div", { className: "sidebar-footer" }, undefined, [
      elem("a", {
        textContent: "Source code",
        href: "https://codeberg.org/aylac/supercoolclient",
      }),
      elem("a", {
        textContent: "Source code (mirror)",
        href: "https://github.com/ayla6/supercoolclient",
      }),
      elem("a", {
        textContent: "Dev",
        href: "/did:plc:avlpu4l2j5u3johint7tqrmu",
      }),
    ]),
  );

  const params = new URLSearchParams(window.location.search);
  let uri: string = params.get("feed");
  history.replaceState(null, "", window.location.pathname);
  if (!uri) {
    uri = localStorage.getItem("last-feed") ?? "following";
  }

  const feedToLoad = feedsData.find((f) => f.feed === uri);
  const onscrollFunction = await stateManager.loadFeed(feedToLoad);

  return { onscrollFunction, stateManager };
};
