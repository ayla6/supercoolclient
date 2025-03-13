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
};

export const languagesToNotTranslate = new Set(
  langs ? JSON.parse(langs) : navigatorLangs,
);

export const viewBlockedPosts =
  localStorage.getItem("view-blocked-posts") === "true";
