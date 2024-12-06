import { elem } from "../utils/elem";

export function stickyHeader(title: string) {
  return elem("div", { className: "sticky-header" }, [
    elem("div", { className: "return-button", onclick: () => history.back() }),
    elem("span", { innerHTML: title }),
  ]);
}
