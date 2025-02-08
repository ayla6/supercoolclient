import { elem } from "../utils/elem";

export const dialogBox = (
  dialog: HTMLElement,
  onCleanup?: (result: boolean) => void,
) => {
  const background = elem("div", { className: "background" });

  const cleanup = (result: boolean = false) => {
    document.body.style.overflow = null;
    background.remove();
    if (onCleanup) onCleanup(result);
  };

  // Prevent clicks inside dialog from closing it
  dialog.addEventListener("click", (e) => e.stopPropagation());

  // Add dialog to background
  background.append(dialog);

  // Handle background click
  background.onclick = () => cleanup();

  // Handle escape key
  document.addEventListener("keydown", function handler(e) {
    if (e.key === "Escape") {
      cleanup();
      document.removeEventListener("keydown", handler);
    }
  });

  // Add to document
  document.body.append(background);
  document.body.style.overflow = "hidden";

  return {
    cleanup,
    element: dialog,
  };
};
