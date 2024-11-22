import { feed, feedNSID } from "../elements/content/feed";
import { profiles } from "../elements/content/graph";
import { profilePage } from "../elements/page/profile";

const urlEquivalents: { [key: string]: [feedNSID, string?] } = {
  posts: ["app.bsky.feed.getAuthorFeed", "posts_no_replies"],
  media: ["app.bsky.feed.getAuthorFeed", "posts_with_media"],
  replies: ["app.bsky.feed.getAuthorFeed", "posts_with_replies"],
  likes: ["app.bsky.feed.getActorLikes"],
};

export async function profileRoute(currentURL: string, loadedState: string) {
  const splitURL = currentURL.split("/");
  const splitLoaded = loadedState.split("/");
  document.title = splitURL[2] + " — SuperCoolClient";

  let atid = splitURL[2];
  if (splitLoaded[2] != atid || splitLoaded[3] == "post")
    atid = await profilePage(atid);
  profileURLChange(currentURL, loadedState);
}

export async function profileURLChange(
  currentURL: string,
  loadedState: string,
) {
  const splitURL = currentURL.split("/");
  const splitLoaded = loadedState.split("/");
  const atid = splitURL[2];
  const currentPlace = splitURL[3] ?? "posts";
  const lastPlace = splitLoaded[3] ?? "posts";
  const content = document.getElementById("content");
  document
    .querySelector(
      `[value="${(lastPlace ?? "posts") + (lastPlace === "search" ? splitLoaded[4] : "")}"]`,
    )
    ?.classList.remove("active");
  document
    .querySelector(
      `[value="${currentPlace + (currentPlace === "search" ? window.location.search : "")}"]`,
    )
    ?.classList.add("active");
  if (splitLoaded[3] != splitURL[3]) content.innerHTML = "";
  let posts: HTMLElement[];
  let forcereload = currentPlace === lastPlace && splitLoaded[1] === "profile";
  switch (currentPlace) {
    case "following":
      posts = await profiles(
        "app.bsky.graph.getFollows",
        { actor: atid },
        forcereload,
      );
      break;
    case "followers":
      posts = await profiles(
        "app.bsky.graph.getFollowers",
        { actor: atid },
        forcereload,
      );
      break;
    case "search":
      posts = await feed(
        "app.bsky.feed.searchPosts",
        {
          author: atid,
          q: decodeURIComponent(window.location.search).slice(1),
        },
        forcereload,
      );
      break;
    default:
      posts = await feed(
        urlEquivalents[currentPlace][0],
        {
          actor: atid,
          filter: urlEquivalents[currentPlace][1],
        },
        forcereload,
      );
      break;
  }
  content.innerHTML = "";
  content.append(...posts);
}

export async function profileRedirect(currentURL: string, loadedState: string) {
  window.location.href = currentURL.slice(0, -1);
}
