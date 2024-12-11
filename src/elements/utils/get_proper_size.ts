import { AppBskyEmbedDefs } from "@atcute/client/lexicons";

const singleImageHeight = 320;
const multiImageHeight = 220;

export const getProperSize = (
  size: AppBskyEmbedDefs.AspectRatio = {
    width: 1600,
    height: 900,
  },
  isSingleImage: boolean = true,
) => {
  const height = Math.min(
    isSingleImage ? singleImageHeight : multiImageHeight,
    size.height,
  );
  const width = Math.round(height * (size.width / size.height));
  return `aspect-ratio: ${size.width} / ${size.height}; width: ${width}px;`;
};
