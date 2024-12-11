import { AppBskyEmbedRecord, AppBskyFeedDefs } from "@atcute/client/lexicons";
import { postCard } from "../post_card";
import { elem } from "../../utils/elem";
import { getPathFromUri } from "../../utils/link_processing";

export const loadEmbedRecord = (embed: AppBskyEmbedRecord.View) => {
  const record = embed.record;
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
      return postCard(post, false, false, true);
    }
  } else if (
    record.$type === "app.bsky.embed.record#viewBlocked" ||
    record.$type === "app.bsky.embed.record#viewDetached" ||
    record.$type === "app.bsky.embed.record#viewNotFound"
  ) {
    console;
    let text: string;
    if (record.$type === "app.bsky.embed.record#viewBlocked") {
      text = "Blocked post";
    } else if (record.$type === "app.bsky.embed.record#viewDetached") {
      text = "Post detached";
    } else {
      text = "Post not found";
    }
    return elem("a", {
      className: "simple-card",
      href: getPathFromUri(record.uri),
      textContent: text,
    });
  }
};
