import { AppBskyEmbedImages } from "@atcute/client/lexicons";
import { imageContainerSize } from "./feed";

export function image(image: AppBskyEmbedImages.Image, did: string) {
  const a = document.createElement("a");
  const img = document.createElement("img");
  a.appendChild(img);
  const ogsize = {
    width: image.aspectRatio?.width || 1000,
    height: image.aspectRatio?.height || 5000,
  };
  let width: number;
  let height: number;
  if (
    !(
      ogsize.width <= imageContainerSize.width &&
      ogsize.height <= imageContainerSize.height
    )
  ) {
    height = imageContainerSize.height;
    width = ogsize.width * (height / ogsize.height);
    if (width > imageContainerSize.width) {
      width = imageContainerSize.width;
      height = ogsize.height * (width / ogsize.width);
    }
  } else {
    let n = Math.floor(imageContainerSize.height / ogsize.height);
    width = n * ogsize.width;
    height = n * ogsize.height;
    if (width > imageContainerSize.width) {
      n = Math.floor(imageContainerSize.width / ogsize.width);
      width = n * ogsize.width;
      height = n * ogsize.height;
    }
  }
  img.width = width;
  img.height = height;
  let thumbFileType = "webp";
  let size = "thumbnail";
  if (ogsize.height <= 1000 && ogsize.width <= 1000) {
    thumbFileType = image.image.mimeType.split("/")[1];
    size = "fullsize";
    if (ogsize.height < imageContainerSize.height) {
      img.setAttribute("style", "image-rendering: crisp-edges;");
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
