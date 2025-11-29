// Detect which environment we're in
const isGitHubPages = window.location.hostname.includes('github.io');
const isVercel = window.location.hostname.includes('vercel.app');
const isLocalhost = window.location.hostname === 'localhost';

export const API_URL = isLocalhost
  ? 'http://localhost:3001'  // Local development
  : 'https://pokemon-ebay-tracker.onrender.com';  // Production (works for both GitHub Pages AND Vercel)

console.log('🌍 Environment detected:', {
  isGitHubPages,
  isVercel,
  isLocalhost,
  API_URL
});