import { elem } from "../utils/elem";

export const popupBox = (
  dialog: HTMLElement,
  onCleanup?: (result: any) => void,
) => {
  const background = elem("div", { className: "background" });

  const cleanup = (result: any = false) => {
    document.removeEventListener("keydown", escapeKeyHandler);
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
  const escapeKeyHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      console.log("hey");
      cleanup();
    }
  };
  document.addEventListener("keydown", escapeKeyHandler);

  // Add to document
  document.body.append(background);
  document.body.style.overflow = "hidden";

  return {
    cleanup,
    element: dialog,
  };
};

export const confirmDialog = async (prompt: string, confirm: string) => {
  return await new Promise<boolean>((resolve) => {
    const content = elem("div", { className: "popup" }, null, [
      elem("span", {
        textContent: prompt,
      }),
      elem("div", { className: "dialog-options" }, null, [
        elem("button", {
          textContent: "Cancel",
          onclick: () => {
            dialog.cleanup(false);
          },
        }),
        elem("button", {
          className: "confirm-delete",
          textContent: confirm,
          onclick: () => {
            dialog.cleanup(true);
          },
        }),
      ]),
    ]);
    const dialog = popupBox(content, (close = false) => resolve(close));
  });
};

export const inputDialog = async (prompt: string, confirm: string) => {
  return await new Promise<string>((resolve) => {
    const content = elem("div", { className: "popup" }, null, [
      elem("span", {
        textContent: prompt,
      }),
      elem("input", {
        type: "text",
      }),
      elem("div", { className: "dialog-options" }, null, [
        elem("button", {
          textContent: "Cancel",
          onclick: () => {
            dialog.cleanup("");
          },
        }),
        elem("button", {
          textContent: confirm,
          onclick: () => {
            const input = content.querySelector("input");
            dialog.cleanup(input.value);
          },
        }),
      ]),
    ]);
    const dialog = popupBox(content, (close = "") => resolve(close));
  });
};

export const selectDialog = async (
  prompt: string,
  options: string[],
  confirm: string,
) => {
  return await new Promise<string>((resolve) => {
    const content = elem("div", { className: "popup" }, null, [
      elem("span", {
        textContent: prompt,
      }),
      elem(
        "select",
        {},
        null,
        options.map((opt) =>
          elem("option", {
            value: opt,
            textContent: opt,
          }),
        ),
      ),
      elem("div", { className: "dialog-options" }, null, [
        elem("button", {
          textContent: "Cancel",
          onclick: () => {
            dialog.cleanup("");
          },
        }),
        elem("button", {
          textContent: confirm,
          onclick: () => {
            const select = content.querySelector("select");
            dialog.cleanup(select.value);
          },
        }),
      ]),
    ]);
    const dialog = popupBox(content, (close = "") => resolve(close));
  });
};
