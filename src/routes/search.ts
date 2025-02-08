import { hydrateFeed } from "../elements/ui/feed";
import { createFeedManager } from "../elements/ui/local_state_manager";
import { postCard } from "../elements/ui/post_card";
import { profileCard } from "../elements/ui/profile_card";
import { elem } from "../elements/utils/elem";
import { updatePage } from "../router";
import { OnscrollFunction, RouteOutput, RouteOutputNotPromise } from "../types";

export const searchRoute = async (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
): RouteOutput => {
  const returnObjects: RouteOutputNotPromise = { title: "Search" };

  const content = elem("div", { id: "content" });

  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get("q") ?? "";

  const searchBar = elem("input", {
    id: "search-bar",
    placeholder: "Search…",
    value: searchQuery,
  });
  searchBar.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && searchBar.value) {
      history.pushState(null, "", `/search?q=${searchBar.value}`);
      updatePage(false);
    }
  });

  const sideBar = elem("div", { id: "side-bar", className: "sticky" });
  sideBar.append(searchBar);
  container.append(elem("div", { className: "buffer-top" }), sideBar, content);

  if (searchQuery) {
    const loadSearchOption = createFeedManager(container, sideBar, 'sort="');

    const navButton = (feedGen: { uri: string; displayName: string }) => {
      const { uri, displayName } = feedGen;
      const nsid =
        uri !== "people"
          ? "app.bsky.feed.searchPosts"
          : "app.bsky.actor.searchActors";
      const params = {
        q: searchQuery,
        sort: uri !== "people" ? uri : undefined,
      };
      const button = elem("a", {
        textContent: displayName,
        onclick: async (e) => {
          e.preventDefault();
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

    returnObjects.onscrollFunction = await loadSearchOption(
      "top",
      "app.bsky.feed.searchPosts",
      { q: searchQuery, sort: "top" },
      postCard,
    );
  }

  if (!searchQuery) searchBar.focus();

  return returnObjects;
};
