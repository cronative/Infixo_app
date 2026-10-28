/**
 * Faint Inflixo wordmark centred (slightly above centre) on a series cover that has no image.
 * Same PNG + CSS mask as the profile logo (.inflixo-logo), forced to white. Decorative only.
 */
export function SeriesCoverLogo({ size = "card" }: { size?: "card" | "thumb" }) {
  const style =
    size === "card"
      ? { width: "45%", maxWidth: 220, backgroundColor: "#FFFFFF", opacity: 0.18, filter: "blur(1.5px)" }
      : { width: "60%", backgroundColor: "#FFFFFF", opacity: 0.25 };
  return (
    <span
      aria-hidden="true"
      className="inflixo-logo pointer-events-none absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2"
      style={style}
    />
  );
}
