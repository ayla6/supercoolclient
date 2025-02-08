import { Facet, segmentize } from "@atcute/bluesky-richtext-segmenter";
import { elem } from "./elem";

const map: { [key: string]: string } = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};
export const processText = (input: string = ""): string => {
  return input
    .replace(/[<>&]/g, (m) => map[m])
    .replace(
      /([\p{Emoji}\u200d]+|\ud83c[\udde6-\uddff]{2})/gu,
      '<span class="emoji">$1</span>',
    );
};

export const processRichText = (text: string, facets: Facet[]) => {
  const segmentText = segmentize(text, facets);
  const processed = document.createDocumentFragment();
  const len = segmentText.length;
  const createTextNode = document.createTextNode.bind(document);

  for (let i = 0; i < len; i++) {
    const segment = segmentText[i];
    const text = segment.text;
    let result: Node;

    if (!segment.features) {
      result = createTextNode(text);
    } else {
      const feat = segment.features[0]; // Only use first feature
      const type = feat.$type;

      switch (type) {
        case "app.bsky.richtext.facet#tag":
          result = elem("a", {
            href: `/search/#${feat.tag}`,
            textContent: text,
          });
          break;
        case "app.bsky.richtext.facet#link":
          result = elem("a", {
            href: feat.uri,
            target: " ",
            textContent: text,
          });
          break;
        case "app.bsky.richtext.facet#mention":
          result = elem("a", {
            href: `/${feat.did}`,
            textContent: text,
          });
          break;
        default:
          result = createTextNode(text);
      }
    }

    processed.appendChild(result);
  }

  return processed;
};

export const encodeQuery = (query: string) => {
  return encodeURIComponent(query).replace("%20", "+");
};

export const decodeQuery = (query: string) => {
  return decodeURIComponent(query.replace("+", "%20"));
};
