export type OnscrollFunction = ((this: GlobalEventHandlers, ev: Event) => any) &
  ((this: Window, ev: Event) => any);

export type Route = (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
) => RouteOutput;

export type RouteOutput = Promise<{
  onscrollFunction?: OnscrollFunction;
  title?: string;
  scrollToElement?: HTMLElement;
  bodyStyle?: string;
  stateManager?: StateManager;
}>;

export type RouteOutputNotPromise = {
  onscrollFunction?: OnscrollFunction;
  title?: string;
  scrollToElement?: HTMLElement;
  bodyStyle?: string;
  stateManager?: StateManager;
};

export type FeedState = {
  [key: string]: {
    content: HTMLDivElement;
    onscrollFunc: OnscrollFunction;
    scroll: number;
  };
};

export type feedNSID =
  | "app.bsky.feed.getAuthorFeed"
  | "app.bsky.feed.getFeed"
  | "app.bsky.feed.searchPosts"
  | "app.bsky.feed.getTimeline"
  | "app.bsky.feed.getActorLikes"
  | "app.bsky.feed.getQuotes"
  | "app.bsky.graph.getFollows"
  | "app.bsky.graph.getFollowers"
  | "app.bsky.feed.getLikes"
  | "app.bsky.feed.getRepostedBy"
  | "app.bsky.actor.searchActors"
  | "app.bsky.graph.getKnownFollowers";

export type ImageFormat =
  | "avif"
  | "webp"
  | "png"
  | "jpeg"
  | "gif"
  | "bmp"
  | "heic";

export interface Feed {
  displayName: string;
  feed: string;
  nsid: feedNSID;
  params: { [key: string]: any };
  func?: (item: any) => HTMLDivElement;
  extra?: HTMLElement;
}

export interface StateManager {
  feedsData: Feed[];
  loadFeed: Function;
  sideBar: HTMLDivElement;
}

export type CacheEntry = {
  expirationDate: number;
  container: HTMLDivElement;
  title?: string;
  feed?: string;
  onscroll?: OnscrollFunction;
  bodyStyle?: string;
  scrollToElement?: HTMLElement;
  stateManager?: StateManager;
  search?: string;
};

export type PageCache = Map<string, CacheEntry>;
