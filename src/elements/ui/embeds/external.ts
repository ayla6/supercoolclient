import { AppBskyEmbedExternal } from "@atcute/client/lexicons";
import { elem } from "../../utils/elem";
import { loadEmbedGif } from "./gif";
import { changeImageFormat, cutOutThePath } from "../../utils/link_processing";

const widescreenThumbs = ["www.youtube.com", "music.youtube.com"];
export const loadEmbedExternal = (embed: AppBskyEmbedExternal.View) => {
  const host = cutOutThePath(embed.external.uri);
  if (host === "media.tenor.com") {
    const uri = new URL(embed.external.uri);
    return loadEmbedGif(uri);
  } else {
    const card = elem("a", {
      href: embed.external.uri,
      className: "external",
      target: "_blank",
    });
    if (embed.external.thumb) {
      const image = elem(
        "div",
        { className: "image" },
        elem("img", {
          src: changeImageFormat(embed.external.thumb),
          loading: "lazy",
        }),
      );
      if (widescreenThumbs.includes(host)) {
        card.classList.add("widescreen");
      }
      card.appendChild(image);
    }
    card.appendChild(
      elem("div", { className: "text" }, undefined, [
        elem("span", {
          textContent: embed.external.title || embed.external.uri,
          className: "title",
        }),
        embed.external.description
          ? elem("span", {
              textContent: embed.external.description,
              className: "description",
            })
          : null,
        elem("span", {
          textContent: host,
          className: "small",
        }),
      ]),
    );
    return card;
  }
};
