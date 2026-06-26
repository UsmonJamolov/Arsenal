"use client";

import { Camera, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

import { adminUploadRequest } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { compressImageFile, resolvePublicAsset } from "@/lib/assets";
import { cn } from "@/lib/utils";

type ProductImageUploadProps = {
  value: string;
  fileName?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
};

function slugifyFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function ProductImageUpload({ value, fileName, onChange, disabled }: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewSrc = resolvePublicAsset(value);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Faqat rasm faylini tanlang");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const dataUrl = await compressImageFile(file);
      const slug =
        slugifyFileName(fileName ?? "") ||
        slugifyFileName(file.name.replace(/\.[^.]+$/, "")) ||
        "tovar";

      const response = await adminUploadRequest<{ image: string }>("/api/admin/media/product-image", {
        method: "POST",
        body: JSON.stringify({ slug, dataUrl }),
      });

      if (!response.image) {
        throw new Error("Rasm yuklanmadi");
      }

      onChange(response.image);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Rasm yuklanmadi");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || uploading}
        onChange={handleFileChange}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-brand-gold/25 bg-arena-overlay/40">
          <img src={previewSrc} alt="" className="h-40 w-full object-cover" />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute right-2 top-2"
            disabled={disabled || uploading}
            onClick={() => onChange("")}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-brand-gold/30 bg-arena-overlay/30 px-4 py-6 text-center transition hover:border-brand-cyan/50 hover:bg-arena-overlay/50",
            (disabled || uploading) && "cursor-not-allowed opacity-60",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="size-8 animate-spin text-brand-cyan" />
              <span className="text-sm text-text-muted">Rasm yuklanmoqda...</span>
            </>
          ) : (
            <>
              <Camera className="size-8 text-brand-gold" />
              <span className="text-sm font-medium text-text-primary">Rasm qo&apos;shish</span>
              <span className="text-xs text-text-muted">Telefondan suratga olish yoki galereyadan tanlash</span>
            </>
          )}
        </button>
      )}

      {value ? (
        <Button type="button" variant="secondary" size="sm" disabled={disabled || uploading} onClick={() => inputRef.current?.click()}>
          Boshqa rasm tanlash
        </Button>
      ) : null}

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
