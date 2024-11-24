import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  Brand,
} from "@atcute/client/lexicons";
import { image, loadImages } from "./embeds/image";
import { post } from "./card";
import { elem } from "../blocks/elem";
import { escapeHTML } from "../blocks/textProcessing";
import { external } from "./embeds/external";
import { getProperSize } from "../blocks/sizing";

export function load(
  embed: Brand.Union<
    | AppBskyEmbedExternal.Main
    | AppBskyEmbedImages.Main
    | AppBskyEmbedRecord.Main
    | AppBskyEmbedRecordWithMedia.Main
    | AppBskyEmbedVideo.Main
  >,
  did: string,
): Node[] {
  let embeds = [];
  switch (embed.$type) {
    case "app.bsky.embed.recordWithMedia":
      {
        embeds.push(...load(embed.media, did));
        const uri = embed.record.record.uri.split("/");
        embeds.push(
          elem("a", {
            href: `/${uri[2]}/post/${uri[4]}`,
            innerHTML: escapeHTML(embed.record.record.uri),
          }),
        );
      }
      break;
    case "app.bsky.embed.images":
      embeds.push(...loadImages(embed.images, did));
      break;
    case "app.bsky.embed.record":
      {
        const uri = embed.record.uri.split("/");
        embeds.push(
          elem("a", {
            href: `/${uri[2]}/post/${uri[4]}`,
            innerHTML: escapeHTML(embed.record.uri),
          }),
        );
      }
      break;
    case "app.bsky.embed.external":
      const url = new URL(embed.external.uri);
      if (url.hostname === "media.tenor.com") {
        const urlParams = new URLSearchParams(url.search);
        const { width, height } = getProperSize({
          width: Number(urlParams.get("ww")),
          height: Number(urlParams.get("hh")),
        });
        const splitPathname = url.pathname.split("/");
        const newURL = `https://t.gifs.bsky.app/${splitPathname[1].slice(0, -2)}P3/${splitPathname[2]}`;
        embeds.push(
          elem("video", {
            src: newURL,
            autoplay: true,
            loop: true,
            muted: true,
            width,
            height,
          }),
        );
      } else embeds.push(external(embed, did));
      break;
    case "app.bsky.embed.video":
      console.log(embed.video);
      break;
    default:
      break;
  }
  return embeds;
}
