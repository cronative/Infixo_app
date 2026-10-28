/**
 * The dashboard header's Inflixo wordmark (/images/inflixo-wordmark-title.png), recoloured with the
 * theme's --wordmark token through a CSS mask (see .inflixo-logo in app/globals.css). Set the height;
 * width follows the PNG's aspect ratio.
 */
export function InflixoWordmark({ className = "h-7" }: { className?: string }) {
  return <span role="img" aria-label="Inflixo" className={`inflixo-logo inline-block shrink-0 ${className}`} />;
}
