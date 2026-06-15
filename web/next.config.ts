import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  turbopack: {
    root: appDir,
  },
  async rewrites() {
    const api = "http://127.0.0.1:4000";
    return {
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${api}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
