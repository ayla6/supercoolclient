import { AppBskyEmbedDefs } from "@atcute/client/lexicons";

export const singleImageHeight = 322;
export const multiImageHeight = 222;

export function getProperSize(
  size: AppBskyEmbedDefs.AspectRatio,
  maxHeight: number,
) {
  const height = Math.min(maxHeight, size.height);
  const width = Math.round(height * (size.width / size.height));
  return { width, height };
}
