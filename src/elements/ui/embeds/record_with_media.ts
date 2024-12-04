import { AppBskyEmbedRecordWithMedia } from "@atcute/client/lexicons";
import { loadEmbedRecord } from "./record";
import { elem } from "../../blocks/elem";
import { embedHandlers } from "./embed_handlers";

export function loadEmbedRecordWithMedia(
  embed: AppBskyEmbedRecordWithMedia.Main,
  did: string,
) {
  return elem("div", {}, [
    embedHandlers[embed.media.$type]?.(embed.media as any, did),
    loadEmbedRecord(embed.record, did),
  ]);
}
