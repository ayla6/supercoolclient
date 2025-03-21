import { AppBskyFeedPost } from "@atcute/client/lexicons";
import { elem } from "../elements/utils/elem";
import { rpc, sessionData } from "../login";
import { ImageFormat, RouteOutput } from "../types";
import { createTray } from "../elements/ui/tray";
import {
  getUriFromSplitPath,
  getUriFromUnresolvedSplitPath,
} from "../elements/utils/link_processing";
import { env, updateColors } from "../settings";
import { stickyHeader } from "../elements/ui/sticky_header";

const saveAgeSettings = async () => {
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
  const listItems = allowListElem.getElementsByClassName("allowed-item");
  const allowList = await Promise.all(
    Array.from(listItems).map(async (item) => {
      const text = item.querySelector("span").textContent;
      return text.startsWith("did:")
        ? text
        : text.match(/https:\/\/.*\/profile\/.*\/lists\/.*/)
          ? (text.match(/https:\/\/.*\/profile\/?did:.*\/lists\/.*/)
              ? getUriFromSplitPath
              : getUriFromUnresolvedSplitPath)(
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
        const key = (post.record as AppBskyFeedPost.Record).text as string;
        if (key.startsWith("age1") && key.length === 62) publicKeys.push(key);
        else console.log("Not a valid public key");
      } else {
        console.log(`Couldn't get public key for ${did}`);
      }
    }
  }
  localStorage.setItem("allowed-public-keys-age", JSON.stringify(publicKeys));
  createTray("Allow list of keys saved successfully!");

  location.reload();
};

export const settingsRoute = async (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
): RouteOutput => {
  const allowedItem = (id: string) =>
    elem("div", { className: "list-item allowed-item" }, undefined, [
      elem("span", { textContent: id }),
      elem("button", {
        className: "square",
        textContent: "×",
        onclick: (e) => (e.target as HTMLElement).parentElement.remove(),
      }),
    ]);

  const content = elem("div", { id: "content" }, undefined, [
    elem(
      "div",
      { className: "card-holder" },
      elem(
        "div",
        { className: "card accent-card hide-on-mobile" },
        elem("span", {
          textContent: "Settings",
          className: "section-title",
        }),
      ),
    ),
    elem(
      "div",
      { className: "card-holder" },
      elem("div", { className: "card" }, undefined, [
        elem("span", {
          textContent: "I don't really know",
          className: "small-section-title",
        }),
        elem("div", { className: "setting toggle" }, undefined, [
          elem("label", {
            textContent: "Load blocked posts:",
            htmlFor: "view-blocked-posts",
          }),
          elem("input", {
            type: "checkbox",
            id: "view-blocked-posts",
            className: "checkbox",
            checked: localStorage.getItem("view-blocked-posts") === "true",
            onclick: (e) => e.stopPropagation(),
            onchange: (e) => {
              localStorage.setItem(
                "view-blocked-posts",
                (e.target as HTMLInputElement).checked ? "true" : "false",
              );
              env.viewBlockedPosts = (e.target as HTMLInputElement).checked;
            },
          }),
        ]),
        elem("div", { className: "setting toggle" }, undefined, [
          elem("label", {
            textContent:
              "Show replies to people you're not following on the timeline:",
            htmlFor: "show-non-following-replies-on-timeline",
          }),
          elem("input", {
            type: "checkbox",
            id: "show-non-following-replies-on-timeline",
            className: "checkbox",
            checked:
              localStorage.getItem("show-non-following-replies-on-timeline") ===
              "true",
            onclick: (e) => e.stopPropagation(),
            onchange: (e) => {
              localStorage.setItem(
                "show-non-following-replies-on-timeline",
                (e.target as HTMLInputElement).checked ? "true" : "false",
              );
              env.showNonFollowingRepliesOnTimeline = (
                e.target as HTMLInputElement
              ).checked;
            },
          }),
        ]),
        elem("div", { className: "setting" }, undefined, [
          elem("label", {
            textContent: "Default fullsize CDN image format:",
            htmlFor: "default-fullsize-format",
          }),
          elem(
            "select",
            {
              id: "default-fullsize-format",
              onclick: (e) => e.stopPropagation(),
              onchange: (e) => {
                localStorage.setItem(
                  "default-fullsize-format",
                  (e.target as HTMLInputElement).value,
                );
                env.defaultFullsizeFormat = (e.target as HTMLInputElement)
                  .value as ImageFormat;
              },
            },
            undefined,
            [
              elem("option", { value: "avif", textContent: "AVIF" }),
              elem("option", { value: "webp", textContent: "WebP" }),
              elem("option", { value: "jpeg", textContent: "JPEG" }),
              elem("option", { value: "png", textContent: "PNG" }),
              elem("option", { value: "gif", textContent: "GIF" }),
              elem("option", { value: "bmp", textContent: "BMP" }),
              elem("option", { value: "heic", textContent: "HEIC" }),
            ].map((opt) => {
              if (opt.value === (env.defaultFullsizeFormat || "avif"))
                opt.selected = true;
              return opt;
            }),
          ),
        ]),
        elem("div", { className: "setting" }, undefined, [
          elem("label", {
            textContent: "Default thumbnail CDN image format:",
            htmlFor: "default-thumbnail-format",
          }),
          elem(
            "select",
            {
              id: "default-thumbnail-format",
              onclick: (e) => e.stopPropagation(),
              onchange: (e) => {
                localStorage.setItem(
                  "default-thumbnail-format",
                  (e.target as HTMLInputElement).value,
                );
                env.defaultThumbnailFormat = (e.target as HTMLInputElement)
                  .value as ImageFormat;
              },
            },
            undefined,
            [
              elem("option", { value: "webp", textContent: "WebP" }),
              elem("option", { value: "avif", textContent: "AVIF" }),
              elem("option", { value: "jpeg", textContent: "JPEG" }),
              elem("option", { value: "png", textContent: "PNG" }),
              elem("option", { value: "gif", textContent: "GIF" }),
              elem("option", { value: "bmp", textContent: "BMP" }),
              elem("option", { value: "heic", textContent: "HEIC" }),
            ].map((opt) => {
              if (opt.value === (env.defaultThumbnailFormat || "webp"))
                opt.selected = true;
              return opt;
            }),
          ),
        ]),
        ...(() => {
          const fixDisplay = () => {
            if (env.translate.type === "libretranslate") {
              apiKeySetting.removeAttribute("style");
            } else {
              apiKeySetting.style.display = "none";
            }

            if (env.translate.type === "simplytranslate") {
              simplyTranslateEngineSetting.removeAttribute("style");
            } else {
              simplyTranslateEngineSetting.style.display = "none";
            }
          };

          const translatorTitle = elem("span", {
            textContent: "Translation service",
            className: "small-section-title",
          });

          const typeLabel = elem("label", {
            textContent: "Type:",
            htmlFor: "translator-type",
          });

          const typeSelect = elem(
            "select",
            {
              id: "translator-type",
              onclick: (e) => e.stopPropagation(),
              onchange: (e) => {
                const type = typeSelect.value as any;
                localStorage.setItem("translator-type", type);
                env.translate.type = type;

                fixDisplay();

                const translatorUrl = {
                  url: "https://translate.google.com/?sl=auto&tl=en&text=",
                  libretranslate: "https://translate.disroot.org/",
                  simplytranslate: "https://simplytranslate.org/api/translate",
                }[type];

                const urlInput = document.getElementById(
                  "translator-url",
                ) as HTMLInputElement;
                urlInput.value = translatorUrl;
                localStorage.setItem("translator-url", translatorUrl);
                env.translate.url = translatorUrl;
              },
            },
            undefined,
            [
              elem("option", { value: "url", textContent: "URL" }),
              elem("option", {
                value: "libretranslate",
                textContent: "LibreTranslate",
              }),
              elem("option", {
                value: "simplytranslate",
                textContent: "SimplyTranslate",
              }),
            ].map((opt) => {
              if (opt.value === (env.translate.type || "url"))
                opt.selected = true;
              return opt;
            }),
          );

          const typeSetting = elem("div", { className: "setting" }, undefined, [
            typeLabel,
            typeSelect,
          ]);

          const urlLabel = elem("label", {
            textContent: "URL:",
            htmlFor: "translator-url",
          });

          const urlInputElem = elem("input", {
            type: "text",
            id: "translator-url",
            className: "text-input",
            value: env.translate.url,
            onchange: (e) => {
              const url = (urlInputElem as HTMLInputElement).value;
              localStorage.setItem("translator-url", url);
              env.translate.url = url;
            },
          });

          const urlSetting = elem("div", { className: "setting" }, undefined, [
            urlLabel,
            urlInputElem,
          ]);

          const apiKeyLabel = elem("label", {
            textContent: "API Key:",
            htmlFor: "translator-api-key",
          });

          const apiKeyInputElem = elem("input", {
            type: "text",
            id: "translator-api-key",
            className: "text-input",
            value: env.translate.apiKey,
            onchange: (e) => {
              const apiKey = (apiKeyInputElem as HTMLInputElement).value;
              localStorage.setItem("translator-api-key", apiKey);
              env.translate.apiKey = apiKey;
            },
          });

          const apiKeySetting = elem(
            "div",
            { className: "setting" },
            undefined,
            [apiKeyLabel, apiKeyInputElem],
          );

          const simplyTranslateEngineLabel = elem("label", {
            textContent: "SimplyTranslate Engine:",
            htmlFor: "simplytranslate-engine",
          });

          const simplyTranslateEngineSelect = elem(
            "select",
            {
              id: "simplytranslate-engine",
              onclick: (e) => e.stopPropagation(),
              onchange: (e) => {
                const engine = simplyTranslateEngineSelect.value;
                localStorage.setItem("simplytranslate-engine", engine);
                env.translate.simplyTranslateEngine = engine as any;
              },
            },
            undefined,
            [
              elem("option", {
                value: "google",
                textContent: "Google Translate",
              }),
              elem("option", {
                value: "iciba",
                textContent: "iCIBA",
              }),
              elem("option", {
                value: "reverso",
                textContent: "Reverso",
              }),
            ].map((opt) => {
              if (
                opt.value === (env.translate.simplyTranslateEngine || "google")
              )
                opt.selected = true;
              return opt;
            }),
          );

          const simplyTranslateEngineSetting = elem(
            "div",
            { className: "setting" },
            undefined,
            [simplyTranslateEngineLabel, simplyTranslateEngineSelect],
          );

          fixDisplay();

          return [
            translatorTitle,
            typeSetting,
            urlSetting,
            apiKeySetting,
            simplyTranslateEngineSetting,
          ];
        })(),
      ]),
    ),
    elem(
      "div",
      { className: "card-holder" },
      elem("div", { className: "card" }, undefined, [
        elem("span", {
          textContent: "Appearance",
          className: "small-section-title",
        }),
        elem("div", { className: "settings-holder" }, undefined, [
          elem("div", { className: "setting" }, undefined, [
            elem("label", { textContent: "Accent color:" }),
            elem(
              "div",
              { className: "color-picker" },
              undefined,
              (() => {
                const saveAccentColor = () => {
                  if (accentColorInput.value.match(/^#[0-9a-f]{6}$/i)) {
                    localStorage.setItem(
                      "accent-color",
                      accentColorInput.value,
                    );
                    updateColors();
                  }
                };
                const accentColorInput = elem("input", {
                  type: "color",
                  id: "accent-color",
                  className: "color-input",
                  value: localStorage.getItem("accent-color") ?? "#226699",
                  onchange: () => {
                    accentColorTextInput.value = accentColorInput.value;
                    saveAccentColor();
                  },
                });
                const accentColorTextInput = elem("input", {
                  type: "text",
                  id: "accent-color-text",
                  className: "text-input",
                  value: localStorage.getItem("accent-color") ?? "#226699",
                  onchange: () => {
                    accentColorInput.value = accentColorTextInput.value;
                    saveAccentColor();
                  },
                });
                return [accentColorInput, accentColorTextInput];
              })(),
            ),
          ]),

          elem("div", { className: "setting" }, undefined, [
            elem("label", { textContent: "Background color:" }),
            elem(
              "div",
              { className: "color-picker" },
              undefined,
              (() => {
                const saveBackgroundColor = () => {
                  if (backgroundColorInput.value.match(/^#[0-9a-f]{6}$/i)) {
                    localStorage.setItem(
                      "background-color",
                      backgroundColorInput.value,
                    );
                    updateColors();
                  }
                };
                const backgroundColorInput = elem("input", {
                  type: "color",
                  id: "background-color",
                  className: "color-input",
                  value: localStorage.getItem("background-color") ?? "#222244",
                  onchange: (e) => {
                    backgroundColorTextInput.value = backgroundColorInput.value;
                    saveBackgroundColor();
                  },
                });
                const backgroundColorTextInput = elem("input", {
                  type: "text",
                  id: "background-color-text",
                  className: "text-input",
                  value: localStorage.getItem("background-color") ?? "#222244",
                  onchange: (e) => {
                    backgroundColorInput.value = backgroundColorTextInput.value;
                    saveBackgroundColor();
                  },
                });
                return [backgroundColorInput, backgroundColorTextInput];
              })(),
            ),
          ]),
        ]),
      ]),
    ),
    elem(
      "div",
      { className: "card-holder" },
      elem("div", { className: "card" }, undefined, [
        elem("span", { textContent: "Age", className: "small-section-title" }),
        elem("p", {}, undefined, [
          elem("a", {
            className: "link",
            target: "_blank",
            textContent: "Age",
            href: "https://github.com/FiloSottile/awesome-age",
          }),
          document.createTextNode(
            " is a nice encryption tool that can you can use to encrypt stuff with only someone's public key!",
          ),
        ]),
        elem(
          "p",
          {},
          elem("a", {
            href: "https://agewasm.marin-basic.com/",
            className: "link",
            target: "_blank",
            textContent:
              "Click on me to go to a site where you can generate your keypair",
          }),
        ),
        elem("p", {
          textContent:
            "The private key is used to decrypt stuff encrypted using the public key! The public key is shared via a post with a special rkey so this page can easily find if the accounts you added have a public key or not!",
        }),
        elem("p", {
          textContent:
            "The private key is saved as plaintext on your local storage so I don't recommend using one you use somewhere else. Just make one just to use here. Save it on like your password manager if you plan on using it across devices.",
        }),
        elem("div", { className: "settings-holder" }, undefined, [
          elem("div", { className: "setting" }, undefined, [
            elem("label", { textContent: "Public key:" }),
            elem("input", {
              type: "text",
              id: "public-key",
              className: "age-input",
              value: localStorage.getItem("public-key"),
            }),
          ]),
          elem("div", { className: "setting" }, undefined, [
            elem("label", { textContent: "Private key:" }),
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
              "People that can see your posts (Handles, DIDs or lists):",
          }),
          elem("div", { id: "allow-list" }, undefined, [
            ...JSON.parse(localStorage.getItem("allowed-dids-age") || "[]").map(
              (id: string) => allowedItem(id),
            ),
            (() => {
              const addToList = () => {
                const input = document.getElementById(
                  "new-item",
                ) as HTMLInputElement;
                const list = document.getElementById("allow-list");
                if (input.value) {
                  const item = allowedItem(input.value);
                  list.insertBefore(item, input.parentElement);
                  input.value = "";
                }
              };

              const input = elem("input", {
                type: "text",
                id: "new-item",
                placeholder:
                  "A handle, a DID or a list (either a link or a proper at:// URI)",
              });
              input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") addToList();
              });

              const button = elem("button", {
                className: "square",
                textContent: "+",
                onclick: addToList,
              });

              return elem("div", { className: "list-item" }, undefined, [
                input,
                button,
              ]);
            })(),
          ]),
        ]),
        elem("button", {
          textContent: "Save",
          id: "save-button",
          onclick: saveAgeSettings,
        }),
      ]),
    ),
  ]);
  container.append(stickyHeader("Settings"), content);

  return { title: "Settings" };
};
