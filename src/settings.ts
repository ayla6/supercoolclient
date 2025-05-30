import { fromRgbaHex, getWCAGTextColor, toRgbaHex } from "@mary/color-fns";
import { ImageFormat, StateManager } from "./types";
import {
  AppBskyActorDefs,
  AppBskyNotificationListNotifications,
} from "@atcute/client/lexicons";

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
    localStorage.setItem("show-non-following-replies-on-timeline", "true");
  }
  if (
    !localStorage.getItem("session-chosen") &&
    localStorage.getItem("session")
  ) {
    const storedSessions = localStorage.getItem("session");
    if (storedSessions) {
      const sessions = JSON.parse(storedSessions);
      localStorage.setItem("session-chosen", Object.keys(sessions)[0]);
    }
  }
};

export const env: {
  sessionsProfile: AppBskyActorDefs.ProfileViewDetailed[];
  sessionChosen: string;
  languagesToNotTranslate: Set<string>;
  viewBlockedPosts: boolean;
  defaultFullsizeFormat: ImageFormat;
  defaultThumbnailFormat: ImageFormat;
  showNonFollowingRepliesOnTimeline: boolean;
  currentStateManager: StateManager;
  contentLabels: any;
  feeds: any;
  translate: {
    type: "url" | "libretranslate" | "simplytranslate";
    url: string;
    apiKey: string;
    simplyTranslateEngine: "google" | "iciba" | "reverso";
  };
  limitedMode: boolean;
} = {
  sessionsProfile: undefined,
  sessionChosen: localStorage.getItem("session-chosen"),
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
  contentLabels: undefined,
  feeds: undefined,
  translate: {
    type: (localStorage.getItem("translator-type") as any) ?? "simplytranslate",
    url:
      localStorage.getItem("translator-url") ??
      "https://simplytranslate.org/api/translate",
    apiKey: localStorage.getItem("translator-api-key") ?? "",
    simplyTranslateEngine:
      (localStorage.getItem("simplytranslate-engine") as any) ?? "google",
  },
  limitedMode: localStorage.getItem("limited-mode") === "true",
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
