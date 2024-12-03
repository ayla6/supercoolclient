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
export function formatTimeDifference(date1: Date, date2: Date): string {
  const diffInSeconds = Math.abs(date2.getTime() - date1.getTime()) / 1000;

  if (diffInSeconds < 60) {
    return `${Math.round(diffInSeconds)}s`;
  } else if (diffInSeconds < 3600) {
    return `${Math.round(diffInSeconds / 60)}m`;
  } else if (diffInSeconds < 86400) {
    return `${Math.round(diffInSeconds / 3600)}h`;
  } else if (diffInSeconds < 2592000) {
    return `${Math.round(diffInSeconds / 86400)}d`;
  } else if (diffInSeconds < 31536000) {
    return `${Math.round(diffInSeconds / 2592000)}mo`;
  } else {
    return formatDate(date2);
  }
}
