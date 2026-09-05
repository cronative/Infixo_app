"use client";

import { useEffect, useState } from "react";
import { Inbox, Mail, Building2, DollarSign, Calendar, Trash2, Eye, ExternalLink, CheckCircle2, Clock, MessageSquare, AlertCircle } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { CollaborationRequest, CollaborationStatus } from "@/types";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

const STATUS_CONFIG: Record<CollaborationStatus, { label: string; bg: string; text: string; border: string }> = {
  NEW: { label: "New", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  VIEWED: { label: "Viewed", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  REPLIED: { label: "Replied", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  CLOSED: { label: "Closed", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Recently";
  }
}

export default function DashboardRequestsPage() {
  const { profile } = useCreator();
  const { showToast } = useToast();

  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | CollaborationStatus>("ALL");

  // View modal & delete modal
  const [selectedRequest, setSelectedRequest] = useState<CollaborationRequest | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<CollaborationRequest | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const creatorLookup = profile.id || profile.email || profile.username;

  const loadRequests = async () => {
    if (!creatorLookup) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/creator/requests?creatorId=${encodeURIComponent(creatorLookup)}`).then((r) => r.json());
      if (res.success && Array.isArray(res.requests)) {
        setRequests(res.requests);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [creatorLookup]);

  const handleOpenDetail = async (req: CollaborationRequest) => {
    setSelectedRequest(req);
    // Auto-mark as VIEWED if it's currently NEW
    if (req.status === "NEW") {
      try {
        await fetch("/api/creator/requests", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: req.id,
            status: "VIEWED",
            creatorId: profile.id || creatorLookup,
            email: profile.email,
          }),
        });
        setRequests((prev) =>
          prev.map((r) => (r.id === req.id ? { ...r, status: "VIEWED" } : r))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {}
    }
  };

  const handleStatusChange = async (newStatus: CollaborationStatus) => {
    if (!selectedRequest) return;
    setIsUpdating(true);
    try {
      const res = await fetch("/api/creator/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRequest.id,
          status: newStatus,
          creatorId: profile.id || creatorLookup,
          email: profile.email,
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(`Status updated to ${STATUS_CONFIG[newStatus].label}`);
        setSelectedRequest({ ...selectedRequest, status: newStatus });
        setRequests((prev) =>
          prev.map((r) => (r.id === selectedRequest.id ? { ...r, status: newStatus } : r))
        );
      } else {
        showToast(res.error || "Failed to update status", "error");
      }
    } catch {
      showToast("Error updating status", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    setIsUpdating(true);
    try {
      const res = await fetch(
        `/api/creator/requests?id=${encodeURIComponent(requestToDelete.id)}&creatorId=${encodeURIComponent(creatorLookup)}`,
        { method: "DELETE" }
      ).then((r) => r.json());

      if (res.success) {
        showToast("Inquiry deleted");
        if (selectedRequest?.id === requestToDelete.id) {
          setSelectedRequest(null);
        }
        setRequestToDelete(null);
        loadRequests();
      } else {
        showToast(res.error || "Failed to delete request", "error");
      }
    } catch {
      showToast("Failed to delete request", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeTab === "ALL") return true;
    return r.status === activeTab;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECE8EB] pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-[#17131A] tracking-tight flex items-center gap-2">
            <span>Collaboration Inquiries</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-xs text-[#6F6872] font-medium mt-0.5">
            Incoming brand enquiries, partnership briefs, and messages received via your &quot;Work With Me&quot; profile form.
          </p>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-[#ECE8EB] shadow-2xs overflow-x-auto">
        {(["ALL", "NEW", "VIEWED", "REPLIED", "CLOSED"] as const).map((tab) => {
          const isSelected = activeTab === tab;
          const count = tab === "ALL" ? requests.length : requests.filter((r) => r.status === tab).length;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`tap-scale flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? "bg-[#803D63] text-white shadow-xs"
                  : "text-[#6F6872] hover:text-[#17131A] hover:bg-[#FAF8FA]"
              }`}
            >
              <span>{tab === "ALL" ? "All Inquiries" : STATUS_CONFIG[tab].label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-[#FAF8FA] text-[#6F6872]"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="rounded-2xl border border-[#ECE8EB] bg-white p-12 text-center text-xs text-[#6F6872]">
          Loading collaboration requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border-2 border-dashed border-[#ECE8EB] bg-white p-10 sm:p-14 text-center space-y-4 max-w-xl mx-auto shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7EDF3] text-[#803D63]">
            <Inbox className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-[#17131A]">
              No collaboration requests yet
            </h3>
            <p className="text-xs text-[#6F6872] font-medium max-w-sm mx-auto leading-relaxed">
              When brands or sponsors reach out through the &quot;Work With Me&quot; button on your public Inflixo profile, their inquiries will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const conf = STATUS_CONFIG[req.status] || STATUS_CONFIG.NEW;
            return (
              <div
                key={req.id}
                onClick={() => handleOpenDetail(req)}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 rounded-2xl border border-[#ECE8EB] bg-white p-4 shadow-2xs hover:border-[#803D63]/40 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7EDF3] text-[#803D63] font-bold text-sm shrink-0">
                    {req.senderName.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs text-[#17131A] truncate">{req.senderName}</h3>
                      {req.companyName && (
                        <span className="text-[11px] font-semibold text-[#6F6872] truncate">
                          • {req.companyName}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#6F6872] line-clamp-1">
                      {req.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#6F6872]">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Mail className="h-3 w-3" />
                        {req.email}
                      </span>
                      {req.approxBudget && (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#803D63]">
                          <DollarSign className="h-3 w-3" />
                          {req.approxBudget}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(req.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${conf.bg} ${conf.text} ${conf.border}`}>
                    {conf.label}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRequestToDelete(req);
                    }}
                    className="p-1.5 text-[#6F6872] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete inquiry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      <Modal
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        size="md"
        title="Collaboration Inquiry Details"
        description={`Received on ${selectedRequest ? formatDate(selectedRequest.createdAt) : ""}`}
        icon={<Inbox className="h-4 w-4" />}
      >
        {selectedRequest && (
          <div className="flex flex-col flex-1 min-h-0">
            <ModalBody className="p-5 sm:p-6 space-y-4 text-left">
              {/* Sender summary card */}
              <div className="rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#17131A]">{selectedRequest.senderName}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_CONFIG[selectedRequest.status].bg} ${STATUS_CONFIG[selectedRequest.status].text} ${STATUS_CONFIG[selectedRequest.status].border}`}>
                    {STATUS_CONFIG[selectedRequest.status].label}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#6F6872]">
                  {selectedRequest.companyName && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-[#803D63]" />
                      <span className="truncate"><strong>Company:</strong> {selectedRequest.companyName}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#803D63]" />
                    <span className="truncate"><strong>Email:</strong> {selectedRequest.email}</span>
                  </div>

                  {selectedRequest.campaignType && (
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-[#803D63]" />
                      <span className="truncate"><strong>Type:</strong> {selectedRequest.campaignType}</span>
                    </div>
                  )}

                  {selectedRequest.approxBudget && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-[#803D63]" />
                      <span className="truncate"><strong>Budget:</strong> {selectedRequest.approxBudget}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-xs font-bold text-[#17131A] mb-1.5">
                  Message / Requirement:
                </label>
                <div className="rounded-xl border border-[#ECE8EB] bg-white p-3.5 text-xs text-[#17131A] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedRequest.message}
                </div>
              </div>

              {/* Status Update Selector */}
              <div>
                <label className="block text-xs font-bold text-[#17131A] mb-1.5">
                  Update Request Status:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["NEW", "VIEWED", "REPLIED", "CLOSED"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange(st)}
                      className={`tap-scale py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        selectedRequest.status === st
                          ? "bg-[#803D63] text-white border-[#803D63] shadow-xs"
                          : "border-[#ECE8EB] bg-white text-[#6F6872] hover:bg-[#FAF8FA]"
                      }`}
                    >
                      {STATUS_CONFIG[st].label}
                    </button>
                  ))}
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="px-5 sm:px-6 py-3.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRequestToDelete(selectedRequest)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Delete Inquiry
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedRequest.email}?subject=Collaboration with ${encodeURIComponent(profile.displayName || "Inflixo Creator")}`}
                  className="bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Reply via Email</span>
                </a>
              </div>
            </ModalFooter>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={Boolean(requestToDelete)}
        onClose={() => setRequestToDelete(null)}
        onConfirm={handleDeleteRequest}
        title="Delete Collaboration Inquiry?"
        description={`Are you sure you want to delete the inquiry from ${requestToDelete?.senderName || "this contact"}?`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        loading={isUpdating}
      />
    </div>
  );
}
