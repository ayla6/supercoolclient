import { feed, feedNSID } from "../elements/content/feed";
import { profiles } from "../elements/content/graph";
import { profilePage } from "../elements/page/profile";

const urlEquivalents: { [key: string | undefined]: [feedNSID, string?] } = {
  posts: ["app.bsky.feed.getAuthorFeed", "posts_no_replies"],
  undefined: ["app.bsky.feed.getAuthorFeed", "posts_no_replies"],
  media: ["app.bsky.feed.getAuthorFeed", "posts_with_media"],
  replies: ["app.bsky.feed.getAuthorFeed", "posts_with_replies"],
  likes: ["app.bsky.feed.getActorLikes"],
};

export async function profileRoute(
  url: Array<string>,
  loadedState: Array<string>,
) {
  document.title = url[2] + " — SuperCoolClient";

  let atid = url[2];
  if (loadedState[2] != atid) atid = await profilePage(atid);
  const place = url[3] ?? "posts";
  const lastPlace = loadedState[3] ?? "posts";
  document
    .querySelector(
      `[value="${(lastPlace ?? "posts") + (lastPlace === "search" ? loadedState[4] : "")}"]`,
    )
    .classList.remove("active");
  document
    .querySelector(
      `[value="${place + (place === "search" ? window.location.search : "")}"]`,
    )
    .classList.add("active");
  const content = document.getElementById("content");
  content.innerHTML = "";
  let posts: HTMLElement[];
  switch (place) {
    case "following":
      posts = await profiles("app.bsky.graph.getFollows", { actor: atid });
      break;
    case "followers":
      posts = await profiles("app.bsky.graph.getFollowers", { actor: atid });
      break;
    case "search":
      posts = await feed("app.bsky.feed.searchPosts", {
        author: atid,
        q: decodeURIComponent(window.location.search).slice(1),
      });
      break;
    default:
      posts = await feed(urlEquivalents[place][0], {
        actor: atid,
        filter: urlEquivalents[place][1],
      });
      break;
  }
  content.append(...posts);
}
