/** @type {import('next').NextConfig} */

const nextConfig = {
  // Removed the invalid allowedDevOrigins option to prevent build crashes

  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'https://secureshare-fsuk.onrender.com';

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
