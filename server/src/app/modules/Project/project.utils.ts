const REPO_HOSTS = ["github.com", "gitlab.com", "bitbucket.org"];
const REPO_SEGMENT = /^[A-Za-z0-9._-]+$/;
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
const PRIVATE_SUFFIXES = [".localhost", ".local", ".internal", ".lan"];

const parseUrl = (value: string, protocols: string[]): URL | null => {
  try {
    const url = new URL(value.trim());
    if (!protocols.includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
};

const stripWww = (host: string) => host.replace(/^www\./, "");
const stripTrailingSlashes = (path: string) => path.replace(/\/+$/, "");

/**
 * Turns a repo URL into the key used for duplicate detection, or `null` if it is not
 * a valid `https://{github.com|gitlab.com|bitbucket.org}/{owner}/{repo}` URL.
 *
 *   https://GitHub.com/Belal/My-App/            -> github.com/belal/my-app
 *   https://www.github.com/belal/my-app.git     -> github.com/belal/my-app
 *   https://github.com/belal/my-app?tab=readme  -> github.com/belal/my-app
 */
export const normalizeRepoUrl = (value: string): string | null => {
  const url = parseUrl(value, ["https:"]);
  if (!url) return null;

  const host = stripWww(url.hostname);
  if (!REPO_HOSTS.includes(host)) return null;

  const path = stripTrailingSlashes(url.pathname).replace(/\.git$/, "");
  const segments = path.split("/").slice(1); // path starts with "/"

  const isValid =
    segments.length === 2 &&
    segments.every((s) => REPO_SEGMENT.test(s) && !/^\.+$/.test(s));
  if (!isValid) return null;

  return `${host}/${segments.join("/")}`.toLowerCase();
};

// A live link has to be reachable by anyone: a real domain, not localhost or an IP address.
const isPublicDomain = (host: string): boolean => {
  if (!host.includes(".")) return false;
  if (host === "localhost" || PRIVATE_SUFFIXES.some((s) => host.endsWith(s))) return false;
  if (IPV4.test(host) || host.startsWith("[")) return false; // IPv4 / IPv6 literal
  return true;
};

/**
 * Turns a live link into its duplicate-detection key, or `null` if it is not a
 * public http(s) URL. http and https of the same site give the same key.
 *
 *   https://My-App.vercel.app/   -> my-app.vercel.app
 *   http://www.my-app.com/a/?x=1 -> my-app.com/a
 */
export const normalizeLiveUrl = (value: string): string | null => {
  const url = parseUrl(value, ["http:", "https:"]);
  if (!url) return null;

  const host = stripWww(url.hostname);
  if (!isPublicDomain(host)) return null;

  const port = url.port ? `:${url.port}` : "";
  return `${host}${port}${stripTrailingSlashes(url.pathname)}`.toLowerCase();
};
