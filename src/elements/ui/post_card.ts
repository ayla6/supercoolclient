import { AppBskyFeedDefs, AppBskyFeedPost } from "@atcute/client/lexicons";
import {
  changeImageFormat,
  getDidFromUri,
  getPathFromUri,
  idChoose,
} from "../utils/link_processing.ts";
import { manager, rpc, contentLabels } from "../../login";
import { elem } from "../utils/elem";
import { encodeQuery, processRichText } from "../utils/text_processing";
import { formatDate, formatTimeDifference } from "../utils/date";
import { handleEmbed } from "./embeds/embed_handlers";
import { languagesToNotTranslate } from "../../config.ts";
import { composerBox } from "./composer.ts";
import { setPreloaded } from "../utils/preloaded_post.ts";

const plural = {
  reply: "replies",
  like: "likes",
  repost: "reposts",
  quote: "quotes",
};

const stat = (
  type: "reply" | "like" | "repost" | "quote",
  post: AppBskyFeedDefs.PostView,
  href: string,
) => {
  const count: number = post[type + "Count"];
  if (count === 0) return;
  return elem(
    "a",
    {
      className: "stat",
      href: `${href}/${plural[type]}`,
    },
    undefined,
    [
      elem("span", { textContent: count.toLocaleString() }),
      elem("span", {
        className: "stat-name",
        textContent: " " + (count === 1 ? type : plural[type]),
      }),
    ],
  );
};

