import { createFeedManager } from "../elements/ui/local_state_manager";
import { elem } from "../elements/utils/elem";
import { feedNSID, RouteOutput } from "../types";

export const unsignedHomeRoute = async (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
): RouteOutput => {
  const sideBar = elem("div", { id: "side-bar", className: "sticky" });

  const feedsData = [
    {
      displayName: "Discover",
      feed: "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot",
      nsid: "app.bsky.feed.getFeed" as feedNSID,
      params: {
        feed: "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot",
      },
    },
  ];

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

  const onscrollFunction = await stateManager.loadFeed(feedsData[0]);

  return { onscrollFunction, stateManager };
};
