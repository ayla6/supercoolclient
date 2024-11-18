import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedVideo,
  AppBskyFeedPost,
  Brand,
} from "@atcute/client/lexicons";
import { imageContainerSize } from "./feed";

export function image(
  image: AppBskyEmbedImages.Image,
  did: string,
  numberOfImages: number = 1,
) {
  const a = document.createElement("a");
  const img = document.createElement("img");
  a.append(img);
  const ogsize = {
    width: image.aspectRatio?.width || imageContainerSize.width * 2,
    height: image.aspectRatio?.height || imageContainerSize.height * 2,
  };
  let width: number;
  let height: number;
  if (
    ogsize.width <= imageContainerSize.width &&
    ogsize.height <= imageContainerSize.height
  ) {
    let h = imageContainerSize.height;
    if (numberOfImages >= 2 && ogsize.width == ogsize.height) h /= 2;
    let n = Math.floor(h / ogsize.height);
    width = n * ogsize.width;
    height = n * ogsize.height;
    if (width > imageContainerSize.width) {
      n = Math.floor(imageContainerSize.width / ogsize.width);
      width = n * ogsize.width;
      height = n * ogsize.height;
    }
  } else {
    if (numberOfImages >= 2 && ogsize.width == ogsize.height) {
      width = imageContainerSize.width / 2;
      height = imageContainerSize.width / 2;
    } else {
      height = imageContainerSize.height;
      width = ogsize.width * (height / ogsize.height);
      if (width > imageContainerSize.width) {
        width = imageContainerSize.width;
        height = ogsize.height * (width / ogsize.width);
      }
    }
  }
  img.width = width;
  img.height = height;
  let thumbFileType = "webp";
  let size = "thumbnail";
  if (ogsize.height <= 1000 && ogsize.width <= 1000) {
    thumbFileType = image.image.mimeType.split("/")[1];
    size = "fullsize";
    if (
      ogsize.width <= imageContainerSize.width &&
      ogsize.height <= imageContainerSize.height
    ) {
      img.setAttribute("style", "image-rendering: pixelated;");
    }
  }
  img.src =
    "https://cdn.bsky.app/img/feed_" +
    `${size}/plain/${did}/${image.image.ref.$link}@${thumbFileType}`;
  img.title = image.alt;
  img.alt = image.alt;
  img.loading = "lazy";
  let fullFileType = image.image.mimeType.split("/")[1];
  if (fullFileType == "webp") fullFileType = "png";
  a.href =
    "https://cdn.bsky.app/img/feed_fullsize/plain/" +
    `${did}/${image.image.ref.$link}@${fullFileType}`;
  a.target = " ";
  a.className = "image";
  return a;
}

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
  if (embed)
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
