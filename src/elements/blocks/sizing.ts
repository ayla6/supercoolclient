export const embedContainer = {
  width: 500,
  height: 1000,
};

export function getProperSize(size: { width: number; height: number }) {
  const ratio = size.width / size.height;
  if (
    size.width >= embedContainer.width ||
    size.height >= embedContainer.height
  ) {
    if (ratio > embedContainer.width / embedContainer.height) {
      const height = size.height / (size.width / embedContainer.width);
      return {
        width: embedContainer.width,
        height: Math.min(height, embedContainer.height),
      };
    } else {
      const width = size.width / (size.height / embedContainer.height);
      return {
        width: Math.min(width, embedContainer.width),
        height: embedContainer.height,
      };
    }
  } else
    return {
      width: size.width,
      height: size.height,
    };
}
