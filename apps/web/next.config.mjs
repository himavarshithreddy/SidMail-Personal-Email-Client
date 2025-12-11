/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  output: "standalone",   // REQUIRED for Docker standalone build
  reactStrictMode: true
};

export default nextConfig;
