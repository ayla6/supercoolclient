import { AppBskyEmbedRecordWithMedia } from "@atcute/client/lexicons";
import { loadEmbedRecord } from "./record";
import { embedHandlers } from "./embed_handlers";

export function loadEmbedRecordWithMedia(
  embed: AppBskyEmbedRecordWithMedia.Main,
  did: string,
) {
  return [
    embedHandlers[embed.media.$type]?.(embed.media as any, did)[0],
    loadEmbedRecord(embed.record, did)[0],
  ];
}
