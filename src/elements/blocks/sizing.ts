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
      return {
        width: embedContainer.width,
        height: embedContainer.width / ratio,
      };
    } else {
      return {
        width: embedContainer.height * ratio,
        height: embedContainer.height,
      };
    }
  } else
    return {
      width: size.width,
      height: size.height,
    };
}
