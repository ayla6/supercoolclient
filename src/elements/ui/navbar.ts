import { manager } from "../../login";
import { elem } from "../utils/elem";

import homeSVG from "../../svg/home.svg?raw";
import notifSVG from "../../svg/bell.svg?raw";
import profileSVG from "../../svg/user.svg?raw";
import postSVG from "../../svg/pencil.svg?raw";
import { composerBox } from "./composer";
import { updatePage } from "../../router";

function navButton(text: string, link: string, icon: string) {
  return elem("a", { innerHTML: `${icon}<span>${text}</span>`, href: link });
}

export const loadNavbar = () => {
  const searchArea = elem("input", {
    id: "search-bar",
    placeholder: "Search…",
  });
  searchArea.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      history.pushState(null, "", `/search?q=${searchArea.value}`);
      updatePage(false);
    }
  });
  const navbar = document.getElementById("navbar");
  navbar.append(
    navButton("Home", "/", homeSVG),
    navButton("Notifications", "/notifications", notifSVG),
    searchArea,
    manager.session
      ? navButton("Profile", "/" + manager.session.did, profileSVG)
      : "",
    elem("button", {
      innerHTML: `${postSVG}<span>Post</span>`,
      onclick: () => composerBox(),
    }),
  );
};
