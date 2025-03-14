import { fromRgbaHex, getWCAGTextColor, toRgbaHex } from "@mary/color-fns";

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
};

export let settings = {
  languagesToNotTranslate: new Set(langs ? JSON.parse(langs) : navigatorLangs),
  viewBlockedPosts: localStorage.getItem("view-blocked-posts") === "true",
  defaultFullsizeFormat:
    localStorage.getItem("default-fullsize-format") || "avif",
  defaultThumbnailFormat:
    localStorage.getItem("default-thumbnail-format") || "webp",
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
