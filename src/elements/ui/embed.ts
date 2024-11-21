import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedVideo,
  AppBskyFeedPost,
  Brand,
} from "@atcute/client/lexicons";
import { image } from "./embeds/image";

export function load(
  embed: Brand.Union<
    | AppBskyEmbedExternal.Main
    | AppBskyEmbedImages.Main
    | AppBskyEmbedRecord.Main
    | AppBskyEmbedRecordWithMedia.Main
    | AppBskyEmbedVideo.Main
  >,
  did: string,
): Node[] {
  let embeds = [];
  switch (embed.$type) {
    case "app.bsky.embed.images":
      for (const img of embed.images) {
        embeds.push(image(img, did, embed.images.length));
      }
      break;
    default:
      break;
  }
  return embeds;
}
