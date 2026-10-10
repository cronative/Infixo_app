"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Trash2,
  Sparkles,
  Lock,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface DomainConfig {
  customDomain: string | null;
  isVerified: boolean;
  configuredAt: string | null;
  targetCname: string;
  planKey: string;
  canUseCustomDomain: boolean;
  instructions: {
    recordType: string;
    host: string;
    pointsTo: string;
    ttl: string;
  };
}

export function CustomDomainCard() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<DomainConfig | null>(null);
  const [domainInput, setDomainInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);

  async function fetchConfig() {
    try {
      const res = await fetch("/api/creator/domain");
      if (res.ok) {
        const json = await res.json();
        if (json.status === 1 && json.data) {
          setConfig(json.data);
          if (json.data.customDomain) {
            setDomainInput(json.data.customDomain);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load domain config:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConfig();
  }, []);

  async function handleSaveDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!domainInput.trim() || saving) return;

    setSaving(true);
    try {
      const res = await fetch("/api/creator/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainInput.trim() }),
      });
      const json = await res.json();

      if (res.ok && json.status === 1) {
        showToast(json.message || "Custom domain saved! Please configure your DNS CNAME.");
        await fetchConfig();
      } else {
        showToast(json.message || "Failed to save domain", "error");
      }
    } catch {
      showToast("Network error while saving domain", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleVerifyDNS() {
    if (verifying) return;
    setVerifying(true);

    try {
      const res = await fetch("/api/creator/domain/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();

      if (res.ok && json.status === 1) {
        showToast(json.message || "Domain verified successfully! 🎉");
        await fetchConfig();
      } else {
        showToast(json.message || "DNS verification failed. Please check your CNAME record.", "error");
      }
    } catch {
      showToast("Network error while verifying DNS", "error");
    } finally {
      setVerifying(false);
    }
  }

  async function handleDisconnectDomain() {
    if (disconnecting) return;
    if (!confirm("Are you sure you want to disconnect this custom domain? Your Inflixo profile will still remain available at inflixo.com/@username.")) {
      return;
    }

    setDisconnecting(true);
    try {
      const res = await fetch("/api/creator/domain", { method: "DELETE" });
      const json = await res.json();

      if (res.ok && json.status === 1) {
        showToast("Custom domain disconnected.");
        setDomainInput("");
        await fetchConfig();
      } else {
        showToast(json.message || "Failed to disconnect domain", "error");
      }
    } catch {
      showToast("Network error while disconnecting domain", "error");
    } finally {
      setDisconnecting(false);
    }
  }

  function handleCopyCname(text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedTarget(true);
      showToast("Copied to clipboard!");
      setTimeout(() => setCopiedTarget(false), 2000);
    }
  }

  if (loading) {
    return (
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#64748b]">
          <RefreshCw className="h-4 w-4 animate-spin text-[#7A2253]" />
          <span>Loading domain settings...</span>
        </div>
      </section>
    );
  }

  // If creator is on Starter/Free and cannot use custom domains
  if (config && !config.canUseCustomDomain) {
    return (
      <section className="group relative overflow-hidden rounded-xl border border-[#7A2253]/20 bg-white p-4 sm:p-5 shadow-xs">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#7A2253]" aria-hidden="true" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#7A2253]" />
              <h2 className="text-sm font-bold text-[#0f172a]">Custom Domain Mapping</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#7A2253]/[0.08] px-2 py-0.5 text-[10px] font-bold text-[#7A2253]">
                <Lock className="h-2.5 w-2.5" />
                Pro & VIP Feature
              </span>
            </div>
            <p className="text-xs text-[#64748b] leading-relaxed max-w-xl">
              Connect your own vanity domain (e.g. <span className="font-semibold text-[#7A2253]">links.yourname.com</span> or <span className="font-semibold text-[#7A2253]">yourbrand.in</span>) to your Inflixo creator bio link.
            </p>
          </div>
          <Link
            href="/dashboard/subscription"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#7A2253] hover:opacity-95 text-white text-xs font-bold py-2.5 px-4 transition-all shrink-0 cursor-pointer shadow-md shadow-[#7A2253]/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Upgrade to Pro</span>
          </Link>
        </div>
      </section>
    );
  }

  const hasDomain = Boolean(config?.customDomain);
  const isVerified = Boolean(config?.isVerified);
  const targetCname = config?.targetCname || "cname.inflixo.com";

  return (
    <section className="group relative overflow-hidden rounded-xl border border-[#e2e8f0] bg-white p-4 sm:p-5 shadow-xs space-y-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#7A2253]" aria-hidden="true" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e8f0] pb-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-[#7A2253]" />
          <h2 className="text-sm font-bold text-[#0f172a]">Custom Domain Mapping</h2>
        </div>

        {hasDomain && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
              isVerified
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            {isVerified ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Active &amp; Verified
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 text-amber-600" />
                DNS Verification Pending
              </>
            )}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-[#64748b] leading-relaxed">
        Point your own subdomain or domain (e.g. <strong className="text-[#0f172a]">links.yourname.com</strong>) to Inflixo so fans can visit your bio link on your brand domain.
      </p>

      {/* Form */}
      <form onSubmit={handleSaveDomain} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-xs font-medium text-[#94a3b8]">https://</span>
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value.toLowerCase().trim())}
              placeholder="links.yourdomain.com"
              disabled={saving || hasDomain}
              className="w-full rounded-lg border border-[#e2e8f0] bg-white pl-18 pr-3 py-2 text-xs font-semibold text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7A2253] focus:outline-none disabled:bg-[#f8fafc] disabled:text-[#64748b]"
            />
          </div>

          {!hasDomain ? (
            <button
              type="submit"
              disabled={saving || !domainInput.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#7A2253] hover:bg-brand-hover text-white text-xs font-bold px-4 py-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              <span>Connect Domain</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {!isVerified && (
                <button
                  type="button"
                  onClick={handleVerifyDNS}
                  disabled={verifying}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#7A2253] hover:bg-brand-hover text-white text-xs font-bold px-3 py-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {verifying ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  <span>Verify DNS</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDisconnectDomain}
                disabled={disconnecting}
                title="Disconnect custom domain"
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold px-3 py-2 transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            </div>
          )}
        </div>
      </form>

      {/* DNS Configuration Instructions (Shown when domain is saved) */}
      {hasDomain && (
        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3.5 space-y-2.5 text-xs text-left">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#0f172a]">Required DNS Record:</span>
            {isVerified && (
              <a
                href={`https://${config?.customDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7A2253] hover:underline"
              >
                <span>Visit {config?.customDomain}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white rounded border border-[#e2e8f0] p-2.5 text-[11px]">
            <div>
              <p className="text-[#64748b] font-medium">Record Type</p>
              <p className="font-bold text-[#0f172a]">CNAME</p>
            </div>
            <div>
              <p className="text-[#64748b] font-medium">Name / Host</p>
              <p className="font-bold text-[#0f172a]">
                {config?.instructions?.host || "links"}
              </p>
            </div>
            <div>
              <p className="text-[#64748b] font-medium">Target / Points To</p>
              <div className="flex items-center gap-1">
                <span className="font-mono font-bold text-[#7A2253] truncate">{targetCname}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCname(targetCname)}
                  className="text-[#64748b] hover:text-[#7A2253] cursor-pointer"
                  title="Copy CNAME target"
                >
                  {copiedTarget ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#64748b] leading-relaxed">
            Log in to your domain registrar (GoDaddy, Cloudflare, Namecheap, Google Domains) and add this CNAME record. DNS changes may take up to a few minutes to propagate worldwide.
          </p>
        </div>
      )}
    </section>
  );
}
