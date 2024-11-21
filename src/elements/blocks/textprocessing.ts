import { Facet, segmentize } from "@atcute/bluesky-richtext-segmenter";

const emojiRegex = /([\p{Emoji}\u200d]+|\ud83c[\udde6-\uddff]{2})/gu;
const map: { [key: string]: string } = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};
export function escapeHTML(input: string): string {
  return input.replaceAll(/[<>&"']/g, (m) => map[m]);
}
export function processText(input: string = ""): string {
  return input
    .replaceAll(/[<>&]/g, (m) => map[m])
    .replaceAll(emojiRegex, '<span class="emoji">$1</span>')
    .replaceAll(/`(.*?)`/g, "<code>$1</code>")
    .replaceAll(/\n/g, "<br/>");
}
export function processRichText(text: string, facets: Facet[]) {
  let processed: string = "";
  const segmentText = segmentize(text, facets);
  for (const segment of segmentText) {
    const text = processText(segment.text);
    if (segment.features)
      for (const feat of segment.features) {
        switch (feat.$type) {
          case "app.bsky.richtext.facet#tag":
            processed += `<a href="/search/#${escapeHTML(feat.tag)}">${text}</a>`;
            break;
          case "app.bsky.richtext.facet#link":
            processed += `<a href="${escapeHTML(feat.uri)}">${text}</a>`;
            break;
          case "app.bsky.richtext.facet#mention":
            processed += `<a href="/profile/${escapeHTML(feat.did)}">${text}</a>`;
            break;
          default:
            processed += text;
            break;
        }
      }
    else processed += text;
  }
  return processed;
}
