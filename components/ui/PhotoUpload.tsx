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
  size = 80,
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
        className={`group relative flex shrink-0 items-center justify-center overflow-hidden border border-[#E5E7EB] bg-slate-50 shadow-xs transition-colors hover:border-[#803D63] ${
          shape === "circle"
            ? "w-20 h-20 rounded-full aspect-square overflow-hidden shrink-0"
            : shape === "landscape"
            ? "aspect-video w-44 rounded-xl"
            : "w-20 h-20 rounded-2xl overflow-hidden"
        } ${className}`}
        style={!isLandscape && shape !== "circle" ? { width: size, height: size } : undefined}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Preview" className="w-full h-full object-cover aspect-square rounded-full overflow-hidden" />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 p-2 text-center text-slate-400">
            {isLandscape ? (
              <>
                <Film className="h-5 w-5 text-[#803D63]" />
                <span className="text-[10px] font-bold text-[#803D63] leading-tight">Upload Landscape Poster (16:9)</span>
              </>
            ) : (
              <ImagePlus className="h-6 w-6 text-[#803D63]" />
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center bg-slate-950/40 text-white opacity-0 transition-all group-hover:opacity-100 cursor-pointer rounded-full"
          aria-label="Upload photo"
        >
          <Camera className="h-5 w-5" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="bg-[#F6EBF1] text-[#803D63] hover:bg-[#E8DCE4] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E8DCE4] transition-colors cursor-pointer"
      >
        {label ?? (value ? (isLandscape ? "Change poster" : "Change Profile Photo") : (isLandscape ? "Upload poster preview" : "Upload Profile Photo"))}
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
