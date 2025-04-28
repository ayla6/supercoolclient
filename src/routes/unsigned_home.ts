import { createFeedManager } from "../elements/ui/local_state_manager";
import { elem } from "../elements/utils/elem";
import { feedNSID } from "../types";

export const unsignedHomeRoute = async (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
  useCache: boolean = false,
) => {
  const sideBar = elem("div", { id: "side-bar", className: "sticky" });

  const feedsData = [
    {
      displayName: "Top moots + Skibidi",
      feed: "at://did:plc:avlpu4l2j5u3johint7tqrmu/app.bsky.feed.generator/aaamhmkkerjsk",
      nsid: "app.bsky.feed.getFeed" as feedNSID,
      params: {
        feed: "at://did:plc:avlpu4l2j5u3johint7tqrmu/app.bsky.feed.generator/aaamhmkkerjsk",
      },
    },
  ];
  /*[
    {
      displayName: "Discover",
      feed: "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot",
      nsid: "app.bsky.feed.getFeed" as feedNSID,
      params: {
        feed: "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot",
      },
    },
    ];*/

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

  window.onscroll = await stateManager.loadFeed(
    stateManager.cachedFeed ?? feedsData[0],
  );
};
