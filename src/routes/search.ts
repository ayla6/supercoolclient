import { createFeedManager } from "../elements/ui/local_state_manager";
import { profileCard } from "../elements/ui/profile_card";
import { elem } from "../elements/utils/elem";
import { updatePage } from "../router";
import { RouteOutput, RouteOutputNotPromise } from "../types";

export const searchRoute = async (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
): RouteOutput => {
  const returnObjects: RouteOutputNotPromise = { title: "Search" };

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
  container.append(
    elem("div", { className: "buffer-top" }),
    sideBar,
    elem("div", { id: "content-holder" }, elem("div", { id: "content" })),
  );

  if (searchQuery) {
    const loadSearchOption = createFeedManager(
      document.getElementById("content-holder"),
      sideBar,
      [
        {
          displayName: "Top",
          feed: "top",
          nsid: "app.bsky.feed.searchPosts",
          params: {
            q: searchQuery,
            sort: "top",
          },
        },
        {
          displayName: "Latest",
          feed: "latest",
          nsid: "app.bsky.feed.searchPosts",
          params: {
            q: searchQuery,
            sort: "latest",
          },
        },
        {
          displayName: "People",
          feed: "people",
          nsid: "app.bsky.actor.searchActors",
          params: {
            q: searchQuery,
          },
          func: profileCard,
        },
      ],
    );

    returnObjects.onscrollFunction = await loadSearchOption({
      feed: "top",
      nsid: "app.bsky.feed.searchPosts",
      params: {
        q: searchQuery,
        sort: "top",
      },
    });
  }

  if (!searchQuery) searchBar.focus();

  return returnObjects;
};
