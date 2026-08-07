/**
 * Scrolls smoothly to the first field that contains a validation error and focuses it.
 */
export function scrollToFirstError(errorsObj: Record<string, string | undefined | boolean>) {
  const errorKeys = Object.keys(errorsObj).filter((k) => Boolean(errorsObj[k]));
  if (errorKeys.length === 0) return;

  const firstKey = errorKeys[0];
  setTimeout(() => {
    const el =
      document.getElementById(firstKey) ||
      document.querySelector(`[name="${firstKey}"]`) ||
      document.querySelector(`[data-field="${firstKey}"]`);

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusable = el.querySelector("input, select, textarea, button") || el;
      if (focusable && "focus" in focusable && typeof (focusable as HTMLElement).focus === "function") {
        (focusable as HTMLElement).focus();
      }
    }
  }, 60);
}
