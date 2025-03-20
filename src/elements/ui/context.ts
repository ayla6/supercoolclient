import { elem } from "../utils/elem";

export const contextMenu = (
  source: HTMLElement,
  options: {
    text: string;
    icon?: string;
    link?: string;
    onclick?: (e: MouseEvent) => any;
    condition?: boolean;
    important?: boolean;
  }[],
) => {
  const background = elem("div", { className: "background transparent" });

  const cleanup = (result: any = false) => {
    document.removeEventListener("keydown", escapeKeyHandler);
    window.removeEventListener("resize", updatePosition);
    background.remove();
  };

  const menu = elem(
    "div",
    { className: "context-menu" },
    undefined,
    options.map((option) => {
      if (option.condition === false) return;
      const item =
        option.text === "divider"
          ? elem("div", {
              className: "divider",
            })
          : elem("div", {
              className: option.important ? "item important" : "item",
              innerHTML:
                (option.icon
                  ? option.icon.startsWith("<")
                    ? `<div class="icon">${option.icon}</div>`
                    : `<div class="icon"><img src="${option.icon}"></div>`
                  : "") + option.text,
              onclick: (e) => {
                e.stopPropagation();
                option.onclick && option.onclick(e);
                cleanup();
              },
            });
      return item;
    }),
  );

  background.append(menu);

  background.onclick = () => cleanup();

  const escapeKeyHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") cleanup();
  };
  document.addEventListener("keydown", escapeKeyHandler);

  document.body.append(background);

  const updatePosition = () => {
    const childOfContent = source.closest("#content") as HTMLDivElement;
    const boundingAreaHeight = childOfContent
      ? childOfContent.offsetHeight
      : window.innerHeight;
    const boundingAreaWidth = childOfContent
      ? childOfContent.offsetWidth
      : window.innerWidth;

    const rect = source.getBoundingClientRect();
    menu.style.position = "fixed";
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const spaceBelow = boundingAreaHeight - rect.bottom;

    const centerPos = rect.left + (rect.width - menuWidth) / 2;
    const spaceRight = boundingAreaWidth - rect.right;

    menu.style.left =
      centerPos >= 0 && centerPos + menuWidth <= boundingAreaWidth
        ? `${centerPos}px`
        : spaceRight >= menuWidth
          ? `${rect.left}px`
          : `${rect.right - menuWidth}px`;

    menu.style.top =
      spaceBelow >= menuHeight
        ? `${rect.bottom}px`
        : `${rect.top - menuHeight}px`;
  };
  updatePosition();
  window.addEventListener("resize", updatePosition);

  return menu;
};