const updateInteraction = async (
  active: boolean,
  cid: string,
  uri: string,
  count: number,
  recordUri: string,
  type: "repost" | "like",
  countSpan: HTMLSpanElement,
  button: HTMLButtonElement,
) => {
  try {
    const collection = "app.bsky.feed." + type;
    count += active ? 1 : -1;
    countSpan.textContent = count.toLocaleString();
    button.classList.toggle("active", active);
    if (active) {
      await rpc.call("com.atproto.repo.createRecord", {
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
    } else {
      if (!recordUri) throw new Error(`No ${type} record URI found on post.`);
      const did = recordUri.slice(5, recordUri.indexOf("/", 6));
      const rkey = recordUri.slice(recordUri.lastIndexOf("/") + 1);
      await rpc.call("com.atproto.repo.deleteRecord", {
        data: { rkey, collection, repo: did },
      });
    }
  } catch (err) {
    console.error(`Failed to ${active ? "add" : "remove"} ${type}:`, err);
    count += active ? -1 : 1;
    countSpan.textContent = count.toLocaleString();
  }
};

const interactionButton = (
  type: "reply" | "like" | "repost" | "quote",
  post: AppBskyFeedDefs.PostView,
) => {
  const hasViewer = "viewer" in post;
  let count: number = post[type + "Count"];

  const countSpan = elem("span", { textContent: count.toLocaleString() });
  const button = elem(
    "button",
    { className: "interaction " + type + "-button" },
    undefined,
    [elem("div", { className: "icon" }), countSpan],
  );
  button.setAttribute("role", "button");

  if (manager.session)
    if (type === "like" || type === "repost") {
      let isActive = Boolean(hasViewer ? post.viewer[type] : false);
      button.classList.toggle("active", isActive);

      if (hasViewer)
        button.onclick = (e) => {
          e.stopPropagation();
          isActive = !isActive;
          updateInteraction(
            isActive,
            post.cid,
            post.uri,
            post[type + "Count"],
            post.viewer[type],
            type,
            countSpan,
            button,
          );
        };
    } else if (type === "reply") {
      button.onclick = (e) => {
        e.stopPropagation();
        composerBox(post);
      };
    } else if (type === "quote") {
      button.onclick = (e) => {
        e.stopPropagation();
        composerBox(undefined, post);
      };
    }

  return button;
};

export const postCard = (
  postHousing:
    | AppBskyFeedDefs.FeedViewPost
    | AppBskyFeedDefs.PostView
    | AppBskyFeedDefs.ThreadViewPost,
  fullView = false,
  hasReplies = false,
  isEmbed = false,
) => {
  console.log(postHousing);
  const post = "post" in postHousing ? postHousing.post : postHousing;

  if (post.labels && post.labels.some((l) => contentLabels[l.val] === "hide"))
    return fullView
      ? elem(
          "div",
          { className: "card-holder" },
          elem("div", {
            className: "simple-card",
            textContent: `This post is hidden because it contains the label ${post.labels.find((l) => contentLabels[l.val] === "hide")?.val}, which is set to hide.`,
          }),
        )
      : elem("div");
  // gonna make this second part better latter maybe

  const record = post.record as AppBskyFeedPost.Record;
  const author = post.author;
  const atId = idChoose(author);
  const authorHref = `/${author.did}`;
  const href = getPathFromUri(post.uri);
  const indexedAt = new Date(post.indexedAt);
  const createdAt = new Date(record.createdAt);

  const postElem = elem("div", {
    className: "card-holder post" + (fullView ? " full" : ""),
  });
  const card = elem("div", { className: "card" });

  if (!fullView) {
    card.onclick = (e) => {
      if (window.getSelection()?.toString()) return;
      if ((e.target as HTMLElement).closest("a, button")) return;
      const embeds = (e.target as HTMLElement).closest(".embeds");
      if (embeds && !embeds.contains(card)) return;
      preload();
    };
    card.setAttribute("works-as-link", "");
    card.setAttribute("href", href);
  }

  const preload = () => {
    setPreloaded(post);
  };

  const profilePicture = elem(
    "a",
    { className: "avatar-holder", href: authorHref },
    elem("img", {
      className: "avatar",
      src: changeImageFormat(post.author.avatar),
      loading: "lazy",
    }),
  );

  if (isEmbed) {
    card.appendChild(
      elem("div", { className: "header" }, undefined, [
        elem("a", { className: "user-area", href: authorHref }, undefined, [
          profilePicture,
          elem("span", { className: "handle-area handle", textContent: atId }),
        ]),
        elem("a", {
          className: "timestamp",
          href: href,
          textContent: formatTimeDifference(new Date(), indexedAt || createdAt),
          onclick: preload,
        }),
      ]),
    );
  } else if (fullView) {
    card.appendChild(
      elem("a", { className: "header", href: authorHref }, undefined, [
        profilePicture,
        elem("div", { className: "handle-area" }, undefined, [
          elem("span", { className: "handle", textContent: atId }),
          elem("span", { textContent: post.author.displayName }),
        ]),
      ]),
    );
  } else {
    let handleElem: HTMLElement[];
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
        elem("span", {}, undefined, [
          elem("a", {
            className: "handle",
            href: "/" + repostedBy.did,
            textContent: idChoose(repostedBy),
          }),
          document.createTextNode(" reposted "),
          elem("a", {
            className: "handle",
            href: authorHref,
            textContent: atId,
          }),
        ]),
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

    postElem.appendChild(
      elem("div", { className: "left-area" }, undefined, [
        profilePicture,
        hasReplies ? elem("div", { className: "reply-string" }) : undefined,
      ]),
    );

    card.appendChild(
      elem("div", { className: "header" }, undefined, [
        elem("span", { className: "handle-area" }, undefined, handleElem),
        elem("a", {
          className: "timestamp",
          href: href,
          textContent: formatTimeDifference(new Date(), indexedAt || createdAt),
          onclick: preload,
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
    card.appendChild(
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
    content.appendChild(
      elem(
        "div",
        { className: "text-content" },
        processRichText(record.text, record.facets),
      ),
    );
  }
  if (post.embed) {
    const embeds = handleEmbed(post.embed as any);
    const multipleEmbeds =
      post.embed.$type === "app.bsky.embed.recordWithMedia#view";
    const embedsElem = elem(
      "div",
      { className: "embeds" },
      multipleEmbeds ? undefined : embeds,
      multipleEmbeds ? embeds : undefined,
    );
    if (
      post.labels &&
      post.labels.some((l) => contentLabels[l.val] === "warn")
    ) {
      let embeddedShown = false;
      const warningLabel = post.labels.find(
        (l) => contentLabels[l.val] === "warn",
      );
      const buttonStatus = elem("span", {
        textContent: embeddedShown ? "Hide content" : "Show content",
      });
      const warningButton = elem(
        "button",
        {
          className: "warning-button",
          onclick: (e) => {
            e.stopPropagation();
            embeddedShown = !embeddedShown;
            buttonStatus.textContent = embeddedShown
              ? "Hide content"
              : "Show content";
            embedsElem.style.display = embeddedShown ? "block" : "none";
          },
        },
        undefined,
        [
          elem("span", {
            className: "warning-text",
            textContent: `Content Warning: ${warningLabel?.val}`,
          }),
          buttonStatus,
        ],
      );

      embedsElem.style.display = "none";
      content.appendChild(warningButton);
      content.appendChild(embedsElem);
    } else content.appendChild(embedsElem);
  }
  card.appendChild(content);

  if (record.tags) {
    const tags = record.tags.map((tag) =>
      elem("a", {
        className: "label",
        textContent: "#" + tag,
        href: `/search?tag=${encodeQuery(tag)}`,
      }),
    );
    card.appendChild(elem("div", { className: "label-area" }, undefined, tags));
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
      card.appendChild(
        elem("div", { className: "label-area" }, undefined, warnings),
      );
  }

  let translateButton: HTMLElement;
  if (
    record.text &&
    record.langs?.[0] &&
    !languagesToNotTranslate.has(record.langs[0])
  ) {
    translateButton = elem("a", {
      className: "small-link",
      textContent: "Translate",
      href: "https://translate.google.com/?sl=auto&tl=en&text=" + record.text,
    });
    if (!fullView) card.appendChild(translateButton);
  }

  if (fullView) {
    const postData = elem("div", { className: "post-data" });
    postData.appendChild(
      elem("a", {
        className: "timestamp",
        href: href,
        textContent: formatDate(indexedAt ?? createdAt),
        onclick: preload,
      }),
    );
    if (translateButton) postData.appendChild(translateButton);
    card.appendChild(postData);

    const stats = [
      stat("like", post, href),
      stat("repost", post, href),
      stat("quote", post, href),
    ].filter(Boolean);

    if (stats.length)
      card.appendChild(elem("div", { className: "stats" }, undefined, stats));
  }

  if (!isEmbed)
    card.appendChild(
      elem("div", { className: "stats-buttons" }, undefined, [
        interactionButton("reply", post),
        interactionButton("repost", post),
        interactionButton("like", post),
        interactionButton("quote", post),
      ]),
    );

  postElem.appendChild(card);

  return postElem;
};
