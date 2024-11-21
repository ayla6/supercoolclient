import { feed, feedNSID } from "../elements/content/feed";
import { profiles } from "../elements/content/graph";
import { profilePage } from "../elements/page/profile";

const urlEquivalents: { [key: string | undefined]: [feedNSID, string?] } = {
  posts: ["app.bsky.feed.getAuthorFeed", "posts_no_replies"],
  "": ["app.bsky.feed.getAuthorFeed", "posts_no_replies"],
  media: ["app.bsky.feed.getAuthorFeed", "posts_with_media"],
  replies: ["app.bsky.feed.getAuthorFeed", "posts_with_replies"],
  likes: ["app.bsky.feed.getActorLikes"],
};

export async function profileRoute(url: string, loadedState: string) {
  const splitURL = url.split("/");
  const splitLoaded = loadedState.split("/");
  document.title = splitURL[2] + " — SuperCoolClient";

  let atid = splitURL[2];
  if (splitLoaded[2] != atid || splitLoaded[3] == "post")
    atid = await profilePage(atid);
  profileURLChange(url, loadedState);
}

export async function profileURLChange(url: string, loadedState: string) {
  const splitURL = url.split("/");
  const splitLoaded = loadedState.split("/");
  const atid = splitURL[2];
  const place = splitURL[3] ?? "posts";
  const lastPlace = splitLoaded[3] ?? "posts";
  const content = document.getElementById("content");
  document
    .querySelector(
      `[value="${(lastPlace ?? "posts") + (lastPlace === "search" ? splitLoaded[4] : "")}"]`,
    )
    ?.classList.remove("active");
  document
    .querySelector(
      `[value="${place + (place === "search" ? window.location.search : "")}"]`,
    )
    ?.classList.add("active");
  if (splitLoaded[3] != splitURL[3]) content.innerHTML = "";
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
  content.innerHTML = "";
  content.append(...posts);
}
