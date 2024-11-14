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
const urlRegex =
  /\b((https?:\/\/)?(www\.)?([a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+)(\/[^\s]*)?\b)/g;
const map = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
  "'": "&#39;",
};
export function processText(input: string = ""): string {
  let result = input
    .replaceAll(/[<>&"']/g, (m) => map[m])
    .replaceAll(urlRegex, (match, p1) => {
      const url = p1.startsWith("http") ? p1 : `http://${p1}`;
      return `<a href="${url}">${p1}</a>`;
    })
    .replaceAll(emojiRegex, '<span class="emoji">$1</span>')
    .replaceAll(/`(.*?)`/g, '<span class="mono">$1</span>')
    .replaceAll(/\n/g, "<br/>");
  return result;
}
