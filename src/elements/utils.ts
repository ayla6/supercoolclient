import { Facet, segmentize } from "@atcute/bluesky-richtext-segmenter";

const dateOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hour12: false,
};
export function formatDate(date: Date) {
  return date.toLocaleString(undefined, dateOptions);
}

const emojiRegex = /([\p{Emoji}\u200d]+|\ud83c[\udde6-\uddff]{2})/gu;
const map = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
};
export function escapeHTML(input: string): string {
  return input.replaceAll(/[<>&"']/g, (m) => map[m]);
}
export function processText(input: string = ""): string {
  return input
    .replaceAll(/[<>&]/g, (m) => map[m])
    .replaceAll(emojiRegex, '<span class="emoji">$1</span>')
    .replaceAll(/`(.*?)`/g, '<span class="mono">$1</span>')
    .replaceAll(/\n/g, "<br/>");
}

export function elem<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  params: Partial<HTMLElementTagNameMap[K]> = {},
  children?: (Node | Text)[],
) {
  const e = document.createElement(tag);
  Object.assign(e, params);
  if (children) {
    e.append(...children);
  }
  return e;
}

export function idchoose(profile: { did: string; handle: string }) {
  return profile.handle === "handle.invalid" ? profile.did : profile.handle;
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
