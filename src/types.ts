export type OnscrollFunction = ((this: GlobalEventHandlers, ev: Event) => any) &
  ((this: Window, ev: Event) => any);

export type RouteOutput = Promise<{
  onscrollFunction?: OnscrollFunction;
  title?: string;
  scrollToElement?: HTMLElement;
  bodyStyle?: string;
}>;

export type RouteOutputNotPromise = {
  onscrollFunction?: OnscrollFunction;
  title?: string;
  scrollToElement?: HTMLElement;
  bodyStyle?: string;
};

export type FeedState = {
  [key: string]: {
    content: HTMLDivElement;
    onscrollFunc: OnscrollFunction;
    scroll: number;
  };
};
