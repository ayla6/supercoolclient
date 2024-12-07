import { AppBskyEmbedRecordWithMedia } from "@atcute/client/lexicons";
import { loadEmbedRecord } from "./record";
import { handleEmbed } from "./embed_handlers";

export function loadEmbedRecordWithMedia(
  embed: AppBskyEmbedRecordWithMedia.View,
) {
  return [handleEmbed(embed.media as any)[0], loadEmbedRecord(embed.record)[0]];
}
