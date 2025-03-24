// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/ticket/:path*",
        destination: "http://localhost:5000/api/ticket/:path*", 
      },
    ];
  },
};

module.exports = nextConfig;
