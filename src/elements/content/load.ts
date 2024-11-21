import { rpc } from "../../login";

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
): Promise<{ items: HTMLElement[]; nextPage: string }> {
  let items = [];
  const { data } = await rpc.get(nsid, { params: params });
  const array = data[dataLocation];
  const { cursor: nextPage } = data;
  for (const item of array) {
    items.push(func(item));
  }
  return { items, nextPage };
}

export async function loadOnscroll(load: Function, cursor: string) {
  return async function (ev) {
    const content = document.getElementById("content");
    if (
      window.innerHeight + Math.round(window.scrollY) >=
      document.body.offsetHeight
    ) {
      const { items, nextPage } = await load();
      content.append(...items);
      cursor = nextPage;
    }
    if (cursor === undefined) {
      window.onscroll = null;
    }
  };
}
