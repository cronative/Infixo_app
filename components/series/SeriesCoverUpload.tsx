"use client";

import React, { useRef, useState } from "react";
import { ImagePlus, Camera, Trash2, MoveVertical, AlertCircle } from "lucide-react";

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
  const [position, setPosition] = useState<"center" | "top" | "bottom">("center");

  const validateAndProcessFile = (file?: File) => {
    setErrorMessage(null);
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

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
        setErrorMessage(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage("Failed to read the image file. Please try again.");
    };
    reader.readAsDataURL(file);
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
        <label className="block text-xs font-bold text-[#181716]">
          {label} <span className="text-[11px] font-semibold text-[#797570]">(16:9 Landscape)</span>
        </label>
        <span className="text-[11px] font-semibold text-[#797570]">
          Max {maxSizeMB}MB
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
        className={`group relative w-full aspect-[16/9] overflow-hidden rounded-2xl border transition-all cursor-pointer select-none ${
          value
            ? "border-[#E4DAD5] bg-slate-950 shadow-sm"
            : isDragging
            ? "border-2 border-dashed border-[#B85C6B] bg-[#B85C6B]/[0.09]"
            : "border-2 border-dashed border-[#E4DAD5] hover:border-[#B85C6B] bg-[#F8F7F3] hover:bg-[#F5F3ED]"
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
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />

            {/* Actions Bar */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="tap-scale flex items-center gap-1.5 rounded-xl bg-white/95 hover:bg-white text-[#181716] px-3 py-1.5 text-xs font-bold shadow-md border border-white/60 backdrop-blur-md transition-all cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5 text-[#B85C6B]" />
                <span>Change Cover</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={cyclePosition}
                  title={`Position: ${position.toUpperCase()} (Click to toggle)`}
                  className="tap-scale flex items-center gap-1 rounded-xl bg-white/95 hover:bg-white text-[#54514D] px-2.5 py-1.5 text-xs font-semibold shadow-md border border-white/60 backdrop-blur-md transition-all cursor-pointer"
                >
                  <MoveVertical className="h-3.5 w-3.5 text-[#797570]" />
                  <span className="capitalize text-[11px]">{position}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  title="Remove cover"
                  className="tap-scale flex h-8 w-8 items-center justify-center rounded-xl bg-white/95 hover:bg-rose-50 text-[#797570] hover:text-[#C2414B] shadow-md border border-white/60 backdrop-blur-md transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State - Full Width Landscape Dropzone */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B85C6B]/[0.09] text-[#B85C6B] border border-[#B85C6B]/20 shadow-xs group-hover:scale-105 transition-transform">
              <ImagePlus className="h-6 w-6 stroke-[2]" />
            </div>

            <p className="mt-2.5 text-xs sm:text-sm font-bold text-[#181716] group-hover:text-[#B85C6B] transition-colors">
              Upload Series Cover
            </p>

            <p className="mt-0.5 text-[11px] sm:text-xs font-semibold text-[#797570]">
              Recommended size: 1920 × 1080 px
            </p>

            <p className="mt-1 text-[10px] sm:text-[11px] font-medium text-[#797570]/70">
              JPG, PNG or WebP
            </p>
          </div>
        )}
      </div>

      {/* Inline Error State */}
      {errorMessage && (
        <div className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-[#C2414B] border border-rose-100 animate-in fade-in duration-150">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
