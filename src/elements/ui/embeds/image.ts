import { AppBskyEmbedImages } from "@atcute/client/lexicons";
import { elem } from "../../blocks/elem";
import { embedContainer, getProperSize } from "../../blocks/sizing";

const imageSizes: { [key: number]: { width: number; height: number } } = {
  2: { width: 250, height: 250 },
  3: { width: 250, height: 125 },
  4: {
    width: embedContainer.width / 2,
    height: embedContainer.width / 3,
  },
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
  did?: string,
  numberOfImages: number = 1,
) {
  const inBluesky = !("offBluesky" in image);
  const originalSize = image.aspectRatio
    ? image.aspectRatio
    : {
        width: 1600,
        height: 900,
      };

  let holderSize: { width: number; height: number };
  let isInteger = false;
  if (numberOfImages > 1) {
    holderSize = imageSizes[numberOfImages];
  } else {
    holderSize = getProperSize(originalSize);
  }

  const img = elem("img", {
    title: image.alt,
    alt: image.alt,
    loading: "lazy",
  });
  if (
    originalSize.width < holderSize.width &&
    originalSize.height < holderSize.height
  ) {
    const scale = Math.min(
      Math.floor(holderSize.width / originalSize.width),
      Math.floor(holderSize.height / originalSize.height),
    );
    img.width = originalSize.width * scale;
    img.height = originalSize.height * scale;
    img.style.top = `${(holderSize.height - img.height) / 2}px`;
    isInteger = true;
  } else {
    img.width = holderSize.width;
    img.height = holderSize.height;
  }

  const imageHolder = elem(
    "a",
    {
      className: "image",
      target: " ",
    },
    [img],
  );
  imageHolder.style.cssText = `width: ${holderSize.width}px; height: ${holderSize.height}px`;

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
      (originalSize.width <= holderSize.width &&
        originalSize.height <= holderSize.height)
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
  let numberOfImages = images.length;
  if (
    numberOfImages === 2 &&
    images[0].aspectRatio &&
    images[1].aspectRatio &&
    images[0].aspectRatio.height * 2 <= embedContainer.height &&
    images[0].aspectRatio.width === images[1].aspectRatio.width &&
    images[0].aspectRatio.height === images[1].aspectRatio.height
  ) {
    numberOfImages = 0;
  }
  return images.map((img, index) => {
    let imgElement: HTMLElement;
    if (numberOfImages === 3 && index === 0) {
      imgElement = image(img, did, 2);
      imgElement.style.float = "left";
    } else {
      imgElement = image(img, did, numberOfImages);
    }
    return imgElement;
  });
}
