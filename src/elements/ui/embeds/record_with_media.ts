import { AppBskyEmbedRecordWithMedia } from "@atcute/client/lexicons";
import { loadEmbedRecord } from "./record";
import { handleEmbed } from "./embed_handlers";

export const loadEmbedRecordWithMedia = (
  embed: AppBskyEmbedRecordWithMedia.View,
) => {
  return [handleEmbed(embed.media as any), loadEmbedRecord(embed.record)];
};
