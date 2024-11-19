import * as feed from "../elements/content/feed";
import { rpc } from "../login";

function navButton(text: string, feed: string) {
  const button = document.createElement("a");
  button.innerText = text;
  return button;
}
export async function homeRoute(
  url: Array<string>,
  loadedState: Array<string>,
) {
  const container = document.getElementById("container");
  container.innerHTML = "";
  const leftBar = document.createElement("div");
  leftBar.className = "left-bar sticky";
  const feedNav = document.createElement("div");
  feedNav.className = "side-nav";
  const prefs = await rpc.get("app.bsky.actor.getPreferences", {});
  const feeds = prefs.data.preferences.find((e) => {
    return e.$type === "app.bsky.actor.defs#savedFeedsPrefV2";
  }).items;
  const feedGens = (
    await rpc.get("app.bsky.feed.getFeedGenerators", {
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
  feedNav.append(navButton("Following", ""));
  for (const feed of feedGens) {
    feedNav.append(navButton(feed.displayName, feed.uri));
  }
  leftBar.append(feedNav);
  container.append(leftBar);

  const content = document.createElement("div");
  content.id = "content";
  container.append(content);
  document.title = "Following — SuperCoolClient";
  feed.feed("app.bsky.feed.getTimeline", {});
}
