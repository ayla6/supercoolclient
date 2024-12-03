import { manager, rpc } from "../../login";
import { elem } from "../blocks/elem";

function navButton(text: string, link: string, icon?: string) {
  const button = document.createElement("a");
  const span = document.createElement("span");
  span.innerText = text;
  button.append(span);
  button.href = link;
  return button;
}

export function loadNavbar() {
  const navbar = document.getElementById("navbar");
  navbar.append(
    navButton("Home", "/"),
    navButton("Notifications", "/notifications"),
    manager.session ? navButton("Profile", "/" + manager.session.did) : "",
    elem("button", {
      innerHTML: "Post",
    }),
  );
}
