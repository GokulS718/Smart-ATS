/**
 * Smart ATS Frontend API & AI Service Configuration
 * Automatically switches between local dev and live Render backend
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://smart-ats-backend.onrender.com";
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export default API_BASE_URL;
