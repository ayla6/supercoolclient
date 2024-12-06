import { AppBskyEmbedImages } from "@atcute/client/lexicons";
import { elem } from "../../utils/elem";
import { getProperSize } from "../../utils/get_proper_size";

export function image(
  image: AppBskyEmbedImages.ViewImage,
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

  const fullsize = image.fullsize.split("@")[0] + "@png";

  imageHolder.style.cssText = getProperSize(image.aspectRatio, isSingleImage);
  if (image.aspectRatio && image.aspectRatio.height <= 350) {
    img.src = fullsize + "png";
  } else img.src = image.fullsize.split("@")[0] + "@webp";

  imageHolder.href = fullsize;

  return imageHolder;
}

export function loadEmbedImages(embed: AppBskyEmbedImages.View, did: string) {
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
