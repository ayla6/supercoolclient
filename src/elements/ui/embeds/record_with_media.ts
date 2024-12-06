import { AppBskyEmbedRecordWithMedia } from "@atcute/client/lexicons";
import { loadEmbedRecord } from "./record";
import { handleEmbed } from "./embed_handlers";

export function loadEmbedRecordWithMedia(
  embed: AppBskyEmbedRecordWithMedia.View,
  did: string,
) {
  return [
    handleEmbed(embed.media as any, did)[0],
    loadEmbedRecord(embed.record, did)[0],
  ];
}
