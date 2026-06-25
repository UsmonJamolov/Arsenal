"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

import { adminRequest } from "@/lib/admin-api";
import { readFileAsDataUrl, resolvePublicAsset } from "@/lib/assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ImageUploadFieldProps = {
  value: string;
  fileBaseName: string;
  uploadPath: "/api/admin/media/hookah-flavor" | "/api/admin/media/table-image";
  onChange: (path: string) => void;
  className?: string;
};

export function ImageUploadField({
  value,
  fileBaseName,
  uploadPath,
  onChange,
  className,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    if (!fileBaseName.trim()) {
      setError("Avval slug yoki nom kiriting");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const response = await adminRequest<{ image: string }>(uploadPath, {
        method: "POST",
        body: JSON.stringify({ slug: fileBaseName.trim(), dataUrl }),
      });
      onChange(response.image);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Rasm yuklanmadi");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
          {value ? (
            <img src={resolvePublicAsset(value)} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-[10px] text-white/35">Rasm</div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void upload(file);
            }
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={uploading || !fileBaseName.trim()}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-3.5" />
          {uploading ? "Yuklanmoqda..." : "Yuklash"}
        </Button>
      </div>
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="/hookah/flavors/..." />
      {error ? <p className="text-[11px] text-rose-300">{error}</p> : null}
    </div>
  );
}
