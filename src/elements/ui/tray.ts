import { elem } from "../utils/elem";

const FADE_DURATION = 150;

export const createTray = (text: string, timeout: number = 3000) => {
  let trayArea = document.getElementById("tray-area");

  if (!trayArea) {
    trayArea = elem("div", { id: "tray-area", className: "tray-area" });
    document.body.appendChild(trayArea);
  }

  const trayElement = elem("div", {
    className: "tray fade",
    textContent: text,
  });
  trayArea.appendChild(trayElement);
  console.log(text);

  setTimeout(() => {
    trayElement.classList.remove("fade");
  }, FADE_DURATION);

  setTimeout(() => {
    trayElement.classList.add("fade");
    setTimeout(() => {
      trayArea!.removeChild(trayElement);
      if (trayArea!.children.length === 0) {
        document.body.removeChild(trayArea!);
      }
    }, FADE_DURATION);
  }, timeout);

  return trayElement;
};
