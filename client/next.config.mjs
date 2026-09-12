/** @type {import('next').NextConfig} */

const nextConfig = {
  allowedDevOrigins: ['10.34.167.166'],

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;