export function elem<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  params: Partial<HTMLElementTagNameMap[K]> = {},
  children?: (Node | Text | string)[],
) {
  const e = document.createElement(tag);
  Object.assign(e, params);
  if (children) e.append(...children);
  return e;
}
