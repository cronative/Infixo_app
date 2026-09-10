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
        className={`group relative flex shrink-0 items-center justify-center overflow-hidden border border-[#E7E3DC] bg-[#fbfbfb] shadow-xs transition-colors hover:border-[#151933] ${shape === "circle"
          ? "rounded-full aspect-square overflow-hidden shrink-0"
          : shape === "landscape"
            ? "aspect-video w-44 rounded-xl"
            : "rounded-2xl overflow-hidden"
          } ${className}`}
        style={!isLandscape ? { width: size, height: size } : undefined}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Preview"
            className={`w-full h-full object-cover overflow-hidden ${shape === "circle"
              ? "aspect-square rounded-full"
              : shape === "landscape"
                ? "aspect-video rounded-xl"
                : "rounded-2xl"
              }`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 p-2 text-center text-[#797570]">
            {isLandscape ? (
              <>
                <Film className="h-5 w-5 text-[#151933]" />
                <span className="text-[10px] font-bold text-[#151933] leading-tight">Upload Landscape Poster (16:9)</span>
              </>
            ) : (
              <ImagePlus className="h-6 w-6 text-[#151933]" />
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-all group-hover:opacity-100 cursor-pointer rounded-full"
          aria-label="Upload photo"
        >
          <Camera className="h-5 w-5" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="bg-[#151933]/[0.09] text-[#151933] hover:bg-[#2c1937]/15 text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#151933]/20 transition-colors cursor-pointer"
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
