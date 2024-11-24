import {
  AppBskyEmbedDefs,
  AppBskyEmbedExternal,
  AppBskyEmbedRecord,
  AppBskyFeedPost,
} from "@atcute/client/lexicons";
import { manager, rpc } from "../../login";
import { elem } from "../blocks/elem";
import { idchoose } from "../blocks/id";

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
    navButton("Profile", "/" + manager.session.did),
    elem("button", {
      innerHTML: "Post",
    }),
  );
}
