import { elem } from "../utils/elem";

export const popupBox = (
  dialog: HTMLElement,
  onCleanup?: (result: any) => void,
) => {
  const background = elem("div", { className: "background" });

  const cleanup = (result: any = false) => {
    document.removeEventListener("keydown", escapeKeyHandler);
    background.remove();
    if (onCleanup) onCleanup(result);
  };

  dialog.addEventListener("click", (e) => e.stopPropagation());

  background.append(dialog);

  background.onclick = () => cleanup();

  const escapeKeyHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") cleanup();
  };
  document.addEventListener("keydown", escapeKeyHandler);

  document.body.append(background);

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

export const textDialog = async (prompt: string, confirmText: string) => {
  return await new Promise<string>((resolve) => {
    const content = elem("div", { className: "popup" }, null, [
      elem("label", {
        textContent: prompt,
        htmlFor: "text-input",
      }),
      elem("input", {
        type: "text",
        id: "text-input",
      }),
      elem("div", { className: "dialog-options" }, null, [
        elem("button", {
          textContent: "Cancel",
          onclick: () => {
            dialog.cleanup("");
          },
        }),
        elem("button", {
          textContent: confirmText,
          onclick: () => {
            const input = content.querySelector("input");
            dialog.cleanup(input.value);
          },
        }),
      ]),
    ]);
    const dialog = popupBox(content, (close = "") => resolve(close));
    (content.querySelector("#text-input") as HTMLInputElement).focus();
  });
};

export const doubleTextDialog = async (
  prompt: string,
  prompt2: string,
  confirmText: string,
) => {
  return await new Promise<string[]>((resolve) => {
    const confirm = () => {
      const input1 = content.querySelector("#text-input-1") as HTMLInputElement;
      const input2 = content.querySelector("#text-input-2") as HTMLInputElement;
      dialog.cleanup([input1.value, input2.value]);
    };
    const content = elem("div", { className: "popup" }, null, [
      elem("label", {
        textContent: prompt,
        htmlFor: "text-input-1",
      }),
      elem("input", {
        type: "text",
        id: "text-input-1",
      }),
      elem("label", {
        textContent: prompt2,
        htmlFor: "text-input-2",
      }),
      elem("input", {
        type: "text",
        id: "text-input-2",
      }),
      elem("div", { className: "dialog-options" }, null, [
        elem("button", {
          textContent: "Cancel",
          onclick: () => {
            dialog.cleanup("");
          },
        }),
        elem("button", {
          textContent: confirmText,
          onclick: confirm,
        }),
      ]),
    ]);
    const dialog = popupBox(content, (close = "") => resolve(close));
    const textInput1 = content.querySelector(
      "#text-input-1",
    ) as HTMLInputElement;
    const textInput2 = content.querySelector(
      "#text-input-2",
    ) as HTMLInputElement;
    textInput1.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        confirm();
      }
    });
    textInput1.focus();
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
