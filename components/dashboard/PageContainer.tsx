import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Shared PageContainer for all /dashboard pages.
 * - Width 100%, no max-width constraint
 * - Padding: 24px top (pt-6), 32px left/right on desktop ≥1024px (lg:px-8), 16px on mobile (px-4), 64px bottom (pb-16)
 * - Vertical gap between sections: 20px (space-y-5)
 */
export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`w-full px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-5 ${className}`}>
      {children}
    </div>
  );
}
