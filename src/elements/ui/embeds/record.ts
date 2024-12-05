import { AppBskyEmbedRecord, AppBskyFeedDefs } from "@atcute/client/lexicons";
import { postCard } from "../post_card";

export function loadEmbedRecord(
  embed: AppBskyEmbedRecord.Main,
  viewEmbed: AppBskyEmbedRecord.View,
  did: string,
) {
  const record = viewEmbed.record;
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
      return [postCard(post, false, false, true)];
    }
  } else return [];
}
