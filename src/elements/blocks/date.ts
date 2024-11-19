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
