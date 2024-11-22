import { get } from "../elements/blocks/cache";
import { elem } from "../elements/blocks/elem";
import { post } from "../elements/ui/card";

export async function postRoute(currentURL: string, loadedState: string) {
  const splitURL = currentURL.split("/");
  const container = document.getElementById("container");
  container.innerHTML = "";
  const content = elem("div", { id: "content" });
  container.append(content);
  const thread = await get("app.bsky.feed.getPostThread", {
    params: {
      uri: `at://${splitURL[2]}/app.bsky.feed.post/${splitURL[4]}`,
    },
  });
  let currentThread = thread.data.thread;
  while ("parent" in currentThread && "post" in currentThread.parent) {
    content.prepend(post(currentThread.parent.post));
    currentThread = currentThread.parent;
  }
  if ("post" in thread.data.thread) {
    content.append(post(thread.data.thread.post, "full"));
  }
  if ("replies" in thread.data.thread) {
    const appendReplies = (
      replies: any[],
      frag: HTMLElement | DocumentFragment,
      levels: number,
    ) => {
      if (replies) {
        const fragment = document.createDocumentFragment();
        for (const reply of replies) {
          if ("post" in reply) {
            fragment.append(post(reply.post, "reply", 8 * levels));
            if ("replies" in reply) {
              appendReplies(reply.replies, fragment, levels + 1);
            }
          }
        }
        frag.append(fragment);
      }
    };
    appendReplies(thread.data.thread.replies, content, 0);
  }
}
