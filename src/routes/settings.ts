import { AppBskyFeedPost } from "@atcute/client/lexicons";
import { elem } from "../elements/utils/elem";
import { rpc, sessionData } from "../login";
import { RouteOutput } from "../types";

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
        repo: sessionData.did,
        rkey: "3publicagekey",
        collection: "app.bsky.feed.post",
        record: {
          $type: "app.bsky.feed.post",
          createdAt: new Date("2000-01-01").toISOString(),
          text: publicKey,
        } as AppBskyFeedPost.Record,
      },
    });

    console.log("Saved keys successfully!");
  }

  console.log("saving dids");
  const didsList = document.getElementById("dids-list");
  const listItems = didsList.getElementsByClassName("list-item");
  const dids = await Promise.all(
    Array.from(listItems).map(async (item) => {
      const text = item.querySelector("span").textContent;
      return text.startsWith("did:")
        ? text
        : (
            await rpc.get("com.atproto.identity.resolveHandle", {
              params: { handle: text },
            })
          ).data.did;
    }),
  );
  localStorage.setItem("allowed-dids-age", JSON.stringify(dids));
  console.log("Saved allowed DID list successfully!");
  console.log("saving public keys");
  const publicKeys: (string | null)[] = [];
  for (let i = 0; i < dids.length; i += 25) {
    const didsBatch = dids.slice(i, i + 25);
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
        console.log(`couldn't get public key for ${did}`);
      }
    }
  }
  localStorage.setItem("allowed-public-keys-age", JSON.stringify(publicKeys));
  console.log("public keys saved!");
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
        elem("p", { textContent: "the ugliest Settings you have ever seen" }),
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
            textContent: "Custom DIDs List: (you can also use handles)",
          }),
          elem("div", { id: "dids-list" }, undefined, [
            ...JSON.parse(localStorage.getItem("allowed-dids-age") || "[]").map(
              (did) =>
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
              id: "new-dids",
              placeholder: "Add new did",
            }),
            elem("button", {
              textContent: "+",
              onclick: () => {
                const input = document.getElementById(
                  "new-dids",
                ) as HTMLInputElement;
                const list = document.getElementById("dids-list");
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
