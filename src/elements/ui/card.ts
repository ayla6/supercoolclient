import { AppBskyFeedDefs, AppBskyFeedPost } from "@atcute/client/lexicons";
import * as embed from "./embed";
import { idchoose } from "../blocks/id";
import { AppBskyActorDefs } from "@atcute/client/lexicons";
import { manager, rpc } from "../../login";
import { elem } from "../blocks/elem";
import { processRichText, processText } from "../blocks/textProcessing";
import { formatDate, formatTimeDifference } from "../blocks/date";
import { setPreloaded } from "../../routes/post";
import { navigateTo } from "../../router";

export function profile(profile: AppBskyActorDefs.ProfileView) {
  const atid =
    profile.handle === "handle.invalid" ? profile.did : profile.handle;
  return elem("div", { className: "card profile" }, [
    elem("div", { className: "pfp-holder" }, [
      elem("a", { href: "/" + profile.did }, [
        elem("img", {
          className: "pfp",
          src: profile.avatar,
          loading: "lazy",
        }),
      ]),
    ]),
    elem("div", { className: "content" }, [
      elem("a", { className: "header", href: "/" + profile.did }, [
        elem("span", { className: "handle", innerHTML: atid }),
        profile.displayName
          ? elem("span", {
              className: "display-name",
              innerHTML: profile.displayName,
            })
          : "",
      ]),
      elem("div", {
        className: "bio",
        innerHTML: profile.description
          ? processText(profile.description)?.replaceAll("<br/>", " ")
          : "",
      }),
    ]),
  ]);
}

export function post(
  postHousing:
    | AppBskyFeedDefs.FeedViewPost
    | AppBskyFeedDefs.PostView
    | AppBskyFeedDefs.ThreadViewPost,
  fullView = false,
) {
  const post: AppBskyFeedDefs.PostView =
    "post" in postHousing ? postHousing.post : postHousing;
  const record = post.record as AppBskyFeedPost.Record;
  const atid = idchoose(post.author);
  const authorURL = "/" + post.author.did;
  const postURL = `${authorURL}/post/${post.uri.split("/")[4]}`;

  const isRepost =
    "reason" in postHousing &&
    postHousing.reason.$type === "app.bsky.feed.defs#reasonRepost";
  const reposter =
    isRepost && "by" in postHousing.reason
      ? {
          handle: idchoose(postHousing.reason.by),
          did: postHousing.reason.by.did,
        }
      : null;

  let translateButton: Node | "" = "";
  if (record.text && "langs" in record && record.langs[0] != "en") {
    translateButton = elem("a", {
      className: "translate",
      innerHTML: "Translate",
      onclick: () =>
        window.open(
          "https://translate.google.com/?sl=auto&tl=en&text=" + record.text,
        ),
    });
  }

  let warnings = [];

  const indexedAt = new Date(post.indexedAt);
  const createdAt = new Date(record.createdAt);
  let postDate: string;
  if (fullView) {
    postDate = formatDate(indexedAt || createdAt);
    if (
      post.indexedAt &&
      Math.abs(indexedAt.getTime() - createdAt.getTime()) > 50000
    ) {
      warnings.push(
        elem("div", {
          className: "warning",
          innerText: `Archived from ${formatDate(createdAt)}`,
        }),
      );
    }
  } else {
    postDate = formatTimeDifference(new Date(), indexedAt || createdAt);
  }

  let fullViewStats: HTMLElement;
  if (fullView) {
    const items = [
      stat("like", post, postURL),
      stat("repost", post, postURL),
      stat("quote", post, postURL),
    ];
    if (items[0]) fullViewStats = elem("div", { className: "stats" }, items);
  }

  const postElem = elem("div", { className: "card post" }, [
    //profile picture
    elem("div", {}, [
      elem("div", { className: "pfp-holder" }, [
        elem("a", { href: authorURL }, [
          elem("img", {
            className: "pfp",
            src: post.author.avatar,
            loading: "lazy",
          }),
        ]),
      ]),
    ]),
    //content
    elem("div", { className: "content" }, [
      // header
      elem("div", { className: "header" }, [
        elem(
          "span",
          {
            className: "handle-area",
          },
          isRepost
            ? [
                elem("div", { className: "repost" }, [
                  elem("div", {
                    className: "icon",
                  }),
                ]),
                elem("a", {
                  className: "handle",
                  href: "/" + reposter.did,
                  innerHTML: reposter.handle,
                }),
                new Text(" reposted "),
                elem("a", {
                  className: "handle",
                  href: authorURL,
                  innerHTML: atid,
                }),
              ]
            : [
                elem("a", {
                  className: "handle",
                  href: authorURL,
                  innerHTML: atid,
                }),
              ],
        ),
        fullView
          ? ""
          : elem("a", {
              className: "timestamp",
              href: postURL,
              innerHTML: postDate,
              onclick: () => setPreloaded(post),
            }),
      ]),
      // text content
      record.text
        ? elem("div", {
            className: "post-content",
            innerHTML: processRichText(record.text, record.facets),
          })
        : "",
      // embeds
      record.embed
        ? elem(
            "div",
            { className: "embeds" },
            embed.load(record.embed, post.author.did),
          )
        : "",
      ...warnings,
      elem("div", { className: "footer" }, [
        fullView
          ? elem("div", { className: "post-data" }, [
              elem("span", {
                className: "timestamp",
                innerHTML: postDate,
                onclick: () => setPreloaded(post),
              }),
              translateButton,
            ])
          : translateButton,
        // likes repost and comments
        fullViewStats ? fullViewStats : "",
        elem("div", { className: "stats-buttons" }, [
          interactionButton("reply", post),
          interactionButton("repost", post),
          interactionButton("like", post),
          interactionButton("quote", post),
        ]),
      ]),
    ]),
  ]);
  return postElem;
}

