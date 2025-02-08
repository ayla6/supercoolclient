import { hydrateFeed } from "../elements/ui/feed";
import { elem } from "../elements/utils/elem";
import { OnscrollFunction, RouteOutput } from "../types";

export const searchRoute = async (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
): RouteOutput => {
  const content = elem("div", { id: "content" });
  container.append(content);

  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get("q") || "";
  (document.getElementById("search-bar") as HTMLInputElement).value =
    searchQuery;

  const onscrollFunction: OnscrollFunction = await hydrateFeed(
    content,
    "app.bsky.feed.searchPosts",
    { q: searchQuery },
  );

  return { onscrollFunction, title: "Search" };
};
