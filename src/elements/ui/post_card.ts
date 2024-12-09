import { AppBskyFeedDefs, AppBskyFeedPost } from "@atcute/client/lexicons";
import {
  getDidFromUri,
  getPathFromUri,
  idChoose,
} from "../utils/link_processing.ts";
import { manager, rpc } from "../../login";
import { elem } from "../utils/elem";
import { encodeQuery, processRichText } from "../utils/text_processing";
import { formatDate, formatTimeDifference } from "../utils/date";
import { setPreloaded } from "../../routes/post";
import { handleEmbed } from "./embeds/embed_handlers";
import { languagesToNotTranslate } from "../../config.ts";

export function postCard(
  postHousing:
    | AppBskyFeedDefs.FeedViewPost
    | AppBskyFeedDefs.PostView
    | AppBskyFeedDefs.ThreadViewPost,
  fullView = false,
  hasReplies = false,
  isEmbed = false,
) {
  const post: AppBskyFeedDefs.PostView =
    "post" in postHousing ? postHousing.post : postHousing;
  const record = post.record as AppBskyFeedPost.Record;

  const author = post.author;
  const atId = idChoose(author);
  const authorDid = author.did;

  const authorHref = `/${authorDid}`;
  const href = getPathFromUri(post.uri);

  const indexedAt = new Date(post.indexedAt);
  const createdAt = new Date(record.createdAt);

  const postElem = elem("div", {
    className: "card-holder post" + (fullView ? " full" : ""),
  });
  const card = elem("div", { className: "card" });

  const profilePicture = elem(
    "div",
    { className: "pfp-holder" },
    elem(
      "a",
      { href: authorHref },
      elem("img", {
        className: "pfp",
        src: post.author.avatar,
        loading: "lazy",
      }),
    ),
  );

  if (isEmbed) {
    card.append(
      elem("div", { className: "header" }, null, [
        elem("a", { className: "user-area", href: authorHref }, null, [
          profilePicture,
          elem(
            "a",
            { className: "handle-area" },
            elem("span", { className: "handle", textContent: atId }),
          ),
        ]),
        elem("a", {
          className: "timestamp",
          href: href,
          textContent: formatTimeDifference(new Date(), indexedAt || createdAt),
          onclick: () => setPreloaded(post),
        }),
      ]),
    );
  } else if (fullView) {
    card.append(
      elem("a", { className: "header", href: authorHref }, null, [
        profilePicture,
        elem("a", { className: "handle-area", href: authorHref }, null, [
          elem("span", { className: "handle", textContent: atId }),
          elem("span", {
            className: "",
            textContent: post.author.displayName,
          }),
        ]),
      ]),
    );
  } else {
    let handleElem: any[];
    if (
      "reason" in postHousing &&
      postHousing.reason.$type === "app.bsky.feed.defs#reasonRepost"
    ) {
      const repostedBy = postHousing.reason.by;
      handleElem = [
        elem(
          "div",
          { className: "repost" },
          elem("div", { className: "icon" }),
        ),
        elem("a", {
          className: "handle",
          href: "/" + repostedBy.did,
          textContent: idChoose(repostedBy),
        }),
        "reposted",
        elem("a", {
          className: "handle",
          href: authorHref,
          textContent: atId,
        }),
      ];
    } else {
      handleElem = [
        elem("a", {
          className: "handle",
          href: authorHref,
          textContent: atId,
        }),
      ];
    }

    postElem.append(
      elem("div", { className: "left-area" }, null, [
        profilePicture,
        hasReplies ? elem("div", { className: "reply-string" }) : "",
      ]),
    );

    card.append(
      elem("div", { className: "header" }, null, [
        elem("span", { className: "handle-area" }, null, handleElem),
        elem("a", {
          className: "timestamp",
          href: href,
          textContent: formatTimeDifference(new Date(), indexedAt || createdAt),
          onclick: () => setPreloaded(post),
        }),
      ]),
    );
  }

  if ("reply" in postHousing) {
    const replyTo = postHousing.reply.parent;
    const did = getDidFromUri(replyTo.uri);
    const atId =
      replyTo.$type === "app.bsky.feed.defs#postView"
        ? idChoose(replyTo.author)
        : did;
    card.append(
      elem(
        "span",
        { className: "small reply-to", textContent: "Reply to " },
        elem("a", {
          textContent: atId,
          href: "/" + did,
        }),
      ),
    );
  }

  const content = elem("div", { className: "post-content" });
  if (record.text) {
    content.append(
      elem(
        "div",
        { className: "text-content" },
        processRichText(record.text, record.facets),
      ),
    );
  }
  if (post.embed) {
    content.append(
      elem(
        "div",
        { className: "embeds" },
        null,
        handleEmbed(post.embed as any),
      ),
    );
  }
  card.append(content);

  if (record.tags) {
    const tags = record.tags.map((tag) =>
      elem("a", {
        className: "label",
        textContent: "#" + tag,
        href: `/search?tag=${encodeQuery(tag)}`,
      }),
    );
    card.append(elem("div", { className: "label-area" }, null, tags));
  }

  if (fullView) {
    const warnings = [];
    if (post.indexedAt && indexedAt.getTime() - createdAt.getTime() > 250000) {
      warnings.push(
        elem("span", {
          className: "label",
          textContent: `Archived from ${formatDate(createdAt)}`,
        }),
      );
    }
    if (warnings.length)
      card.append(elem("div", { className: "label-area" }, null, warnings));
  }

  let translateButton: HTMLElement;
  if (
    record.text &&
    record.langs &&
    record.langs[0] &&
    !languagesToNotTranslate.includes(record.langs[0])
  ) {
    translateButton = elem("a", {
      className: "small-link",
      textContent: "Translate",
      href: "https://translate.google.com/?sl=auto&tl=en&text=" + record.text,
    });
    if (!fullView) card.append(translateButton);
  }
  if (fullView) {
    const postData = elem("div", { className: "post-data" });
    postData.append(
      elem("a", {
        className: "timestamp",
        href: href,
        textContent: formatDate(indexedAt ?? createdAt),
        onclick: () => setPreloaded(post),
      }),
    );
    if (translateButton) postData.append(translateButton);
    card.append(postData);
  }
  if (fullView) {
    const stats = [
      stat("like", post, href),
      stat("repost", post, href),
      stat("quote", post, href),
    ].filter(Boolean);

    if (stats.length > 0)
      card.append(elem("div", { className: "stats" }, null, stats));
  }
  if (!isEmbed)
    card.append(
      elem("div", { className: "stats-buttons" }, null, [
        interactionButton("reply", post),
        interactionButton("repost", post),
        interactionButton("like", post),
        interactionButton("quote", post),
      ]),
    );

  postElem.append(card);

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
  href: string,
) {
  const count: number = post[type + "Count"];
  if (count === 0) return "";
  return elem(
    "a",
    { className: "stat", href: `${href}/${plural[type]}` },
    null,
    [
      elem("span", { textContent: count.toLocaleString() }),
      elem("span", {
        className: "stat-name",
        textContent: " " + (count === 1 ? type : plural[type]),
      }),
    ],
  );
}

