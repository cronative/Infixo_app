import { ReactNode } from "react";
import { Input } from "@/components/ui/Input";

export function PlatformCard({
  icon,
  name,
  accentClass,
  children,
}: {
  icon: ReactNode;
  name: string;
  accentClass: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-xs transition-all hover:border-purple-200">
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accentClass} shadow-2xs`}>{icon}</div>
        <p className="font-display text-base font-black text-slate-900">{name}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function NumberInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
}) {
  return (
    <Input
      label={label}
      type="number"
      inputMode="numeric"
      min={0}
      placeholder={placeholder ?? "0"}
      value={value === 0 ? "" : value}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
    />
  );
}
