import { AppBskyEmbedDefs } from "@atcute/client/lexicons";

const singleImageHeight = 320;
const multiImageHeight = 220;

export const getProperSize = (
  size: AppBskyEmbedDefs.AspectRatio = { width: 1600, height: 900 },
  isSingleImage = true,
) =>
  `aspect-ratio: ${size.width} / ${size.height}; width: ${Math.round(
    Math.min(
      isSingleImage ? singleImageHeight : multiImageHeight,
      size.height,
    ) *
      (size.width / size.height),
  )}px;`;
