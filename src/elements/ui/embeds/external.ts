import { AppBskyEmbedExternal } from "@atcute/client/lexicons";
import { elem } from "../../blocks/elem";
import { escapeHTML } from "../../blocks/text_processing";
import { getProperSize } from "../../blocks/get_proper_size";

function gifClick(e: MouseEvent) {
  //i saw this on aglais but like this is  basically the only option right
  const gif = e.currentTarget as HTMLVideoElement;

  e.preventDefault();

  if (gif.paused) {
    gif.play();
  } else {
    gif.pause();
  }
}

export function loadEmbedExternal(
  embed: AppBskyEmbedExternal.Main,
  viewEmbed: AppBskyEmbedExternal.View,
  did: string,
) {
  const url = new URL(embed.external.uri);
  if (url.hostname === "media.tenor.com") {
    const urlParams = new URLSearchParams(url.search);
    const aspectRatio = {
      width: Number(urlParams.get("ww") ?? 1600),
      height: Number(urlParams.get("hh") ?? 900),
    };
    const splitPathname = url.pathname.split("/");
    const newURL = `https://t.gifs.bsky.app/${splitPathname[1].slice(0, -2)}P3/${splitPathname[2]}`;
    const gif = elem("video", {
      src: newURL,
      autoplay: true,
      loop: true,
      muted: true,
    });
    gif.style.cssText = getProperSize(aspectRatio, true);
    gif.addEventListener("click", gifClick);
    return [elem("div", { className: "media-container" }, [gif])];
  } else {
    const card = elem("a", { href: embed.external.uri, className: "external" });
    if (viewEmbed.external.thumb)
      card.append(
        elem("div", { className: "image" }, [
          elem("img", { src: viewEmbed.external.thumb }),
        ]),
      );
    card.append(
      elem("div", { className: "text" }, [
        elem("span", {
          innerHTML: escapeHTML(embed.external.title || embed.external.uri),
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
      ]),
    );
    return [card];
  }
}
