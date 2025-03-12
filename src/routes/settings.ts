import { AppBskyFeedPost } from "@atcute/client/lexicons";
import { elem } from "../elements/utils/elem";
import { rpc, sessionData } from "../login";
import { RouteOutput } from "../types";
import { createTray } from "../elements/ui/tray";
import { getUriFromSplitPath } from "../elements/utils/link_processing";

const saveSettings = async () => {
  const publicKey = (document.getElementById("public-key") as HTMLInputElement)
    .value;
  const privateKey = (
    document.getElementById("private-key") as HTMLInputElement
  ).value;

  if (publicKey && privateKey) {
    localStorage.setItem("public-key", publicKey);
    localStorage.setItem("private-key", privateKey);

    rpc.call("com.atproto.repo.putRecord", {
      data: {
        rkey: "3publicagekey",
        repo: sessionData.did,
        collection: "app.bsky.feed.post",
        record: {
          $type: "app.bsky.feed.post",
          createdAt: new Date("2000-01-01").toISOString(),
          text: publicKey,
        } as AppBskyFeedPost.Record,
      },
    });

    createTray("Key pair saved successfully!");
  }

  const allowListElem = document.getElementById("allow-list");
  const listItems = allowListElem.getElementsByClassName("list-item");
  const allowList = await Promise.all(
    Array.from(listItems).map(async (item) => {
      const text = item.querySelector("span").textContent;
      return text.startsWith("did:")
        ? text
        : text.match(/https:\/\/.*\/profile\/?did:.*\/lists\/.*/)
          ? getUriFromSplitPath(
              new URL(text).pathname.split("/").slice(2),
              "app.bsky.graph.list",
            )
          : text.match(/at:\/\/did:.*\/app\.bsky\.graph\.list\/.*/)
            ? text
            : (
                await rpc.get("com.atproto.identity.resolveHandle", {
                  params: { handle: text },
                })
              ).data.did;
    }),
  );
  localStorage.setItem("allowed-dids-age", JSON.stringify(allowList));
  createTray("Allow list of identities saved successfully!");

  const processedDids = [];
  for (const item of allowList) {
    if (item.match(/at:\/\/did:.*\/app\.bsky\.graph\.list\/.*/)) {
      const { data } = await rpc.get("app.bsky.graph.getList", {
        params: { list: item },
      });
      processedDids.push(...data.items.map((did) => did.subject.did));
    } else if (item.match(/did:.*/)) {
      processedDids.push(item);
    }
  }
  const publicKeys: (string | null)[] = [];
  for (let i = 0; i < processedDids.length; i += 25) {
    const didsBatch = processedDids.slice(i, i + 25);
    const posts = await rpc.get("app.bsky.feed.getPosts", {
      params: {
        uris: didsBatch.map(
          (did) => `at://${did}/app.bsky.feed.post/3publicagekey`,
        ),
      },
    });

    for (const did of didsBatch) {
      const post = posts.data.posts.find(
        (post) => post.uri === `at://${did}/app.bsky.feed.post/3publicagekey`,
      );
      if (post) {
        publicKeys.push((post.record as AppBskyFeedPost.Record).text as string);
      } else {
        console.log(`Couldn't get public key for ${did}`);
      }
    }
  }
  localStorage.setItem("allowed-public-keys-age", JSON.stringify(publicKeys));
  createTray("Allow list of keys saved successfully!");
};

export const settingsRoute = async (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
): RouteOutput => {
  const content = elem(
    "div",
    { id: "content" },
    elem(
      "div",
      { className: "card-holder" },
      elem("div", { className: "card" }, undefined, [
        elem("h2", { textContent: "Settings" }),
        elem("a", {
          href: "https://agewasm.marin-basic.com/",
          target: "_blank",
          textContent:
            "click on me to go to a site where you can generate your keypair",
        }),
        elem("span", {
          textContent:
            "btw the private key is saved as plaintext on your local storage so i don't recommend using one use somewhere else. just make a new one. save it on like your password manager if you plan on using it across devices. but like this is silly so youre probably not going to to",
        }),
        elem("p", { textContent: "Age Settings" }),
        elem("div", { className: "settings-holder" }, undefined, [
          elem("div", { className: "setting" }, undefined, [
            elem("label", { textContent: "Public Age:" }),
            elem("input", {
              type: "text",
              id: "public-key",
              className: "age-input",
              value: localStorage.getItem("public-key"),
            }),
          ]),
          elem("div", { className: "setting" }, undefined, [
            elem("label", { textContent: "Private Age:" }),
            elem("input", {
              type: "password",
              id: "private-key",
              className: "age-input",
              value: localStorage.getItem("private-key"),
            }),
          ]),
        ]),
        elem("div", { className: "setting" }, undefined, [
          elem("label", {
            textContent:
              "People that can see your posts: (Handles, DIDs or lists)",
          }),
          elem("div", { id: "allow-list" }, undefined, [
            ...JSON.parse(localStorage.getItem("allowed-dids-age") || "[]").map(
              (did: string) =>
                elem("div", { className: "list-item" }, undefined, [
                  elem("span", { textContent: did }),
                  elem("button", {
                    textContent: "×",
                    onclick: (e) =>
                      (e.target as HTMLElement).parentElement.remove(),
                  }),
                ]),
            ),
            elem("input", {
              type: "text",
              id: "new-item",
              placeholder:
                "A handle, a did or a list (either a link or a proper at:// uri)",
            }),
            elem("button", {
              textContent: "+",
              onclick: () => {
                const input = document.getElementById(
                  "new-item",
                ) as HTMLInputElement;
                const list = document.getElementById("allow-list");
                if (input.value) {
                  const item = elem(
                    "div",
                    { className: "list-item" },
                    undefined,
                    [
                      elem("span", { textContent: input.value }),
                      elem("button", {
                        textContent: "×",
                        onclick: (e) =>
                          (e.target as HTMLElement).parentElement.remove(),
                      }),
                    ],
                  );
                  list.appendChild(item);
                  input.value = "";
                }
              },
            }),
          ]),
        ]),
        elem("button", {
          textContent: "Save",
          id: "save-button",
          onclick: saveSettings,
        }),
      ]),
    ),
  );
  container.append(content);

  return { title: "Settings" };
};
