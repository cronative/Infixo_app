"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Camera,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  User,
  UserPlus,
  Briefcase,
  FileText,
  Image as ImageIcon,
  X,
  GripVertical,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { CreatorTeam, TeamMember, TeamMemberGroup } from "@/types";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { teamRepository } from "@/repositories/localRepository";
import { getInitials } from "@/lib/avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PAGE_COPY } from "@/components/dashboard/pageCopy";
import { resizeImageToDataUrl } from "@/lib/imageResize";

export default function DashboardTeamPage() {
  const { profile } = useCreator();
  const { showToast } = useToast();

  const [team, setTeam] = useState<CreatorTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const teamMenuRef = useRef<HTMLDivElement>(null);

  // Drag-and-drop state
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
  const [dragOverMemberId, setDragOverMemberId] = useState<string | null>(null);

  // Modals state
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Team Form State
  const [teamName, setTeamName] = useState("The Crew");
  const [teamLogoUrl, setTeamLogoUrl] = useState<string | null>(null);
  const [teamDescription, setTeamDescription] = useState("");

  // Member Form State
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [memberGroup, setMemberGroup] = useState<TeamMemberGroup>("Behind the camera");
  const [memberOneLiner, setMemberOneLiner] = useState("");
  const [memberInflixoUsername, setMemberInflixoUsername] = useState("");
  const [memberAvatar, setMemberAvatar] = useState<string | null>(null);
  const [memberInstagram, setMemberInstagram] = useState("");
  const [memberYoutube, setMemberYoutube] = useState("");
  const [memberFacebook, setMemberFacebook] = useState("");

  const creatorLookup = profile.id || profile.email || profile.username;
  const cleanCreatorHandle = (profile.username || "creator").replace(/^@/, "");

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

  // Load team data from MySQL DB and fallback to local storage
  const loadTeam = async () => {
    if (!creatorLookup) return;
    setLoading(true);
    try {
      const httpResponse = await fetch(`/api/creator/team?creatorId=${encodeURIComponent(creatorLookup)}`);
      const apiResponse = await httpResponse.json();
      const teamData = apiResponse.data?.team || apiResponse.team;
      if (httpResponse.ok && (apiResponse.status === 1 || apiResponse.success) && teamData) {
        setTeam(teamData);
        teamRepository.save(teamData);
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file, 600);
      setTeamLogoUrl(dataUrl);
    } catch {
      showToast("Failed to process image", "error");
    }
  };

  const handleMemberPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file, 500);
      setMemberAvatar(dataUrl);
    } catch {
      showToast("Failed to process member photo", "error");
    }
  };

  // Open Edit Team Modal
  const handleOpenTeamModal = () => {
    setTeamName(team?.teamName || "The Crew");
    setTeamLogoUrl(team?.teamLogoUrl || null);
    setTeamDescription(team?.teamDescription || "");
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
      const httpResponse = await fetch("/api/creator/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: profile.id || creatorLookup,
          email: profile.email,
          action: "save_team",
          id: team?.id,
          teamName: teamName.trim() || "The Crew",
          teamLogoUrl,
          teamDescription: teamDescription.trim(),
          isActive: team?.isActive !== false,
        }),
      });
      const apiResponse = await httpResponse.json();

      if (httpResponse.ok && (apiResponse.status === 1 || apiResponse.success)) {
        showToast("Team saved successfully! 🎉");
        setIsTeamModalOpen(false);
        await loadTeam();
      } else {
        showToast(apiResponse.message || apiResponse.error || "Failed to save team", "error");
      }
    } catch {
      showToast("An error occurred while saving team", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helpers to format and clean handles
  const extractHandle = (raw?: string, platform?: "instagram" | "youtube" | "facebook" | "inflixo") => {
    if (!raw) return "";
    let clean = raw.trim();
    clean = clean.replace(/^https?:\/\//i, "");
    clean = clean.replace(/^(www\.)?inflixo\.com\//i, "");
    clean = clean.replace(/^(www\.)?instagram\.com\//i, "");
    clean = clean.replace(/^(www\.)?youtube\.com\/(@|c\/|channel\/|user\/)?/i, "");
    clean = clean.replace(/^(www\.)?youtu\.be\//i, "");
    clean = clean.replace(/^(www\.)?facebook\.com\//i, "");
    clean = clean.replace(/^(www\.)?fb\.com\//i, "");
    clean = clean.replace(/^[@/]+/, "");
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
      setMemberGroup(member.group === "On camera" ? "On camera" : "Behind the camera");
      setMemberOneLiner(member.oneLiner || "");
      setMemberInflixoUsername(extractHandle(member.inflixoUsername || "", "inflixo"));
      setMemberAvatar(member.avatarUrl || null);
      setMemberInstagram(extractHandle(member.instagramUrl, "instagram"));
      setMemberYoutube(extractHandle(member.youtubeUrl, "youtube"));
      setMemberFacebook(extractHandle(member.facebookUrl, "facebook"));
    } else {
      setEditingMember(null);
      setMemberName("");
      setMemberRole("");
      setMemberGroup("Behind the camera");
      setMemberOneLiner("");
      setMemberInflixoUsername("");
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
    // Photo is required for new members; existing members fall back to initials if they don't have one
    if (!editingMember && !memberAvatar) {
      showToast("Please upload a photo for the new member", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const httpResponse = await fetch("/api/creator/team", {
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
            group: memberGroup,
            oneLiner: memberOneLiner.trim().slice(0, 80) || null,
            inflixoUsername: extractHandle(memberInflixoUsername, "inflixo") || null,
            avatarUrl: memberAvatar,
            instagramUrl: memberInstagram.trim() ? buildSocialUrl(memberInstagram, "instagram") : undefined,
            youtubeUrl: memberYoutube.trim() ? buildSocialUrl(memberYoutube, "youtube") : undefined,
            facebookUrl: memberFacebook.trim() ? buildSocialUrl(memberFacebook, "facebook") : undefined,
            sortOrder: editingMember ? editingMember.sortOrder : (team?.members?.length ?? 0),
            isActive: editingMember ? editingMember.isActive : true,
          },
        }),
      });
      const apiResponse = await httpResponse.json();

      if (httpResponse.ok && (apiResponse.status === 1 || apiResponse.success)) {
        showToast(editingMember ? "Member updated! 🎉" : "Member added! 🎉");
        setIsMemberModalOpen(false);
        await loadTeam();
      } else {
        showToast(apiResponse.message || apiResponse.error?.message || apiResponse.error || "Failed to save member", "error");
      }
    } catch {
      showToast("An error occurred while saving member", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drag-and-drop reorder handler
  const handleDropMember = async (targetMemberId: string) => {
    setDragOverMemberId(null);
    if (!team?.members || !draggedMemberId || draggedMemberId === targetMemberId) {
      setDraggedMemberId(null);
      return;
    }

    const currentList = [...team.members];
    const fromIdx = currentList.findIndex((m) => m.id === draggedMemberId);
    const toIdx = currentList.findIndex((m) => m.id === targetMemberId);
    setDraggedMemberId(null);

    if (fromIdx === -1 || toIdx === -1) return;

    const [moved] = currentList.splice(fromIdx, 1);
    currentList.splice(toIdx, 0, moved);

    const reordered = currentList.map((m, idx) => ({ ...m, sortOrder: idx }));
    const updatedTeam = { ...team, members: reordered };
    setTeam(updatedTeam);
    teamRepository.save(updatedTeam);

    try {
      await fetch("/api/creator/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: profile.id || creatorLookup,
          email: profile.email,
          action: "reorder",
          members: reordered.map((m, idx) => ({
            id: m.id,
            sortOrder: idx,
            group: m.group,
          })),
        }),
      });
      showToast("Team order updated");
    } catch {
      showToast("Could not save new order", "error");
      loadTeam();
    }
  };

  // Toggle Member Active/Hidden
  const handleToggleMember = async (member: TeamMember) => {
    try {
      const newStatus = !member.isActive;
      const httpResponse = await fetch("/api/creator/team", {
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
      });
      const apiResponse = await httpResponse.json();

      if (httpResponse.ok && (apiResponse.status === 1 || apiResponse.success)) {
        showToast(newStatus ? "Member shown on profile" : "Member hidden from profile");
        loadTeam();
      } else {
        showToast(apiResponse.message || apiResponse.error || "Failed to update member status", "error");
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
      const httpResponse = await fetch("/api/creator/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: profile.id || creatorLookup,
          email: profile.email,
          action: "delete_member",
          teamId: team?.id,
          memberId: memberToDelete.id,
        }),
      });
      const apiResponse = await httpResponse.json();

      if (httpResponse.ok && (apiResponse.status === 1 || apiResponse.success)) {
        showToast("Member removed successfully");
        setMemberToDelete(null);
        loadTeam();
      } else {
        showToast(apiResponse.message || apiResponse.error || "Failed to delete member", "error");
      }
    } catch {
      showToast("Error deleting member", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        {...PAGE_COPY.team}
        actions={
          <>
            <button type="button" onClick={handleOpenTeamModal} className="dash-btn-secondary">
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit team</span>
            </button>
            <button type="button" onClick={() => handleOpenMemberModal()} className="dash-btn-primary">
              <Plus className="h-3.5 w-3.5" />
              <span>Add member</span>
            </button>
          </>
        }
      />

      {/* Main Content Area */}
      {loading ? (
        <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-6 text-center text-xs text-[#64748b]">
          Loading team details...
        </div>
      ) : !team ? (
        /* Empty State */
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="Build the team behind your content"
          description="Highlight your directors, editors, writers, and collaborators. Team members will be featured cleanly on your Inflixo public profile."
          action={
            <button
              type="button"
              onClick={handleOpenTeamModal}
              className="inline-flex items-center gap-2 rounded-[5px] bg-[#7A2253] h-9 px-4 text-xs font-semibold text-white shadow-md shadow-[#7A2253]/20 transition-all hover:bg-[#681c46] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Your Team</span>
            </button>
          }
        />
      ) : (
        /* Main Team Container */
        <div className="rounded-[5px] border border-[#ECECF0] bg-white shadow-none overflow-hidden">
          {/* Top Team Summary Row */}
          <div className="p-4 sm:px-5 sm:py-4 flex items-center justify-between gap-3 text-left">
            {/* Left: Avatar Squircle + Team Name, Description & Members count */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {team.teamLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={team.teamLogoUrl}
                  alt={team.teamName || "The Crew"}
                  className="h-11 w-11 rounded-[5px] object-cover border border-[#ECECF0] shrink-0"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-[5px] bg-[#F7EEF2] text-[#7A2253] font-semibold text-sm shrink-0 select-none">
                  {getInitials(team.teamName || "The Crew")}
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-0.5">
                <h2 className="line-clamp-2 break-words text-[16px] font-semibold text-[#18181B]">
                  {team.teamName || "The Crew"}
                </h2>
                {team.teamDescription && team.teamDescription.trim() ? (
                  <p className="line-clamp-2 break-words text-[12px] text-[#52525B]">
                    {team.teamDescription}
                  </p>
                ) : null}
                <p className="text-[11.5px] text-[#6B6B76]">
                  {team.members?.length || 0} team {team.members?.length === 1 ? "member" : "members"}
                </p>
              </div>
            </div>

            {/* Right: View -> /:username/team, Collapse/Expand */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`/${cleanCreatorHandle}/team`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[5px] border border-[#ECECF0] bg-white hover:bg-[#FAFAFB] text-[13px] font-medium text-[#18181B] transition-colors"
                title="View public team page"
              >
                <span>View</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#6B6B76]" />
              </a>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 rounded-[5px] border border-[#ECECF0] bg-white hover:bg-[#FAFAFB] text-[#6B6B76] hover:text-[#18181B] flex items-center justify-center transition-colors cursor-pointer"
                aria-expanded={isExpanded}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Expanded Members Area */}
          {isExpanded && (
            <div>
              {/* Divider Bar: TEAM MEMBERS (N) */}
              <div className="border-t border-b border-[#e2e8f0] bg-[#f8fafc] px-4 sm:px-5 py-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                  TEAM MEMBERS ({team.members?.length || 0})
                </span>
                {(team.members?.length || 0) > 1 && (
                  <span className="text-[11px] text-[#94a3b8]">
                    Drag rows to reorder
                  </span>
                )}
              </div>

              {!team.members || team.members.length === 0 ? (
                <div className="p-6 text-center space-y-2 bg-white">
                  <p className="text-xs font-bold text-[#7A2253]">No team members added yet</p>
                  <p className="text-xs text-[#64748b] max-w-sm mx-auto">
                    Add members to highlight on-camera talent, directors, editors, writers, and collaborators on your public profile.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenMemberModal()}
                    className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#7A2253] hover:bg-[#681c46] h-8 px-3 text-xs font-semibold text-white transition-colors cursor-pointer shadow-2xs mt-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add First Member</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#f1f5f9] bg-white">
                  {team.members.map((member: TeamMember) => {
                    const isHidden = member.isActive === false;
                    const groupLabel = member.group === "On camera" ? "On camera" : "Behind the camera";
                    const cleanInflixo = (member.inflixoUsername || "").trim().replace(/^@/, "");
                    const isDragTarget = dragOverMemberId === member.id && draggedMemberId !== member.id;

                    return (
                      <div
                        key={member.id}
                        draggable
                        onDragStart={() => setDraggedMemberId(member.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragOverMemberId !== member.id) {
                            setDragOverMemberId(member.id);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverMemberId === member.id) {
                            setDragOverMemberId(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDropMember(member.id);
                        }}
                        onDragEnd={() => {
                          setDraggedMemberId(null);
                          setDragOverMemberId(null);
                        }}
                        className={`px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#fafafa] transition-all text-left ${
                          isHidden ? "opacity-50" : ""
                        } ${isDragTarget ? "border-t-2 border-t-[#7A2253] bg-[#FFF0F5]/30" : ""}`}
                      >
                        {/* Left: Drag Handle + Round Photo + Name, Role Chip, Group, One-Liner */}
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                          <div
                            className="cursor-grab active:cursor-grabbing text-[#94a3b8] hover:text-[#475569] shrink-0"
                            title="Drag to reorder"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>

                          <CreatorAvatar
                            src={member.avatarUrl || null}
                            name={member.name}
                            className="h-10 w-10 rounded-full object-cover shrink-0 border border-[#e2e8f0]"
                            fallbackBgClass="bg-[#FFF5F7]"
                            textClassName="text-xs font-bold text-[#7A2253]"
                          />

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="font-bold text-sm text-[#0f172a] truncate">
                                {member.name}
                              </p>
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#F7EEF2] text-[#7A2253] px-2 py-0.5 text-[11px] font-semibold">
                                {member.role}
                              </span>
                              <span className="inline-flex items-center rounded-[4px] bg-[#f1f5f9] text-[#475569] px-1.5 py-0.5 text-[10px] font-semibold">
                                {groupLabel}
                              </span>
                              {isHidden && (
                                <span className="inline-flex items-center rounded-[4px] bg-[#f1f5f9] border border-[#cbd5e1] text-[#475569] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                  Hidden
                                </span>
                              )}
                            </div>

                            {member.oneLiner && member.oneLiner.trim() && (
                              <p className="text-xs italic text-[#64748b] line-clamp-1">
                                &ldquo;{member.oneLiner.trim()}&rdquo;
                              </p>
                            )}

                            {cleanInflixo && (
                              <Link
                                href={`/${cleanInflixo}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#7A2253] hover:underline"
                              >
                                <span>@{cleanInflixo}</span>
                                <ArrowUpRight className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Center: Social Icons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {member.instagramUrl && (
                            <a
                              href={member.instagramUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7EEF2] text-[#E1306C] hover:scale-105 transition-transform"
                              title="Instagram"
                            >
                              <InstagramIcon className="h-4 w-4" />
                            </a>
                          )}
                          {member.youtubeUrl && (
                            <a
                              href={member.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7EEF2] text-[#FF0000] hover:scale-105 transition-transform"
                              title="YouTube"
                            >
                              <YoutubeIcon className="h-4 w-4" />
                            </a>
                          )}
                          {member.facebookUrl && (
                            <a
                              href={member.facebookUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7EEF2] text-[#1877F2] hover:scale-105 transition-transform"
                              title="Facebook"
                            >
                              <FacebookIcon className="h-4 w-4" />
                            </a>
                          )}
                        </div>

                        {/* Right: 3 Action Buttons [ 👁️ ] [ ✏️ ] [ 🗑️ ] */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleMember(member)}
                            className="h-8 w-8 flex items-center justify-center rounded-[5px] border border-[#ECECF0] bg-white hover:bg-[#FAFAFB] text-[#6B6B76] hover:text-[#18181B] transition-colors cursor-pointer"
                            title={member.isActive ? "Hide from profile" : "Show on profile"}
                          >
                            {member.isActive ? (
                              <Eye className="h-4 w-4 text-[#10b981]" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-[#94a3b8]" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenMemberModal(member)}
                            className="h-8 w-8 flex items-center justify-center rounded-[5px] border border-[#ECECF0] bg-white hover:bg-[#FAFAFB] text-[#6B6B76] hover:text-[#18181B] transition-colors cursor-pointer"
                            title="Edit member"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setMemberToDelete(member)}
                            className="h-8 w-8 flex items-center justify-center rounded-[5px] border border-[#ECECF0] bg-white hover:bg-rose-50 text-[#C2414B] transition-colors cursor-pointer"
                            title="Remove member"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TEAM EDIT / CREATE MODAL */}
      <Modal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        size="md"
        title={team ? "Edit team details" : "Create creator team"}
        description="Set up your team name and identity for your public profile."
        icon={<Users className="h-5 w-5" />}
      >
        <form onSubmit={handleSaveTeam} className="flex flex-col flex-1 min-h-0">
          <ModalBody className="p-4 sm:p-5 space-y-4 text-left">
            {/* Info Banner */}
            <div className="flex items-center gap-3 p-3.5 rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F1]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-white border border-[#FCE7F1] text-[#7A2253]">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#7A2253]">What is a Creator Team?</p>
                <p className="text-[11px] text-[#64748b] mt-0.5">Highlight your on-camera talent, directors, editors, writers, and collaborators on your Inflixo profile.</p>
              </div>
            </div>

            {/* Team Name */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-medium text-[#0f172a]">
                  Team Name <span className="text-[#C2414B]">*</span>
                </label>
                <span className="text-[11px] text-[#64748b]">Default: The Crew</span>
              </div>
              <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                  <Users className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="The Crew"
                  className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Team Logo (Optional) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-medium text-[#0f172a]">
                  Team Logo <span className="font-normal text-[#94a3b8]">(Optional)</span>
                </label>
                <span className="text-[11px] text-[#64748b]">Add a team logo to make it stand out.</span>
              </div>
              <label className="relative flex flex-col items-center justify-center p-4 border border-dashed border-[#cbd5e1] rounded-[5px] bg-[#f8fafc] hover:bg-[#f1f5f9] transition-colors cursor-pointer min-h-[96px] group">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  className="sr-only"
                />
                {teamLogoUrl ? (
                  <div className="flex items-center gap-3 w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={teamLogoUrl}
                      alt="Team logo preview"
                      className="h-14 w-14 rounded-[5px] object-cover border border-[#e2e8f0]"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-[#0f172a]">Logo uploaded</span>
                      <span className="block text-[11px] text-[#7A2253] font-medium">Click to change logo</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTeamLogoUrl(null);
                      }}
                      className="h-7 w-7 flex items-center justify-center rounded-[5px] text-[#64748b] hover:text-rose-600 hover:bg-rose-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[5px] text-[#64748b] group-hover:text-[#7A2253] mb-1">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-[#0f172a]">Upload Team Logo</span>
                    <span className="text-[11px] text-[#94a3b8]">JPG, PNG or WebP · Max 5MB</span>
                  </div>
                )}
              </label>
            </div>

            {/* Team Description (Optional) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-medium text-[#0f172a]">
                  Team Description <span className="font-normal text-[#94a3b8]">(Optional)</span>
                </label>
                <span className="text-[11px] text-[#64748b]">Shown on your public team section</span>
              </div>
              <div className="flex rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                <div className="flex w-10 shrink-0 items-start justify-center pt-2.5 border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                  <FileText className="h-4 w-4" />
                </div>
                <textarea
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="e.g. A team of filmmakers, editors and storytellers creating travel and lifestyle content."
                  rows={2}
                  className="flex-1 p-2.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none resize-y"
                />
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="px-5 sm:px-6 py-4">
            <button
              type="button"
              onClick={() => setIsTeamModalOpen(false)}
              className="h-10 px-5 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 rounded-[5px] bg-[#7A2253] hover:opacity-95 text-white font-semibold text-xs transition-all cursor-pointer shadow-md shadow-[#7A2253]/20 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>{isSubmitting ? "Saving..." : team ? "Save changes" : "+ Create team"}</span>
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ADD / EDIT MEMBER MODAL */}
      <Modal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        size="md"
        title={editingMember ? "Edit team member" : "Add team member"}
        description="Add member photo, role, group, one-liner, and social links."
        icon={<Users className="h-5 w-5" />}
      >
        <form onSubmit={handleSaveMember} className="flex flex-col flex-1 min-h-0">
          <ModalBody className="p-4 sm:p-5 space-y-4 text-left max-h-[72vh] overflow-y-auto">
            {/* Member Photo Upload (Required for new members; existing fall back to initials) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-medium text-[#0f172a]">
                  Member Photo {!editingMember && <span className="text-[#C2414B]">*</span>}
                </label>
                <span className="text-[11px] text-[#64748b]">
                  {editingMember ? "Optional (falls back to initials)" : "Required for new members"}
                </span>
              </div>
              <div className="flex items-center gap-3.5">
                <label className="relative h-14 w-14 rounded-full border border-dashed border-[#cbd5e1] bg-[#f8fafc] hover:bg-[#f1f5f9] flex items-center justify-center overflow-hidden cursor-pointer shrink-0 group">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleMemberPhotoUpload}
                    className="sr-only"
                  />
                  {memberAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={memberAvatar}
                      alt="Member avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Camera className="h-5 w-5 text-[#64748b] group-hover:text-[#7A2253]" />
                  )}
                </label>
                <div className="min-w-0 flex-1 space-y-1">
                  <label className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0f172a] hover:bg-[#f8fafc] cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleMemberPhotoUpload}
                      className="sr-only"
                    />
                    <span>{memberAvatar ? "Change photo" : "Upload photo"}</span>
                  </label>
                  {memberAvatar && editingMember && (
                    <button
                      type="button"
                      onClick={() => setMemberAvatar(null)}
                      className="ml-2 text-[11px] font-semibold text-[#C2414B] hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-[11px] text-[#94a3b8]">Displayed as a round portrait on your public team cards.</p>
                </div>
              </div>
            </div>

            {/* Name & Role Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[13px] font-medium text-[#0f172a]">
                  Name <span className="text-[#C2414B]">*</span>
                </label>
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[13px] font-medium text-[#0f172a]">
                  Role <span className="text-[#C2414B]">*</span>
                </label>
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    placeholder="e.g. Lead Video Editor"
                    className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Group: On camera | Behind the camera */}
            <div className="space-y-1">
              <label className="block text-[13px] font-medium text-[#0f172a]">Group</label>
              <div className="grid grid-cols-2 gap-2">
                {(["Behind the camera", "On camera"] as TeamMemberGroup[]).map((grp) => {
                  const selected = memberGroup === grp;
                  return (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setMemberGroup(grp)}
                      className={`h-10 rounded-[5px] border text-xs font-semibold transition-all cursor-pointer ${
                        selected
                          ? "border-[#7A2253] bg-[#FFF0F5] text-[#7A2253] ring-1 ring-[#7A2253]"
                          : "border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc]"
                      }`}
                    >
                      {grp}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* One-liner (80 chars, optional) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-medium text-[#0f172a]">
                  One-liner <span className="font-normal text-[#94a3b8]">(Optional)</span>
                </label>
                <span className="text-[11px] text-[#64748b]">{memberOneLiner.length}/80</span>
              </div>
              <input
                type="text"
                maxLength={80}
                value={memberOneLiner}
                onChange={(e) => setMemberOneLiner(e.target.value.slice(0, 80))}
                placeholder="e.g. The one who always says 'one more take'"
                className="w-full h-10 rounded-[5px] border border-[#e2e8f0] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 focus:border-[#7A2253] outline-none"
              />
            </div>

            {/* Inflixo Username (Optional) */}
            <div className="space-y-1">
              <label className="block text-[13px] font-medium text-[#0f172a]">
                Inflixo Username <span className="font-normal text-[#94a3b8]">(Optional)</span>
              </label>
              <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                <div className="flex h-10 px-3 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-xs font-semibold text-[#64748b]">
                  inflixo.com/
                </div>
                <input
                  type="text"
                  value={memberInflixoUsername}
                  onChange={(e) => setMemberInflixoUsername(extractHandle(e.target.value, "inflixo"))}
                  placeholder="username"
                  className="flex-1 h-10 px-3 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/40 bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Social Profiles (Optional) */}
            <div className="space-y-3 pt-1">
              <div>
                <p className="text-xs font-bold text-[#7A2253]">Social Profiles (Optional)</p>
                <p className="text-[11px] text-[#64748b] mt-0.5">Enter username only — we&apos;ll generate the full profile links automatically.</p>
              </div>

              {/* Instagram */}
              <div className="space-y-1">
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc]">
                    <InstagramIcon className="h-4.5 w-4.5 text-[#E1306C]" />
                  </div>
                  <div className="flex-1 px-3 py-1 min-w-0">
                    <span className="block text-[10px] font-semibold text-[#64748b] leading-tight">Instagram Username</span>
                    <input
                      type="text"
                      value={memberInstagram}
                      onChange={(e) => setMemberInstagram(extractHandle(e.target.value, "instagram"))}
                      placeholder="e.g. johndoe"
                      className="w-full text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/40 bg-transparent outline-none pt-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* YouTube */}
              <div className="space-y-1">
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc]">
                    <YoutubeIcon className="h-4.5 w-4.5 text-[#FF0000]" />
                  </div>
                  <div className="flex-1 px-3 py-1 min-w-0">
                    <span className="block text-[10px] font-semibold text-[#64748b] leading-tight">YouTube Channel Username</span>
                    <input
                      type="text"
                      value={memberYoutube}
                      onChange={(e) => setMemberYoutube(extractHandle(e.target.value, "youtube"))}
                      placeholder="e.g. channelname"
                      className="w-full text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/40 bg-transparent outline-none pt-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Facebook */}
              <div className="space-y-1">
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc]">
                    <FacebookIcon className="h-4.5 w-4.5 text-[#1877F2]" />
                  </div>
                  <div className="flex-1 px-3 py-1 min-w-0">
                    <span className="block text-[10px] font-semibold text-[#64748b] leading-tight">Facebook Username</span>
                    <input
                      type="text"
                      value={memberFacebook}
                      onChange={(e) => setMemberFacebook(extractHandle(e.target.value, "facebook"))}
                      placeholder="e.g. pagename"
                      className="w-full text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/40 bg-transparent outline-none pt-0.5"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="px-5 sm:px-6 py-4">
            <button
              type="button"
              onClick={() => setIsMemberModalOpen(false)}
              className="h-10 px-5 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 rounded-[5px] bg-[#7A2253] hover:opacity-95 text-white font-semibold text-xs transition-all cursor-pointer shadow-md shadow-[#7A2253]/20 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              <span>{isSubmitting ? "Saving..." : editingMember ? "Save changes" : "Add member"}</span>
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
    </PageContainer>
  );
}
