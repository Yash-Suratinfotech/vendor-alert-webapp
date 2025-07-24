export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return "just now";
  }

  // Less than an hour
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1
      ? "1 minute ago"
      : `${diffInMinutes} minutes ago`;
  }

  // Less than a day
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
  }

  // Less than a month
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
  }

  // Less than a year
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
  }

  // More than a year
  const diffInYears = Math.floor(diffInMonths / 12);
  return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
};

export const formatMonthDate = (timestamp) => {
  if (!timestamp) return " - / - / - ";
  const date = new Date(timestamp);

  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return formatted;
};

export const defaultFormatDate = (timestamp) => {
  if (!timestamp) return "-";
  return new Date(timestamp)
    .toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "-"); // "04-22-2025"
};

export const defaultMessageTime = (timestamp) => {
  if (!timestamp) return "-";
  return new Date(timestamp)
    .toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }); // "2:26 PM"
};

export default {
  formatTimeAgo,
  formatMonthDate,
  defaultMessageTime
};
