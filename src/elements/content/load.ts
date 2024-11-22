import { get } from "../blocks/cache";

type QueryWithCursor =
  | "app.bsky.graph.getFollows"
  | "app.bsky.graph.getFollowers"
  | "app.bsky.feed.getAuthorFeed"
  | "app.bsky.feed.getFeed"
  | "app.bsky.feed.getActorLikes"
  | "app.bsky.feed.searchPosts"
  | "app.bsky.feed.getTimeline";

export async function load(
  nsid: QueryWithCursor,
  params: any,
  dataLocation: string,
  func: Function,
  forcereload: boolean = false,
): Promise<{ items: HTMLElement[]; cursor: string }> {
  let items = [];
  const { data } = await get(nsid, { params: params }, forcereload);
  const array = data[dataLocation];
  const cursor = data.cursor;
  for (const item of array) {
    items.push(func(item));
  }
  return { items, cursor };
}

export async function loadOnscroll(load: Function, params: any) {
  return async function (ev) {
    if (
      window.innerHeight + Math.round(window.scrollY) >=
      document.body.offsetHeight
    ) {
      const content = document.getElementById("content");
      const { items, cursor } = await load();
      content.append(...items);
      params.cursor = cursor;
      if (cursor === undefined) window.onscroll = null;
    }
  };
}
