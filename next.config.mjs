import { BASE_PATH } from "./src/lib/putanje.js";

const nextConfig = {
  basePath: BASE_PATH,
  poweredByHeader: false,
  reactStrictMode: true,
  // `pnpm dev` may be opened as localhost (edge on :8000) or 127.0.0.1:5173.
  allowedDevOrigins: ["127.0.0.1"],
  // Earlier links were /#/doc/<id> at the root. When this app answers "/"
  // (alone, e.g. on Vercel), send it to /o/; the browser keeps the fragment and
  // StaraPoveznica opens the document. Behind the edge "/" is the Preloader.
  async redirects() {
    return [{ source: "/", destination: `${BASE_PATH}/`, basePath: false, permanent: false }];
  },
};

export default nextConfig;
