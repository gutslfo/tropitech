/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // Optimisé pour les environnements Docker
  
  // Configuration proxy pour le développement local
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*` 
          : 'http://localhost:5000/api/:path*',
      },
    ];
  },
  
  // Variables d'environnement publiques
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
  
  // Configuration des images
  images: {
    domains: ['localhost'],
    // Permet d'utiliser des images optimisées dans l'application
    formats: ['image/avif', 'image/webp'],
  },
  
  // Ignorer les erreurs TypeScript lors du build (utile en production)
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;