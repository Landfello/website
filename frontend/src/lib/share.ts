/** Build a stable shareable URL for a property listing. */
export function propertyShareUrl(propertyId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/buy?property=${encodeURIComponent(propertyId)}`;
}

/**
 * Share a property link via the Web Share API when available,
 * otherwise copy to clipboard. Returns how it was shared.
 */
export async function sharePropertyLink(
  propertyId: string,
  title?: string
): Promise<"shared" | "copied" | "prompted"> {
  if (!propertyId) throw new Error("Missing property id");
  const url = propertyShareUrl(propertyId);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: title || "Landfello listing",
        text: title ? `Check out ${title} on Landfello` : "Check out this Landfello listing",
        url,
      });
      return "shared";
    } catch (err: any) {
      // User cancelled share sheet — not a failure
      if (err?.name === "AbortError") return "shared";
    }
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return "copied";
    }
  } catch {
    // fall through to prompt
  }

  window.prompt("Copy this link to share:", url);
  return "prompted";
}
