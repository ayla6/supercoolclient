import { AppBskyEmbedImages } from "@atcute/client/lexicons";
import { elem } from "../../blocks/elem";
import {
  getProperSize,
  multiImageHeight,
  singleImageHeight,
} from "../../blocks/get_proper_size";

const forcePngFileTypes = ["webp", "gif"];
export function image(
  image: AppBskyEmbedImages.Image,
  did: string,
  isSingleImage: boolean,
) {
  const img = elem("img", {
    title: image.alt,
    alt: image.alt,
  });
  const imageHolder = elem(
    "a",
    {
      className: "image",
      target: " ",
    },
    [img],
  );

  const ogFileType = image.image.mimeType.split("/")[1];
  const fullFileType = forcePngFileTypes.includes(ogFileType)
    ? "png"
    : ogFileType;

  let thumbFileType = "webp";
  let thumbSize = "thumbnail";
  const aspectRatio = image.aspectRatio ?? {
    width: 1600,
    height: 900,
  };

  const properSize = getProperSize(
    aspectRatio,
    isSingleImage ? singleImageHeight : multiImageHeight,
  );
  imageHolder.style.cssText =
    `aspect-ratio: ${aspectRatio.width}/${aspectRatio.height}; width: ${properSize.width}px;` +
    (isSingleImage ? "" : `height: ${properSize.height}px`);

  if (aspectRatio && aspectRatio.width <= 1000 && aspectRatio.height <= 1000) {
    thumbSize = "fullsize";
    thumbFileType = fullFileType;
  }

  img.src = `https://cdn.bsky.app/img/feed_${thumbSize}/plain/${did}/${image.image.ref.$link}@${thumbFileType}`;
  imageHolder.href = `https://cdn.bsky.app/img/feed_fullsize/plain/${did}/${image.image.ref.$link}@${fullFileType}`;

  return imageHolder;
}

export function loadEmbedImages(
  embed: AppBskyEmbedImages.Main,
  viewEmbed: AppBskyEmbedImages.View,
  did: string,
) {
  return [
    elem(
      "div",
      {
        className:
          "media-container" + (embed.images.length === 1 ? "" : " multi"),
      },
      embed.images.map((img, index) => {
        return image(img, did, embed.images.length === 1);
      }),
    ),
  ];
}
