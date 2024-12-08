import { AppBskyEmbedExternal } from "@atcute/client/lexicons";
import { elem } from "../../utils/elem";
import { loadEmbedGif } from "./gif";
import { cutOutThePath } from "../../utils/link_processing";

export function loadEmbedExternal(embed: AppBskyEmbedExternal.View) {
  const host = cutOutThePath(embed.external.uri);
  if (host === "https://media.tenor.com/") {
    const uri = new URL(embed.external.uri);
    return loadEmbedGif(uri);
  } else {
    const card = elem("a", { href: embed.external.uri, className: "external" });
    if (embed.external.thumb) {
      const image = elem(
        "div",
        { className: "image" },
        elem("img", { src: embed.external.thumb, loading: "lazy" }),
      );
      card.append(image);
    }
    card.append(
      elem("div", { className: "text" }, null, [
        elem("span", {
          textContent: embed.external.title || embed.external.uri,
          className: "title",
        }),
        embed.external.description
          ? elem("span", {
              textContent: embed.external.description,
              className: "description",
            })
          : "",
        elem("span", {
          textContent: host,
          className: "small",
        }),
      ]),
    );
    return [card];
  }
}
