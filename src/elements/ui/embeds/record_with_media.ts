import { AppBskyEmbedRecordWithMedia } from "@atcute/client/lexicons";
import { loadEmbedRecord } from "./record";
import { handleEmbed } from "./embed_handlers";

export function loadEmbedRecordWithMedia(
  embed: AppBskyEmbedRecordWithMedia.Main,
  viewEmbed: AppBskyEmbedRecordWithMedia.View,
  did: string,
) {
  return [
    handleEmbed(embed.media as any, viewEmbed.media as any, did)[0],
    loadEmbedRecord(embed.record, viewEmbed.record, did)[0],
  ];
}
