import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // This app resolves dependencies from the workspace root (parent folder).
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
