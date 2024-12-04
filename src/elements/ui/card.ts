import { AppBskyFeedDefs, AppBskyFeedPost } from "@atcute/client/lexicons";
import { idchoose } from "../blocks/id";
import { AppBskyActorDefs } from "@atcute/client/lexicons";
import { manager, rpc } from "../../login";
import { elem } from "../blocks/elem";
import {
  escapeHTML,
  processRichText,
  processText,
} from "../blocks/textProcessing";
import { formatDate, formatTimeDifference } from "../blocks/date";
import { setPreloaded } from "../../routes/post";
import { Brand } from "@atcute/client/lexicons";
import { embedHandlers } from "./embeds/embed_handlers";

export function profileCard(profile: AppBskyActorDefs.ProfileView) {
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

export function statProfile(
  stat:
    | AppBskyActorDefs.ProfileView
    | {
        [Brand.Type]?: string;
        actor: AppBskyActorDefs.ProfileView;
        createdAt: string;
        indexedAt: string;
      },
) {
  const _profile = "actor" in stat ? stat.actor : stat;
  return profileCard(_profile);
}

export function postCard(
  postHousing:
    | AppBskyFeedDefs.FeedViewPost
    | AppBskyFeedDefs.PostView
    | AppBskyFeedDefs.ThreadViewPost,
  fullView = false,
  hasReplies = false,
) {
  // Extract core data
  const post: AppBskyFeedDefs.PostView =
    "post" in postHousing ? postHousing.post : postHousing;
  const record = post.record as AppBskyFeedPost.Record;
  const atid = idchoose(post.author);
  const authorURL = "/" + post.author.did;
  const postURL = `${authorURL}/post/${post.uri.split("/")[4]}`;
  const indexedAt = new Date(post.indexedAt);
  const createdAt = new Date(record.createdAt);
  const postDate = fullView
    ? formatDate(indexedAt ?? createdAt)
    : formatTimeDifference(new Date(), indexedAt || createdAt);

  // Create base elements
  const postElem = elem("div", { className: "card post" });
  const content = elem("div", { className: "content" });
  const header = elem("div", { className: "header" });
  const footer = elem("div", { className: "footer" });
  if (fullView) postElem.classList.add("full");

  // Create reusable components
  const profilePicture = elem("div", { className: "pfp-holder" }, [
    elem("a", { href: authorURL }, [
      elem("img", {
        className: "pfp",
        src: post.author.avatar,
        loading: "lazy",
      }),
    ]),
  ]);

  // Handle reply and repost info
  const replyTo =
    "reply" in postHousing
      ? {
          handle:
            postHousing.reply.parent.$type === "app.bsky.feed.defs#postView"
              ? idchoose(postHousing.reply.parent.author)
              : postHousing.reply.parent.uri.split("/")[2],
          did:
            postHousing.reply.parent.$type === "app.bsky.feed.defs#postView"
              ? postHousing.reply.parent.author.did
              : postHousing.reply.parent.uri.split("/")[2],
        }
      : null;

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

  // Build header based on view type
  if (!fullView) {
    postElem.append(
      elem("div", { className: "left-area" }, [
        profilePicture,
        hasReplies ? elem("div", { className: "reply-string" }) : "",
      ]),
    );

    header.append(
      elem(
        "span",
        { className: "handle-area" },
        isRepost
          ? [
              elem("div", { className: "repost" }, [
                elem("div", { className: "icon" }),
              ]),
              elem("a", {
                className: "handle",
                href: "/" + reposter!.did,
                innerHTML: reposter!.handle,
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
      elem("a", {
        className: "timestamp",
        href: postURL,
        innerHTML: postDate,
        onclick: () => setPreloaded(post),
      }),
    );
  } else {
    header.append(
      profilePicture,
      elem("a", { className: "handle-area", href: authorURL }, [
        elem("span", { className: "handle", innerHTML: atid }),
        elem("span", {
          className: "",
          innerHTML: escapeHTML(post.author.displayName),
        }),
      ]),
    );

    footer.append(
      elem("div", { className: "post-data" }, [
        elem("a", {
          className: "timestamp",
          href: postURL,
          innerHTML: postDate,
          onclick: () => setPreloaded(post),
        }),
      ]),
    );
  }

  // Add translate button if needed
  const translateButton =
    record.text && "langs" in record && record.langs[0] != "en"
      ? elem("a", {
          className: "translate",
          innerHTML: "Translate",
          onclick: () =>
            window.open(
              "https://translate.google.com/?sl=auto&tl=en&text=" + record.text,
            ),
        })
      : "";

  // Add warnings if needed
  let warnings: HTMLElement[];
  if (fullView) {
    warnings = [];
    if (
      post.indexedAt &&
      Math.abs(indexedAt.getTime() - createdAt.getTime()) > 250000
    ) {
      warnings.push(
        elem("div", {
          className: "warning",
          innerText: `Archived from ${formatDate(createdAt)}`,
        }),
      );
    }
  }

  // Build full view stats if needed
  let fullViewStats: HTMLElement;
  if (fullView) {
    const stats = [
      stat("like", post, postURL),
      stat("repost", post, postURL),
      stat("quote", post, postURL),
    ].filter(Boolean);

    if (stats.length > 0) {
      fullViewStats = elem("div", { className: "stats" }, stats);
    }
  }

  // Assemble content
  content.append(header);

  if (replyTo) {
    content.append(
      elem("span", { className: "small", innerHTML: "Reply to " }, [
        elem("a", { innerHTML: replyTo.handle, href: "/" + replyTo.did }),
      ]),
    );
  }

  if (record.text) {
    content.append(
      elem("div", {
        className: "post-content",
        innerHTML: processRichText(record.text, record.facets),
      }),
    );
  }

  if (record.embed) {
    content.append(
      elem("div", { className: "embeds" }, [
        embedHandlers[record.embed.$type](record.embed as any, post.author.did),
      ]),
    );
  }

  if (warnings) {
    content.append(elem("div", { className: "warnings" }, warnings));
  }

  footer.append(translateButton);
  content.append(footer);
  if (fullViewStats) content.append(fullViewStats);

  content.append(
    elem("div", { className: "stats-buttons" }, [
      interactionButton("reply", post),
      interactionButton("repost", post),
      interactionButton("like", post),
      interactionButton("quote", post),
    ]),
  );

  postElem.append(content);

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
      elem("span", { innerHTML: count.toLocaleString() }),
      elem("span", {
        className: "stat-name",
        innerHTML: " " + (count === 1 ? type : plural[type]),
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

  if (type === "like" || type === "repost") {
    let isActive = Boolean(manager.session && post.viewer[type]);
    button.classList.toggle("active", isActive);

    button.addEventListener(
      "click",
      manager.session
        ? async () => {
            isActive = !isActive;
            await updateInteraction(isActive, post, type, countSpan, button);
          }
        : async () => {},
    );
  }

  return button;
}

async function updateInteraction(
  active: boolean,
  post: AppBskyFeedDefs.PostView,
  type: "repost" | "like",
  countSpan: HTMLSpanElement,
  button: HTMLButtonElement,
) {
  let count = post[type + "Count"];
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
}
