import { manager, rpc, sessionData } from "../../login";
import { elem } from "../utils/elem";

import homeSVG from "../../svg/home.svg?raw";
import notifSVG from "../../svg/bell.svg?raw";
import profileSVG from "../../svg/user.svg?raw";
import postSVG from "../../svg/pencil.svg?raw";
import searchSVG from "../../svg/search.svg?raw";
import plusSVG from "../../svg/plus.svg?raw";
import logoutSVG from "../../svg/logout.svg?raw";
import settingsSVG from "../../svg/settings.svg?raw";
import { composerBox } from "./composer";
import { loginDialog } from "./login_dialog";
import { env } from "../../settings";
import { contextMenu } from "./context";
import { updatePage } from "../../router";
import { AppBskyActorDefs } from "@atcute/client/lexicons";
import { confirmDialog } from "./dialog";
import { request } from "../utils/request";

function navButton(text: string, link: string, icon: string) {
  const button = elem("a", {
    innerHTML: `${icon}<span>${text}</span>`,
    href: link,
  });
  button.setAttribute("use-cache", "");
  return button;
}

const profileContextMenu = (target: HTMLElement) => {
  contextMenu(target, [
    {
      icon: settingsSVG,
      text: "Settings",
      onclick: () => {
        history.pushState(null, "", "/settings");
        updatePage(true);
      },
    },
    { text: "divider" },
    ...env.sessionsProfile.map(
      (profile: AppBskyActorDefs.ProfileViewDetailed) => {
        return {
          icon: profile.avatar,
          text: profile.handle,
          onclick: () => {
            if (profile.did === sessionData.did) {
              history.pushState(null, "", `/${profile.did}`);
              updatePage(true);
            } else {
              localStorage.setItem("session-chosen", profile.did);
              window.location.reload();
            }
          },
        };
      },
    ),
    {
      icon: plusSVG,
      text: "Add another account",
      onclick: loginDialog,
    },
    {
      icon: logoutSVG,
      text: "Sign out",
      onclick: async () => {
        const result = await confirmDialog(
          `Sign out of ${sessionData.handle}?`,
          "Sign out",
        );
        if (result) {
          localStorage.removeItem("session-chosen");
          const sessions = JSON.parse(localStorage.getItem("session"));
          sessions[sessionData.did] = null;
          localStorage.setItem("session", JSON.stringify(sessions));
          window.location.reload();
        }
      },
    },
    ,
  ]);
};

export const loadNavbar = () => {
  const navbar = document.getElementById("navbar");
  navbar.replaceChildren(
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
        elem("a", {
          id: "profile-button",
          innerHTML: `<img src="${sessionData.avatar}"><span>Profile</span>`,
          onmousedown: (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest("a");
            let pressTimer: number;

            const showContextMenu = () => {
              profileContextMenu(target);
            };

            const startTimer = () => {
              pressTimer = setTimeout(showContextMenu, 500);
            };

            const clearTimer = () => {
              clearTimeout(pressTimer);
            };

            target.addEventListener("mouseup", clearTimer, { once: true });
            target.addEventListener("mouseleave", clearTimer, { once: true });

            startTimer();
          },
          ontouchstart: (e: TouchEvent) => {
            const target = (e.target as HTMLElement).closest("a");
            let pressTimer: number;

            const showContextMenu = () => {
              profileContextMenu(target);
            };

            const startTimer = () => {
              pressTimer = setTimeout(showContextMenu, 500);
            };

            const clearTimer = () => {
              clearTimeout(pressTimer);
            };

            target.addEventListener("touchend", clearTimer, { once: true });
            target.addEventListener("touchcancel", clearTimer, { once: true });

            startTimer();
          },
          onclick: (e: MouseEvent) => {
            history.pushState(null, "", `/${sessionData.did}`);
            updatePage(true);
          },
        }),
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
    request("app.bsky.notification.listNotifications", {
      params: { limit: 50 },
    });
  }
  const notificationCount = document.getElementById("notification-count");
  if (unreadCount !== 0) {
    notificationCount.textContent = unreadCount.toString();
    notificationCount.classList.add("show");
  } else {
    notificationCount.classList.remove("show");
  }
};
