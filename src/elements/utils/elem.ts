export function elem<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  params: Partial<HTMLElementTagNameMap[K]> = {},
  child?: Node | string,
  children?: (Node | string)[],
) {
  const e = document.createElement(tag);
  Object.assign(e, params);
  if (child) e.append(child);
  if (children) e.append(...children);
  return e;
}
