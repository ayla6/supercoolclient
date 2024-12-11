export type OnscrollFunction = ((this: GlobalEventHandlers, ev: Event) => any) &
  ((this: Window, ev: Event) => any);

export type RouteOutput = Promise<
  [
    onscrollFunction: OnscrollFunction,
    title?: string,
    scrollToElement?: HTMLElement,
    css?: string,
  ]
>;

export type FeedState = {
  [key: string]: [
    content: HTMLDivElement,
    onscroll: OnscrollFunction,
    scroll: number,
  ];
};
