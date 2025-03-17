import { fromRgbaHex, getWCAGTextColor, toRgbaHex } from "@mary/color-fns";
import { ImageFormat, StateManager } from "./types";
import { AppBskyNotificationListNotifications } from "@atcute/client/lexicons";

const langs = localStorage.getItem("langs");
const navigatorLangs = window.navigator.languages.map((lang) =>
  lang.slice(0, 2),
);

export const fillMissingSettings = () => {
  if (!langs) {
    localStorage.setItem("langs", JSON.stringify([...new Set(navigatorLangs)]));
  }
  if (!localStorage.getItem("view-blocked-posts")) {
    localStorage.setItem("view-blocked-posts", "1");
  }
  if (!localStorage.getItem("default-fullsize-format")) {
    localStorage.setItem("default-fullsize-format", "avif");
  }
  if (!localStorage.getItem("default-thumbnail-format")) {
    localStorage.setItem("default-thumbnail-format", "webp");
  }
  if (!localStorage.getItem("show-non-following-replies-on-timeline")) {
    localStorage.setItem("show-non-following-replies-on-timeline", "false");
  }
};

export const env: {
  languagesToNotTranslate: Set<string>;
  viewBlockedPosts: boolean;
  defaultFullsizeFormat: ImageFormat;
  defaultThumbnailFormat: ImageFormat;
  showNonFollowingRepliesOnTimeline: boolean;
  currentStateManager: StateManager;
  latestNotifications: {
    notifications: AppBskyNotificationListNotifications.Notification[];
    cursor: string;
  };
} = {
  languagesToNotTranslate: new Set(langs ? JSON.parse(langs) : navigatorLangs),
  viewBlockedPosts: localStorage.getItem("view-blocked-posts") === "true",
  defaultFullsizeFormat: localStorage.getItem(
    "default-fullsize-format",
  ) as ImageFormat,
  defaultThumbnailFormat: localStorage.getItem(
    "default-thumbnail-format",
  ) as ImageFormat,
  showNonFollowingRepliesOnTimeline:
    localStorage.getItem("show-non-following-replies-on-timeline") === "true",
  currentStateManager: {
    sideBar: undefined,
    loadFeed: undefined,
    feedsData: undefined,
  } as StateManager,
  latestNotifications: undefined,
};

export const updateColors = () => {
  const customAccentColor = localStorage.getItem("accent-color");
  if (customAccentColor) {
    document.documentElement.style.setProperty(
      "--accent-color",
      customAccentColor,
    );
    document.documentElement.style.setProperty(
      "--accent-color-text",
      "#" +
        toRgbaHex(
          getWCAGTextColor(fromRgbaHex(customAccentColor.slice(1))),
        ).slice(0, -2),
    );
  }
  const customBackgroundColor = localStorage.getItem("background-color");
  if (customBackgroundColor) {
    document.documentElement.style.setProperty(
      "--background-color",
      customBackgroundColor,
    );
  }
};
