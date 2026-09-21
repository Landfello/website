import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Circle,
  Eye,
  Pencil,
} from "lucide-react";
import { TopNav } from "@/components/Profile/TopNav";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/features/ownerListing/components";
import { getListing, saveListing } from "@/features/ownerListing/store";
import { STEP_META, type OwnerListingDraft } from "@/features/ownerListing/types";
import { useAuth } from "@/contexts/AuthContext";
import { createProperty, type Property } from "@/services/propertyService";
import {
  formatLocation,
  formatMoney,
  listingTitle,
  sectionComplete,
  toBadgeStatus,
} from "./helpers";

function toApiPropertyType(value: string): Property["propertyType"] {
  const map: Record<string, Property["propertyType"]> = {
    residential: "Residential",
    commercial: "Commercial",
    agricultural: "Agricultural",
    mixed_use: "Mixed Use",
  };
  return map[value] || "Residential";
}

function toAcres(size: number | null, unit: string): number {
  if (!size) return 0;
  if (unit === "hectares") return size * 2.471;
  if (unit === "sqm") return size / 4046.86;
  return size;
}

export default function OwnerListingReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [draft, setDraft] = useState<OwnerListingDraft | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const listing = getListing(id);
    if (!listing) {
      navigate("/sell/owner/dashboard", { replace: true });
      return;
    }
    setDraft(listing);
  }, [id, navigate]);

  const completedCount = useMemo(() => {
    if (!draft) return 0;
    return STEP_META.filter((s) => sectionComplete(draft, s.step)).length;
  }, [draft]);

  if (!draft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emerald-50 text-sm text-emerald-950/70">
        Loading review…
      </div>
    );
  }

  const editStep = (step: number) => {
    saveListing({ ...draft, currentStep: step });
    navigate(`/sell/owner/listing/${draft.id}?step=${step}`);
  };

  const submitForVerification = async () => {
    if (!confirmed) {
      setError("Please confirm you have reviewed this listing before submitting.");
      return;
    }
    if (!currentUser) {
      setError("You must be signed in to publish this listing.");
      return;
    }

    setSubmitting(true);
    try {
      const email =
        draft.identity.email?.includes("@") ? draft.identity.email : currentUser.email;
      await createProperty({
        userId: currentUser.uid,
        listingType: "sale",
        title: listingTitle(draft),
        description: draft.land.description || listingTitle(draft),
        country: draft.location.country || "Unknown",
        city: draft.location.city || draft.location.region || "Unknown",
        neighborhood: draft.location.neighborhood || undefined,
        propertyType: toApiPropertyType(draft.land.propertyType),
        areaAcres: toAcres(draft.land.size, draft.land.unit),
        tenure: "Freehold",
        price: draft.pricing.askingPrice ?? undefined,
        tags: [],
        images: draft.media.photos
          .map((p) => p.dataUrl)
          .filter((url): url is string => Boolean(url)),
        contactName: draft.identity.fullName || currentUser.email,
        contactPhone: draft.identity.phone || "n/a",
        contactEmail: email,
      });
    } catch (err: any) {
      setError(err.message || "Could not publish listing to the marketplace.");
      setSubmitting(false);
      return;
    }

    const badges = Array.from(
      new Set([
        ...draft.verificationBadges,
        "submitted_for_review",
        draft.identity.identityStatus === "verified" ? "identity_verified" : "",
      ].filter(Boolean)),
    );
    const updated = saveListing({
      ...draft,
      status: "under_review",
      verificationBadges: badges,
      currentStep: 10,
    });
    setDraft(updated);
    navigate(`/sell/owner/listing/${updated.id}/success`);
  };

  const saveAsDraft = () => {
    saveListing({ ...draft, status: "draft" });
    navigate("/sell/owner/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50/30">
      <TopNav />

      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => navigate(`/sell/owner/listing/${draft.id}?step=10`)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-900/70 hover:text-emerald-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to disclosures
        </button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-emerald-950 sm:text-3xl">
              Review your listing
            </h1>
            <p className="mt-1 text-sm text-emerald-950/65">
              {completedCount} of {STEP_META.length} sections look complete. Edit anything before
              submitting for verification.
            </p>
          </div>
          <StatusBadge status={toBadgeStatus(draft.status)} />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            {STEP_META.map((meta) => {
              const done = sectionComplete(draft, meta.step);
              return (
                <div
                  key={meta.step}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {done ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 text-emerald-950/25" />
                    )}
                    <div>
                      <div className="text-sm font-semibold text-emerald-950">
                        {meta.step}. {meta.title}
                      </div>
                      <div className="mt-0.5 text-xs text-emerald-950/55">
                        {done ? "Looks complete" : "Needs attention"}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => editStep(meta.step)}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
                <Eye className="h-4 w-4 text-emerald-700" />
                Buyer preview
              </div>
              <h2 className="mt-3 text-lg font-semibold text-emerald-950">
                {listingTitle(draft)}
              </h2>
              <p className="mt-1 text-sm text-emerald-950/65">{formatLocation(draft)}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-emerald-950/50">Price</div>
                  <div className="font-semibold text-emerald-950">
                    {formatMoney(draft.pricing.askingPrice, draft.pricing.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-emerald-950/50">Size</div>
                  <div className="font-semibold text-emerald-950">
                    {draft.land.size != null
                      ? `${draft.land.size} ${draft.land.unit}`
                      : "—"}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-emerald-950/50">Type</div>
                  <div className="font-semibold capitalize text-emerald-950">
                    {draft.land.propertyType?.replace(/_/g, " ") || "—"}
                  </div>
                </div>
              </div>
              {draft.verificationBadges.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {draft.verificationBadges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800"
                    >
                      <BadgeCheck className="h-3 w-3" />
                      {badge.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="mt-4 text-sm leading-relaxed text-emerald-950/70">
                {draft.land.description || "No description yet."}
              </p>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-emerald-950/10 bg-white p-4 text-sm text-emerald-950/80">
              <Checkbox
                checked={confirmed}
                onCheckedChange={(v) => {
                  setConfirmed(v === true);
                  setError(null);
                }}
                className="mt-0.5"
              />
              <span>
                I confirm I have reviewed this listing and the information is accurate to the best
                of my knowledge.
              </span>
            </label>

            {error ? (
              <p className="text-sm text-red-700">{error}</p>
            ) : null}

            <Button
              type="button"
              onClick={submitForVerification}
              disabled={submitting}
              className="w-full rounded-2xl bg-emerald-900 text-white hover:bg-emerald-900/90"
            >
              {submitting ? "Publishing listing…" : "Submit Listing for Verification"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={saveAsDraft}
              className="w-full rounded-2xl"
            >
              Save as Draft
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
