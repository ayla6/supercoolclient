import { loadEmbedImages } from "./image";
import { loadEmbedExternal } from "./external";
import { loadEmbedRecordWithMedia } from "./record_with_media";
import { loadEmbedRecord } from "./record";
import { loadEmbedVideo } from "./video";
import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedVideo,
} from "@atcute/client/lexicons";

const embedHandlers = {
  "app.bsky.embed.external#view": loadEmbedExternal,
  "app.bsky.embed.images#view": loadEmbedImages,
  "app.bsky.embed.record#view": loadEmbedRecord,
  "app.bsky.embed.recordWithMedia#view": loadEmbedRecordWithMedia,
  "app.bsky.embed.video#view": loadEmbedVideo,
};

export function handleEmbed(
  embed:
    | AppBskyEmbedVideo.View
    | AppBskyEmbedImages.View
    | AppBskyEmbedRecord.View
    | AppBskyEmbedExternal.View
    | AppBskyEmbedRecordWithMedia.View,
  did: string,
) {
  if (embed) return embedHandlers[(embed as any).$type](embed, did);
}
