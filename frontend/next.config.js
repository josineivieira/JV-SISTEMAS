/** @type {import('next').NextConfig} */
function normalizeApiUrl(value) {
  const fallback = 'http://localhost:5000/api'
  const url = (value || fallback).replace(/\/$/, '')
  return url.endsWith('/api') ? url : `${url}/api`
}

const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL || process.env.API_URL)

const nextConfig = {
  output: 'standalone',
  env: {
    API_URL: apiUrl,
    NEXT_PUBLIC_API_URL: apiUrl,
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
