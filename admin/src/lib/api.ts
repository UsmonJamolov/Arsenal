const DIRECT_API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

// Admin brauzerida Next.js rewrite o'rniga to'g'ridan-to'g'ri API — proxy compile paytida osilib qolmasin.
const API_URL = typeof window !== "undefined" ? DIRECT_API_URL : DIRECT_API_URL;
const UPLOAD_API_URL = DIRECT_API_URL;

export { API_URL, UPLOAD_API_URL, DIRECT_API_URL };
