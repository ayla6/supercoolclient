import {
  AppBskyEmbedImages,
  AppBskyFeedDefs,
  AppBskyFeedPost,
} from "@atcute/client/lexicons";
import {
  changeImageFormat,
  getDidFromUri,
  getFediAt,
  getPathFromUri,
  idChoose,
} from "../utils/link_processing.ts";
import { manager, rpc, contentLabels, privateKey } from "../../login";
import { elem } from "../utils/elem";
import { encodeQuery, processRichText } from "../utils/text_processing";
import { formatDate, formatTimeDifference } from "../utils/date";
import { handleEmbed } from "./embeds/embed_handlers";
import { settings } from "../../settings.ts";
import { composerBox } from "./composer.ts";
import { setPreloaded } from "../utils/preloaded_post.ts";
import * as age from "age-encryption";
import sanitizeHtml from "sanitize-html";

const ageDecrypter = new age.Decrypter();
privateKey && ageDecrypter.addIdentity(privateKey);

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
  post: AppBskyFeedDefs.PostView,
  type: string,
  countSpan: HTMLSpanElement,
  button: HTMLButtonElement,
) => {
  let count = post[type + "Count"];
  const recordUri = post.viewer[type];
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
            subject: { cid: post.cid, uri: post.uri },
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

export const postCard = (
  postHousing:
    | AppBskyFeedDefs.FeedViewPost
    | AppBskyFeedDefs.PostView
    | AppBskyFeedDefs.ThreadViewPost,
  cfg: {
    isFullView?: boolean;
    hasReplies?: boolean;
    isEmbed?: boolean;
    isDecryptedPost?: boolean;
    blockedPost?: boolean;
    blockedByPost?: boolean;
    someBlocking?: boolean;
    icon?: string;
    text?: string;
  } = {
    isFullView: false,
    hasReplies: false,
    isEmbed: false,
    isDecryptedPost: false,
    blockedPost: false,
    blockedByPost: false,
    someBlocking: false,
    icon: undefined,
    text: undefined,
  },
) => {
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
            updateInteraction(isActive, post, type, countSpan, button);
          };
      } else if (type === "reply") {
        button.onclick = (e) => {
          e.stopPropagation();
          composerBox(post, undefined, cfg.isDecryptedPost);
        };
      } else if (type === "quote") {
        button.onclick = (e) => {
          e.stopPropagation();
          composerBox(undefined, post, cfg.isDecryptedPost);
        };
      }

    return button;
  };

  const post = "post" in postHousing ? postHousing.post : postHousing;

  if (post.labels && post.labels.some((l) => contentLabels[l.val] === "hide"))
    return cfg.isFullView
      ? elem(
          "div",
          { className: "card-holder" },
          elem("div", {
            className: "simple-card",
            textContent: `This post is hidden because it contains the label
            ${post.labels.find((l) => contentLabels[l.val] === "hide")?.val}, which is set to hide.`,
          }),
        )
      : elem("div");
  // gonna make this second part better latter maybe

  const record = post.record as AppBskyFeedPost.Record;
  const author = post.author;
  const authorHref = `/${author.did}`;
  const href = getPathFromUri(post.uri);
  const indexedAt = new Date(post.indexedAt);
  const createdAt = new Date(record.createdAt);

  const notBridgyPost = !(
    record["bridgyOriginalText"] && record["bridgyOriginalUrl"]
  );
  const notLongText = !record["longText"];

  const atId =
    notBridgyPost || !author.handle.endsWith(".brid.gy")
      ? idChoose(author)
      : getFediAt(author.handle);

  const postElem = elem("div", {
    className: "card-holder post" + (cfg.isFullView ? " full" : ""),
  });
  const card = elem("div", { className: "card" });

  const profilePicture = elem(
    "a",
    { className: "avatar-holder", href: authorHref },
    elem("img", {
      className: "avatar",
      src: changeImageFormat(post.author.avatar),
      loading: "lazy",
    }),
  );

  const isAgeEncrypted =
    (record.text === "AGE ENCRYPTED POST" &&
      post.record["dev.pages.supercoolclient.secret"]) ||
    (record.text === "=== AGE ENCRYPTED POST ===\n=== JUST IGNORE IT :) ===" &&
      (post.embed as AppBskyEmbedImages.View)?.images[0].alt);
  if (isAgeEncrypted) {
    setTimeout(async () => {
      let success = false;
      const text = isAgeEncrypted;
      let decryptedText: string;
      try {
        decryptedText = await ageDecrypter.decrypt(
          age.armor.decode(text),
          "text",
        );
        success = true;
      } catch (e) {
        success = false;
      }
      if (success) {
        record.text = decryptedText;
        record.embed = undefined;
        post.embed = undefined;
        post.labels = undefined;
        postElem.replaceWith(
          postCard(postHousing, {
            isFullView: cfg.isFullView,
            isDecryptedPost: true,
          }),
        );
      }
    }, 0);
  }

  let apOgLink: HTMLAnchorElement;
  if (!notBridgyPost) {
    if (
      post.embed?.$type === "app.bsky.embed.external#view" &&
      post.embed.external.title.startsWith("Original post on ")
    ) {
      post.embed = null;
    }
    apOgLink = elem("a", {
      className: "og-fedi-link",
      textContent: "🔗",
      target: "_blank",
      href: record["bridgyOriginalUrl"],
    });
  }
  if (!notLongText) {
    if (
      post.embed?.$type === "app.bsky.embed.external#view" &&
      post.embed.external.title.startsWith("Full post at ")
    ) {
      post.embed = null;
    }
  }

  if (!cfg.isFullView) {
    card.onclick = (e) => {
      if (window.getSelection()?.toString()) return;
      if ((e.target as HTMLElement).closest("a, button")) return;
      const embeds = (e.target as HTMLElement).closest(".embeds");
      if (
        embeds &&
        !(e.target as HTMLElement).classList.contains("media-container") &&
        !embeds.contains(card)
      )
        return;
      preload();
    };
    card.setAttribute("works-as-link", "");
    card.setAttribute("href", href);
  }

  const preload = () => {
    setPreloaded(post);
  };

  if (cfg.isEmbed) {
    card.appendChild(
      elem("div", { className: "header" }, undefined, [
        elem("a", { className: "user-area", href: authorHref }, undefined, [
          profilePicture,
          elem("span", { className: "handle-area handle", textContent: atId }),
          cfg.isDecryptedPost && elem("span", { textContent: "🔓" }),
        ]),
        elem("div", { className: "flex-row-gap" }, undefined, [
          apOgLink,
          elem("a", {
            className: "timestamp",
            href: href,
            textContent: formatTimeDifference(
              new Date(),
              indexedAt || createdAt,
            ),
            onclick: preload,
          }),
        ]),
      ]),
    );
  } else if (cfg.isFullView) {
    card.appendChild(
      elem("a", { className: "header", href: authorHref }, undefined, [
        profilePicture,
        elem("div", { className: "handle-area" }, undefined, [
          elem("span", {
            className: "handle",
            textContent: atId + (cfg.isDecryptedPost ? "🔓" : ""),
          }),
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
          cfg.isDecryptedPost && elem("span", { textContent: "🔓" }),
        ]),
      ];
    } else {
      handleElem = [
        elem("a", {
          className: "handle",
          href: authorHref,
          textContent: atId,
        }),
        cfg.text && elem("span", { textContent: cfg.text }),
        cfg.isDecryptedPost && elem("span", { textContent: "🔓" }),
      ];
    }

    postElem.appendChild(
      elem("div", { className: "left-area" }, undefined, [
        profilePicture,
        cfg.hasReplies ? elem("div", { className: "reply-string" }) : undefined,
      ]),
    );

    card.appendChild(
      elem("div", { className: "header" }, undefined, [
        elem(
          "span",
          { className: "handle-area", innerHTML: cfg.icon ?? "" },
          undefined,
          handleElem,
        ),
        elem("div", { className: "flex-row-gap" }, undefined, [
          apOgLink,
          elem("a", {
            className: "timestamp",
            href: href,
            textContent: formatTimeDifference(
              new Date(),
              indexedAt || createdAt,
            ),
            onclick: preload,
          }),
        ]),
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

  const labelArea = elem("div", { className: "label-area" });
  const content = elem("div", { className: "post-content" });
  let apWarningButton: HTMLButtonElement;
  if (!notBridgyPost) {
    const warningLabel = record.text.match(/^\[(.*)\]/);
    const originalTextHasWarning =
      warningLabel &&
      record["bridgyOriginalText"].match(
        new RegExp(`^<p>\\\[${warningLabel[1]}\\\]</p>`),
      );
    if (warningLabel?.[0] && !originalTextHasWarning) {
      let postShow = false;
      const buttonStatus = elem("span", {
        textContent: postShow ? "Hide content" : "Show content",
      });
      apWarningButton = elem(
        "button",
        {
          className: "warning-button",
          onclick: (e) => {
            e.stopPropagation();
            postShow = !postShow;
            buttonStatus.textContent = postShow
              ? "Hide content"
              : "Show content";
            const display = postShow ? "block" : "none";
            content.style.display = display;
            labelArea.style.display = display;
          },
        },
        undefined,
        [
          elem("span", {
            className: "warning-text",
            textContent: warningLabel?.[1],
          }),
          buttonStatus,
        ],
      );
      content.style.display = "none";
      labelArea.style.display = "none";
    }
  }
  if (record.text) {
    if (notBridgyPost && notLongText) {
      content.appendChild(
        elem(
          "div",
          { className: "text-content" },
          processRichText(record.text, record.facets),
        ),
      );
    } else {
      const saferText = sanitizeHtml(
        notLongText ? record["bridgyOriginalText"] : record["longText"],
      ).replaceAll("https://bsky.brid.gy/r/https://bsky.app/profile/", "/");
      content.appendChild(
        elem("div", {
          className: "text-content",
          innerHTML: saferText,
        }),
      );
    }
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
      let embeddedShow = false;
      const warningLabel = post.labels.find(
        (l) => contentLabels[l.val] === "warn",
      );
      const buttonStatus = elem("span", {
        textContent: embeddedShow ? "Hide content" : "Show content",
      });
      const warningButton = elem(
        "button",
        {
          className: "warning-button",
          onclick: (e) => {
            e.stopPropagation();
            embeddedShow = !embeddedShow;
            buttonStatus.textContent = embeddedShow
              ? "Hide content"
              : "Show content";
            embedsElem.style.display = embeddedShow ? "block" : "none";
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
    }
    content.appendChild(embedsElem);
  }
  if (apWarningButton) card.appendChild(apWarningButton);
  card.appendChild(content);

  if (record.tags) {
    const tags = record.tags.map((tag) =>
      elem("a", {
        className: "label",
        textContent: "#" + tag,
        href: `/search?tag=${encodeQuery(tag)}`,
      }),
    );
    labelArea.append(...tags);
    card.appendChild(labelArea);
  }

  if (settings.viewBlockedPosts) {
    const warnings = [];
    const warning = (text: string) =>
      warnings.push(
        elem("span", {
          className: "label",
          textContent: text,
        }),
      );

    if (post.indexedAt && indexedAt.getTime() - createdAt.getTime() > 250000)
      warning(`Archived from ${formatDate(createdAt)}`);
    if (cfg.blockedPost)
      warning(`Block relation between this user and their replier`);
    if (cfg.blockedByPost) warning(`Blocked by or blocking this user`);
    if (cfg.someBlocking) warning(`Someone here is blocking someone`);

    if (warnings.length)
      card.appendChild(
        elem("div", { className: "label-area" }, undefined, warnings),
      );
  }

  let translateButton: HTMLElement;
  if (
    record.text &&
    record.langs?.[0] &&
    !settings.languagesToNotTranslate.has(record.langs[0])
  ) {
    translateButton = elem("a", {
      className: "small-link",
      textContent: "Translate",
      href: "https://translate.google.com/?sl=auto&tl=en&text=" + record.text,
    });
    if (!cfg.isFullView) card.appendChild(translateButton);
  }

  if (cfg.isFullView) {
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
    if (apOgLink) postData.appendChild(apOgLink);
    card.appendChild(postData);

    const stats = [
      stat("like", post, href),
      stat("repost", post, href),
      stat("quote", post, href),
    ].filter(Boolean);

    if (stats.length)
      card.appendChild(elem("div", { className: "stats" }, undefined, stats));
  }

  if (!cfg.isEmbed)
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
