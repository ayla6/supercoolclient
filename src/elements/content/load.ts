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
  content: HTMLElement,
  func: Function,
) {
  const { data } = await rpc.get(nsid, { params: params });
  const array = data[dataLocation];
  const { cursor: nextPage } = data;
  for (const item of array) {
    content.append(func(item));
  }
  return nextPage;
}
