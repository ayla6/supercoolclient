import {
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
  AppBskyFeedPost,
} from "@atcute/client/lexicons";
import { manager, rpc, sessionData } from "../../login";
import { elem } from "../utils/elem";
import { postCard } from "./post_card";
import { dialogBox } from "./dialog";
import { uploadImages } from "./composer-embeds/image";
import { uploadVideo } from "./composer-embeds/video";

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
  let language: string = "en";

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
            className: "close-button",
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
            const content = elem("div", { className: "popup" }, null, [
              elem("p", { textContent: "Do you want to discard this draft?" }),
              elem("div", { className: "horizontal-buttons" }, null, [
                elem("button", {
                  textContent: "Cancel",
                  onclick: () => {
                    dialog.cleanup(false);
                  },
                }),
                elem("button", {
                  textContent: "Discard",
                  onclick: () => {
                    dialog.cleanup(true);
                  },
                }),
              ]),
            ]);
            const dialog = dialogBox(content, (close = false) =>
              resolve(close),
            );
          });
    console.log(result);
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
  const composer = elem("div", { className: "composer" }, null, [
    elem("div", { className: "text-area" }, undefined, [
      elem(
        "div",
        { className: "avatar-area" },
        elem("img", { src: sessionData.avatar }),
      ),
      textbox,
    ]),
    imagePreviewContainer,
    quote &&
      elem("div", { className: "embeds" }, postCard(quote, false, false, true)),
    elem("div", { className: "horizontal-buttons" }, null, [
      imageButton,
      //videoButton,
    ]),
    elem("div", { className: "horizontal-buttons space-between" }, null, [
      cancelButton,
      postButton,
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
