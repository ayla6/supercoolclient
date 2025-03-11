import { elem } from "../utils/elem";

const FADE_DURATION = 150;

export const createTray = (text: string, timeout: number = 3000) => {
  const trayElement = elem("div", {
    className: "tray fade",
    textContent: text,
  });
  document.body.appendChild(trayElement);

  setTimeout(() => {
    trayElement.classList.remove("fade");
  }, FADE_DURATION);

  setTimeout(() => {
    trayElement.classList.add("fade");
    setTimeout(() => {
      document.body.removeChild(trayElement);
    }, FADE_DURATION);
  }, timeout);

  return trayElement;
};
