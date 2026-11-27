import type { NextConfig } from "next";
const config: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js"],
  outputFileTracingIncludes: { "/api/card": ["./public/fonts/**/*"] },
};
export default config;
