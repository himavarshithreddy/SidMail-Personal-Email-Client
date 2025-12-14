/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  output: "standalone",   // REQUIRED for Docker standalone build
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.56.1"],
};

export default nextConfig;
