const fs = require("fs/promises");
const path = require("path");

const WEB_PUBLIC_DIR = path.resolve(__dirname, "../../../web/public");

function sanitizeFileBaseName(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getExtension(mime) {
  if (mime === "image/jpeg" || mime === "image/jpg") return ".jpg";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return ".png";
}

async function savePublicImage({ folder, fileBaseName, dataUrl, maxBytes = 5 * 1024 * 1024 }) {
  const match = String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Noto'g'ri rasm formati");
  }

  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");

  if (!buffer.length) {
    throw new Error("Rasm bo'sh");
  }

  if (buffer.length > maxBytes) {
    throw new Error("Rasm 5MB dan katta");
  }

  const safeName = sanitizeFileBaseName(fileBaseName);
  if (!safeName) {
    throw new Error("Fayl nomi noto'g'ri");
  }

  const ext = getExtension(mime);
  const folderPath = folder.replace(/^\/+|\/+$/g, "");
  const absolutePath = path.join(WEB_PUBLIC_DIR, folderPath, `${safeName}${ext}`);
  const publicPath = `/${folderPath}/${safeName}${ext}`.replace(/\\/g, "/");

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buffer);

  return publicPath;
}

module.exports = { savePublicImage, sanitizeFileBaseName };
