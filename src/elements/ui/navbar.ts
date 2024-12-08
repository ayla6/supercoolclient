import { manager } from "../../login";
import { elem } from "../utils/elem";

import homeSVG from "../../svg/home.svg?raw";
import notifSVG from "../../svg/bell.svg?raw";
import profileSVG from "../../svg/user.svg?raw";
import postSVG from "../../svg/pencil.svg?raw";

function navButton(text: string, link: string, icon: string) {
  const button = document.createElement("a");
  button.innerHTML = `${icon}<span>${text}</span>`;
  button.href = link;
  return button;
}

export function loadNavbar() {
  const navbar = document.getElementById("navbar");
  navbar.append(
    navButton("Home", "/", homeSVG),
    navButton("Notifications", "/notifications", notifSVG),
    manager.session
      ? navButton("Profile", "/" + manager.session.did, profileSVG)
      : "",
    elem("button", {
      innerHTML: `${postSVG}<span>Post</span>`,
    }),
  );
}
