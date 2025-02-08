import { hydrateFeed } from "../elements/ui/feed";
import { createFeedManager } from "../elements/ui/local_state_manager";
import { postCard } from "../elements/ui/post_card";
import { profileCard } from "../elements/ui/profile_card";
import { elem } from "../elements/utils/elem";
import { OnscrollFunction, RouteOutput } from "../types";

export const searchRoute = async (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
): RouteOutput => {
  const content = elem("div", { id: "content" });

  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get("q") || "";
  (document.getElementById("search-bar") as HTMLInputElement).value =
    searchQuery;

  const sideBar = elem("div", { id: "side-bar", className: "sticky" });

  const loadSearchOption = createFeedManager(container, sideBar, 'sort="');

  const navButton = (feedGen: { uri: string; displayName: string }) => {
    const { uri, displayName } = feedGen;
    const nsid =
      uri !== "people"
        ? "app.bsky.feed.searchPosts"
        : "app.bsky.actor.searchActors";
    const params = { q: searchQuery, sort: uri !== "people" ? uri : undefined };
    const button = elem("a", {
      textContent: displayName,
      onclick: async (e) => {
        e.preventDefault();
        localStorage.setItem("last-feed", uri);
        loadSearchOption(
          uri,
          nsid,
          params,
          uri !== "people" ? postCard : profileCard,
        );
      },
    });
    button.setAttribute("sort", uri);
    button.setAttribute("ignore", "");
    return button;
  };
  const feedNav = elem("div", { className: "side-nav" }, undefined, [
    navButton({ uri: "top", displayName: "Top" }),
    navButton({ uri: "latest", displayName: "Latest" }),
    navButton({ uri: "people", displayName: "People" }),
  ]);
  sideBar.append(feedNav);

  container.append(sideBar, content);

  const onscrollFunction: OnscrollFunction = await loadSearchOption(
    "top",
    "app.bsky.feed.searchPosts",
    { q: searchQuery, sort: "top" },
    postCard,
  );

  return { onscrollFunction, title: "Search" };
};
