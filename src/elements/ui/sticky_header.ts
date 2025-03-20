import { elem } from "../utils/elem";

export const stickyHeader = (title: string, returnButton: boolean = true) => {
  return elem("div", { className: "sticky-header" }, undefined, [
    returnButton
      ? elem("div", {
          className: "return-button",
          onclick: () => history.back(),
        })
      : null,
    elem("span", { textContent: title }),
  ]);
};
