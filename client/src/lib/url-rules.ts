// Client-side copies of the URL rules the API enforces (server/src/app/modules/Project/
// project.utils.ts). They exist only to give instant feedback in the form; the API stays the
// source of truth and re-checks everything. If the rules change there, change them here too.

const REPO_HOSTS = ["github.com", "gitlab.com", "bitbucket.org"];
const REPO_SEGMENT = /^[A-Za-z0-9._-]+$/;
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
const PRIVATE_SUFFIXES = [".localhost", ".local", ".internal", ".lan"];

function parseUrl(value: string, protocols: string[]): URL | null {
  try {
    const url = new URL(value.trim());
    if (!protocols.includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

const stripWww = (host: string) => host.replace(/^www\./, "");
const stripTrailingSlashes = (path: string) => path.replace(/\/+$/, "");

// https://{github.com|gitlab.com|bitbucket.org}/{owner}/{repo}
export function isValidRepoUrl(value: string): boolean {
  const url = parseUrl(value, ["https:"]);
  if (!url) return false;
  if (!REPO_HOSTS.includes(stripWww(url.hostname))) return false;

  const path = stripTrailingSlashes(url.pathname).replace(/\.git$/, "");
  const segments = path.split("/").slice(1); // the path starts with "/"

  return (
    segments.length === 2 &&
    segments.every((s) => REPO_SEGMENT.test(s) && !/^\.+$/.test(s))
  );
}

// A public http(s) address: a real domain, not localhost or an IP address.
export function isValidLiveUrl(value: string): boolean {
  const url = parseUrl(value, ["http:", "https:"]);
  if (!url) return false;

  const host = stripWww(url.hostname);
  if (!host.includes(".")) return false;
  if (host === "localhost" || PRIVATE_SUFFIXES.some((s) => host.endsWith(s))) return false;
  if (IPV4.test(host) || host.startsWith("[")) return false; // IPv4 / IPv6 literal

  return true;
}
