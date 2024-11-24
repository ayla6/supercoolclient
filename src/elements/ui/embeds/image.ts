import { AppBskyEmbedImages } from "@atcute/client/lexicons";
import { elem } from "../../blocks/elem";

export const embedContainer = {
  width: 500,
  height: 1000,
};

const forcePngFileTypes = ["webp", "gif"];
export function image(
  image:
    | AppBskyEmbedImages.Image
    | {
        offBluesky: true;
        uri: string;
        aspectRatio?: { width: number; height: number } | null;
        alt: string;
      },
  did: string,
) {
  const inBluesky = !("offBluesky" in image);
  const originalSize = image.aspectRatio
    ? image.aspectRatio
    : {
        width: 1600,
        height: 900,
      };

  const img = elem("img", {
    title: image.alt,
    alt: image.alt,
    loading: "lazy",
  });
  const imageHolder = elem(
    "a",
    {
      className: "image",
      target: " ",
    },
    [img],
  );

  let isInteger: boolean;
  const ratio = originalSize.width / originalSize.height;
  if (
    originalSize.width < embedContainer.width * 0.5 &&
    originalSize.height < embedContainer.height * 0.5
  ) {
    const scale = Math.min(
      Math.floor((embedContainer.width * 0.5) / originalSize.width),
      Math.floor((embedContainer.height * 0.5) / originalSize.height),
    );
    img.width = originalSize.width * scale;
    img.height = originalSize.height * scale;
  }

  const ogFileType = inBluesky ? image.image.mimeType.split("/")[1] : "";
  const fullFileType =
    inBluesky && forcePngFileTypes.includes(ogFileType) ? "png" : ogFileType;

  let thumbFileType = "webp";
  let thumbSize = "thumbnail";
  if (originalSize.width <= 1000 && originalSize.height <= 1000) {
    thumbSize = "fullsize";
    thumbFileType = fullFileType;
    if (
      isInteger ||
      (originalSize.width <= embedContainer.width &&
        originalSize.height <= embedContainer.height)
    ) {
      img.style.imageRendering = "pixelated";
    }
  }

  img.src = inBluesky
    ? `https://cdn.bsky.app/img/feed_${thumbSize}/plain/${did}/${image.image.ref.$link}@${thumbFileType}`
    : image.uri;
  imageHolder.href = inBluesky
    ? `https://cdn.bsky.app/img/feed_fullsize/plain/${did}/${image.image.ref.$link}@${fullFileType}`
    : image.uri;

  return imageHolder;
}

export function loadImages(images: AppBskyEmbedImages.Image[], did: string) {
  return images.map((img, index) => {
    return image(img, did);
  });
}
