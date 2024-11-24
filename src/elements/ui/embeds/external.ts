import { AppBskyEmbedExternal } from "@atcute/client/lexicons";
import { elem } from "../../blocks/elem";
import { escapeHTML } from "../../blocks/textProcessing";

export function external(embed: AppBskyEmbedExternal.Main, did: string) {
  return elem("a", { href: embed.external.uri, className: "external" }, [
    embed.external.thumb
      ? elem("img", {
          src: `https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${embed.external.thumb.ref.$link}@${embed.external.thumb.mimeType.split("/")[1]}`,
        })
      : "",
    elem("span", {
      innerHTML: escapeHTML(embed.external.title),
      className: "title",
    }),
    elem("span", {
      innerHTML: escapeHTML(embed.external.description),
      className: "description",
    }),
  ]);
}
