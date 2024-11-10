import { AppBskyFeedDefs } from "@atcute/client/lexicons";
import { rpc } from "../login.ts";

export const icon = {
  like: `<svg class="like-icon" width="24" height="24" fill="currentColor" version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m8.243 7.34-6.38 0.925-0.113 0.023a1 1 0 0 0-0.44 1.684l4.622 4.499-1.09 6.355-0.013 0.11a1 1 0 0 0 1.464 0.944l5.706-3 5.693 3 0.1 0.046a1 1 0 0 0 1.352-1.1l-1.091-6.355 4.624-4.5 0.078-0.085a1 1 0 0 0-0.633-1.62l-6.38-0.926-2.852-5.78a1 1 0 0 0-1.794 0l-2.853 5.78z"/></svg>`,
  reply: `<svg class="reply-icon" width="24" height="24" version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m18 3c2.2091 0 4 1.7909 4 4v8c0 2.2091-1.7909 4-4 4h-4.724l-4.762 2.857c-0.62331 0.37406-1.4248-0.020842-1.508-0.743l-6e-3 -0.114v-2h-1c-2.1314 2e-6 -3.8884-1.6713-3.995-3.8l-5e-3 -0.2v-8c0-2.2091 1.7909-4 4-4z"/></svg>`,
  repost: `<svg class="repost-icon" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m4 12v-3a3 3 0 0 1 3-3h13m-3-3 3 3-3 3"/><path d="m20 12v3a3 3 0 0 1-3 3h-13m3 3-3-3 3-3"/></svg>`,
};

export function button(type: string, post: AppBskyFeedDefs.PostView) {
  const button = document.createElement("button");
  button.innerHTML = icon[type];
  button.setAttribute("role", "button");
  button.className = `interaction ${type}`;

  const countSpan = document.createElement("span");
  let count = post[type + "Count"] || 0;
  countSpan.innerText = count.toLocaleString("sv-SE");
  button.appendChild(countSpan);

  const updateInteraction = async (active: boolean) => {
    try {
      const userDid = sessionStorage.getItem("userdid");
      const collection = `app.bsky.feed.${type}`;
      if (active) {
        count++;
        countSpan.innerText = count.toLocaleString("sv-SE");
        const { cid, uri } = post;
        const response = await rpc.call("com.atproto.repo.createRecord", {
          data: {
            record: {
              $type: collection,
              createdAt: new Date().toISOString(),
              subject: { cid, uri },
            },
            collection,
            repo: userDid,
          },
        });
        post.viewer[type] = response.data.uri;
        post[type + "Count"] = count;
      } else {
        count--;
        countSpan.innerText = count.toLocaleString("sv-SE");
        const recordUri = post.viewer[type];
        if (!recordUri) {
          throw new Error(`No ${type} record URI found on post.`);
        }
        const [, , did, , rkey] = recordUri.split("/");
        await rpc.call("com.atproto.repo.deleteRecord", {
          data: { rkey, collection, repo: did },
        });
        post.viewer[type] = null;
        post[type + "Count"] = count;
      }

      button.classList.toggle("active", active);
    } catch (err) {
      console.error(`Failed to ${active ? "add" : "remove"} ${type}:`, err);
      // revert count if the interaction failed
      if (active) {
        count--;
      } else {
        count++;
      }
      countSpan.innerText = count.toLocaleString("sv-SE");
    }
  };

  if (type === "like" || type === "repost") {
    let isActive = Boolean(post.viewer[type]);
    button.classList.toggle("active", isActive);

    button.addEventListener("click", async () => {
      isActive = !isActive;
      await updateInteraction(isActive);
    });
  }

  return button;
}
