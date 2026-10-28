"use client";

import {
  useRef,
  useEffect,
  KeyboardEvent,
  ClipboardEvent,
  ChangeEvent,
  forwardRef,
  useImperativeHandle,
} from "react";

export interface OtpInputHandle {
  clearAndFocus: () => void;
  focus: () => void;
}

interface OtpInputProps {
  length?: number;
  value: string[];
  onChange: (digits: string[]) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  isShaking?: boolean;
}

export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(
  (
    {
      length = 4,
      value,
      onChange,
      onComplete,
      disabled = false,
      hasError = false,
      isShaking = false,
    },
    ref
  ) => {
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    useImperativeHandle(ref, () => ({
      clearAndFocus: () => {
        onChange(Array(length).fill(""));
        inputsRef.current[0]?.focus();
      },
      focus: () => {
        const firstEmpty = value.findIndex((d) => !d);
        const target = firstEmpty === -1 ? length - 1 : firstEmpty;
        inputsRef.current[target]?.focus();
      },
    }));

    useEffect(() => {
      // Auto focus first input on mount
      const timer = setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }, []);

    const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const raw = e.target.value;
      const clean = raw.replace(/\D/g, "").slice(-1);
      const next = [...value];
      next[index] = clean;
      onChange(next);

      if (clean && index < length - 1) {
        inputsRef.current[index + 1]?.focus();
      }

      if (next.every((d) => d !== "") && onComplete) {
        onComplete(next.join(""));
      }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (e.key === "Backspace") {
        if (!value[index] && index > 0) {
          inputsRef.current[index - 1]?.focus();
          const next = [...value];
          next[index - 1] = "";
          onChange(next);
        } else if (value[index]) {
          const next = [...value];
          next[index] = "";
          onChange(next);
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputsRef.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < length - 1) {
        inputsRef.current[index + 1]?.focus();
      }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      e.preventDefault();
      const pasted = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, length);
      if (!pasted) return;

      const next = Array(length).fill("");
      pasted.split("").forEach((digit, i) => {
        next[i] = digit;
      });
      onChange(next);

      const targetIndex = Math.min(pasted.length, length) - 1;
      inputsRef.current[targetIndex]?.focus();

      if (pasted.length === length && onComplete) {
        onComplete(pasted);
      }
    };

    return (
      <div
        className={`flex justify-center gap-2.5 sm:gap-3 ${
          isShaking ? "animate-shake" : ""
        }`}
      >
        {Array.from({ length }).map((_, i) => {
          const digit = value[i] || "";
          return (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={1}
              disabled={disabled}
              value={digit}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              aria-label={`Digit ${i + 1}`}
              className={`h-12 w-12 rounded-[5px] border text-center text-xl font-extrabold transition-all duration-150 outline-none sm:h-13 sm:w-13 ${
                hasError
                  ? "border-[#DC2626] bg-rose-50/20 text-[#DC2626] ring-2 ring-[#DC2626]/20"
                  : digit
                  ? "border-[#7A2253] bg-white text-[#18181B] ring-2 ring-[#7A2253]/20 shadow-xs"
                  : "border-[#E4E4E7] bg-zinc-50 text-[#18181B] focus:border-[#7A2253] focus:bg-white focus:ring-2 focus:ring-[#7A2253]/15"
              } ${disabled ? "opacity-50 cursor-not-allowed bg-zinc-100" : ""}`}
            />
          );
        })}

        <style jsx global>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-6px); }
            40%, 80% { transform: translateX(6px); }
          }
          .animate-shake {
            animation: shake 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
          }
        `}</style>
      </div>
    );
  }
);

OtpInput.displayName = "OtpInput";
