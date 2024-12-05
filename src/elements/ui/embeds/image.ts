import { AppBskyEmbedImages } from "@atcute/client/lexicons";
import { elem } from "../../utils/elem";
import { getProperSize } from "../../utils/get_proper_size";

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

  imageHolder.style.cssText = getProperSize(image.aspectRatio, isSingleImage);
  if (
    image.aspectRatio &&
    image.aspectRatio.width <= 1000 &&
    image.aspectRatio.height <= 1000
  ) {
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
