import { AppBskyEmbedImages } from "@atcute/client/lexicons";
import { elem } from "../../blocks/elem";

export const embedContainer = {
  width: 500,
  height: 1000,
};

const forcePngFileTypes = ["webp", "gif"];
export function image(image: AppBskyEmbedImages.Image, did: string) {
  const originalSize = image.aspectRatio
    ? image.aspectRatio
    : {
        width: 1600,
        height: 900,
      };

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

  img.width = originalSize.width;
  img.height = originalSize.height;

  const ogFileType = image.image.mimeType.split("/")[1];
  const fullFileType = forcePngFileTypes.includes(ogFileType)
    ? "png"
    : ogFileType;

  let thumbFileType = "webp";
  let thumbSize = "thumbnail";
  if (originalSize.width <= 1000 && originalSize.height <= 1000) {
    thumbSize = "fullsize";
    thumbFileType = fullFileType;
  }

  img.src = `https://cdn.bsky.app/img/feed_${thumbSize}/plain/${did}/${image.image.ref.$link}@${thumbFileType}`;
  imageHolder.href = `https://cdn.bsky.app/img/feed_fullsize/plain/${did}/${image.image.ref.$link}@${fullFileType}`;

  return imageHolder;
}

export function loadEmbedImages(embed: AppBskyEmbedImages.Main, did: string) {
  return [
    elem(
      "div",
      { className: "images" + (embed.images.length > 1 ? " multi" : "") },
      embed.images.map((img, index) => {
        return image(img, did);
      }),
    ),
  ];
}
