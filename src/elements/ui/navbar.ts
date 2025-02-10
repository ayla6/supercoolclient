import { manager } from "../../login";
import { elem } from "../utils/elem";

import homeSVG from "../../svg/home.svg?raw";
import notifSVG from "../../svg/bell.svg?raw";
import profileSVG from "../../svg/user.svg?raw";
import postSVG from "../../svg/pencil.svg?raw";
import searchSVG from "../../svg/search.svg?raw";
import { composerBox } from "./composer";
import { loginDialog } from "./login_dialog";

function navButton(text: string, link: string, icon: string) {
  return elem("a", { innerHTML: `${icon}<span>${text}</span>`, href: link });
}

export const loadNavbar = () => {
  const navbar = document.getElementById("navbar");
  navbar.append(
    ...[
      navButton("Home", "/", homeSVG),
      navButton("Search", "/search", searchSVG),
      manager.session && navButton("Notifications", "/notifications", notifSVG),
      manager.session &&
        navButton("Profile", "/" + manager.session.did, profileSVG),
      manager.session &&
        elem("button", {
          id: "composer-button",
          innerHTML: `${postSVG}<span>Post</span>`,
          onclick: () => composerBox(),
        }),
      !manager.session &&
        elem("button", { textContent: "Sign in", onclick: loginDialog }),
    ].filter(Boolean),
  );
};
