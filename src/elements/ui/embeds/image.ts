import { AppBskyEmbedImages } from "@atcute/client/lexicons";
import { elem } from "../../utils/elem";
import { getProperSize } from "../../utils/get_proper_size";
import {
  changeImageFormat,
  parseBlueskyImage,
} from "../../utils/link_processing";
import { popupBox } from "../dialog";
import { createSwipeAction } from "../../utils/swipe_manager";
import { getPdsEndpoint } from "@atcute/client/utils/did";
import { env } from "../../../settings";

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
      target: "_blank",
      onclick: (e) => {
        e.preventDefault();
        let notDefaultFormat = false;
        const img = elem("img", {
          src: changeImageFormat(image.fullsize, env.defaultFullsizeFormat),
        });
        const seeRawButton = elem("button", {
          textContent: "See raw",
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
            seeRawButton.textContent = "Raw";
            pngDefaultButton.textContent = `See ${env.defaultFullsizeFormat}`;
            notDefaultFormat = true;
          },
        });
        const pngDefaultButton = elem("button", {
          textContent: "See as PNG",
          onclick: async (e) => {
            img.src = changeImageFormat(
              image.fullsize,
              notDefaultFormat ? env.defaultFullsizeFormat : "png",
            );
            pngDefaultButton.textContent = `See as ${notDefaultFormat ? "PNG" : env.defaultFullsizeFormat}`;
            seeRawButton.textContent = "See raw";
            notDefaultFormat = !notDefaultFormat;
          },
        });
        const content = elem("div", { className: "image-view" }, undefined, [
          img,
          elem(
            "div",
            {
              className: "ztop see-raw-button",
            },
            undefined,
            [seeRawButton, pngDefaultButton],
          ),
          elem("button", {
            textContent: "×",
            className: "ztop large close-button",
            onclick: () => {
              dialog.cleanup();
            },
          }),
        ]);
        const dialog = popupBox(content);

        createSwipeAction(dialog.element, (pos, e) => {
          if (Math.abs(pos.endY - pos.startY) > 150) {
            dialog.cleanup();
          }
        });
      },
    },
    img,
  );

  imageHolder.style.cssText = getProperSize(image.aspectRatio, isSingleImage);
  if (
    image.aspectRatio &&
    image.aspectRatio.height <= 350 &&
    image.aspectRatio.height > 8
  ) {
    img.src = changeImageFormat(image.fullsize, env.defaultFullsizeFormat);
  } else img.src = changeImageFormat(image.thumb);

  imageHolder.href = changeImageFormat(image.fullsize, "png");
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
