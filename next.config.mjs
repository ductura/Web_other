import { BASE_PATH } from "./src/lib/putanje.js";

const nextConfig = {
  basePath: BASE_PATH,
  poweredByHeader: false,
  reactStrictMode: true,
  // `pnpm dev` may be opened as localhost (edge on :8000) or 127.0.0.1:5173.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
