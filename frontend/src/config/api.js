/**
 * Base API URL for Smart ATS backend REST services.
 * Automatically switches between development (.env) and production (.env.production)
 * with a fallback to http://localhost:8080 if VITE_API_URL is undefined.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default API_BASE_URL;
