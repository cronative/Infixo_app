"use client";

import React, { useRef, useState } from "react";
import { ImagePlus, Camera, Trash2, MoveVertical, AlertCircle } from "lucide-react";
import { resizeImageToDataUrl } from "@/lib/imageResize";

export interface SeriesCoverUploadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  maxSizeMB?: number;
  className?: string;
  label?: string;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export function SeriesCoverUpload({
  value,
  onChange,
  maxSizeMB = 5,
  className = "",
  label = "Series Cover",
}: SeriesCoverUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPortraitWarning, setIsPortraitWarning] = useState(false);
  const [position, setPosition] = useState<"center" | "top" | "bottom">("center");

  const validateAndProcessFile = (file?: File) => {
    setErrorMessage(null);
    setIsPortraitWarning(false);
    if (!file) return;

    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const isValidType =
      ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) ||
      ALLOWED_EXTENSIONS.includes(extension);

    if (!isValidType) {
      setErrorMessage("Unsupported file format. Please upload a JPG, PNG, or WebP image.");
      return;
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage(`File size exceeds ${maxSizeMB}MB limit. Please upload a smaller image.`);
      return;
    }

    // Check if the uploaded image is portrait (height > width)
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (img.height > img.width) {
        setIsPortraitWarning(true);
      } else {
        setIsPortraitWarning(false);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;

    resizeImageToDataUrl(file, 1600)
      .then((result) => {
        onChange(result);
        setErrorMessage(null);
      })
      .catch(() => setErrorMessage("Failed to read the image file. Please try again."));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setErrorMessage(null);
    setIsPortraitWarning(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const cyclePosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (position === "center") setPosition("top");
    else if (position === "top") setPosition("bottom");
    else setPosition("center");
  };

  return (
    <div className={`w-full space-y-1.5 text-left ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <label className="block text-[13px] font-medium text-[#18181B]">
          {label} <span className="font-normal text-[#A1A1AA]">· 16:9, optional</span>
        </label>
        <span className="text-[11px] text-[#A1A1AA]">
          JPG, PNG, WebP · max {maxSizeMB}MB
        </span>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={(e) => validateAndProcessFile(e.target.files?.[0])}
      />

      {/* 16:9 Landscape Upload Container */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`group relative w-full overflow-hidden rounded-[5px] border transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A2253]/30 ${value
          ? "aspect-[16/9] border-[#ECECF0] bg-zinc-950"
          : isDragging
            ? "h-20 border-dashed border-[#7A2253] bg-[#7A2253]/[0.05]"
            : "h-20 border-dashed border-[#D4D4D8] bg-[#FAFAFB] hover:border-[#A1A1AA] hover:bg-[#F4F4F5]"
          }`}
      >
        {value ? (
          <>
            {/* 16:9 Landscape Image Preview */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Series Cover Preview"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              style={{ objectPosition: position }}
            />

            {/* Dark gradient overlay on hover for clear button contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-zinc-950/20 to-transparent opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />

            {/* Actions Bar */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="tap-scale flex h-8 items-center gap-1.5 rounded-[5px] bg-white/95 hover:bg-white text-[#18181B] px-3 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5 text-[#6B6B76]" />
                <span>Change Cover</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={cyclePosition}
                  title={`Position: ${position.toUpperCase()} (Click to toggle)`}
                  className="tap-scale flex h-8 items-center gap-1 rounded-[5px] bg-white/95 hover:bg-white text-[#52525B] px-2.5 text-xs font-medium shadow-sm transition-colors cursor-pointer"
                >
                  <MoveVertical className="h-3.5 w-3.5 text-[#6B6B76]" />
                  <span className="capitalize text-[11px]">{position}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  title="Remove cover"
                  aria-label="Remove cover"
                  className="tap-scale flex h-8 w-8 items-center justify-center rounded-[5px] bg-white/95 hover:bg-white text-[#6B6B76] hover:text-[#C2414B] shadow-sm transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state — compact dropzone so the form's required fields stay above the fold */
          <div className="absolute inset-0 flex items-center justify-center gap-3 px-4 text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] border border-[#ECECF0] bg-white text-[#6B6B76]">
              <ImagePlus className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-[#18181B]">Upload a cover</span>
              <span className="block text-xs text-[#6B6B76]">Drop an image or tap to browse · 1600 × 900 px recommended</span>
            </span>
          </div>
        )}
      </div>

      {/* Helper Guidance Text */}
      <p className="text-[12px] text-[#6B6B76] leading-relaxed">
        Best size: 1600×900 px (landscape). The important part should be in the centre — it will be cropped for the profile.
      </p>

      {/* Portrait Aspect Ratio Warning */}
      {isPortraitWarning && (
        <div className="flex items-start gap-2 rounded-[5px] bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 border border-amber-200/80 animate-in fade-in duration-150">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <span>Portrait images get cropped heavily. Upload a landscape image for the best look.</span>
        </div>
      )}

      {/* Inline Error State */}
      {errorMessage && (
        <div className="flex items-center gap-1.5 rounded-[5px] bg-rose-50 px-3 py-2 text-xs font-semibold text-[#C2414B] border border-rose-100 animate-in fade-in duration-150">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
