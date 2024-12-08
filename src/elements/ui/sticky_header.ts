import { elem } from "../utils/elem";

export function stickyHeader(title: string) {
  return elem("div", { className: "sticky-header" }, null, [
    elem("div", { className: "return-button", onclick: () => history.back() }),
    elem("span", { textContent: title }),
  ]);
}
