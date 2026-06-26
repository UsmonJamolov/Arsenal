import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

function dataUrlToFile(dataUrl: string, fileName: string) {
  const match = String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Noto'g'ri rasm formati");
  }

  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length) {
    throw new Error("Rasm bo'sh");
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "product";
  const extension = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";

  return new File([buffer], `${safeName}.${extension}`, { type: mime });
}

export async function POST(request: Request) {
  try {
    const { dataUrl, fileName } = (await request.json()) as { dataUrl?: string; fileName?: string };

    if (!dataUrl) {
      return NextResponse.json({ message: "Rasm topilmadi" }, { status: 400 });
    }

    const file = dataUrlToFile(dataUrl, String(fileName || "product").trim());
    const result = await utapi.uploadFiles(file);

    if (result.error) {
      return NextResponse.json(
        { message: result.error.message || "UploadThing xatosi" },
        { status: 500 },
      );
    }

    const uploaded = result.data;
    const url = uploaded?.ufsUrl ?? uploaded?.url;

    if (!url) {
      return NextResponse.json({ message: "Rasm manzili qaytmadi" }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rasm yuklanmadi";
    return NextResponse.json({ message }, { status: 500 });
  }
}
