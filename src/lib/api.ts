const envUrl = import.meta.env.VITE_API_BASE_URL;

if (!import.meta.env.DEV && !envUrl) {
  throw new Error(
    'VITE_API_BASE_URL is required in production. Set it to the URL of your post-for-me backend (e.g. https://your-app.ondigitalocean.app).'
  );
}

export const API_BASE_URL = envUrl || 'http://localhost:3001';
