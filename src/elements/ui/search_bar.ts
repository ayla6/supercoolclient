import { updatePage } from "../../router";
import { elem } from "../utils/elem";
import { historyPush } from "../utils/history";

export const createSearchBar = (addToSearch?: string, hideOnMobile = false) => {
  const searchBar = elem("input", {
    id: "search-bar",
    className: hideOnMobile ? "hide-on-mobile" : undefined,
    placeholder: "Search…",
  });
  searchBar.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && searchBar.value) {
      history.pushState(
        null,
        "",
        `/search?q=${addToSearch ? addToSearch + " " : ""}${searchBar.value}`,
      );
      updatePage();
    }
  });
  return searchBar;
};