const plural = {
  reply: "replies",
  like: "likes",
  repost: "reposts",
  quote: "quotes",
};

function stat(
  type: "reply" | "like" | "repost" | "quote",
  post: AppBskyFeedDefs.PostView,
  postURL: string,
) {
  const count: number = post[type + "Count"];
  if (count === 0) return "";
  return elem(
    "a",
    {
      className: "stat",
      href: `${postURL}/${plural[type]}`,
    },
    [
      elem("span", { innerHTML: String(count) }),
      elem("span", {
        className: "stat-name",
        innerHTML: " " + String(count === 1 ? type : plural[type]),
      }),
    ],
  );
}

function interactionButton(
  type: "reply" | "like" | "repost" | "quote",
  post: AppBskyFeedDefs.PostView,
) {
  let count: number = post[type + "Count"];

  const countSpan = elem("span", { innerHTML: count.toLocaleString() });
  const button = elem(
    "button",
    { className: "interaction " + type + "-button" },
    [elem("div", { className: "icon" }), countSpan],
  );
  button.setAttribute("role", "button");

  const updateInteraction = async (active: boolean) => {
    try {
      const collection = "app.bsky.feed." + type;
      count += active ? 1 : -1;
      countSpan.innerHTML = count.toLocaleString();
      if (active) {
        const { cid, uri } = post;
        const response = await rpc.call("com.atproto.repo.createRecord", {
          data: {
            record: {
              $type: collection,
              createdAt: new Date().toISOString(),
              subject: { cid, uri },
            },
            collection,
            repo: manager.session.did,
          },
        });
        post.viewer[type] = response.data.uri;
      } else {
        const recordUri = post.viewer[type];
        if (!recordUri) throw new Error(`No ${type} record URI found on post.`);
        const [, , did, , rkey] = recordUri.split("/");
        await rpc.call("com.atproto.repo.deleteRecord", {
          data: { rkey, collection, repo: did },
        });
        delete post.viewer[type];
      }
      post[type + "Count"] = count;
      button.classList.toggle("active", active);
    } catch (err) {
      console.error(`Failed to ${active ? "add" : "remove"} ${type}:`, err);
      // revert count if the interaction failed
      count += active ? -1 : 1;
      countSpan.innerHTML = count.toLocaleString();
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
