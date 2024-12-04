import { loadEmbedImages } from "./image";
import { loadEmbedExternal } from "./external";
import { loadEmbedRecordWithMedia } from "./record_with_media";
import { loadEmbedRecord } from "./record";
import { loadEmbedVideo } from "./video";

export const embedHandlers = {
  "app.bsky.embed.external": loadEmbedExternal,
  "app.bsky.embed.images": loadEmbedImages,
  "app.bsky.embed.record": loadEmbedRecord,
  "app.bsky.embed.recordWithMedia": loadEmbedRecordWithMedia,
  "app.bsky.embed.video": loadEmbedVideo,
};
