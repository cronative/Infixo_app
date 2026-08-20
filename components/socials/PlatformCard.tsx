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
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
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