function interactionButton(
  type: "reply" | "like" | "repost" | "quote",
  post: AppBskyFeedDefs.PostView,
) {
  const hasViewer = "viewer" in post;
  let count: number = post[type + "Count"];

  const countSpan = elem("span", { textContent: count.toLocaleString() });
  const button = elem(
    "button",
    { className: "interaction " + type + "-button" },
    null,
    [elem("div", { className: "icon" }), countSpan],
  );
  button.setAttribute("role", "button");

  if (type === "like" || type === "repost") {
    let isActive = Boolean(hasViewer ? post.viewer[type] : false);
    button.classList.toggle("active", isActive);

    if (hasViewer)
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
    countSpan.textContent = count.toLocaleString();
    if (active) {
      const { cid, uri } = post;
      const { data } = await rpc.call("com.atproto.repo.createRecord", {
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
      post.viewer[type] = data.uri;
    } else {
      const recordUri = post.viewer[type];
      if (!recordUri) throw new Error(`No ${type} record URI found on post.`);
      const did = recordUri.slice(5, recordUri.indexOf("/", 6));
      const rkey = recordUri.slice(recordUri.lastIndexOf("/") + 1);
      await rpc.call("com.atproto.repo.deleteRecord", {
        data: { rkey, collection, repo: did },
      });
      delete post.viewer[type];
    }
    post[type + "Count"] = count;
    button.classList.toggle("active", active);
  } catch (err) {
    console.error(`Failed to ${active ? "add" : "remove"} ${type}:`, err);
    count += active ? -1 : 1;
    countSpan.textContent = count.toLocaleString();
  }
}
