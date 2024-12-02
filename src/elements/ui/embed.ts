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

type Embed = Brand.Union<
  | AppBskyEmbedExternal.Main
  | AppBskyEmbedImages.Main
  | AppBskyEmbedRecord.Main
  | AppBskyEmbedRecordWithMedia.Main
  | AppBskyEmbedVideo.Main
>;

export function loadEmbed(embed: Embed, did: string): Node[] {
  let embeds = [];
  const embedHandlers = {
    "app.bsky.embed.recordWithMedia": (embed: any, did: string) => {
      return [
        ...loadEmbed(embed.media, did),
        ...loadEmbed({ ...embed.record, $type: "app.bsky.embed.record" }, did),
      ];
    },
    "app.bsky.embed.images": (embed: any, did: string) => [
      elem("div", { className: "images" }, loadImages(embed.images, did)),
    ],
    "app.bsky.embed.record": (embed: any, did: string) => {
      const uri = embed.record.uri.split("/");
      return [
        elem("a", {
          href: `/${uri[2]}/post/${uri[4]}`,
          innerHTML: escapeHTML(embed.record.uri),
          className: "record-link",
        }),
      ];
    },
    "app.bsky.embed.external": (embed: any, did: string) => {
      const url = new URL(embed.external.uri);
      if (url.hostname === "media.tenor.com") {
        const urlParams = new URLSearchParams(url.search);
        const width = Number(urlParams.get("ww"));
        const height = Number(urlParams.get("hh"));
        const splitPathname = url.pathname.split("/");
        const newURL = `https://t.gifs.bsky.app/${splitPathname[1].slice(0, -2)}P3/${splitPathname[2]}`;
        return [
          elem("video", {
            src: newURL,
            autoplay: true,
            loop: true,
            muted: true,
            width,
            height,
          }),
        ];
      }
      return [external(embed, did)];
    },
    "app.bsky.embed.video": (embed: any) => {
      console.log(embed.video);
      return [];
    },
  };
  embeds.push(...(embedHandlers[embed.$type]?.(embed, did) || []));
  return embeds;
}
