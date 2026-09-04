"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_MB = 8;

interface ImageUploaderProps {
  bucket: "waste-images" | "task-images" | "avatars";
  onUploaded: (url: string, base64: string, mimeType: string) => void;
  label?: string;
}

export function ImageUploader({ bucket, onUploaded, label = "Upload a photo" }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, or WEBP images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);

      const base64 = await fileToBase64(file);
      setPreview(publicUrlData.publicUrl);
      onUploaded(publicUrlData.publicUrl, base64, file.type);
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] ?? "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40",
          preview && "border-brand-400 bg-brand-50/40"
        )}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="max-h-56 rounded-xl object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
              }}
              className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow-soft"
            >
              <X className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        ) : uploading ? (
          <>
            <UploadCloud className="mb-2 h-8 w-8 animate-bounce text-brand-500" />
            <p className="text-sm font-medium text-slate-600">Uploading...</p>
          </>
        ) : (
          <>
            <ImageIcon className="mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">{label}</p>
            <p className="mt-1 text-xs text-slate-400">JPG, PNG, or WEBP — up to {MAX_SIZE_MB}MB</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
