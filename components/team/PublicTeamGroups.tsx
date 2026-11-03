"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TeamMember } from "@/types";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
} from "@/components/shared/BrandIcons";

export interface PublicTeamGroupsProps {
  members: TeamMember[];
  variant?: "profile" | "mediakit";
  primaryTextColor?: string;
  secondaryTextColor?: string;
  mutedTextColor?: string;
  accentColor?: string;
  borderColor?: string;
  cardBgColor?: string;
  isInformational?: boolean;
}

export function PublicTeamGroups({
  members,
  variant = "profile",
  primaryTextColor,
  secondaryTextColor,
  mutedTextColor,
  accentColor = "#7A2253",
  borderColor,
  cardBgColor,
  isInformational = false,
}: PublicTeamGroupsProps) {
  const activeMembers = (members || []).filter(
    (m) => m.isActive !== false && m.name?.trim()
  );

  if (activeMembers.length === 0) return null;

  const onCameraMembers = activeMembers.filter((m) => m.group === "On camera");
  const behindCameraMembers = activeMembers.filter(
    (m) => m.group !== "On camera"
  );

  const groups: Array<{ label: "On camera" | "Behind the camera"; items: TeamMember[] }> = [];
  if (onCameraMembers.length > 0) {
    groups.push({ label: "On camera", items: onCameraMembers });
  }
  if (behindCameraMembers.length > 0) {
    groups.push({ label: "Behind the camera", items: behindCameraMembers });
  }

  const isEditorial = variant === "mediakit";

  return (
    <div className="space-y-4 w-full text-left">
      {groups.map((group) => (
        <div key={group.label} className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h4
              style={{
                color: isEditorial ? "#78716C" : secondaryTextColor || "var(--text-muted)",
              }}
              className="text-[11px] font-bold uppercase tracking-[0.12em]"
            >
              {group.label}
            </h4>
            <span
              style={{
                color: isEditorial ? "#A8A29E" : mutedTextColor || "var(--text-muted)",
              }}
              className="text-[10.5px] font-medium"
            >
              {group.items.length}
            </span>
          </div>

          <div
            className={
              isEditorial
                ? "flex flex-col space-y-2.5 w-full"
                : "space-y-2"
            }
          >
            {group.items.map((member) => {
              const cleanInflixo = (member.inflixoUsername || "")
                .trim()
                .replace(/^@/, "");
              const socialLinks = [
                {
                  url: member.instagramUrl,
                  icon: <InstagramIcon className="h-3.5 w-3.5 text-[#E1306C]" />,
                  label: "Instagram",
                },
                {
                  url: member.youtubeUrl,
                  icon: <YoutubeIcon className="h-3.5 w-3.5 text-[#FF0000]" />,
                  label: "YouTube",
                },
                {
                  url: member.facebookUrl,
                  icon: <FacebookIcon className="h-3.5 w-3.5 text-[#1877F2]" />,
                  label: "Facebook",
                },
              ].filter((item) => Boolean(item.url));

              return (
                <div
                  key={member.id}
                  style={{
                    backgroundColor: isEditorial
                      ? "#FFFFFF"
                      : cardBgColor || "transparent",
                    borderColor: isEditorial
                      ? "#E7E0D6"
                      : borderColor || "var(--surface-border)",
                  }}
                  className={`flex items-start justify-between gap-3 border p-3 sm:p-3.5 transition-colors ${
                    isEditorial ? "rounded-xl" : "rounded-[5px]"
                  }`}
                >
                  {/* Left: Round Photo + Name + Role Chip + One-liner in italics */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <CreatorAvatar
                      src={member.avatarUrl || null}
                      name={member.name || "Crew"}
                      className="h-11 w-11 shrink-0 rounded-full object-cover border border-black/5"
                      fallbackBgClass="bg-(--accent)"
                      textClassName="text-xs font-bold tracking-tight text-white"
                      style={{ backgroundColor: accentColor }}
                    />

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p
                          style={{
                            color: isEditorial
                              ? "#1C1917"
                              : primaryTextColor || "var(--text)",
                          }}
                          className="text-xs sm:text-[13.5px] font-bold leading-snug break-words"
                        >
                          {member.name}
                        </p>

                        {member.role && (
                          <span
                            style={
                              isEditorial
                                ? {
                                    backgroundColor: "#FAF0F5",
                                    color: "#7A2253",
                                    borderColor: "#F5D9E6",
                                  }
                                : {
                                    backgroundColor:
                                      "color-mix(in srgb, var(--accent) 10%, var(--surface))",
                                    color: "var(--accent-text)",
                                    borderColor:
                                      "color-mix(in srgb, var(--accent) 22%, var(--surface-border))",
                                  }
                            }
                            className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold leading-tight"
                          >
                            {member.role}
                          </span>
                        )}
                      </div>

                      {member.oneLiner && member.oneLiner.trim() && (
                        <p
                          style={{
                            color: isEditorial
                              ? "#57534E"
                              : secondaryTextColor || "var(--text-muted)",
                          }}
                          className="text-[11.5px] sm:text-xs italic leading-snug break-words"
                        >
                          &ldquo;{member.oneLiner.trim()}&rdquo;
                        </p>
                      )}

                      {cleanInflixo && (
                        <div className="pt-0.5">
                          <Link
                            href={`/${cleanInflixo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isInformational) e.preventDefault();
                            }}
                            style={
                              isEditorial
                                ? { color: "#7A2253" }
                                : { color: "var(--accent-text)" }
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline"
                          >
                            <span>@{cleanInflixo}</span>
                            <ArrowUpRight className="h-3 w-3 shrink-0" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Social Icons */}
                  {socialLinks.length > 0 && (
                    <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                      {socialLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${member.name} ${link.label}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isInformational) e.preventDefault();
                          }}
                          style={
                            isEditorial
                              ? {
                                  borderColor: "#E7E0D6",
                                  backgroundColor: "#FAF7F2",
                                }
                              : {
                                  borderColor: borderColor || "var(--surface-border)",
                                  backgroundColor: cardBgColor || "var(--surface)",
                                }
                          }
                          className="tap-scale flex h-8 w-8 items-center justify-center rounded-full border transition-transform hover:scale-105"
                        >
                          {link.icon}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

