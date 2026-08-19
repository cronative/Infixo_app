"use client";

import { useRef } from "react";
import { Camera, ImagePlus, X, Film } from "lucide-react";

interface PhotoUploadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  shape?: "circle" | "rounded" | "landscape";
  size?: number;
  label?: string;
  className?: string;
}

export function PhotoUpload({
  value,
  onChange,
  shape = "circle",
  size = 112,
  label,
  className = "",
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  const isLandscape = shape === "landscape";

  return (
    <div className="flex flex-col items-center sm:items-start gap-2">
      <div
        className={`group relative flex shrink-0 items-center justify-center overflow-hidden border-2 border-dashed border-purple-300/80 bg-purple-50/50 shadow-xs transition-colors hover:border-purple-600 ${
          shape === "circle"
            ? "rounded-full"
            : shape === "landscape"
            ? "w-48 sm:w-56 aspect-[2/1] rounded-2xl"
            : "rounded-2xl"
        } ${className}`}
        style={!isLandscape ? { width: size, height: size } : undefined}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 p-2 text-center text-slate-400">
            {isLandscape ? (
              <>
                <Film className="h-6 w-6 text-purple-600" />
                <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider">Landscape Poster</span>
              </>
            ) : (
              <ImagePlus className="h-6 w-6 text-purple-600" />
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white opacity-0 transition-all group-hover:bg-slate-950/50 group-hover:opacity-100 cursor-pointer"
          aria-label="Upload photo"
        >
          <Camera className="h-5 w-5" />
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80 text-white shadow-md hover:bg-rose-600 transition-colors cursor-pointer"
            aria-label="Remove photo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-xs font-extrabold text-purple-700 hover:text-purple-900 cursor-pointer"
      >
        {label ?? (value ? "Change poster" : "Upload poster preview")}
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
