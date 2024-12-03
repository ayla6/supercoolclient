import { get } from "../blocks/cache";
import { elem } from "../blocks/elem";
import { feedNSID, hydrateFeed } from "../content/feed";
import { postCard } from "../ui/card";
import { stickyHeader } from "../ui/stickyHeader";

export async function statsPage(
  currentURL: string,
  loadedURL: string,
  title: string,
  nsid: feedNSID,
  func?: Function,
) {
  const splitURL = currentURL.split("/");
  const container = document.getElementById("container");
  let content = document.getElementById("content");

  container.innerHTML = "";
  container.append(stickyHeader(title));
  content = elem("div", { id: "content" });
  container.append(content);
  content.append(
    postCard(
      (
        await get("app.bsky.feed.getPosts", {
          params: {
            uris: [`at://${splitURL[1]}/app.bsky.feed.post/${splitURL[3]}`],
          },
        })
      ).data.posts[0],
      true,
    ),
  );
  content.append(
    ...(await hydrateFeed(
      nsid,
      {
        uri: `at://${splitURL[1]}/app.bsky.feed.post/${splitURL[3]}`,
      },
      true,
      func,
    )),
  );
}
