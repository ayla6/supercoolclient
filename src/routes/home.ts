import { createLocalStateManager } from "../elements/ui/local_state_manager";
import { elem } from "../elements/utils/elem";
import { rpc } from "../login";
import { RouteOutput } from "../types";

export const homeRoute = async (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
): RouteOutput => {
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

  const loadHomeFeed = createLocalStateManager(container, sideBar);

  for (const feedGen of [
    { uri: "following", displayName: "Following" },
    ...feedGens.feeds,
  ]) {
    const { uri, displayName } = feedGen;
    const button = elem("a", {
      textContent: displayName,
      href: `?feed=${uri}`,
      onclick: async (e) => {
        e.preventDefault();
        localStorage.setItem("last-feed", uri);
        loadHomeFeed(
          uri,
          uri !== "following"
            ? "app.bsky.feed.getFeed"
            : "app.bsky.feed.getTimeline",
          { feed: uri },
        );
      },
    });
    button.setAttribute("ignore", "");
    feedNav.append(button);
  }
  sideBar.append(feedNav);

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

  container.append(sideBar);

  const [onscrollFunction, content] = await loadHomeFeed(
    uri,
    uri !== "following" ? "app.bsky.feed.getFeed" : "app.bsky.feed.getTimeline",
    { feed: uri },
  );
  container.appendChild(content);

  return { onscrollFunction, feed: uri };
};
