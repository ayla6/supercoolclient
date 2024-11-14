import * as feed from "../elements/feed.ts";
import * as list from "../elements/list.ts";
import { profilePage } from "../elements/profile.ts";

export async function profileRoute(
  url: Array<string>,
  loadedState: Array<string>,
) {
  const urlEquivalents = {
    posts: ["app.bsky.feed.getAuthorFeed", "posts_no_replies"],
    undefined: ["app.bsky.feed.getAuthorFeed", "posts_no_replies"],
    media: ["app.bsky.feed.getAuthorFeed", "posts_with_media"],
    replies: ["app.bsky.feed.getAuthorFeed", "posts_with_replies"],
    search: [
      "app.bsky.feed.searchPosts",
      decodeURIComponent(window.location.search).slice(1),
    ],
    likes: ["app.bsky.feed.getActorLikes"],
  };

  let atid = url[2];
  if (loadedState[2] != atid) atid = await profilePage(atid);
  const place = url[3] || "posts";
  const lastPlace = loadedState[3] || "posts";
  document
    .querySelector(
      `[value="${(lastPlace || "posts") + (lastPlace == "search" ? loadedState[4] : "")}"]`,
    )
    .classList.remove("active");
  document
    .querySelector(
      `[value="${place + (place == "search" ? window.location.search : "")}"]`,
    )
    .classList.add("active");
  document.getElementById("content").innerHTML = "";
  switch (place) {
    case "following":
      await list.profiles("app.bsky.graph.getFollows", { actor: atid });
      break;
    case "followers":
      await list.profiles("app.bsky.graph.getFollowers", { actor: atid });
      break;
    default:
      await feed.userFeed(
        urlEquivalents[place][0],
        atid,
        urlEquivalents[place][1],
      );
      break;
  }
}
