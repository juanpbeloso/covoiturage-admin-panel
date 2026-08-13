/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone", // facilita el build para Docker
};

module.exports = nextConfig;
