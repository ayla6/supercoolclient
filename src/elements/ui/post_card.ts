import { AppBskyFeedDefs, AppBskyFeedPost } from "@atcute/client/lexicons";
import { getUrlFromUri, idChoose } from "../utils/link_processing.ts";
import { manager, rpc } from "../../login";
import { elem } from "../utils/elem";
import {
  encodeQuery,
  escapeHTML,
  processRichText,
} from "../utils/text_processing";
import { formatDate, formatTimeDifference } from "../utils/date";
import { setPreloaded } from "../../routes/post";
import { handleEmbed } from "./embeds/embed_handlers";

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
  const href = getUrlFromUri(post.uri);

  const indexedAt = new Date(post.indexedAt);
  const createdAt = new Date(record.createdAt);

  const postElem = elem("div", {
    className: "card post" + (fullView ? " full" : ""),
  });
  const content = elem("div", { className: "content" });
  const footer = elem("div", { className: "footer" });

  const profilePicture = elem(
    "a",
    { className: "pfp-holder", href: authorHref },
    [
      elem("img", {
        className: "pfp",
        src: post.author.avatar,
      }),
    ],
  );

  if (isEmbed) {
    content.append(
      elem("div", { className: "header" }, [
        elem("a", { href: authorHref }, [
          profilePicture,
          elem("a", { className: "handle-area" }, [
            elem("span", { className: "handle", innerHTML: atId }),
          ]),
        ]),
        elem("a", {
          className: "timestamp",
          href: href,
          innerHTML: formatTimeDifference(new Date(), indexedAt || createdAt),
          onclick: () => setPreloaded(post),
        }),
      ]),
    );
  } else if (fullView) {
    content.append(
      elem("a", { className: "header", href: authorHref }, [
        profilePicture,
        elem("a", { className: "handle-area", href: authorHref }, [
          elem("span", { className: "handle", innerHTML: atId }),
          elem("span", {
            className: "",
            innerHTML: escapeHTML(post.author.displayName),
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
        elem("div", { className: "repost" }, [
          elem("div", { className: "icon" }),
        ]),
        elem("a", {
          className: "handle",
          href: "/" + repostedBy.did,
          innerHTML: idChoose(repostedBy),
        }),
        new Text(" reposted "),
        elem("a", {
          className: "handle",
          href: authorHref,
          innerHTML: atId,
        }),
      ];
    } else {
      handleElem = [
        elem("a", {
          className: "handle",
          href: authorHref,
          innerHTML: atId,
        }),
      ];
    }

    postElem.append(
      elem("div", { className: "left-area" }, [
        profilePicture,
        hasReplies ? elem("div", { className: "reply-string" }) : "",
      ]),
    );

    content.append(
      elem("div", { className: "header" }, [
        elem("span", { className: "handle-area" }, handleElem),
        elem("a", {
          className: "timestamp",
          href: href,
          innerHTML: formatTimeDifference(new Date(), indexedAt || createdAt),
          onclick: () => setPreloaded(post),
        }),
      ]),
    );
  }

  if ("reply" in postHousing) {
    const replyTo = postHousing.reply.parent;
    content.append(
      elem("span", { className: "small reply-to", innerHTML: "Reply to " }, [
        elem("a", {
          innerHTML:
            replyTo.$type === "app.bsky.feed.defs#postView"
              ? idChoose(replyTo.author)
              : replyTo.uri.split("/")[2],
          href:
            "/" +
            (replyTo.$type === "app.bsky.feed.defs#postView"
              ? replyTo.author.did
              : replyTo.uri.split("/")[2]),
        }),
      ]),
    );
  }

  const postContent = elem("div", { className: "post-content" });
  if (record.text) {
    postContent.append(
      elem("div", {
        className: "text-content",
        innerHTML: processRichText(record.text, record.facets),
      }),
    );
  }
  if (record.embed) {
    postContent.append(
      elem(
        "div",
        { className: "embeds" },
        handleEmbed(post.embed as any, authorDid),
      ),
    );
  }
  content.append(postContent);

  if (record.tags) {
    const tags = record.tags.map((tag) =>
      elem("a", {
        className: "label",
        innerHTML: "#" + escapeHTML(tag),
        href: `/search?tag=${encodeQuery(tag)}`,
      }),
    );
    content.append(elem("div", { className: "label-area" }, tags));
  }

  if (fullView) {
    let warnings = [];
    if (
      post.indexedAt &&
      Math.abs(indexedAt.getTime() - createdAt.getTime()) > 250000
    ) {
      warnings.push(
        elem("span", {
          className: "label",
          innerHTML: `Archived from ${formatDate(createdAt)}`,
        }),
      );
    }
    if (warnings.length)
      content.append(elem("div", { className: "label-area" }, warnings));
  }

  let translateButton: HTMLElement;
  if (
    record.text &&
    record.langs &&
    record.langs[0] != "en" &&
    record.langs[0].slice(0, 2) != "en"
  ) {
    translateButton = elem("a", {
      className: "small-link",
      innerHTML: "Translate",
      onclick: () =>
        window.open(
          "https://translate.google.com/?sl=auto&tl=en&text=" + record.text,
        ),
    });
    if (!fullView) footer.append(translateButton);
  }
  if (fullView) {
    const postData = elem("div", { className: "post-data" });
    postData.append(
      elem("a", {
        className: "timestamp",
        href: href,
        innerHTML: formatDate(indexedAt ?? createdAt),
        onclick: () => setPreloaded(post),
      }),
    );
    if (translateButton) postData.append(translateButton);
    footer.append(postData);
  }
  if (fullView) {
    const stats = [
      stat("like", post, href),
      stat("repost", post, href),
      stat("quote", post, href),
    ].filter(Boolean);

    if (stats.length > 0)
      footer.append(elem("div", { className: "stats" }, stats));
  }
  if (!isEmbed)
    footer.append(
      elem("div", { className: "stats-buttons" }, [
        interactionButton("reply", post),
        interactionButton("repost", post),
        interactionButton("like", post),
        interactionButton("quote", post),
      ]),
    );
  content.append(footer);

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
  href: string,
) {
  const count: number = post[type + "Count"];
  if (count === 0) return "";
  return elem(
    "a",
    {
      className: "stat",
      href: `${href}/${plural[type]}`,
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
  const hasViewer = "viewer" in post;
  let count: number = post[type + "Count"];

  const countSpan = elem("span", { innerHTML: count.toLocaleString() });
  const button = elem(
    "button",
    { className: "interaction " + type + "-button" },
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
    count += active ? -1 : 1;
    countSpan.innerHTML = count.toLocaleString();
  }
}
