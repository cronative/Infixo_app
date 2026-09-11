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
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cbd5e1] hover:shadow-md sm:p-4">
      <div className="space-y-2.5">{children}</div>
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
