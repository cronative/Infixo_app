"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, Plus, Pencil, Trash2, ShieldCheck, Eye, EyeOff, Camera, ExternalLink, Sparkles } from "lucide-react";
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
          member: {
            id: editingMember?.id,
            name: memberName.trim(),
            role: memberRole.trim(),
            avatarUrl: memberAvatar,
            instagramUrl: buildSocialUrl(memberInstagram, "instagram"),
            youtubeUrl: buildSocialUrl(memberYoutube, "youtube"),
            facebookUrl: buildSocialUrl(memberFacebook, "facebook"),
            sortOrder: editingMember ? editingMember.sortOrder : (team?.members?.length || 0),
            isActive: editingMember?.isActive !== false,
          },
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(editingMember ? "Team member updated! ✨" : "Team member added! 🚀");
        setIsMemberModalOpen(false);
        loadTeam();
      } else {
        showToast(res.error || "Failed to save team member", "error");
      }
    } catch {
      showToast("Failed to save team member", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Member Confirmation
  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/creator/team?memberId=${encodeURIComponent(memberToDelete.id)}&creatorId=${encodeURIComponent(creatorLookup)}`,
        { method: "DELETE" }
      ).then((r) => r.json());

      if (res.success) {
        showToast("Team member removed");
        setMemberToDelete(null);
        loadTeam();
      } else {
        showToast(res.error || "Failed to delete member", "error");
      }
    } catch {
      showToast("Failed to remove member", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Member Visibility
  const handleToggleMember = async (member: TeamMember) => {
    try {
      const updated = !member.isActive;
      await fetch("/api/creator/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: profile.id || creatorLookup,
          email: profile.email,
          action: "save_member",
          member: {
            ...member,
            isActive: updated,
          },
        }),
      });
      showToast(updated ? "Member visible on profile" : "Member hidden from profile");
      loadTeam();
    } catch {}
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E3DC] pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-[#181716] tracking-tight">
            Creator Team
          </h1>
          <p className="text-xs text-[#797570] font-medium mt-0.5">
            Showcase the core team, editors, and creators behind your content on your public profile.
          </p>
        </div>

        {team && (
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenTeamModal}
              className="tap-scale flex items-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] px-3.5 py-2 text-xs font-semibold text-[#181716] transition-colors cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5 text-[#797570]" />
              <span>Edit Team Details</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenMemberModal()}
              className="tap-scale flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Add Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-12 text-center text-xs text-[#797570]">
          Loading team details...
        </div>
      ) : !team ? (
        /* Empty State: Create Team */
        <div className="rounded-3xl border-2 border-dashed border-[#E7E3DC] bg-white p-10 sm:p-14 text-center space-y-4 max-w-xl mx-auto shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#803D63]/[0.09] text-[#803D63] border border-[#803D63]/20">
            <Users className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-[#181716]">
              Build the team behind your content
            </h3>
            <p className="text-xs text-[#797570] font-medium max-w-sm mx-auto leading-relaxed">
              Highlight your directors, editors, writers, and collaborators. Team members will be featured cleanly on your Inflixo public profile.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenTeamModal}
            className="tap-scale inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2.5 px-5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Create Team</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Team Info Card */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#E7E3DC] bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#803D63] text-white font-extrabold text-sm shadow-xs ring-2 ring-[#803D63]/20 shrink-0">
                {getInitials(team.teamName)}
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-[#181716]">{team.teamName}</h2>
                <p className="text-xs text-[#797570] font-medium">
                  {team.members?.length || 0} team {team.members?.length === 1 ? "member" : "members"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenMemberModal()}
              className="tap-scale flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Add Member</span>
            </button>
          </div>

          {/* Team Members List */}
          {(!team.members || team.members.length === 0) ? (
            <div className="rounded-2xl border border-dashed border-[#E7E3DC] bg-white p-8 text-center space-y-2">
              <p className="font-bold text-xs text-[#181716]">No team members added yet</p>
              <p className="text-[11px] text-[#797570]">Click &quot;Add Member&quot; to showcase your collaborators.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className={`relative flex flex-col justify-between rounded-2xl border p-4 bg-white shadow-xs transition-all ${
                    member.isActive ? "border-[#E7E3DC]" : "border-[#E7E3DC] opacity-60 bg-[#F8F7F3]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#803D63] text-white font-extrabold text-xs shadow-xs shrink-0 ring-2 ring-[#803D63]/20">
                      {getInitials(member.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-xs text-[#181716]">{member.name}</h3>
                      <p className="truncate text-[11px] font-medium text-[#803D63]">{member.role}</p>

                      {/* Member Social Links */}
                      <div className="mt-2.5 flex items-center gap-2">
                        {member.instagramUrl && (
                          <a
                            href={member.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-pink-50 text-[#E1306C] hover:scale-110 transition-transform"
                            title="Instagram"
                          >
                            <InstagramIcon className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {member.youtubeUrl && (
                          <a
                            href={member.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-red-50 text-[#FF0000] hover:scale-110 transition-transform"
                            title="YouTube"
                          >
                            <YoutubeIcon className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {member.facebookUrl && (
                          <a
                            href={member.facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-[#1877F2] hover:scale-110 transition-transform"
                            title="Facebook"
                          >
                            <FacebookIcon className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-[#E7E3DC] flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleMember(member)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#797570] hover:text-[#181716] transition-colors cursor-pointer"
                    >
                      {member.isActive ? (
                        <>
                          <Eye className="h-3.5 w-3.5 text-[#17845B]" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5 text-[#797570]" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenMemberModal(member)}
                        className="p-1 text-[#797570] hover:text-[#181716] hover:bg-[#F8F7F3] rounded-lg transition-colors cursor-pointer"
                        title="Edit member"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setMemberToDelete(member)}
                        className="p-1 text-[#797570] hover:text-[#C2414B] hover:bg-[#C2414B]/10 rounded-lg transition-colors cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
          <ModalBody className="p-5 sm:p-6 space-y-4 text-left">
            {/* Live Team Initials Badge Preview */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#F8F7F3] border border-[#E7E3DC]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#803D63] text-white font-extrabold text-sm shadow-xs ring-2 ring-[#803D63]/20 shrink-0">
                {getInitials(teamName || "Team")}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-[#181716] truncate">{teamName.trim() || "Team Name"}</p>
                <span className="inline-block text-[10px] font-semibold text-[#803D63] bg-[#803D63]/[0.09] border border-[#803D63]/20 px-1.5 py-0.5 rounded-md">Creator Team</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#181716] mb-1.5">
                Team Name <span className="text-[#C2414B]">*</span>
              </label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. MediaVerse Studio or Nikunj Films"
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3.5 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </ModalBody>

          <ModalFooter className="px-5 sm:px-6 py-3.5">
            <button
              type="button"
              onClick={() => setIsTeamModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#E7E3DC] text-xs font-semibold text-[#797570] hover:bg-[#F8F7F3] hover:text-[#181716] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
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
          <ModalBody className="p-5 sm:p-6 space-y-4 text-left">
            {/* Live Member Initials Avatar Preview */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#F8F7F3] border border-[#E7E3DC]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#803D63] text-white font-extrabold text-sm shadow-xs ring-2 ring-[#803D63]/20 shrink-0">
                {getInitials(memberName || "Member")}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-[#181716] truncate">{memberName.trim() || "Member Name"}</p>
                <p className="text-[11px] font-medium text-[#803D63] truncate">{memberRole.trim() || "Member Role"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#181716] mb-1.5">
                  Name <span className="text-[#C2414B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3.5 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#181716] mb-1.5">
                  Role <span className="text-[#C2414B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  placeholder="e.g. Lead Video Editor"
                  className="w-full rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3.5 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-[#E7E3DC]">
              <div>
                <p className="text-xs font-bold text-[#181716]">Social Profiles (Optional)</p>
                <p className="text-[11px] text-[#797570] mt-0.5">Enter username only — full profile links are generated automatically.</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#797570] mb-1">
                  Instagram Username
                </label>
                <div className="flex h-10 items-center rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3 transition-colors focus-within:border-[#803D63] focus-within:bg-white">
                  <span className="mr-2 text-[#E1306C] shrink-0">
                    <InstagramIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={memberInstagram}
                    onChange={(e) => setMemberInstagram(extractHandle(e.target.value, "instagram"))}
                    placeholder="Enter username (e.g. johndoe)"
                    className="h-full w-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#181716] placeholder:text-[#797570]/40 outline-none"
                  />
                </div>
                <p className="mt-1 text-[10.5px] font-medium text-[#797570]/80 truncate">
                  Link: <span className="text-[#803D63] font-semibold">https://instagram.com/{memberInstagram || "username"}</span>
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#797570] mb-1">
                  YouTube Channel Username
                </label>
                <div className="flex h-10 items-center rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3 transition-colors focus-within:border-[#803D63] focus-within:bg-white">
                  <span className="mr-2 text-[#FF0000] shrink-0">
                    <YoutubeIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={memberYoutube}
                    onChange={(e) => setMemberYoutube(extractHandle(e.target.value, "youtube"))}
                    placeholder="Enter channel username (e.g. channelname)"
                    className="h-full w-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#181716] placeholder:text-[#797570]/40 outline-none"
                  />
                </div>
                <p className="mt-1 text-[10.5px] font-medium text-[#797570]/80 truncate">
                  Link: <span className="text-[#803D63] font-semibold">https://youtube.com/@{memberYoutube || "channel_username"}</span>
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#797570] mb-1">
                  Facebook Username
                </label>
                <div className="flex h-10 items-center rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3 transition-colors focus-within:border-[#803D63] focus-within:bg-white">
                  <span className="mr-2 text-[#1877F2] shrink-0">
                    <FacebookIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={memberFacebook}
                    onChange={(e) => setMemberFacebook(extractHandle(e.target.value, "facebook"))}
                    placeholder="Enter page or profile username (e.g. pagename)"
                    className="h-full w-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#181716] placeholder:text-[#797570]/40 outline-none"
                  />
                </div>
                <p className="mt-1 text-[10.5px] font-medium text-[#797570]/80 truncate">
                  Link: <span className="text-[#803D63] font-semibold">https://facebook.com/{memberFacebook || "username"}</span>
                </p>
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="px-5 sm:px-6 py-3.5">
            <button
              type="button"
              onClick={() => setIsMemberModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#E7E3DC] text-xs font-semibold text-[#797570] hover:bg-[#F8F7F3] hover:text-[#181716] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
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
