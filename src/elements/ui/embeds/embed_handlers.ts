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
  "app.bsky.embed.external": loadEmbedExternal,
  "app.bsky.embed.images": loadEmbedImages,
  "app.bsky.embed.record": loadEmbedRecord,
  "app.bsky.embed.recordWithMedia": loadEmbedRecordWithMedia,
  "app.bsky.embed.video": loadEmbedVideo,
};

export function handleEmbed(
  embed:
    | AppBskyEmbedVideo.Main
    | AppBskyEmbedImages.Main
    | AppBskyEmbedRecord.Main
    | AppBskyEmbedExternal.Main
    | AppBskyEmbedRecordWithMedia.Main,
  viewEmbed:
    | AppBskyEmbedVideo.View
    | AppBskyEmbedImages.View
    | AppBskyEmbedRecord.View
    | AppBskyEmbedExternal.View
    | AppBskyEmbedRecordWithMedia.View,
  did: string,
) {
  if (embed && viewEmbed)
    return embedHandlers[(embed as any).$type](embed, viewEmbed, did);
}
