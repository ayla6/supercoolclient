const defaultLanguages = ["en", "en-US", "en-GB"];

export function fillMissingSettings() {
  if (!localStorage.getItem("langs")) {
    localStorage.setItem("langs", JSON.stringify(defaultLanguages));
  }
}

export const languagesToNotTranslate = JSON.parse(
  localStorage.getItem("langs"),
);
