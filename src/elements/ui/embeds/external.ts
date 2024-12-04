import { AppBskyEmbedExternal } from "@atcute/client/lexicons";
import { elem } from "../../blocks/elem";
import { escapeHTML } from "../../blocks/text_processing";

export function loadEmbedExternal(
  embed: AppBskyEmbedExternal.Main,
  did: string,
) {
  const url = new URL(embed.external.uri);
  if (url.hostname === "media.tenor.com") {
    const urlParams = new URLSearchParams(url.search);
    const width = Number(urlParams.get("ww"));
    const height = Number(urlParams.get("hh"));
    const splitPathname = url.pathname.split("/");
    const newURL = `https://t.gifs.bsky.app/${splitPathname[1].slice(0, -2)}P3/${splitPathname[2]}`;
    return elem("video", {
      src: newURL,
      autoplay: true,
      loop: true,
      muted: true,
      width,
      height,
    });
  } else {
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
      elem("span", {
        innerHTML: escapeHTML(new URL(embed.external.uri).host),
        className: "small",
      }),
    ]);
  }
}
