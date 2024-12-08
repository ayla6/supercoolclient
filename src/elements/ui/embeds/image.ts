import { AppBskyEmbedImages } from "@atcute/client/lexicons";
import { elem } from "../../utils/elem";
import { getProperSize } from "../../utils/get_proper_size";
import { changeImageFormat } from "../../utils/link_processing";

export function image(
  image: AppBskyEmbedImages.ViewImage,
  isSingleImage: boolean,
) {
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
    img,
  );

  const fullsize = changeImageFormat(image.fullsize, "png");

  imageHolder.style.cssText = getProperSize(image.aspectRatio, isSingleImage);
  if (image.aspectRatio && image.aspectRatio.height <= 350) {
    img.src = fullsize;
  } else img.src = changeImageFormat(image.thumb);

  imageHolder.href = fullsize;

  return imageHolder;
}

export function loadEmbedImages(embed: AppBskyEmbedImages.View) {
  const isSingleImage = embed.images.length === 1;
  const func = (img: AppBskyEmbedImages.ViewImage) => {
    return image(img, isSingleImage);
  };
  return [
    elem(
      "div",
      {
        className:
          "media-container" + (embed.images.length === 1 ? "" : " multi"),
      },
      null,
      embed.images.map(func),
    ),
  ];
}
