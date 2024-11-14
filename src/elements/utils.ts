const dateOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
};
export function formatDate(date: Date) {
  return date.toLocaleString("sv-SE", dateOptions);
}

const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
const map = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
  "'": "&#39;",
};
export function escapeHTML(input: string): string {
  return input.replaceAll(/[<>&"']/g, (m) => map[m]);
}
export function processText(input: string = ""): string {
  return input
    .replaceAll(/[<>&"']/g, (m) => map[m])
    .replaceAll(emojiRegex, '<span class="emoji">$1</span>')
    .replaceAll(/`(.*?)`/g, '<span class="mono">$1</span>')
    .replaceAll(/\n/g, "<br/>");
}
