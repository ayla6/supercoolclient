import { elem } from "../utils/elem";

export const dialogBox = (content: HTMLElement) => {
  const background = elem("div", { className: "background" });
  const dialog = elem("div", { className: "popup" }, null, [content]);

  const cleanup = () => {
    document.body.style.overflow = null;
    background.remove();
  };

  // Prevent clicks inside dialog from closing it
  dialog.addEventListener("click", (e) => e.stopPropagation());

  // Add dialog to background
  background.append(dialog);

  // Handle background click
  background.onclick = cleanup;

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
    close: cleanup,
    element: dialog,
  };
};
