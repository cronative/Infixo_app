"use client";

import React from "react";
import { openCookiePreferences } from "@/lib/cookieConsent";

interface CookiePreferencesButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function CookiePreferencesButton({
  className = "hover:text-[#151933] transition-colors cursor-pointer",
  children = "Cookie Preferences",
}: CookiePreferencesButtonProps) {
  return (
    <button
      type="button"
      onClick={() => openCookiePreferences()}
      className={className}
    >
      {children}
    </button>
  );
}
