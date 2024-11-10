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

export const urlEquivalents = {
  undefined: "posts_no_replies",
  "": "posts_no_replies",
  media: "posts_with_media",
  replies: "posts_with_replies",
  likes: "likes",
};
