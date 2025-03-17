import { AppBskyEmbedRecord, AppBskyFeedDefs } from "@atcute/client/lexicons";
import { postCard } from "../post_card";
import { elem } from "../../utils/elem";
import { getPathFromUri } from "../../utils/link_processing";
import { env } from "../../../settings";
import { rpcPublic } from "../../../login";

export const loadEmbedRecord = (
  embed:
    | AppBskyEmbedRecord.View
    | { isLoadedBlockedPost: true; record: AppBskyFeedDefs.PostView },
) => {
  const record = embed.record;
  if ("$type" in record) {
    if (record.$type === "app.bsky.embed.record#viewRecord") {
      const value = record.value as { $type?: string };
      const valueType = "$type" in value ? value.$type : "";
      if (valueType === "app.bsky.feed.post") {
        const post: AppBskyFeedDefs.PostView = {
          author: record.author,
          cid: record.cid,
          indexedAt: record.indexedAt,
          record: value,
          uri: record.uri,
          embed: record.embeds?.[0],
          labels: record.labels,
          likeCount: record.likeCount,
          replyCount: record.replyCount,
          repostCount: record.repostCount,
          quoteCount: record.quoteCount,
        };
        return postCard(post, { isEmbed: true });
      }
    } else if (
      record.$type === "app.bsky.embed.record#viewBlocked" ||
      record.$type === "app.bsky.embed.record#viewDetached" ||
      record.$type === "app.bsky.embed.record#viewNotFound"
    ) {
      let text: string;
      if (record.$type === "app.bsky.embed.record#viewBlocked") {
        text = "Blocked post";
      } else if (record.$type === "app.bsky.embed.record#viewDetached") {
        text = "Post detached";
      } else {
        text = "Post not found";
      }
      const simpleCard = elem("a", {
        className: "simple-card",
        href: getPathFromUri(record.uri),
        textContent: text,
      });
      if (
        record.$type === "app.bsky.embed.record#viewBlocked" &&
        env.viewBlockedPosts
      ) {
        setTimeout(async () => {
          let post = (
            await rpcPublic.get("app.bsky.feed.getPosts", {
              params: { uris: [record.uri] },
            })
          ).data.posts[0];
          simpleCard.replaceWith(
            postCard(post, { isEmbed: true, someBlocking: true }),
          );
        }, 0);
      }
      return simpleCard;
    }
  } else if ("isLoadedBlockedPost" in embed) {
    return postCard(record as AppBskyFeedDefs.PostView, {
      isEmbed: true,
      someBlocking: true,
    });
  }
};
