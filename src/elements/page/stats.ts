import { get } from "../utils/cache";
import { elem } from "../utils/elem";
import { feedNSID, hydrateFeed } from "../content/feed";
import { postCard } from "../ui/post_card";
import { stickyHeader } from "../ui/sticky_header";
import { getUriFromPath } from "../utils/link_processing";

export async function statsPage(
  currentPath: string,
  title: string,
  nsid: feedNSID,
  func?: Function,
) {
  const container = document.getElementById("container");
  const content = elem("div", { id: "content" });

  const uri = getUriFromPath(currentPath);

  container.replaceChildren(stickyHeader(title), content);
  content.append(
    postCard(
      (
        await get("app.bsky.feed.getPosts", {
          params: {
            uris: [uri],
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
        uri: uri,
      },
      true,
      func,
    )),
  );
}
