import { postCard } from "../ui/post_card";
import { rpc } from "../../login";
import { OnscrollFunction } from "../../types";

export type feedNSID =
  | "app.bsky.feed.getAuthorFeed"
  | "app.bsky.feed.getFeed"
  | "app.bsky.feed.getActorLikes"
  | "app.bsky.feed.searchPosts"
  | "app.bsky.feed.getTimeline"
  | "app.bsky.graph.getFollows"
  | "app.bsky.graph.getFollowers"
  | "app.bsky.feed.getLikes"
  | "app.bsky.feed.getRepostedBy"
  | "app.bsky.feed.getQuotes";

const dataLocations = {
  "app.bsky.feed.searchPosts": "posts",
  "app.bsky.graph.getFollows": "follows",
  "app.bsky.graph.getFollowers": "followers",
  "app.bsky.feed.getLikes": "likes",
  "app.bsky.feed.getRepostedBy": "repostedBy",
  "app.bsky.feed.getQuotes": "posts",
};

let feedBeingLoaded = false;
export const hydrateFeed = async (
  output: HTMLElement,
  nsid: feedNSID,
  params: { [key: string]: any },
  func: (item: any) => HTMLDivElement = postCard,
): Promise<OnscrollFunction> => {
  const dataLocation = dataLocations[nsid] ?? "feed";
  const { data } = await rpc.get(nsid, { params: params });

  output.replaceChildren();
  data[dataLocation].forEach((item: Object) => output.appendChild(func(item)));

  if (data.cursor === undefined) return;
  params.cursor = data.cursor;
  return async () => {
    if (feedBeingLoaded) return;

    const bottomPosition = window.innerHeight + Math.round(window.scrollY);
    const shouldLoad = bottomPosition + 2000 >= document.body.offsetHeight;

    if (!shouldLoad) return;

    try {
      feedBeingLoaded = true;
      const { data } = await rpc.get(nsid, { params: params });
      data[dataLocation].forEach((item: Object) =>
        output.appendChild(func(item)),
      );
      params.cursor = data.cursor;
      if (params.cursor === undefined) window.onscroll = null;
    } finally {
      feedBeingLoaded = false;
    }
  };
};
