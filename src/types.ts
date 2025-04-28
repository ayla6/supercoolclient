export type OnscrollFunction = ((this: GlobalEventHandlers, ev: Event) => any) &
  ((this: Window, ev: Event) => any);

export type Route = (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
  useCache: boolean,
) => Promise<void>;

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
  cachedFeed?: Object;
}

export type XRPCCache = Map<string, { value: any; expiresAt: number }>;
