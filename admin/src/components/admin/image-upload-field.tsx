"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

import { adminUploadRequest } from "@/lib/admin-api";
import { compressImageFile, resolvePublicAsset } from "@/lib/assets";
import { Button } from "@/components/ui/button";
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
  const [previewVersion, setPreviewVersion] = useState(0);
  const [instantPreview, setInstantPreview] = useState("");

  const remotePreview = value
    ? `${resolvePublicAsset(value)}${previewVersion ? `?v=${previewVersion}` : ""}`
    : "";
  const previewSrc = instantPreview || remotePreview;

  useEffect(() => {
    if (!value) {
      setInstantPreview("");
    }
  }, [value]);

  const upload = async (file: File) => {
    setUploading(true);
    setError("");

    try {
      const dataUrl = await compressImageFile(file);
      setInstantPreview(dataUrl);

      const slug = fileBaseName.trim() || `rasm-${Date.now()}`;

      const response = await adminUploadRequest<{ image: string }>(uploadPath, {
        method: "POST",
        body: JSON.stringify({ slug, dataUrl }),
      });
      onChange(response.image);
      setPreviewVersion(Date.now());
    } catch (uploadError) {
      setInstantPreview("");
      setError(uploadError instanceof Error ? uploadError.message : "Rasm yuklanmadi");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-2">
        <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
          {previewSrc ? (
            <img
              src={previewSrc}
              alt=""
              className="size-full object-cover"
              onLoad={() => {
                if (instantPreview && remotePreview) {
                  setInstantPreview("");
                }
              }}
              onError={() => {
                if (!instantPreview && value) {
                  setError("Rasm preview yuklanmadi");
                }
              }}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-[10px] text-white/35">Rasm</div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
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
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-3.5" />
          {uploading ? "Yuklanmoqda..." : "Yuklash"}
        </Button>
      </div>
      {error ? <p className="text-[11px] text-rose-300">{error}</p> : null}
    </div>
  );
}
