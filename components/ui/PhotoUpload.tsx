"use client";

import { useRef } from "react";
import { Camera, ImagePlus, X } from "lucide-react";

interface PhotoUploadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  shape?: "circle" | "rounded";
  size?: number;
  label?: string;
}

export function PhotoUpload({ value, onChange, shape = "circle", size = 112, label }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`group relative flex shrink-0 items-center justify-center overflow-hidden border-2 border-dashed border-inflixo-purple/25 bg-inflixo-lavender/50 shadow-[var(--shadow-soft)] transition-colors hover:border-inflixo-purple/60 ${
          shape === "circle" ? "rounded-full" : "rounded-2xl"
        }`}
        style={{ width: size, height: size }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-6 w-6 text-muted" />
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center bg-inflixo-navy/0 text-white opacity-0 transition-all group-hover:bg-inflixo-navy/40 group-hover:opacity-100"
          aria-label="Upload photo"
        >
          <Camera className="h-5 w-5" />
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-inflixo-navy shadow-sm"
            aria-label="Remove photo"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-xs font-semibold text-inflixo-purple hover:text-inflixo-purple-dark"
      >
        {label ?? (value ? "Change photo" : "Upload photo")}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
