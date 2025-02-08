import { AppBskyEmbedImages } from "@atcute/client/lexicons";
import { elem } from "../../utils/elem";
import { getProperSize } from "../../utils/get_proper_size";
import { changeImageFormat } from "../../utils/link_processing";
import { dialogBox } from "../dialog";

const loadImage = (
  image: AppBskyEmbedImages.ViewImage,
  isSingleImage: boolean,
) => {
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
      onclick: (e) => {
        e.preventDefault();
        dialogBox(elem("img", { src: image.fullsize }));
      },
    },
    img,
  );

  const fullsize = image.fullsize;

  imageHolder.style.cssText = getProperSize(image.aspectRatio, isSingleImage);
  if (image.aspectRatio && image.aspectRatio.height <= 350) {
    img.src = fullsize;
  } else img.src = changeImageFormat(image.thumb);

  imageHolder.href = fullsize;
  return imageHolder;
};

export const loadEmbedImages = (embed: AppBskyEmbedImages.View) => {
  const isSingleImage = embed.images.length === 1;
  const mediaContainer = elem("div", {
    className: "media-container" + (embed.images.length === 1 ? "" : " multi"),
  });
  embed.images.forEach((img) =>
    mediaContainer.appendChild(loadImage(img, isSingleImage)),
  );
  return mediaContainer;
};
