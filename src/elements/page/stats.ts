import { get } from "../utils/cache";
import { elem } from "../utils/elem";
import { feedNSID, hydrateFeed } from "../content/feed";
import { postCard } from "../ui/post_card";
import { stickyHeader } from "../ui/sticky_header";

export async function statsPage(
  currentUrl: string,
  loadedUrl: string,
  title: string,
  nsid: feedNSID,
  func?: Function,
) {
  const splitUrl = currentUrl.split("/");
  const container = document.getElementById("container");
  let content = document.getElementById("content");

  content = elem("div", { id: "content" });
  container.replaceChildren(stickyHeader(title), content);
  content.append(
    postCard(
      (
        await get("app.bsky.feed.getPosts", {
          params: {
            uris: [`at://${splitUrl[1]}/app.bsky.feed.post/${splitUrl[3]}`],
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
        uri: `at://${splitUrl[1]}/app.bsky.feed.post/${splitUrl[3]}`,
      },
      true,
      func,
    )),
  );
}
