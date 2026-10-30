import { GlobalFooter } from "@/components/shared/GlobalFooter";

/** Shared footer for legal pages (Terms, Creator Terms, Privacy, Cookies). */
export function LegalFooter({ current }: { current?: string }) {
  return (
    <div className="border-t border-[#E7E3DC] bg-white w-full">
      <div className="mx-auto max-w-[960px] px-4 py-3 sm:px-6">
        <GlobalFooter />
      </div>
    </div>
  );
}
