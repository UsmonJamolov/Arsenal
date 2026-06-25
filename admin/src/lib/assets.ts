const WEB_APP_URL = (
  process.env.NEXT_PUBLIC_WEB_URL ||
  process.env.NEXT_PUBLIC_USER_APP_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

export function resolvePublicAsset(path: string) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${WEB_APP_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi"));
    reader.readAsDataURL(file);
  });
}

export { WEB_APP_URL };
