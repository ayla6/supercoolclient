import { get } from "../utils/cache";
import { elem } from "../utils/elem";
import { feedNSID, hydrateFeed } from "../ui/feed";
import { postCard } from "../ui/post_card";
import { stickyHeader } from "../ui/sticky_header";
import { getUriFromSplitPath } from "../utils/link_processing";

export async function statsPage(
  splitPath: string[],
  title: string,
  nsid: feedNSID,
  func: (item: any) => HTMLElement,
) {
  const container = document.getElementById("container");
  const content = elem("div", { id: "content" });

  const uri = getUriFromSplitPath(splitPath);

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
