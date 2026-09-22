/** Build a stable shareable URL that opens that listing on the buy page. */
export function propertyShareUrl(propertyId: string): string {
  const origin =
    (typeof window !== "undefined" && window.location?.origin) ||
    import.meta.env.VITE_PUBLIC_SITE_URL ||
    "";
  const base = String(origin).replace(/\/$/, "");
  return `${base}/buy?property=${encodeURIComponent(propertyId)}`;
}

/**
 * Share a direct link to a property.
 * Always prefers putting `/buy?property=<id>` on the clipboard so recipients
 * land on that exact listing. Uses the native share sheet on mobile when available.
 */
export async function sharePropertyLink(
  propertyId: string,
  title?: string
): Promise<"shared" | "copied" | "prompted"> {
  if (!propertyId) throw new Error("Missing property id");
  const url = propertyShareUrl(propertyId);

  // 1) Copy first so we always have a working deep link even if share is cancelled
  let copied = false;
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      copied = true;
    }
  } catch {
    // continue to other fallbacks
  }

  // 2) Native share sheet (mobile) — still pass the same deep link
  const canNativeShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    (!navigator.canShare ||
      navigator.canShare({
        title: title || "Landfello listing",
        text: title ? `Check out ${title} on Landfello` : "Check out this Landfello listing",
        url,
      }));

  if (canNativeShare) {
    try {
      await navigator.share({
        title: title || "Landfello listing",
        text: title ? `Check out ${title} on Landfello` : "Check out this Landfello listing",
        url,
      });
      return "shared";
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return copied ? "copied" : "prompted";
      }
    }
  }

  if (copied) return "copied";

  window.prompt("Copy this link to open the listing:", url);
  return "prompted";
}
