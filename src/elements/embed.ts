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
import { elem } from "./utils";

const forcePngFileTypes = ["webp", "gif"];
export function image(
  image: AppBskyEmbedImages.Image,
  did: string,
  numberOfImages: number = 1,
) {
  const ogsize = image.aspectRatio
    ? {
        width: image.aspectRatio.width,
        height: image.aspectRatio.height,
      }
    : {
        width: imageContainerSize.width * 2,
        height: imageContainerSize.height * 2,
      };
  let width: number;
  let height: number;

  if (numberOfImages >= 2 && ogsize.width === ogsize.height) {
    width = imageContainerSize.width / 2;
    height = imageContainerSize.width / 2;
  } else {
    const ratio = ogsize.width / ogsize.height;
    width = Math.min(
      imageContainerSize.width,
      imageContainerSize.height * ratio,
    );
    height = width / ratio;
  }

  const ogFileType = image.image.mimeType.split("/")[1];
  const fullFileType = forcePngFileTypes.includes(ogFileType)
    ? "png"
    : ogFileType;

  let thumbFileType = "webp";
  let thumbSize = "thumbnail";
  let imageRendering = "";
  if (ogsize.width <= 1000 && ogsize.height <= 1000) {
    thumbSize = "fullsize";
    thumbFileType = fullFileType;
    if (
      ogsize.width <= imageContainerSize.width &&
      ogsize.height <= imageContainerSize.height
    )
      imageRendering = "pixelated";
  }

  return elem(
    "a",
    {
      className: "image",
      href:
        "https://cdn.bsky.app/img/feed_fullsize/plain/" +
        did +
        "/" +
        image.image.ref.$link +
        "@" +
        fullFileType,
      target: "",
    },
    [
      elem("img", {
        src:
          "https://cdn.bsky.app/img/feed_" +
          thumbSize +
          "/plain/" +
          did +
          "/" +
          image.image.ref.$link +
          "@" +
          thumbFileType,
        title: image.alt,
        alt: image.alt,
        loading: "lazy",
        width: width,
        height: height,
        style: {
          imageRendering: imageRendering,
        } as CSSStyleDeclaration,
      }),
    ],
  );
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
