import { AppBskyEmbedDefs } from "@atcute/client/lexicons";

const singleImageHeight = 322;
const multiImageHeight = 222;

export function getProperSize(
  size: AppBskyEmbedDefs.AspectRatio = {
    width: 1600,
    height: 900,
  },
  isSingleImage: boolean,
) {
  const height = Math.min(
    isSingleImage ? singleImageHeight : multiImageHeight,
    size.height,
  );
  const width = Math.round(height * (size.width / size.height));
  return (
    `aspect-ratio: ${size.width} / ${size.height}; width: ${width}px;` +
    (isSingleImage ? "" : `height: ${height}px`)
  );
}
