import { rpc } from "../login.ts";

export function formatDate(date) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export const urlEquivalents = {
  undefined: "posts_no_replies",
  "": "posts_no_replies",
  media: "posts_with_media",
  replies: "posts_with_replies",
  likes: "likes",
  following: "app.bsky.graph.getFollows",
  followers: "app.bsky.graph.getFollowers",
};
