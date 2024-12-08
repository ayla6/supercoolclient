import { Facet, segmentize } from "@atcute/bluesky-richtext-segmenter";
import { elem } from "./elem";

const emojiRegex = /([\p{Emoji}\u200d]+|\ud83c[\udde6-\uddff]{2})/gu;
const map: { [key: string]: string } = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};

export function processText(input: string = ""): string {
  return input
    .replace(/[<>&]/g, (m) => map[m])
    .replace(emojiRegex, '<span class="emoji">$1</span>');
}

export function processRichText(text: string, facets: Facet[]) {
  const segmentText = segmentize(text, facets);
  const length = segmentText.length;
  const processed = document.createDocumentFragment();

  for (let i = 0; i < length; i++) {
    const segment = segmentText[i];
    const text = segment.text;
    let result: string | Node;
    if (segment.features)
      for (const feat of segment.features) {
        const type = feat.$type;
        if (type === "app.bsky.richtext.facet#tag") {
          result = elem("a", { href: `/search/#${feat.tag}` }, text);
        } else if (type === "app.bsky.richtext.facet#link") {
          result = elem("a", { href: feat.uri }, text);
        } else if (type === "app.bsky.richtext.facet#mention") {
          result = elem("a", { href: `/${feat.did}` }, text);
        } else {
          result = text;
        }
      }
    else result = text;
    processed.append(result);
  }
  return processed;
}

export function encodeQuery(query: string) {
  return encodeURIComponent(query).replace("%20", "+");
}

export function decodeQuery(query: string) {
  return decodeURIComponent(query.replace("+", "%20"));
}
