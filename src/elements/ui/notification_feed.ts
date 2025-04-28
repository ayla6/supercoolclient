import {
  AppBskyNotificationListNotifications,
  AppBskyFeedPost,
} from "@atcute/client/lexicons";
import { rpc, sessionData } from "../../login";
import { OnscrollFunction } from "../../types";
import { formatTimeDifference } from "../utils/date";
import { elem } from "../utils/elem";
import { getDidFromUri, getPathFromUri } from "../utils/link_processing";

import favSvg from "../../svg/fav.svg?raw";
import repostSvg from "../../svg/repost.svg?raw";
import userSvg from "../../svg/user.svg?raw";
import replySvg from "../../svg/reply.svg?raw";
import atSvg from "../../svg/at.svg?raw";
import quoteSvg from "../../svg/quote.svg?raw";
import { postCard } from "./post_card";
import { updateNotificationIcon } from "./navbar";
import { env } from "../../settings";
import { request } from "../utils/request";

const notificationIcons = {
  like: favSvg,
  repost: repostSvg,
  follow: userSvg,
  reply: replySvg,
  mention: atSvg,
  quote: quoteSvg,
};

const notificationMessages = {
  like: " liked your post",
  repost: " reposted your post",
  follow: " followed you",
  reply: " replied to",
  mention: " mentioned you in a post",
  quote: " quoted you in a post",
};

const loadNotifications = async (
  params: {
    limit: number;
    cursor: string;
  },
  useCache: boolean = false,
) => {
  const fragment = document.createDocumentFragment();
  const data = (
    await request(
      "app.bsky.notification.listNotifications",
      {
        params,
      },
      useCache,
    )
  ).data;

  const listPosts = [];

  for (const notification of data.notifications) {
    if (notification.reasonSubject) {
      listPosts.push(notification.reasonSubject);
    }
    if (notification.reason === "reply" || notification.reason === "mention") {
      listPosts.push(notification.uri);
    }
  }

  const postsMentioned = {
    posts: [],
  };
  if (listPosts.length > 0) {
    const chunks = [];
    for (let i = 0; i < listPosts.length; i += 25) {
      chunks.push(listPosts.slice(i, i + 25));
    }
    for (const chunk of chunks) {
      const response = await request(
        "app.bsky.feed.getPosts",
        {
          params: { uris: chunk },
        },
        useCache,
      );
      postsMentioned.posts.push(...response.data.posts);
    }
  }

  const loadNotification = async (
    notification: AppBskyNotificationListNotifications.Notification,
  ) => {
    const href =
      (notification.record as any).$type === "app.bsky.feed.post"
        ? getPathFromUri(notification.uri)
        : notification.reasonSubject
          ? getPathFromUri(notification.reasonSubject)
          : `/${notification.author.did}`;

    if (
      !(notification.reason === "reply" || notification.reason === "mention")
    ) {
      const leftArea = elem("div", { className: "left-area" }, undefined, [
        elem(
          "a",
          { className: "avatar-holder", href: `/${notification.author.did}` },
          elem("img", {
            className: "avatar",
            src: notification.author.avatar,
          }),
        ),
      ]);

      const notifText = elem("span", {}, undefined, [
        elem("a", {
          className: "handle",
          href: `/${notification.author.did}`,
          textContent: notification.author.handle,
          onclick: (e) => e.stopPropagation(),
        }),
        document.createTextNode(notificationMessages[notification.reason]),
      ]);

      const notifHeader = elem("div", { className: "header" }, undefined, [
        elem(
          "div",
          {
            className: "handle-area",
            innerHTML: notificationIcons[notification.reason],
          },
          notifText,
        ),
        elem("a", {
          className: "timestamp",
          href: href,
          textContent: formatTimeDifference(
            new Date(),
            new Date(notification.indexedAt),
          ),
          onclick: (e) => e.stopPropagation(),
        }),
      ]);

      let notifContent = elem("div", { className: "content" });
      if (notification.reasonSubject) {
        notifContent.classList.add("greyed");
        notifContent.append(
          document.createTextNode(
            postsMentioned.posts.find(
              (post) => post.uri === notification.reasonSubject,
            )?.record.text,
          ),
        );
      }

      const card = elem("div", { className: "card" }, undefined, [
        notifHeader,
        notifContent,
      ]);

      card.setAttribute("works-as-link", "");
      card.setAttribute("href", href);

      if (notification.reason === "follow") card.style.paddingBlock = "16px";

      return elem("div", { className: "card-holder clickable" }, undefined, [
        leftArea,
        card,
      ]);
    } else {
      if (
        notification.reason === "mention" &&
        (notification.record as AppBskyFeedPost.Record).reply?.parent.uri &&
        getDidFromUri(
          (notification.record as AppBskyFeedPost.Record).reply.parent.uri,
        ) === sessionData.did
      ) {
        notification.reason = "reply";
      }
      return postCard(
        postsMentioned.posts.find((post) => post.uri === notification.uri),
        {
          icon: notificationIcons[notification.reason],
          text: notificationMessages[notification.reason],
        },
      );
    }
  };

  for (const notification of data.notifications) {
    fragment.appendChild(await loadNotification(notification));
  }

  return { fragment, cursor: data.cursor };
};

let feedBeingLoaded = false;
export const hydrateNotificationFeed = async (
  output: HTMLElement,
  useCache = true,
): Promise<OnscrollFunction> => {
  rpc.call("app.bsky.notification.updateSeen", {
    data: { seenAt: new Date().toISOString() },
  });
  updateNotificationIcon(true);
  const params = { limit: 50, cursor: undefined };
  const data = await loadNotifications(params, useCache);

  output.replaceChildren();
  output.append(data.fragment);

  if (data.cursor === undefined) return;
  params.cursor = data.cursor;
  return async () => {
    if (feedBeingLoaded) return;

    const bottomPosition = window.innerHeight + Math.round(window.scrollY);
    const shouldLoad = bottomPosition + 2000 >= document.body.offsetHeight;

    if (!shouldLoad) return;

    try {
      feedBeingLoaded = true;
      const data = await loadNotifications(params, useCache);
      output.append(data.fragment);
      params.cursor = data.cursor;
      if (params.cursor === undefined) window.onscroll = null;
    } finally {
      feedBeingLoaded = false;
    }
  };
};
