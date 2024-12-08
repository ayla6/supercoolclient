import { Facet, segmentize } from "@atcute/bluesky-richtext-segmenter";

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
    .replace(emojiRegex, '<span class="emoji">$1</span>')
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

export function processRichText(text: string, facets: Facet[]) {
  let processed: string = "";
  const segmentText = segmentize(text, facets);
  for (const segment of segmentText) {
    const text = processText(segment.text);
    if (segment.features)
      for (const feat of segment.features) {
        const type = feat.$type;
        if (type === "app.bsky.richtext.facet#tag") {
          processed += `<a href="/search/#${escapeHTML(feat.tag)}">${text}</a>`;
        } else if (type === "app.bsky.richtext.facet#link") {
          processed += `<a href="${escapeHTML(feat.uri)}">${text}</a>`;
        } else if (type === "app.bsky.richtext.facet#mention") {
          processed += `<a href="/${escapeHTML(feat.did)}">${text}</a>`;
        } else {
          processed += text;
        }
      }
    else processed += text;
  }
  return processed;
}

export function encodeQuery(query: string) {
  return encodeURIComponent(query).replace("%20", "+");
}

export function decodeQuery(query: string) {
  return decodeURIComponent(query.replace("+", "%20"));
}
