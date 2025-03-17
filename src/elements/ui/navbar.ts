import { manager, rpc } from "../../login";
import { elem } from "../utils/elem";

import homeSVG from "../../svg/home.svg?raw";
import notifSVG from "../../svg/bell.svg?raw";
import profileSVG from "../../svg/user.svg?raw";
import postSVG from "../../svg/pencil.svg?raw";
import searchSVG from "../../svg/search.svg?raw";
import { composerBox } from "./composer";
import { loginDialog } from "./login_dialog";
import { env } from "../../settings";

function navButton(text: string, link: string, icon: string) {
  return elem("a", { innerHTML: `${icon}<span>${text}</span>`, href: link });
}

export const loadNavbar = () => {
  const navbar = document.getElementById("navbar");
  navbar.append(
    ...[
      navButton("Home", "/", homeSVG),
      navButton("Search", "/search", searchSVG),
      manager.session &&
        (() => {
          const notifButton = navButton(
            "Notifications",
            "/notifications",
            notifSVG,
          );
          notifButton.append(
            elem("span", { id: "notification-count", textContent: "0" }),
          );
          return notifButton;
        })(),
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

export const updateNotificationIcon = async (toZero: boolean = false) => {
  const unreadCount = toZero
    ? 0
    : (
        await rpc.get("app.bsky.notification.getUnreadCount", {
          params: {},
        })
      ).data.count;
  if (unreadCount) {
    env.latestNotifications = (
      await rpc.get("app.bsky.notification.listNotifications", {
        params: { limit: 50 },
      })
    ).data as any;
  }
  const notificationCount = document.getElementById("notification-count");
  if (unreadCount !== 0) {
    notificationCount.textContent = unreadCount.toString();
    notificationCount.classList.add("show");
  } else {
    notificationCount.classList.remove("show");
  }
};
