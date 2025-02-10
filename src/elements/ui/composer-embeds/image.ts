interface ImageWithURL {
  file: File;
  objectURL: string;
}
import { AppBskyEmbedDefs, AppBskyEmbedImages } from "@atcute/client/lexicons";
import { rpc } from "../../../login";

// Media upload functions
export const uploadImages = async (input: ImageWithURL[]) => {
  const images: AppBskyEmbedImages.Main = {
    $type: "app.bsky.embed.images",
    images: [],
  };

  for (const { file, objectURL } of input) {
    const img = new Image();
    const aspectRatio = await new Promise<AppBskyEmbedDefs.AspectRatio>(
      (resolve) => {
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.src = objectURL;
      },
    );

    // this was claude
    const fixedImage = await new Promise<Blob>(async (resolve) => {
      console.log("Starting image processing...");

      // Constants
      const MAX_FILE_SIZE = 976.56 * 1024; // ~1MB
      const MAX_DIMENSION = 2000;
      const DEFAULT_QUALITY = 100;

      // Helper functions
      const createCanvas = (width: number, height: number) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas;
      };

      const drawImageToCanvas = (
        canvas: HTMLCanvasElement,
        image: HTMLImageElement,
        width?: number,
        height?: number,
      ) => {
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(
          image,
          0,
          0,
          width || image.width,
          height || image.height,
        );
        return canvas;
      };

      const getScaledDimensions = (width: number, height: number) => {
        const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        return {
          width: width * scale,
          height: height * scale,
        };
      };

      // Handle PNG files
      if (file.type === "image/png") {
        console.log("Processing PNG file...");
        const canvas = drawImageToCanvas(
          createCanvas(img.width, img.height),
          img,
        );

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > MAX_FILE_SIZE) {
              console.log("PNG exceeds max file size, resizing...");
              if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
                const { width, height } = getScaledDimensions(
                  img.width,
                  img.height,
                );
                const scaledCanvas = drawImageToCanvas(
                  createCanvas(width, height),
                  img,
                  width,
                  height,
                );

                scaledCanvas.toBlob(
                  (resizedBlob) => {
                    console.log("Resized PNG blob size:", resizedBlob?.size);
                    resolve(resizedBlob!);
                  },
                  "image/webp",
                  1.0,
                );
              } else {
                throw new Error("Image file size too large");
              }
            } else {
              console.log("PNG blob size:", blob?.size);
              resolve(blob!);
            }
          },
          "image/webp",
          1.0,
        );
        return;
      }

      // Handle large images that need resizing
      if (
        file.size > MAX_FILE_SIZE &&
        (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION)
      ) {
        console.log("Processing oversized image...");
        let currentQuality = DEFAULT_QUALITY;
        let currentWidth = img.width;
        let currentHeight = img.height;

        const processImage = (quality: number) =>
          new Promise<Blob>((res) => {
            const { width, height } = getScaledDimensions(
              currentWidth,
              currentHeight,
            );
            currentWidth = width;
            currentHeight = height;
            const canvas = drawImageToCanvas(
              createCanvas(width, height),
              img,
              width,
              height,
            );
            canvas.toBlob((blob) => res(blob!), "image/webp", quality);
          });

        let resizedBlob = await processImage(currentQuality / 100);

        while (resizedBlob.size > MAX_FILE_SIZE && currentQuality > 50) {
          currentQuality = currentQuality - 5;
          console.log(`Retrying with ${currentQuality}% quality...`);
          resizedBlob = await processImage(currentQuality / 100);
        }
        if (resizedBlob.size > MAX_FILE_SIZE) {
          Error("Still to large lol");
        }

        console.log("Final resized image blob size:", resizedBlob.size);
        resolve(resizedBlob);
        return;
      }

      // Handle JPEG metadata stripping
      console.log("Processing JPEG file...");
      const reader = new FileReader();
      reader.onload = () => {
        const buffer = reader.result as ArrayBuffer;
        const result = buffer.slice(0);
        const view = new DataView(result);

        if (file.type === "image/jpeg") {
          let offset = 2;
          while (offset < result.byteLength) {
            const marker = view.getUint16(offset);
            if ((marker & 0xff00) !== 0xff00) break;

            const segmentLength = view.getUint16(offset + 2);
            if ((marker & 0xff) === 0xe1) {
              new Uint8Array(result).fill(
                0,
                offset + 4,
                offset + 2 + segmentLength,
              );
            }
            offset += 2 + segmentLength;
          }
        }

        const finalBlob = new Blob([result], { type: file.type });
        console.log("Final JPEG blob size:", finalBlob.size);
        resolve(finalBlob);
      };
      reader.readAsArrayBuffer(file);
    });

    console.log("Uploading blob to server...");
    const blob = (
      await rpc.call("com.atproto.repo.uploadBlob", { data: fixedImage })
    ).data.blob;
    console.log("Server upload complete");

    images.images.push({
      $type: "app.bsky.embed.image",
      aspectRatio,
      alt: "",
      image: blob,
    });
  }
  return images;
};
