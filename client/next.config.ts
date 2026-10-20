import type { NextConfig } from "next";

// Where the Express API lives. Server-side only (no NEXT_PUBLIC_ prefix): the browser never
// sees it, it only talks to this Next.js app. Needs to be set at build / start time.
const API_URL = (process.env.API_URL ?? "http://localhost:5000/api/v1").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // create-next-app turned on `cacheComponents` / `partialPrefetching`. We don't use them:
  // every piece of data in this app is fetched in the browser through RTK Query, so there is
  // nothing for Next.js to cache on the server. They also reject Redux Toolkit's
  // configureStore (it calls Math.random() while the page is prerendered).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // The browser calls /api/... on THIS origin and Next forwards it to Express. This is a plain
  // forward, not backend code. Because the response comes back through this origin, the login
  // cookie belongs to this origin too, which is what lets proxy.ts read it on every page.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/:path*` }];
  },
};

export default nextConfig;
