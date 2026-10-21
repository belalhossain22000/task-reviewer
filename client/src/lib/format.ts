// "Rahim Uddin" -> "RU", "madonna" -> "M". Shown in the avatar when there is no photo.
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";

  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// "2 days ago", "yesterday", "in 3 hours". Smallest unit shown is a minute; anything newer
// is "just now".
const relativeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const seconds = (new Date(iso).getTime() - now) / 1000;

  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

// How long until `iso`, for a hold that is about to run out: "28 min left", "under 1 min left",
// or "expired" once it has passed.
export function formatTimeLeft(iso: string, now: number = Date.now()): string {
  const minutes = Math.ceil((new Date(iso).getTime() - now) / 60_000);
  if (minutes <= 0) return "expired";
  if (minutes === 1) return "under 1 min left";
  return `${minutes} min left`;
}

// "Oct 21, 2026, 3:14 PM". The exact time, for a tooltip behind the relative one.
const dateTimeFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

// "https://www.github.com/owner/repo/" -> "github.com/owner/repo". Short enough to read as
// link text; the full address is still what the link points to.
export function displayUrl(url: string): string {
  try {
    const { host, pathname } = new URL(url);
    return `${host.replace(/^www\./, "")}${pathname.replace(/\/+$/, "")}`;
  } catch {
    return url;
  }
}
