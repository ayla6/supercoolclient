import { AppBskyFeedDefs, AppBskyFeedPost } from "@atcute/client/lexicons";
import { rpc } from "../login.ts";

export const icon = {
  like: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-star"><path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"/></svg>`,
  reply: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-message"><defs id="defs2"/><path d="m 18,3 c 2.209139,0 4,1.790861 4,4 v 8 c 0,2.209139 -1.790861,4 -4,4 H 13.276 L 8.514,21.857 C 7.8906918,22.231059 7.0891961,21.836158 7.006,21.114 L 7,21 V 19 H 6 c -2.1314014,2e-6 -3.8884299,-1.671265 -3.995,-3.8 L 2,15 V 7 C 2,4.790861 3.790861,3 6,3 Z" id="path2"/></svg>`,
  repost: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-repeat"><path d="M4 12v-3a3 3 0 0 1 3 -3h13m-3 -3l3 3l-3 3"/><path d="M20 12v3a3 3 0 0 1 -3 3h-13m3 3l-3 -3l3 -3"/></svg>`,
};

export function button(type: string, post: AppBskyFeedDefs.PostView) {
  const button = document.createElement("a");
  button.innerHTML = icon[type];
  button.setAttribute("role", "button");

  const number = document.createElement("span");
  number.innerText = String(post[type + "Count"] || 0);
  number.classList.add("interaction-count");
  button.className = "interaction " + type;

  if (type === "like" || type === "repost") {
    let isActive = Boolean(post.viewer[type]);
    let [, , did, , record] = post.viewer[type]?.split("/") || [];
    const collection = "app.bsky.feed." + type;

    isActive && button.classList.add("active");

    button.addEventListener("click", async () => {
      try {
        const userDid = sessionStorage.getItem("userdid");
        if (isActive) {
          await rpc.call("com.atproto.repo.deleteRecord", {
            data: { rkey: record, collection, repo: did },
          });
          button.classList.remove("active");
          post.viewer[type] = null;
        } else {
          const response = await rpc.call("com.atproto.repo.createRecord", {
            data: {
              record: {
                $type: collection,
                createdAt: new Date().toISOString(),
                subject: { cid: post.cid, uri: post.uri },
              },
              collection,
              repo: userDid,
            },
          });
          record = response.data.uri.split("/").pop();
          did = userDid;
          post.viewer[type] = `at://${userDid}/${collection}/${record}`;
          button.classList.add("active");
        }

        const updatedPost = await rpc.get("app.bsky.feed.getPosts", {
          params: { uris: [post.uri] },
        });
        post[type + "Count"] = updatedPost.data.posts[0][type + "Count"];
        number.innerText = String(post[type + "Count"]);
        isActive = !isActive;
      } catch (err) {
        console.error(`Failed to ${isActive ? "remove" : "add"} ${type}:`, err);
      }
    });
  }

  button.appendChild(number);
  return button;
}
