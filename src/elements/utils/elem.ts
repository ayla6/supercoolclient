export const elem = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  params: Partial<HTMLElementTagNameMap[K]> = {},
  child?: Node,
  children?: Node[],
) => {
  const e = document.createElement(tag);
  Object.assign(e, params);
  if (child) e.appendChild(child);
  if (children)
    children.forEach((child) => {
      if (child) e.appendChild(child);
    });
  return e;
};
