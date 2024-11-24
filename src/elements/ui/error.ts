import { elem } from "../blocks/elem";

export function error(text: string) {
  return elem("div", { className: "error", innerHTML: text });
}
