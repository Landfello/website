import type { EscrowStatus, ListingStatus, OwnerListingDraft } from "@/features/ownerListing/types";
import type { StatusBadgeStatus } from "@/features/ownerListing/components";

export function formatMoney(amount: number | null | undefined, currency = "USD"): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatLocation(draft: OwnerListingDraft): string {
  const parts = [
    draft.location.neighborhood,
    draft.location.city,
    draft.location.region,
    draft.location.country,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "Location not set";
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function listingTitle(draft: OwnerListingDraft): string {
  return draft.land.title?.trim() || "Untitled land listing";
}

export function toBadgeStatus(status: ListingStatus): StatusBadgeStatus {
  if (status === "sold") return "verified";
  return status;
}

export function escrowLabel(status: EscrowStatus): string {
  return status.replace(/_/g, " ");
}

export function sectionComplete(draft: OwnerListingDraft, step: number): boolean {
  switch (step) {
    case 1:
      return Boolean(draft.sellerType);
    case 2:
      return (
        Boolean(draft.identity.fullName) &&
        Boolean(draft.identity.phone) &&
        Boolean(draft.identity.email)
      );
    case 3:
      return Boolean(draft.ownership.method) && Boolean(draft.ownership.nameOnRecord);
    case 4:
      return Boolean(draft.location.country) && Boolean(draft.location.city || draft.location.region);
    case 5:
      return Boolean(draft.land.title) && draft.land.size != null;
    case 6:
      return true;
    case 7:
      return draft.documents.length > 0;
    case 8:
      return draft.media.photos.length > 0;
    case 9:
      return true;
    case 10:
      return (
        draft.disclosures.accurateInfoDeclared &&
        draft.disclosures.authorityDeclared &&
        draft.disclosures.termsAccepted
      );
    default:
      return false;
  }
}
