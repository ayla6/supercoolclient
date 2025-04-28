import { createFeedManager } from "../elements/ui/local_state_manager";
import { profileCard } from "../elements/ui/profile_card";
import { createSearchBar } from "../elements/ui/search_bar";
import { elem } from "../elements/utils/elem";

export const searchRoute = async (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
  useCache: boolean = false,
) => {
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get("q") ?? "";

  const searchBar = createSearchBar();

  const sideBar = elem("div", { id: "side-bar", className: "sticky" });
  sideBar.append(searchBar);
  container.append(
    elem("div", { className: "buffer-top" }),
    sideBar,
    elem("div", { id: "content-holder" }, elem("div", { id: "content" })),
  );

  (
    document
      .getElementById("navbar")
      .querySelector(`a[href="/search"]`) as HTMLLinkElement
  ).onclick = (e) => {
    if (window.location.pathname === "/search") {
      e.preventDefault();
      e.stopPropagation();
      searchBar.focus();
    }
  };

  if (searchQuery) {
    searchBar.value = searchQuery;
    const stateManager = createFeedManager(
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

    window.onscroll = await stateManager.loadFeed(
      stateManager.cachedFeed ?? {
        feed: "top",
        nsid: "app.bsky.feed.searchPosts",
        params: {
          q: searchQuery,
          sort: "top",
        },
      },
    );
  }
};
