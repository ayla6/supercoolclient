import {
  AppBskyEmbedImages,
  ComAtprotoSyncGetBlob,
} from "@atcute/client/lexicons";
import { elem } from "../../utils/elem";
import { getProperSize } from "../../utils/get_proper_size";
import {
  changeImageFormat,
  parseBlueskyImage,
} from "../../utils/link_processing";
import { dialogBox } from "../dialog";
import { createSwipeAction } from "../../utils/swipe_manager";
import { getPdsEndpoint } from "@atcute/client/utils/did";

const loadImage = (
  image: AppBskyEmbedImages.ViewImage,
  isSingleImage: boolean,
) => {
  const img = elem("img", {
    title: image.alt,
    alt: image.alt,
    loading: "lazy",
  });
  const imageHolder = elem(
    "a",
    {
      className: "image",
      target: " ",
      onclick: (e) => {
        e.preventDefault();
        const img = elem("img", { src: image.fullsize });
        const content = elem("div", { className: "image-view" }, undefined, [
          img,
          elem("button", {
            textContent: "See raw",
            className: "see-raw-button",
            onclick: async (e) => {
              const { cid, did } = parseBlueskyImage(image.fullsize);
              const pds = getPdsEndpoint(
                await (
                  await fetch(
                    did.startsWith("did:web")
                      ? `https://${did.split(":")[2]}/.well-known/did.json`
                      : "https://plc.directory/" + did,
                  )
                ).json(),
              );
              img.src = `${pds}/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}`;
              (e.target as HTMLButtonElement).textContent = "Raw";
              (e.target as HTMLButtonElement).onclick = null;
            },
          }),
          elem("button", {
            textContent: "×",
            className: "large close-button",
            onclick: () => {
              dialog.cleanup();
            },
          }),
        ]);
        const dialog = dialogBox(content);

        createSwipeAction(dialog.element, (pos) => {
          if (Math.abs(pos.endY - pos.startY) > 150) {
            dialog.cleanup();
          }
        });
      },
    },
    img,
  );

  const fullsize = image.fullsize;

  imageHolder.style.cssText = getProperSize(image.aspectRatio, isSingleImage);
  if (image.aspectRatio && image.aspectRatio.height <= 350) {
    img.src = fullsize;
  } else img.src = changeImageFormat(image.thumb);

  imageHolder.href = fullsize;
  return imageHolder;
};

export const loadEmbedImages = (embed: AppBskyEmbedImages.View) => {
  const isSingleImage = embed.images.length === 1;
  const mediaContainer = elem("div", {
    className: "media-container" + (embed.images.length === 1 ? "" : " multi"),
  });
  embed.images.forEach((img) =>
    mediaContainer.appendChild(loadImage(img, isSingleImage)),
  );
  return mediaContainer;
};
