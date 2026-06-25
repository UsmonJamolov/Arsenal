import { DIRECT_API_URL } from "@/lib/api";

const WEB_APP_URL = (
  process.env.NEXT_PUBLIC_WEB_URL ||
  process.env.NEXT_PUBLIC_USER_APP_URL ||
  DIRECT_API_URL
).replace(/\/$/, "");

export function resolvePublicAsset(path: string) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Admin preview: rasmlar API server orqali (web/public static)
  const base = DIRECT_API_URL || WEB_APP_URL;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi"));
    image.src = src;
  });
}

export async function compressImageFile(file: File, maxDimension = 1280) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Faqat rasm fayllari qabul qilinadi");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Rasmni qayta ishlab bo'lmadi");
    }

    context.drawImage(image, 0, 0, width, height);

    let quality = 0.88;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);

    while (dataUrl.length > 1_800_000 && quality > 0.45) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export { WEB_APP_URL };
