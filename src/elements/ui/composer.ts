import {
  AppBskyEmbedDefs,
  AppBskyEmbedImages,
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
  AppBskyFeedPost,
} from "@atcute/client/lexicons";
import { manager, rpc } from "../../login";
import { elem } from "../utils/elem";
import { postCard } from "./post_card";
import { dialogBox } from "./dialog";

export const composerBox = (
  replyTo?: AppBskyFeedPost.ReplyRef,
  quote?: AppBskyFeedDefs.PostView,
) => {
  // Main container elements
  const background = elem("div", { className: "background" });
  const imagePreviewContainer = elem("div", { className: "image-preview" });

  // State
  interface ImageWithURL {
    file: File;
    objectURL: string;
  }
  let images: ImageWithURL[] = [];
  let video: File;
  let cleaning = false;

  // Create main textbox
  const textbox = elem("div", {
    className: "textbox",
    role: "textbox",
    contentEditable: "true",
    translate: false,
    ariaPlaceholder: "Say anything you want",
  });

  // Image handling functions
  const updateImagePreviews = () => {
    imagePreviewContainer.innerHTML = "";
    images.forEach((image, index) => {
      imagePreviewContainer.appendChild(
        elem("div", { className: "image" }, null, [
          elem("img", { src: image.objectURL }),
          elem("button", {
            textContent: "×",
            className: "remove",
            onclick: () => {
              URL.revokeObjectURL(image.objectURL);
              images.splice(index, 1);
              updateImagePreviews();
            },
          }),
        ]),
      );
    });
  };

  const handleImageInput = (files: FileList) => {
    const remainingSlots = 4 - images.length;
    const newFiles = Array.from(files).slice(0, remainingSlots);
    const newImages = newFiles.map((file) => ({
      file,
      objectURL: URL.createObjectURL(file),
    }));
    images.push(...newImages);
    updateImagePreviews();
  };

  // Paste handler
  textbox.addEventListener("paste", (e) => {
    e.preventDefault();
    if (images?.length >= 4) return;

    const files = Array.from(e.clipboardData?.items || [])
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter(Boolean);

    if (files.length) {
      handleImageInput(files as unknown as FileList);
    }
  });

  // File input helpers
  const createFileInput = (
    type: string,
    multiple: boolean,
    handler: (files: FileList) => void,
  ) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = `${type}/*`;
    input.multiple = multiple;
    input.addEventListener("change", () => input.files && handler(input.files));
    return input;
  };

  // Media upload functions
  const uploadImages = async (input: ImageWithURL[]) => {
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
      const fixedImage = await new Promise<Blob>((resolve) => {
        // Constants
        const MAX_FILE_SIZE = 976.56 * 1024; // ~1MB
        const MAX_DIMENSION = 2000;
        const DEFAULT_QUALITY = 0.95;

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
          const canvas = drawImageToCanvas(
            createCanvas(img.width, img.height),
            img,
          );

          canvas.toBlob(
            (blob) => {
              if (blob && blob.size > MAX_FILE_SIZE) {
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
                    (resizedBlob) => resolve(resizedBlob!),
                    "image/webp",
                    1.0,
                  );
                } else {
                  throw new Error("Image file size too large");
                }
              } else {
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
          const { width, height } = getScaledDimensions(img.width, img.height);
          const canvas = drawImageToCanvas(
            createCanvas(width, height),
            img,
            width,
            height,
          );

          const compressImage = (quality: number): void => {
            canvas.toBlob(
              (blob) => {
                if (blob && blob.size > MAX_FILE_SIZE && quality > 0.1) {
                  compressImage(quality - 0.05);
                } else {
                  console.log("Final compression quality:", quality);
                  resolve(blob!);
                }
              },
              "image/webp",
              quality,
            );
          };

          compressImage(DEFAULT_QUALITY);
          return;
        }

        // Handle JPEG metadata stripping
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

          resolve(new Blob([result], { type: file.type }));
        };
        reader.readAsArrayBuffer(file);
      });

      const blob = (
        await rpc.call("com.atproto.repo.uploadBlob", { data: fixedImage })
      ).data.blob;
      images.images.push({
        $type: "app.bsky.embed.image",
        aspectRatio,
        alt: "",
        image: blob,
      });
    }
    return images;
  };

  const uploadVideo = async (input: File) =>
    ({
      $type: "app.bsky.embed.video",
      video: (await rpc.call("com.atproto.repo.uploadBlob", { data: input }))
        .data.blob,
    }) as AppBskyEmbedVideo.Main;

  // Post creation
  const createPost = async () => {
    let embed: any;
    if (images.length) embed = await uploadImages(images);
    if (video) embed = await uploadVideo(video);

    const record: AppBskyFeedPost.Record = {
      $type: "app.bsky.feed.post",
      createdAt: new Date().toISOString(),
      text: textbox.textContent,
      reply: replyTo,
      embed: quote
        ? embed
          ? {
              $type: "app.bsky.embed.recordWithMedia",
              media: embed,
              record: { record: { uri: quote.uri, cid: quote.cid } },
            }
          : {
              $type: "app.bsky.embed.record",
              record: { uri: quote.uri, cid: quote.cid },
            }
        : embed,
    };

    await rpc.call("com.atproto.repo.createRecord", {
      data: {
        record,
        collection: "app.bsky.feed.post",
        repo: manager.session.did,
      },
    });

    cleanup(true);
  };

  // Cleanup function
  const cleanup = async (override?: boolean) => {
    if (cleaning) return;
    cleaning = true;

    const hasContent = textbox.textContent || images[0] || video;
    const result =
      !hasContent || override
        ? true
        : await new Promise<boolean>((resolve) => {
            const content = elem("div", {}, null, [
              elem("p", { textContent: "Do you want to discard this draft?" }),
              elem("div", { className: "horizontal-buttons" }, null, [
                elem("button", {
                  textContent: "Cancel",
                  onclick: () => {
                    dialog.close();
                    resolve(false);
                  },
                }),
                elem("button", {
                  textContent: "Discard",
                  onclick: () => {
                    dialog.close();
                    resolve(true);
                  },
                }),
              ]),
            ]);
            const dialog = dialogBox(content);
          });

    if (result) {
      images.forEach((image) => URL.revokeObjectURL(image.objectURL));
      document.body.style.overflow = null;
      background.remove();
    }
    cleaning = false;
    return result;
  };

  // UI Elements
  const postButton = elem("button", {
    textContent: "Post",
    onclick: () => {
      if (textbox.textContent || images.length || video) {
        createPost();
      }
    },
  });

  const cancelButton = elem("button", {
    textContent: "Cancel",
    onclick: () => {
      cleanup();
    },
  });

  const imageButton = elem("button", {
    textContent: "🖼️",
    onclick: () => createFileInput("image", true, handleImageInput).click(),
  });

  const videoButton = elem("button", {
    textContent: "📽️",
    onclick: () =>
      createFileInput("video", false, (files) => (video = files[0])).click(),
  });

  // Compose the UI
  const composer = elem("div", { className: "composer popup" }, null, [
    elem("div", { className: "horizontal-buttons space-between" }, null, [
      cancelButton,
      postButton,
    ]),
    textbox,
    imagePreviewContainer,
    quote &&
      elem("div", { className: "embeds" }, postCard(quote, false, false, true)),
    elem("div", { className: "horizontal-buttons" }, null, [
      imageButton,
      videoButton,
    ]),
  ]);

  // Event handlers
  composer.addEventListener("click", (e) => e.stopPropagation());
  background.append(composer);
  background.onclick = () => cleanup();

  document.addEventListener("keydown", function handler(e) {
    if (e.key === "Escape") {
      if (cleanup()) document.removeEventListener("keydown", handler);
    }
  });

  // Final setup
  document.body.append(background);
  document.body.style.overflow = "hidden";
  textbox.focus();
};
