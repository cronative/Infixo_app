"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Users, Plus, Pencil, Trash2, ShieldCheck, Eye, EyeOff, Camera, ExternalLink, Sparkles, ChevronDown, ChevronUp, MoreVertical, Copy } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { CreatorTeam, TeamMember } from "@/types";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { teamRepository } from "@/repositories/localRepository";
import { getInitials } from "@/lib/avatar";

export default function DashboardTeamPage() {
  const { profile } = useCreator();
  const { showToast } = useToast();

  const [team, setTeam] = useState<CreatorTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const [activeMemberMenuId, setActiveMemberMenuId] = useState<string | null>(null);
  const teamMenuRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Team Form State
  const [teamName, setTeamName] = useState("");
  const [teamLogoUrl, setTeamLogoUrl] = useState<string | null>(null);

  // Member Form State
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [memberAvatar, setMemberAvatar] = useState<string | null>(null);
  const [memberInstagram, setMemberInstagram] = useState("");
  const [memberYoutube, setMemberYoutube] = useState("");
  const [memberFacebook, setMemberFacebook] = useState("");

  const creatorLookup = profile.id || profile.email || profile.username;

  // Close team dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (teamMenuRef.current && !teamMenuRef.current.contains(event.target as Node)) {
        setTeamMenuOpen(false);
      }
    };
    if (teamMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [teamMenuOpen]);

  const handleCopyLink = () => {
    setTeamMenuOpen(false);
    const url = typeof window !== "undefined" ? `${window.location.origin}/${profile.username || "creator"}` : "";
    if (url && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast("Profile link copied! 📋");
    }
  };

  // Load team data from MySQL DB and fallback to local storage
  const loadTeam = async () => {
    if (!creatorLookup) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/creator/team?creatorId=${encodeURIComponent(creatorLookup)}`).then((r) => r.json());
      if (res.success && res.team) {
        setTeam(res.team);
        teamRepository.save(res.team);
      } else {
        const local = teamRepository.get();
        setTeam(local);
      }
    } catch {
      const local = teamRepository.get();
      setTeam(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [creatorLookup]);

  // Open Edit Team Modal
  const handleOpenTeamModal = () => {
    setTeamName(team?.teamName || `${profile.displayName || "Creator"}'s Team`);
    setTeamLogoUrl(team?.teamLogoUrl || null);
    setIsTeamModalOpen(true);
  };

  // Save Team base details
  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      showToast("Please enter a team name", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/creator/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: profile.id || creatorLookup,
          email: profile.email,
          action: "save_team",
          id: team?.id,
          teamName: teamName.trim(),
          teamLogoUrl,
          isActive: team?.isActive !== false,
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast("Team saved successfully! 🎉");
        setIsTeamModalOpen(false);
        loadTeam();
      } else {
        showToast(res.error || "Failed to save team", "error");
      }
    } catch {
      showToast("An error occurred while saving team", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helpers to format and clean handles with prefilled un-editable prefixes
  const extractHandle = (raw?: string, platform?: "instagram" | "youtube" | "facebook") => {
    if (!raw) return "";
    let clean = raw.trim();
    clean = clean.replace(/^https?:\/\//i, "");
    clean = clean.replace(/^(www\.)?instagram\.com\//i, "");
    clean = clean.replace(/^(www\.)?youtube\.com\/(@|c\/|channel\/|user\/)?/i, "");
    clean = clean.replace(/^(www\.)?youtu\.be\//i, "");
    clean = clean.replace(/^(www\.)?facebook\.com\//i, "");
    clean = clean.replace(/^(www\.)?fb\.com\//i, "");
    clean = clean.replace(/^[@\/]+/, "");
    clean = clean.split(/[?#]/)[0];
    clean = clean.replace(/\/+$/, "");
    clean = clean.replace(/\s+/g, "");
    return clean;
  };

  const buildSocialUrl = (handle: string, platform: "instagram" | "youtube" | "facebook") => {
    const clean = extractHandle(handle, platform);
    if (!clean) return "";
    if (platform === "instagram") return `https://instagram.com/${clean}`;
    if (platform === "youtube") return `https://youtube.com/@${clean}`;
    if (platform === "facebook") return `https://facebook.com/${clean}`;
    return clean;
  };

  // Open Add/Edit Member Modal
  const handleOpenMemberModal = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
      setMemberName(member.name);
      setMemberRole(member.role);
      setMemberAvatar(member.avatarUrl || null);
      setMemberInstagram(extractHandle(member.instagramUrl, "instagram"));
      setMemberYoutube(extractHandle(member.youtubeUrl, "youtube"));
      setMemberFacebook(extractHandle(member.facebookUrl, "facebook"));
    } else {
      setEditingMember(null);
      setMemberName("");
      setMemberRole("");
      setMemberAvatar(null);
      setMemberInstagram("");
      setMemberYoutube("");
      setMemberFacebook("");
    }
    setIsMemberModalOpen(true);
  };

  // Save Member
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) {
      showToast("Member name is required", "error");
      return;
    }
    if (!memberRole.trim()) {
      showToast("Member role is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/creator/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: profile.id || creatorLookup,
          email: profile.email,
          action: "save_member",
          teamId: team?.id,
          member: {
            id: editingMember?.id,
            name: memberName.trim(),
            role: memberRole.trim(),
            avatarUrl: memberAvatar,
            instagramUrl: memberInstagram.trim() ? buildSocialUrl(memberInstagram, "instagram") : undefined,
            youtubeUrl: memberYoutube.trim() ? buildSocialUrl(memberYoutube, "youtube") : undefined,
            facebookUrl: memberFacebook.trim() ? buildSocialUrl(memberFacebook, "facebook") : undefined,
            isActive: editingMember ? editingMember.isActive : true,
          },
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(editingMember ? "Member updated! 🎉" : "Member added! 🎉");
        setIsMemberModalOpen(false);
        loadTeam();
      } else {
        showToast(res.error || "Failed to save member", "error");
      }
    } catch {
      showToast("An error occurred while saving member", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Member Active/Hidden
  const handleToggleMember = async (member: TeamMember) => {
    try {
      const newStatus = !member.isActive;
      const res = await fetch("/api/creator/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: profile.id || creatorLookup,
          email: profile.email,
          action: "toggle_member",
          teamId: team?.id,
          memberId: member.id,
          isActive: newStatus,
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(newStatus ? "Member shown on profile" : "Member hidden from profile");
        loadTeam();
      } else {
        showToast(res.error || "Failed to update member status", "error");
      }
    } catch {
      showToast("Error updating member", "error");
    }
  };

  // Delete Member
  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/creator/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: profile.id || creatorLookup,
          email: profile.email,
          action: "delete_member",
          teamId: team?.id,
          memberId: memberToDelete.id,
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast("Member removed successfully");
        setMemberToDelete(null);
        loadTeam();
      } else {
        showToast(res.error || "Failed to delete member", "error");
      }
    } catch {
      showToast("Error deleting member", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 w-full pb-8 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#181716]">
            Team &amp; Collaborators
          </h1>
          <p className="text-xs sm:text-[13px] text-[#797570] font-medium mt-0.5">
            Showcase the core creative crew behind your videos, content, and productions.
          </p>
        </div>

        {team && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenTeamModal}
              className="tap-scale flex items-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] px-3 py-1.5 text-xs font-semibold text-[#181716] transition-colors cursor-pointer shadow-xs"
            >
              <Pencil className="h-3.5 w-3.5 text-[#797570]" />
              <span>Edit Team</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenMemberModal()}
              className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-[#600a0f] hover:bg-[#6F3456] text-white font-semibold text-xs py-1.5 px-3 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Add Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-8 text-center text-xs text-[#797570]">
          Loading team details...
        </div>
      ) : !team ? (
        /* Empty State: Create Team */
        <div className="rounded-2xl border-2 border-dashed border-[#E7E3DC] bg-white p-8 sm:p-10 text-center space-y-3 max-w-xl mx-auto shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#600a0f]/[0.09] text-[#600a0f]">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-sm sm:text-base font-bold text-[#181716]">
              Build the team behind your content
            </h3>
            <p className="text-xs text-[#797570] font-medium max-w-sm mx-auto leading-relaxed">
              Highlight your directors, editors, writers, and collaborators. Team members will be featured cleanly on your Inflixo public profile.
            </p>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={handleOpenTeamModal}
              className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-[#600a0f] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Create Team</span>
            </button>
          </div>
        </div>
      ) : (
        /* Unified Series-Style Expandable Team Card */
        <div className="rounded-2xl border border-[#E7E3DC] bg-white divide-y divide-[#E7E3DC] shadow-xs">
          {/* Team Row Header */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3.5 py-2.5 sm:py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FAF8F5]/80 transition-colors group text-left ${isExpanded ? "rounded-t-2xl" : "rounded-2xl"
              }`}
          >
            {/* Left: Squircle Badge + Title & Subtitle */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#600b0f0f] border border-[#E7D0D4] text-[#600a0f] font-extrabold text-xs shadow-xs shrink-0 select-none">
                {getInitials(team.teamName)}
              </div>
              <div className="min-w-0 flex-1 text-left space-y-0.5">
                <p className="truncate text-xs sm:text-[13px] font-bold text-[#181716] group-hover:text-[#600a0f] transition-colors">
                  {team.teamName}
                </p>
                <p className="truncate text-[11px] font-medium text-[#797570]">
                  {team.members?.length || 0} team {team.members?.length === 1 ? "member" : "members"}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 sm:gap-2 shrink-0"
            >
              {/* Add Member Button (Desktop) */}
              <button
                type="button"
                onClick={() => handleOpenMemberModal()}
                className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-[#600a0f] hover:bg-[#6F3456] text-white px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Member</span>
              </button>

              {/* View Public Page (Desktop) */}
              <a
                href={`/${profile.username || "creator"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] px-2.5 py-1.5 text-xs font-semibold text-[#181716] transition-colors shadow-xs"
                title="View public profile"
              >
                <span>View</span>
                <ExternalLink className="h-3 w-3 text-[#600a0f]" />
              </a>

              {/* 3-Dot Overflow Menu (Always visible) */}
              <div className="relative" ref={teamMenuRef}>
                <button
                  type="button"
                  onClick={() => setTeamMenuOpen(!teamMenuOpen)}
                  className="flex h-7 w-7 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-xs"
                  aria-label="More actions"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>

                {teamMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-[#E7E3DC] bg-white p-1 shadow-lg z-50 space-y-0.5 animate-in fade-in text-left">
                    <button
                      type="button"
                      onClick={() => {
                        setTeamMenuOpen(false);
                        handleOpenMemberModal();
                      }}
                      className="sm:hidden flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#600a0f] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#600a0f]" />
                      <span>Add Member</span>
                    </button>

                    <a
                      href={`/${profile.username || "creator"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setTeamMenuOpen(false)}
                      className="sm:hidden flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-[#797570]" />
                      <span>View Public Page</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setTeamMenuOpen(false);
                        handleOpenTeamModal();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5 text-[#797570]" />
                      <span>Edit Team Name</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5 text-[#797570]" />
                      <span>Copy Profile Link</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Expand / Collapse Chevron */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex h-7 w-7 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-xs"
                aria-expanded={isExpanded}
                title={isExpanded ? "Hide members" : "Show members"}
              >
                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Expanded Members List */}
          {isExpanded && (
            <div className="border-t border-[#E7E3DC] bg-[#FAF8F5]/80 rounded-b-2xl">
              {/* Header Strip */}
              <div className="px-3.5 py-1.5 bg-[#FAF8F5] flex items-center justify-between border-b border-[#E7E3DC]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#797570]">
                  Team Members ({team.members?.length || 0})
                </span>
              </div>

              {(!team.members || team.members.length === 0) ? (
                <div className="p-5 text-center space-y-2 bg-white rounded-b-2xl">
                  <p className="text-xs font-bold text-[#181716]">No team members added yet</p>
                  <p className="text-xs text-[#797570] max-w-sm mx-auto">
                    Add members to highlight directors, editors, writers, and collaborators on your public profile.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenMemberModal()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#600a0f] hover:bg-[#6F3456] px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add First Member</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#E7E3DC] bg-white rounded-b-2xl">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className={`px-3.5 py-2 sm:py-2.5 flex items-center justify-between gap-3 hover:bg-[#FAF8F5]/60 transition-colors text-left last:rounded-b-2xl ${member.isActive ? "" : "opacity-60 bg-[#FAF8F5]/40"
                        }`}
                    >
                      {/* Left: Avatar Initial / Squircle + Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#600b0f0f] border border-[#E7D0D4] text-[#600a0f] font-bold text-xs shadow-xs shrink-0 select-none">
                          {getInitials(member.name)}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="truncate font-bold text-xs sm:text-[13px] text-[#181716]">{member.name}</h3>
                            <span className="text-[11px] font-semibold text-[#600a0f] truncate">
                              • {member.role}
                            </span>
                            {!member.isActive && (
                              <span className="text-[10px] font-semibold text-[#797570] bg-[#FAF8F5] border border-[#E7E3DC] px-1.5 py-0.2 rounded-md">
                                Hidden
                              </span>
                            )}
                          </div>

                          {/* Social Icons */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            {member.instagramUrl && (
                              <a
                                href={member.instagramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-5 w-5 items-center justify-center rounded-md bg-pink-50 text-[#E1306C] hover:scale-110 transition-transform"
                                title="Instagram"
                              >
                                <InstagramIcon className="h-3 w-3" />
                              </a>
                            )}
                            {member.youtubeUrl && (
                              <a
                                href={member.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-5 w-5 items-center justify-center rounded-md bg-red-50 text-[#FF0000] hover:scale-110 transition-transform"
                                title="YouTube"
                              >
                                <YoutubeIcon className="h-3 w-3" />
                              </a>
                            )}
                            {member.facebookUrl && (
                              <a
                                href={member.facebookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-[#1877F2] hover:scale-110 transition-transform"
                                title="Facebook"
                              >
                                <FacebookIcon className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Desktop Actions */}
                        <div className="hidden sm:flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleMember(member)}
                            className="tap-scale flex h-7 w-7 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-xs"
                            title={member.isActive ? "Hide from profile" : "Show on profile"}
                          >
                            {member.isActive ? (
                              <Eye className="h-3.5 w-3.5 text-[#17845B]" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5 text-[#797570]" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenMemberModal(member)}
                            className="tap-scale flex h-7 w-7 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-xs"
                            title="Edit member"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setMemberToDelete(member)}
                            className="tap-scale flex h-7 w-7 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-rose-50 text-[#797570] hover:text-[#C2414B] transition-colors cursor-pointer shadow-xs"
                            title="Remove member"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Mobile 3-Dot Menu */}
                        <div className="relative sm:hidden">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMemberMenuId(activeMemberMenuId === member.id ? null : member.id);
                            }}
                            className="tap-scale flex h-7 w-7 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-xs"
                            aria-label="Member actions"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>

                          {activeMemberMenuId === member.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-[#E7E3DC] bg-white p-1 shadow-lg z-50 space-y-0.5 animate-in fade-in"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMemberMenuId(null);
                                  handleToggleMember(member);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                              >
                                {member.isActive ? <EyeOff className="h-3.5 w-3.5 text-[#797570]" /> : <Eye className="h-3.5 w-3.5 text-[#17845B]" />}
                                <span>{member.isActive ? "Hide from profile" : "Show on profile"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMemberMenuId(null);
                                  handleOpenMemberModal(member);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5 text-[#797570]" />
                                <span>Edit Member</span>
                              </button>

                              <div className="my-1 border-t border-[#E7E3DC]" />

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMemberMenuId(null);
                                  setMemberToDelete(member);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#C2414B] hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Remove Member</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TEAM EDIT MODAL */}
      <Modal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        size="md"
        title={team ? "Edit Team Details" : "Create Creator Team"}
        description="Set up your team name for your public profile."
        icon={<Users className="h-4 w-4" />}
      >
        <form onSubmit={handleSaveTeam} className="flex flex-col flex-1 min-h-0">
          <ModalBody className="p-4 sm:p-5 space-y-3.5 text-left">
            {/* Live Team Initials Badge Preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F5]/60 border border-[#E7E3DC]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#600b0f0f] border border-[#E7D0D4] text-[#600a0f] font-extrabold text-xs shadow-xs shrink-0">
                {getInitials(teamName || "Team")}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-[#181716] truncate">{teamName.trim() || "Team Name"}</p>
                <span className="inline-block text-[10px] font-semibold text-[#600a0f] bg-[#600a0f]/[0.09] border border-[#600a0f]/20 px-1.5 py-0.2 rounded-md">Creator Team</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#181716]">
                Team Name <span className="text-[#C2414B]">*</span>
              </label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. MediaVerse Studio or Nikunj Films"
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 px-3.5 py-2 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#600a0f] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </ModalBody>

          <ModalFooter className="px-4 sm:px-5 py-3">
            <button
              type="button"
              onClick={() => setIsTeamModalOpen(false)}
              className="px-3.5 py-2 rounded-xl border border-[#E7E3DC] text-xs font-semibold text-[#797570] hover:bg-[#FAF8F5] hover:text-[#181716] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="tap-scale bg-[#600a0f] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>{isSubmitting ? "Saving..." : "Save Team"}</span>
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ADD / EDIT MEMBER MODAL */}
      <Modal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        size="md"
        title={editingMember ? "Edit Team Member" : "Add Team Member"}
        description="Add member information, role and social links."
        icon={<Users className="h-4 w-4" />}
      >
        <form onSubmit={handleSaveMember} className="flex flex-col flex-1 min-h-0">
          <ModalBody className="p-4 sm:p-5 space-y-3.5 text-left">
            {/* Live Member Initials Avatar Preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F5]/60 border border-[#E7E3DC]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#600b0f0f] border border-[#E7D0D4] text-[#600a0f] font-extrabold text-xs shadow-xs shrink-0">
                {getInitials(memberName || "Member")}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-[#181716] truncate">{memberName.trim() || "Member Name"}</p>
                <p className="text-[11px] font-medium text-[#600a0f] truncate">{memberRole.trim() || "Member Role"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#181716]">
                  Name <span className="text-[#C2414B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 px-3.5 py-2 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#600a0f] focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#181716]">
                  Role <span className="text-[#C2414B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  placeholder="e.g. Lead Video Editor"
                  className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 px-3.5 py-2 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#600a0f] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-[#E7E3DC]">
              <div>
                <p className="text-xs font-bold text-[#181716]">Social Profiles (Optional)</p>
                <p className="text-[10px] text-[#797570]">Enter username only — full profile links are generated automatically.</p>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#797570]">
                  Instagram Username
                </label>
                <div className="flex h-9 items-center rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 px-3 transition-colors focus-within:border-[#600a0f] focus-within:bg-white">
                  <span className="mr-2 text-[#E1306C] shrink-0">
                    <InstagramIcon className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    value={memberInstagram}
                    onChange={(e) => setMemberInstagram(extractHandle(e.target.value, "instagram"))}
                    placeholder="username (e.g. johndoe)"
                    className="h-full w-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#181716] placeholder:text-[#797570]/40 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#797570]">
                  YouTube Channel Username
                </label>
                <div className="flex h-9 items-center rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 px-3 transition-colors focus-within:border-[#600a0f] focus-within:bg-white">
                  <span className="mr-2 text-[#FF0000] shrink-0">
                    <YoutubeIcon className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    value={memberYoutube}
                    onChange={(e) => setMemberYoutube(extractHandle(e.target.value, "youtube"))}
                    placeholder="channel username (e.g. channelname)"
                    className="h-full w-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#181716] placeholder:text-[#797570]/40 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#797570]">
                  Facebook Username
                </label>
                <div className="flex h-9 items-center rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/60 px-3 transition-colors focus-within:border-[#600a0f] focus-within:bg-white">
                  <span className="mr-2 text-[#1877F2] shrink-0">
                    <FacebookIcon className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    value={memberFacebook}
                    onChange={(e) => setMemberFacebook(extractHandle(e.target.value, "facebook"))}
                    placeholder="page username (e.g. pagename)"
                    className="h-full w-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#181716] placeholder:text-[#797570]/40 outline-none"
                  />
                </div>
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="px-4 sm:px-5 py-3">
            <button
              type="button"
              onClick={() => setIsMemberModalOpen(false)}
              className="px-3.5 py-2 rounded-xl border border-[#E7E3DC] text-xs font-semibold text-[#797570] hover:bg-[#FAF8F5] hover:text-[#181716] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="tap-scale bg-[#600a0f] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>{isSubmitting ? "Saving..." : editingMember ? "Save Changes" : "Add Member"}</span>
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* DELETE MEMBER CONFIRM MODAL */}
      <ConfirmModal
        isOpen={Boolean(memberToDelete)}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleDeleteMember}
        title="Delete Team Member?"
        description={`Are you sure you want to remove ${memberToDelete?.name || "this member"} from your team?`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        loading={isSubmitting}
      />
    </div>
  );
}
