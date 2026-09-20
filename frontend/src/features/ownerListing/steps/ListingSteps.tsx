import { useId } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  ShieldAlert,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Field,
  FileUploadZone,
  SelectableCard,
  StatusBadge,
  YesNoUnknown,
  type StatusBadgeStatus,
  type UploadedFileItem,
  type YesNoUnknownValue,
} from "@/features/ownerListing/components";
import {
  CLOSING_TIMELINE_OPTIONS,
  CONDITION_QUESTIONS,
  COST_RESPONSIBILITY_KEYS,
  COST_RESPONSIBILITY_VALUES,
  CURRENCIES,
  DISCLOSURE_QUESTIONS,
  ENVIRONMENTAL_QUESTIONS,
  ESCROW_OPTIONS,
  ID_TYPES,
  INFRASTRUCTURE_OPTIONS,
  OWNERSHIP_METHODS,
  PAYMENT_OPTIONS,
  PROPERTY_TYPES,
  SELLER_TYPE_OPTIONS,
  SIZE_UNITS,
} from "@/features/ownerListing/constants";
import { documentChecklistFor } from "@/features/ownerListing/store";
import type {
  CoOwner,
  FileReviewStatus,
  IdentityStatus,
  ListingPhoto,
  OwnerListingDraft,
  SellerType,
  TriState,
  UploadedFile,
} from "@/features/ownerListing/types";

type OnChange = (
  patch:
    | Partial<OwnerListingDraft>
    | ((prev: OwnerListingDraft) => OwnerListingDraft),
) => void;

const inputClass = "rounded-2xl border-emerald-900/15";
const sectionClass =
  "space-y-4 rounded-2xl border border-emerald-900/10 bg-emerald-50/20 p-4 sm:p-5";
const textareaClass =
  "flex min-h-[120px] w-full rounded-2xl border border-emerald-900/15 bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-emerald-900 focus-visible:ring-[3px] focus-visible:ring-emerald-900/20 disabled:cursor-not-allowed disabled:opacity-50";

/* ─── helpers ─────────────────────────────────────────────────────────── */

function update(onChange: OnChange, patch: Partial<OwnerListingDraft>) {
  onChange(patch);
}

function toYesNo(value: TriState | undefined | null): YesNoUnknownValue | null {
  if (!value) return null;
  if (value === "unsure") return "unknown";
  if (value === "yes" || value === "no" || value === "unknown") return value;
  return null;
}

function reviewToBadge(status: FileReviewStatus): StatusBadgeStatus {
  switch (status) {
    case "approved":
      return "verified";
    case "needs_info":
      return "action_required";
    case "rejected":
      return "rejected";
    case "pending":
    default:
      return "pending";
  }
}

function badgeToReview(status: StatusBadgeStatus): FileReviewStatus {
  switch (status) {
    case "verified":
    case "published":
      return "approved";
    case "action_required":
      return "needs_info";
    case "rejected":
    case "unsuccessful":
      return "rejected";
    case "pending":
    case "under_review":
    case "draft":
    case "paused":
    default:
      return "pending";
  }
}

function toUploadItem(file: UploadedFile): UploadedFileItem {
  return {
    id: file.id,
    name: file.name,
    type: file.type,
    uploadedAt: file.uploadedAt,
    reviewStatus: reviewToBadge(file.reviewStatus),
    privacy: file.privacy,
    dataUrl: file.dataUrl,
  };
}

function fromUploadItem(item: UploadedFileItem): UploadedFile {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    uploadedAt: item.uploadedAt,
    reviewStatus: badgeToReview(item.reviewStatus),
    privacy: item.privacy,
    dataUrl: item.dataUrl,
  };
}

function identityBadge(
  status: IdentityStatus,
): { status: StatusBadgeStatus; label: string } {
  switch (status) {
    case "verified":
      return { status: "verified", label: "Verified" };
    case "in_progress":
      return { status: "under_review", label: "In progress" };
    case "additional_info_required":
      return { status: "action_required", label: "Additional info required" };
    case "unsuccessful":
      return { status: "unsuccessful", label: "Unsuccessful" };
    case "not_started":
    default:
      return { status: "draft", label: "Not started" };
  }
}

function newCoOwner(): CoOwner {
  return {
    id: `co_${crypto.randomUUID()}`,
    fullName: "",
    relationship: "",
    email: "",
    consentGiven: false,
    sharePercent: undefined,
  };
}

export function withoutEmptyCoOwners(draft: OwnerListingDraft): OwnerListingDraft {
  return {
    ...draft,
    ownership: {
      ...draft.ownership,
      coOwners: draft.ownership.coOwners.filter(
        (c) => c.fullName.trim() || (c.email ?? "").trim(),
      ),
    },
  };
}

function newPhotoId() {
  return `photo_${crypto.randomUUID()}`;
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/* ─── Step 1 — Seller type ────────────────────────────────────────────── */

function Step1SellerType({
  draft,
  onChange,
}: {
  draft: OwnerListingDraft;
  onChange: OnChange;
}) {
  const needsAuth = draft.sellerType && draft.sellerType !== "owner";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SELLER_TYPE_OPTIONS.map((opt) => (
          <SelectableCard
            key={opt.value}
            title={opt.label}
            description={opt.description}
            selected={draft.sellerType === opt.value}
            onClick={() =>
              update(onChange, { sellerType: opt.value as SellerType })
            }
          />
        ))}
      </div>

      {draft.sellerType === "representative" ? (
        <div className={sectionClass}>
          <Field label="Owner's full name" required htmlFor="ownerName">
            <Input
              id="ownerName"
              className={inputClass}
              value={draft.ownerName}
              onChange={(e) => update(onChange, { ownerName: e.target.value })}
              placeholder="Legal name of the land owner"
            />
          </Field>
          <Field label="Your relationship to the owner" required htmlFor="relationship">
            <Input
              id="relationship"
              className={inputClass}
              value={draft.relationship}
              onChange={(e) => update(onChange, { relationship: e.target.value })}
              placeholder="e.g. Family member, attorney, agent"
            />
          </Field>
        </div>
      ) : null}

      {draft.sellerType === "company" ? (
        <div className={sectionClass}>
          <Field label="Company name" required htmlFor="companyName">
            <Input
              id="companyName"
              className={inputClass}
              value={draft.companyName}
              onChange={(e) => update(onChange, { companyName: e.target.value })}
            />
          </Field>
          <Field
            label="Company registration number"
            htmlFor="companyRegistrationNumber"
          >
            <Input
              id="companyRegistrationNumber"
              className={inputClass}
              value={draft.companyRegistrationNumber}
              onChange={(e) =>
                update(onChange, {
                  companyRegistrationNumber: e.target.value,
                })
              }
            />
          </Field>
          <Field label="Your role in the company" htmlFor="companyRole">
            <Input
              id="companyRole"
              className={inputClass}
              value={draft.companyRole}
              onChange={(e) => update(onChange, { companyRole: e.target.value })}
              placeholder="e.g. Director, authorized signatory"
            />
          </Field>
        </div>
      ) : null}

      {draft.sellerType === "estate" ? (
        <div className={sectionClass}>
          <Field label="Name of the deceased / estate" required htmlFor="estateName">
            <Input
              id="estateName"
              className={inputClass}
              value={draft.estateName}
              onChange={(e) => update(onChange, { estateName: e.target.value })}
            />
          </Field>
          <Field label="Probate / administration reference" htmlFor="probateReference">
            <Input
              id="probateReference"
              className={inputClass}
              value={draft.probateReference}
              onChange={(e) =>
                update(onChange, { probateReference: e.target.value })
              }
            />
          </Field>
          <Field label="Your role in the estate" htmlFor="estateRole">
            <Input
              id="estateRole"
              className={inputClass}
              value={draft.estateRole}
              onChange={(e) => update(onChange, { estateRole: e.target.value })}
              placeholder="e.g. Executor, administrator, beneficiary"
            />
          </Field>
        </div>
      ) : null}

      {needsAuth ? (
        <div className={sectionClass}>
          <FileUploadZone
            label="Authorization documents"
            hint="Upload power of attorney, board resolution, probate grant, or other proof you may sell this land."
            files={draft.documents.map(toUploadItem)}
            onChange={(items) =>
              update(onChange, { documents: items.map(fromUploadItem) })
            }
          />
        </div>
      ) : null}
    </div>
  );
}

/* ─── Step 2 — Identity ───────────────────────────────────────────────── */

function Step2Identity({
  draft,
  onChange,
}: {
  draft: OwnerListingDraft;
  onChange: OnChange;
}) {
  const id = draft.identity;
  const badge = identityBadge(id.identityStatus);

  const setIdentity = (patch: Partial<typeof id>) =>
    update(onChange, { identity: { ...id, ...patch } });

  const setSingleFile = (
    key: "idFront" | "idBack" | "selfie",
    items: UploadedFileItem[],
  ) => {
    setIdentity({ [key]: items[0] ? fromUploadItem(items[0]) : null });
  };

  return (
    <div className="space-y-6">
      <div className={sectionClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-emerald-950">
              Identity verification status
            </p>
            <p className="mt-1 text-xs text-emerald-950/55">
              Status updates after you submit ID photos for review.
            </p>
          </div>
          <StatusBadge status={badge.status} label={badge.label} />
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl"
          onClick={() => {
            setIdentity({
              identityStatus:
                id.identityStatus === "in_progress" ? "verified" : "in_progress",
            });
          }}
        >
          Simulate verification
        </Button>
      </div>

      <div className={`${sectionClass} grid gap-4 sm:grid-cols-2`}>
        <Field label="Full legal name" required htmlFor="fullName" className="sm:col-span-2">
          <Input
            id="fullName"
            className={inputClass}
            value={id.fullName}
            onChange={(e) => setIdentity({ fullName: e.target.value })}
          />
        </Field>
        <Field label="Date of birth" htmlFor="dob">
          <Input
            id="dob"
            type="date"
            className={inputClass}
            value={id.dob}
            onChange={(e) => setIdentity({ dob: e.target.value })}
          />
        </Field>
        <Field label="Citizenship" htmlFor="citizenship">
          <Input
            id="citizenship"
            className={inputClass}
            value={id.citizenship}
            onChange={(e) => setIdentity({ citizenship: e.target.value })}
          />
        </Field>
        <Field label="Country of residence" htmlFor="residence">
          <Input
            id="residence"
            className={inputClass}
            value={id.residence}
            onChange={(e) => setIdentity({ residence: e.target.value })}
          />
        </Field>
        <Field label="Residential address" htmlFor="address" className="sm:col-span-2">
          <Input
            id="address"
            className={inputClass}
            value={id.address}
            onChange={(e) => setIdentity({ address: e.target.value })}
          />
        </Field>
        <Field label="Phone" required htmlFor="phone">
          <div className="flex gap-2">
            <Input
              id="phone"
              className={inputClass}
              value={id.phone}
              onChange={(e) => setIdentity({ phone: e.target.value })}
              placeholder="+233…"
            />
            <Button
              type="button"
              variant={id.phoneVerified ? "default" : "outline"}
              className="shrink-0 rounded-2xl"
              onClick={() => setIdentity({ phoneVerified: !id.phoneVerified })}
            >
              {id.phoneVerified ? "Verified" : "Verify"}
            </Button>
          </div>
        </Field>
        <Field label="Email" required htmlFor="email">
          <div className="flex gap-2">
            <Input
              id="email"
              type="email"
              className={inputClass}
              value={id.email}
              onChange={(e) => setIdentity({ email: e.target.value })}
            />
            <Button
              type="button"
              variant={id.emailVerified ? "default" : "outline"}
              className="shrink-0 rounded-2xl"
              onClick={() => setIdentity({ emailVerified: !id.emailVerified })}
            >
              {id.emailVerified ? "Verified" : "Verify"}
            </Button>
          </div>
        </Field>
      </div>

      <div className={sectionClass}>
        <p className="text-sm font-medium text-emerald-950">ID document type</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {ID_TYPES.map((opt) => (
            <SelectableCard
              key={opt.value}
              title={opt.label}
              selected={id.idType === opt.value}
              onClick={() => setIdentity({ idType: opt.value })}
            />
          ))}
        </div>
      </div>

      <div className={sectionClass}>
        <p className="text-sm text-emerald-950/70">
          Upload clear, well-lit photos of your ID. Avoid glare, cropped edges, and
          blurry images. The selfie should show your face clearly next to (or matching)
          the ID.
        </p>
        <FileUploadZone
          label="ID front"
          hint="Front of your government-issued ID"
          multiple={false}
          accept=".jpg,.jpeg,.png,image/*"
          files={id.idFront ? [toUploadItem(id.idFront)] : []}
          onChange={(items) => setSingleFile("idFront", items)}
        />
        <FileUploadZone
          label="ID back"
          hint="Back of your ID (if applicable)"
          multiple={false}
          accept=".jpg,.jpeg,.png,image/*"
          files={id.idBack ? [toUploadItem(id.idBack)] : []}
          onChange={(items) => setSingleFile("idBack", items)}
        />
        <FileUploadZone
          label="Selfie"
          hint="A clear selfie for face match"
          multiple={false}
          accept=".jpg,.jpeg,.png,image/*"
          files={id.selfie ? [toUploadItem(id.selfie)] : []}
          onChange={(items) => setSingleFile("selfie", items)}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-900/10 bg-white p-4">
        <Checkbox
          checked={id.identityConfirmed}
          onCheckedChange={(checked) =>
            setIdentity({ identityConfirmed: checked === true })
          }
          className="mt-0.5"
        />
        <span className="text-sm text-emerald-950">
          I confirm that the identity details and documents provided are mine and
          accurate.
        </span>
      </label>
    </div>
  );
}

/* ─── Step 3 — Ownership ──────────────────────────────────────────────── */

function Step3Ownership({
  draft,
  onChange,
}: {
  draft: OwnerListingDraft;
  onChange: OnChange;
}) {
  const o = draft.ownership;
  const setOwnership = (patch: Partial<typeof o>) =>
    update(onChange, { ownership: { ...o, ...patch } });

  const setTri = (key: keyof typeof o, value: YesNoUnknownValue) => {
    if (key === "multipleOwners" && value === "no") {
      setOwnership({ multipleOwners: value, coOwners: [] });
      return;
    }
    setOwnership({ [key]: value } as Partial<typeof o>);
  };

  const updateCoOwner = (id: string, patch: Partial<CoOwner>) => {
    setOwnership({
      coOwners: o.coOwners.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  return (
    <div className="space-y-6">
      <div className={sectionClass}>
        <p className="text-sm font-medium text-emerald-950">How was ownership acquired?</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {OWNERSHIP_METHODS.map((opt) => (
            <SelectableCard
              key={opt.value}
              title={opt.label}
              selected={o.method === opt.value}
              onClick={() => setOwnership({ method: opt.value })}
            />
          ))}
        </div>
      </div>

      <div className={`${sectionClass} grid gap-4 sm:grid-cols-2`}>
        <Field label="Name on title / record" required htmlFor="nameOnRecord" className="sm:col-span-2">
          <Input
            id="nameOnRecord"
            className={inputClass}
            value={o.nameOnRecord}
            onChange={(e) => setOwnership({ nameOnRecord: e.target.value })}
          />
        </Field>
        <Field label="Acquisition date" htmlFor="acquisitionDate">
          <Input
            id="acquisitionDate"
            type="date"
            className={inputClass}
            value={o.acquisitionDate}
            onChange={(e) => setOwnership({ acquisitionDate: e.target.value })}
          />
        </Field>
        <Field label="Registration date" htmlFor="registrationDate">
          <Input
            id="registrationDate"
            type="date"
            className={inputClass}
            value={o.registrationDate}
            onChange={(e) => setOwnership({ registrationDate: e.target.value })}
          />
        </Field>
        <Field label="Registration number" htmlFor="registrationNumber">
          <Input
            id="registrationNumber"
            className={inputClass}
            value={o.registrationNumber}
            onChange={(e) => setOwnership({ registrationNumber: e.target.value })}
          />
        </Field>
        <Field label="Parcel number" htmlFor="parcelNumber">
          <Input
            id="parcelNumber"
            className={inputClass}
            value={o.parcelNumber}
            onChange={(e) => setOwnership({ parcelNumber: e.target.value })}
          />
        </Field>
        <Field label="Plot number" htmlFor="plotNumber">
          <Input
            id="plotNumber"
            className={inputClass}
            value={o.plotNumber}
            onChange={(e) => setOwnership({ plotNumber: e.target.value })}
          />
        </Field>
        <Field label="Title number" htmlFor="titleNumber">
          <Input
            id="titleNumber"
            className={inputClass}
            value={o.titleNumber}
            onChange={(e) => setOwnership({ titleNumber: e.target.value })}
          />
        </Field>
        <Field label="Survey number" htmlFor="surveyNumber">
          <Input
            id="surveyNumber"
            className={inputClass}
            value={o.surveyNumber}
            onChange={(e) => setOwnership({ surveyNumber: e.target.value })}
          />
        </Field>
        <Field label="Registry office" htmlFor="registryOffice" className="sm:col-span-2">
          <Input
            id="registryOffice"
            className={inputClass}
            value={o.registryOffice}
            onChange={(e) => setOwnership({ registryOffice: e.target.value })}
          />
        </Field>
      </div>

      <div className={`${sectionClass} space-y-4`}>
        {(
          [
            ["nameMatches", "Does the name on record match the seller identity?"],
            ["multipleOwners", "Are there multiple owners on title?"],
            ["spouseConsent", "Is spousal consent required / obtained?"],
            ["customary", "Is this customary / family land?"],
            ["authorityApproval", "Has relevant authority approval been obtained?"],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label}>
            <YesNoUnknown
              value={toYesNo(o[key] as TriState)}
              onChange={(v) => setTri(key, v)}
            />
          </Field>
        ))}
      </div>

      <div className={sectionClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-emerald-950">Co-owners</p>
              <p className="text-xs text-emerald-950/55">
                Optional. Leave this blank if you are the only owner.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                className="rounded-2xl"
                onClick={() =>
                  setOwnership({ multipleOwners: "no", coOwners: [] })
                }
              >
                I don’t have co-owners
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={() =>
                  setOwnership({ coOwners: [...o.coOwners, newCoOwner()] })
                }
              >
                Add co-owner
              </Button>
            </div>
          </div>
          {o.coOwners.length === 0 ? (
            <p className="text-sm text-emerald-950/55">
              You can continue without adding anyone.
            </p>
          ) : (
            <ul className="space-y-4">
              {o.coOwners.map((co, index) => (
                <li
                  key={co.id}
                  className="space-y-3 rounded-2xl border border-emerald-900/10 bg-emerald-50/30 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-emerald-950">
                      Co-owner {index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-xl text-red-700 hover:bg-red-50"
                      onClick={() =>
                        setOwnership({
                          coOwners: o.coOwners.filter((c) => c.id !== co.id),
                        })
                      }
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Full name" htmlFor={`co-name-${co.id}`}>
                      <Input
                        id={`co-name-${co.id}`}
                        className={inputClass}
                        value={co.fullName}
                        onChange={(e) =>
                          updateCoOwner(co.id, { fullName: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Share %" htmlFor={`co-share-${co.id}`}>
                      <Input
                        id={`co-share-${co.id}`}
                        type="number"
                        min={0}
                        max={100}
                        className={inputClass}
                        value={co.sharePercent ?? ""}
                        onChange={(e) =>
                          updateCoOwner(co.id, {
                            sharePercent: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </Field>
                    <Field label="Email" htmlFor={`co-email-${co.id}`} className="sm:col-span-2">
                      <Input
                        id={`co-email-${co.id}`}
                        type="email"
                        className={inputClass}
                        value={co.email ?? ""}
                        onChange={(e) =>
                          updateCoOwner(co.id, { email: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-emerald-950">
                    <Checkbox
                      checked={co.consentGiven}
                      onCheckedChange={(checked) =>
                        updateCoOwner(co.id, { consentGiven: checked === true })
                      }
                    />
                    Consent given to list / sell
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
    </div>
  );
}

/* ─── Step 4 — Location ───────────────────────────────────────────────── */

function Step4Location({
  draft,
  onChange,
}: {
  draft: OwnerListingDraft;
  onChange: OnChange;
}) {
  const loc = draft.location;
  const setLocation = (patch: Partial<typeof loc>) =>
    update(onChange, { location: { ...loc, ...patch } });

  return (
    <div className="space-y-6">
      <div className={`${sectionClass} grid gap-4 sm:grid-cols-2`}>
        {(
          [
            ["country", "Country", true],
            ["region", "Region / state", false],
            ["county", "County / district", false],
            ["city", "City / town", true],
            ["village", "Village", false],
            ["neighborhood", "Neighborhood", false],
            ["street", "Street / access road", false],
            ["landmark", "Nearby landmark", false],
            ["postalCode", "Postal code", false],
          ] as const
        ).map(([key, label, required]) => (
          <Field
            key={key}
            label={label}
            required={required}
            htmlFor={key}
            className={key === "landmark" || key === "street" ? "sm:col-span-2" : undefined}
          >
            <Input
              id={key}
              className={inputClass}
              value={loc[key]}
              onChange={(e) => setLocation({ [key]: e.target.value })}
            />
          </Field>
        ))}
      </div>
    </div>
  );
}

/* ─── Step 5 — Land details ───────────────────────────────────────────── */

function Step5LandDetails({
  draft,
  onChange,
}: {
  draft: OwnerListingDraft;
  onChange: OnChange;
}) {
  const land = draft.land;
  const setLand = (patch: Partial<typeof land>) =>
    update(onChange, { land: { ...land, ...patch } });

  return (
    <div className="space-y-6">
      <div className={`${sectionClass} space-y-4`}>
        <Field label="Listing title" required htmlFor="landTitle">
          <Input
            id="landTitle"
            className={inputClass}
            value={land.title}
            onChange={(e) => setLand({ title: e.target.value })}
            placeholder="e.g. Residential plot — East Airport, Accra"
          />
        </Field>

        <div>
          <p className="mb-3 text-sm font-medium text-emerald-950">Property type</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROPERTY_TYPES.map((opt) => (
              <SelectableCard
                key={opt.value}
                title={opt.label}
                selected={land.propertyType === opt.value}
                onClick={() => setLand({ propertyType: opt.value })}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Size" required htmlFor="landSize">
            <Input
              id="landSize"
              type="number"
              min={0}
              step="any"
              className={inputClass}
              value={land.size ?? ""}
              onChange={(e) =>
                setLand({
                  size: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </Field>
          <Field label="Unit" htmlFor="landUnit">
            <select
              id="landUnit"
              className={`${inputClass} flex h-9 w-full border bg-transparent px-3 text-sm`}
              value={land.unit}
              onChange={(e) => setLand({ unit: e.target.value })}
            >
              {SIZE_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Current use" htmlFor="currentUse">
            <Input
              id="currentUse"
              className={inputClass}
              value={land.currentUse}
              onChange={(e) => setLand({ currentUse: e.target.value })}
            />
          </Field>
          <Field label="Intended use" htmlFor="intendedUse">
            <Input
              id="intendedUse"
              className={inputClass}
              value={land.intendedUse}
              onChange={(e) => setLand({ intendedUse: e.target.value })}
            />
          </Field>
          <Field label="Zoning" htmlFor="zoning">
            <Input
              id="zoning"
              className={inputClass}
              value={land.zoning}
              onChange={(e) => setLand({ zoning: e.target.value })}
            />
          </Field>
          <Field label="Development status" htmlFor="developmentStatus">
            <Input
              id="developmentStatus"
              className={inputClass}
              value={land.developmentStatus}
              onChange={(e) => setLand({ developmentStatus: e.target.value })}
              placeholder="e.g. Vacant, cleared, partially built"
            />
          </Field>
        </div>

        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            className={textareaClass}
            value={land.description}
            onChange={(e) => setLand({ description: e.target.value })}
            placeholder="Describe the land for serious buyers…"
            rows={5}
          />
        </Field>
      </div>

      <div className={`${sectionClass} space-y-4`}>
        <p className="text-sm font-medium text-emerald-950">Condition</p>
        {CONDITION_QUESTIONS.map((q) => (
          <Field key={q.key} label={q.label}>
            <YesNoUnknown
              value={toYesNo(land.conditions[q.key])}
              onChange={(v) =>
                setLand({
                  conditions: { ...land.conditions, [q.key]: v },
                })
              }
            />
          </Field>
        ))}
      </div>

      <div className={`${sectionClass} space-y-3`}>
        <p className="text-sm font-medium text-emerald-950">Infrastructure nearby</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {INFRASTRUCTURE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm text-emerald-950 hover:bg-emerald-50/50"
            >
              <Checkbox
                checked={!!land.infrastructure[opt.value]}
                onCheckedChange={(checked) =>
                  setLand({
                    infrastructure: {
                      ...land.infrastructure,
                      [opt.value]: checked === true,
                    },
                  })
                }
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className={`${sectionClass} space-y-4`}>
        <p className="text-sm font-medium text-emerald-950">Environmental</p>
        {ENVIRONMENTAL_QUESTIONS.map((q) => (
          <Field key={q.key} label={q.label}>
            <YesNoUnknown
              value={toYesNo(land.environmental[q.key])}
              onChange={(v) =>
                setLand({
                  environmental: { ...land.environmental, [q.key]: v },
                })
              }
            />
          </Field>
        ))}
      </div>
    </div>
  );
}

/* ─── Step 6 — Boundaries ─────────────────────────────────────────────── */

function Step6Boundaries({
  draft,
  onChange,
}: {
  draft: OwnerListingDraft;
  onChange: OnChange;
}) {
  const b = draft.boundaries;
  const setBoundaries = (patch: Partial<typeof b>) =>
    update(onChange, { boundaries: { ...b, ...patch } });

  return (
    <div className="space-y-6">
      <div className={`${sectionClass} space-y-4`}>
        {(
          [
            ["surveyed", "Has the land been professionally surveyed?"],
            ["markersVisible", "Are boundary markers / beacons visible?"],
            ["disputes", "Are there any boundary disputes?"],
            ["sizeMatches", "Does the surveyed size match the title size?"],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label}>
            <YesNoUnknown
              value={toYesNo(b[key])}
              onChange={(v) => setBoundaries({ [key]: v })}
            />
          </Field>
        ))}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Survey date" htmlFor="surveyDate">
            <Input
              id="surveyDate"
              type="date"
              className={inputClass}
              value={b.surveyDate}
              onChange={(e) => setBoundaries({ surveyDate: e.target.value })}
            />
          </Field>
          <Field label="Surveyor / firm" htmlFor="surveyor">
            <Input
              id="surveyor"
              className={inputClass}
              value={b.surveyor}
              onChange={(e) => setBoundaries({ surveyor: e.target.value })}
            />
          </Field>
        </div>
      </div>

      <div className={`${sectionClass} grid gap-4 sm:grid-cols-2`}>
        <Field label="North boundary" htmlFor="north">
          <Input
            id="north"
            className={inputClass}
            value={b.north}
            onChange={(e) => setBoundaries({ north: e.target.value })}
            placeholder="What adjoins to the north"
          />
        </Field>
        <Field label="South boundary" htmlFor="south">
          <Input
            id="south"
            className={inputClass}
            value={b.south}
            onChange={(e) => setBoundaries({ south: e.target.value })}
          />
        </Field>
        <Field label="East boundary" htmlFor="east">
          <Input
            id="east"
            className={inputClass}
            value={b.east}
            onChange={(e) => setBoundaries({ east: e.target.value })}
          />
        </Field>
        <Field label="West boundary" htmlFor="west">
          <Input
            id="west"
            className={inputClass}
            value={b.west}
            onChange={(e) => setBoundaries({ west: e.target.value })}
          />
        </Field>
      </div>

      <div className={sectionClass}>
        <FileUploadZone
          label="Survey uploads"
          hint="Optional. Upload site plans, cadastral plans, or survey reports if you have them."
          files={b.surveyUploads.map(toUploadItem)}
          onChange={(items) =>
            setBoundaries({ surveyUploads: items.map(fromUploadItem) })
          }
        />
      </div>

      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Boundary information is provided by the seller and reviewed by Landfello.
        Buyers should still commission an independent survey before closing.
      </p>
    </div>
  );
}

/* ─── Step 7 — Documents ──────────────────────────────────────────────── */

function Step7Documents({
  draft,
  onChange,
}: {
  draft: OwnerListingDraft;
  onChange: OnChange;
}) {
  const checklist = documentChecklistFor(
    draft.location.country,
    draft.ownership.method,
    draft.sellerType,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Fraud warning</p>
          <p className="mt-1 text-red-900/80">
            Never share original title documents outside Landfello or pay upfront
            &quot;verification fees&quot; to third parties. Landfello staff will never ask
            you to transfer money to personal accounts to publish a listing.
          </p>
        </div>
      </div>

      <div className={sectionClass}>
        <p className="text-sm font-medium text-emerald-950">
          Required documents checklist
        </p>
        <p className="mt-1 text-xs text-emerald-950/55">
          Based on {draft.location.country || "your country"}, ownership method, and
          seller type.
        </p>
        <ul className="mt-4 space-y-2">
          {checklist.map((item) => {
            const uploaded = draft.documents.some((d) =>
              d.name.toLowerCase().includes(item.toLowerCase().slice(0, 12)),
            );
            return (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-emerald-950"
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    uploaded ? "bg-emerald-600" : "bg-emerald-900/25"
                  }`}
                />
                {item}
              </li>
            );
          })}
        </ul>
      </div>

      <div className={sectionClass}>
        <FileUploadZone
          label="Upload documents"
          hint="Title, survey, tax clearance, authority letters, and supporting paperwork."
          files={draft.documents.map(toUploadItem)}
          onChange={(items) =>
            update(onChange, { documents: items.map(fromUploadItem) })
          }
        />
      </div>
    </div>
  );
}

/* ─── Step 8 — Photos ─────────────────────────────────────────────────── */

function Step8Photos({
  draft,
  onChange,
}: {
  draft: OwnerListingDraft;
  onChange: OnChange;
}) {
  const inputId = useId();
  const media = draft.media;
  const photos = [...media.photos].sort((a, b) => a.order - b.order);

  const setMedia = (patch: Partial<typeof media>) =>
    update(onChange, { media: { ...media, ...patch } });

  const setPhotos = (next: ListingPhoto[]) => {
    const coverId = next.find((p) => p.isCover)?.id ?? next[0]?.id;
    const withCover = next.map((p, i) => ({
      ...p,
      order: i,
      isCover: p.id === coverId,
    }));
    setMedia({ photos: withCover });
  };

  const handleAddFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const files = Array.from(fileList).filter(
      (f) => f.type.startsWith("image/") || /\.(jpe?g|png|gif|webp)$/i.test(f.name),
    );
    const added: ListingPhoto[] = [];
    for (const file of files) {
      let dataUrl: string | undefined;
      try {
        dataUrl = await readImageAsDataUrl(file);
      } catch {
        dataUrl = undefined;
      }
      added.push({
        id: newPhotoId(),
        caption: "",
        isCover: false,
        order: photos.length + added.length,
        dataUrl,
      });
    }
    setPhotos([...photos, ...added]);
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...photos];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    setPhotos(next);
  };

  return (
    <div className="space-y-6">
      <div className={sectionClass}>
        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-emerald-900/20 bg-emerald-50/40 px-6 py-10 text-center transition-colors hover:border-emerald-900/40 hover:bg-emerald-50/70"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-900 ring-1 ring-emerald-900/10">
            <ImagePlus className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-emerald-950">
              Add land photos
            </p>
            <p className="mt-1 text-xs text-emerald-950/55">
              JPG or PNG. First photo becomes the cover by default.
            </p>
          </div>
          <input
            id={inputId}
            type="file"
            accept="image/*,.jpg,.jpeg,.png,.webp"
            multiple
            className="sr-only"
            onChange={(e) => {
              void handleAddFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        {photos.length > 0 ? (
          <ul className="mt-5 space-y-4">
            {photos.map((photo, index) => (
              <li
                key={photo.id}
                className="flex flex-col gap-4 rounded-2xl border border-emerald-900/10 bg-white p-4 sm:flex-row"
              >
                <div className="h-28 w-full shrink-0 overflow-hidden rounded-2xl bg-emerald-50 sm:w-36">
                  {photo.dataUrl ? (
                    <img
                      src={photo.dataUrl}
                      alt={photo.caption || `Photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-emerald-950/40">
                      No preview
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {photo.isCover ? (
                      <StatusBadge status="verified" label="Cover photo" />
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-xl px-3 text-xs"
                        onClick={() =>
                          setPhotos(
                            photos.map((p) => ({
                              ...p,
                              isCover: p.id === photo.id,
                            })),
                          )
                        }
                      >
                        <Star className="mr-1.5 h-3.5 w-3.5" />
                        Set as cover
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 rounded-xl px-2"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 rounded-xl px-2"
                      disabled={index === photos.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 rounded-xl px-2 text-red-700 hover:bg-red-50"
                      onClick={() =>
                        setPhotos(photos.filter((p) => p.id !== photo.id))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Field label="Caption" htmlFor={`caption-${photo.id}`}>
                    <Input
                      id={`caption-${photo.id}`}
                      className={inputClass}
                      value={photo.caption}
                      onChange={(e) =>
                        setPhotos(
                          photos.map((p) =>
                            p.id === photo.id
                              ? { ...p, caption: e.target.value }
                              : p,
                          ),
                        )
                      }
                      placeholder="Describe what this photo shows"
                    />
                  </Field>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Field label="Optional video URL" htmlFor="videoUrl">
        <Input
          id="videoUrl"
          className={inputClass}
          value={media.videoUrl ?? ""}
          onChange={(e) => setMedia({ videoUrl: e.target.value })}
          placeholder="https://…"
        />
      </Field>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-900/10 bg-white p-4">
        <Checkbox
          checked={media.photoConfirmation}
          onCheckedChange={(checked) =>
            setMedia({ photoConfirmation: checked === true })
          }
          className="mt-0.5"
        />
        <span className="text-sm text-emerald-950">
          I confirm these photos accurately represent the land being listed and
          were taken recently.
        </span>
      </label>
    </div>
  );
}

/* ─── Step 9 — Pricing ────────────────────────────────────────────────── */

function Step9Pricing({
  draft,
  onChange,
}: {
  draft: OwnerListingDraft;
  onChange: OnChange;
}) {
  const p = draft.pricing;
  const setPricing = (patch: Partial<typeof p>) =>
    update(onChange, { pricing: { ...p, ...patch } });

  const togglePayment = (value: string) => {
    const has = p.paymentOptions.includes(value);
    const next = has
      ? p.paymentOptions.filter((v) => v !== value)
      : [...p.paymentOptions, value];
    setPricing({
      paymentOptions: next,
      installmentsAllowed: next.includes("installments"),
    });
  };

  const showInstallments =
    p.paymentOptions.includes("installments") || p.installmentsAllowed;

  return (
    <div className="space-y-6">
      <div className={`${sectionClass} grid gap-4 sm:grid-cols-2`}>
        <Field label="Asking price" required htmlFor="askingPrice">
          <Input
            id="askingPrice"
            type="number"
            min={0}
            className={inputClass}
            value={p.askingPrice ?? ""}
            onChange={(e) =>
              setPricing({
                askingPrice: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </Field>
        <Field label="Currency" required htmlFor="currency">
          <select
            id="currency"
            className={`${inputClass} flex h-9 w-full border bg-transparent px-3 text-sm`}
            value={p.currency}
            onChange={(e) => setPricing({ currency: e.target.value })}
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Price per unit (optional)" htmlFor="pricePerUnit">
          <Input
            id="pricePerUnit"
            type="number"
            min={0}
            className={inputClass}
            value={p.pricePerUnit ?? ""}
            onChange={(e) =>
              setPricing({
                pricePerUnit:
                  e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </Field>
        <Field label="Closing timeline" htmlFor="closingTimeline">
          <select
            id="closingTimeline"
            className={`${inputClass} flex h-9 w-full border bg-transparent px-3 text-sm`}
            value={p.closingTimeline}
            onChange={(e) => setPricing({ closingTimeline: e.target.value })}
          >
            <option value="">Select timeline</option>
            {CLOSING_TIMELINE_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Minimum offer" htmlFor="minOffer">
          <Input
            id="minOffer"
            type="number"
            min={0}
            className={inputClass}
            value={p.minOffer ?? ""}
            onChange={(e) =>
              setPricing({
                minOffer: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </Field>
        <div className="flex flex-col justify-end gap-3 pb-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-emerald-950">
            <Checkbox
              checked={p.negotiable}
              onCheckedChange={(checked) =>
                setPricing({ negotiable: checked === true })
              }
            />
            Price is negotiable
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-emerald-950">
            <Checkbox
              checked={p.hideMinOffer}
              onCheckedChange={(checked) =>
                setPricing({ hideMinOffer: checked === true })
              }
            />
            Hide minimum offer publicly
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-emerald-950">
            <Checkbox
              checked={p.acceptOffersInApp}
              onCheckedChange={(checked) =>
                setPricing({ acceptOffersInApp: checked === true })
              }
            />
            Accept offers in the app
          </label>
        </div>
      </div>

      <div className={`${sectionClass} space-y-3`}>
        <p className="text-sm font-medium text-emerald-950">Payment options</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAYMENT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm text-emerald-950 hover:bg-emerald-50/50"
            >
              <Checkbox
                checked={p.paymentOptions.includes(opt.value)}
                onCheckedChange={() => togglePayment(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>

        {showInstallments ? (
          <div className="mt-4 grid gap-4 rounded-2xl border border-emerald-900/10 bg-emerald-50/30 p-4 sm:grid-cols-2">
            <Field label="Installment months" htmlFor="installmentMonths">
              <Input
                id="installmentMonths"
                type="number"
                min={1}
                className={inputClass}
                value={p.installmentMonths ?? ""}
                onChange={(e) =>
                  setPricing({
                    installmentMonths:
                      e.target.value === "" ? null : Number(e.target.value),
                    installmentsAllowed: true,
                  })
                }
              />
            </Field>
            <Field
              label="Down payment %"
              htmlFor="installmentDownPaymentPercent"
            >
              <Input
                id="installmentDownPaymentPercent"
                type="number"
                min={0}
                max={100}
                className={inputClass}
                value={p.installmentDownPaymentPercent ?? ""}
                onChange={(e) =>
                  setPricing({
                    installmentDownPaymentPercent:
                      e.target.value === "" ? null : Number(e.target.value),
                    installmentsAllowed: true,
                  })
                }
              />
            </Field>
          </div>
        ) : null}
      </div>

      <div className={`${sectionClass} space-y-4`}>
        <p className="text-sm font-medium text-emerald-950">Cost responsibility</p>
        {COST_RESPONSIBILITY_KEYS.map((key) => (
          <Field key={key.value} label={key.label} htmlFor={`cost-${key.value}`}>
            <select
              id={`cost-${key.value}`}
              className={`${inputClass} flex h-9 w-full border bg-transparent px-3 text-sm`}
              value={p.costResponsibility[key.value] ?? ""}
              onChange={(e) =>
                setPricing({
                  costResponsibility: {
                    ...p.costResponsibility,
                    [key.value]: e.target.value,
                  },
                })
              }
            >
              <option value="">Select who pays</option>
              {COST_RESPONSIBILITY_VALUES.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </Field>
        ))}
      </div>

      <div className={sectionClass}>
        <p className="text-sm font-medium text-emerald-950">Escrow preference</p>
        <p className="mt-1 text-xs text-emerald-950/55">
          We recommend platform-supported escrow to protect both parties until title
          transfer is complete.
        </p>
        <div className="mt-4 grid gap-3">
          {ESCROW_OPTIONS.map((opt) => (
            <SelectableCard
              key={opt.value}
              title={opt.label}
              selected={p.escrowChoice === opt.value}
              onClick={() => setPricing({ escrowChoice: opt.value })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 10 — Disclosures ───────────────────────────────────────────── */

function Step10Disclosures({
  draft,
  onChange,
}: {
  draft: OwnerListingDraft;
  onChange: OnChange;
}) {
  const d = draft.disclosures;
  const setDisclosures = (patch: Partial<typeof d>) =>
    update(onChange, { disclosures: { ...d, ...patch } });

  return (
    <div className="space-y-6">
      <div className={`${sectionClass} space-y-5`}>
        {DISCLOSURE_QUESTIONS.map((q) => {
          const answer = toYesNo(d.answers[q.key]);
          const needsExplain = answer === "yes" || answer === "unknown";
          return (
            <div key={q.key} className="space-y-3">
              <Field label={q.label}>
                <YesNoUnknown
                  value={answer}
                  onChange={(v) =>
                    setDisclosures({
                      answers: { ...d.answers, [q.key]: v },
                    })
                  }
                />
              </Field>
              {needsExplain ? (
                <Field
                  label="Please explain"
                  htmlFor={`explain-${q.key}`}
                  required
                >
                  <Input
                    id={`explain-${q.key}`}
                    className={inputClass}
                    value={d.explanations[q.key] ?? ""}
                    onChange={(e) =>
                      setDisclosures({
                        explanations: {
                          ...d.explanations,
                          [q.key]: e.target.value,
                        },
                      })
                    }
                    placeholder="Provide details…"
                  />
                </Field>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className={`${sectionClass} space-y-3`}>
        {(
          [
            [
              "accurateInfoDeclared",
              "I declare that all information provided in this listing is accurate to the best of my knowledge.",
            ],
            [
              "authorityDeclared",
              "I declare that I have the legal authority to list and sell this land.",
            ],
            [
              "noHiddenLiensDeclared",
              "I declare that I have disclosed all known liens, claims, and encumbrances.",
            ],
            [
              "termsAccepted",
              "I accept Landfello's terms of service and listing policies.",
            ],
          ] as const
        ).map(([key, label]) => (
          <label
            key={key}
            className="flex cursor-pointer items-start gap-3 rounded-xl px-1 py-2 text-sm text-emerald-950"
          >
            <Checkbox
              checked={d[key]}
              onCheckedChange={(checked) =>
                setDisclosures({ [key]: checked === true })
              }
              className="mt-0.5"
            />
            {label}
          </label>
        ))}
      </div>

      <div className={sectionClass}>
        <Field
          label="Type your full name as signature"
          required
          htmlFor="signatureName"
          hint="Typing your name confirms this declaration."
        >
          <Input
            id="signatureName"
            className={inputClass}
            value={d.signatureName}
            onChange={(e) => {
              const name = e.target.value;
              setDisclosures({
                signatureName: name,
                signatureData: name.trim() ? `typed:${name.trim()}` : "",
                signedAt: name.trim() ? new Date().toISOString() : "",
              });
            }}
            placeholder="Full legal name"
          />
        </Field>
        {d.signatureName.trim() ? (
          <p className="mt-3 font-serif text-2xl italic text-emerald-900/80">
            {d.signatureName}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ─── validateStep ────────────────────────────────────────────────────── */

export function validateStep(
  step: number,
  draft: OwnerListingDraft,
): string | null {
  switch (step) {
    case 1: {
      if (!draft.sellerType) return "Select how you are listing this land.";
      if (draft.sellerType === "representative") {
        if (!draft.ownerName.trim()) return "Enter the owner's full name.";
        if (!draft.relationship.trim())
          return "Enter your relationship to the owner.";
      }
      if (draft.sellerType === "company" && !draft.companyName.trim()) {
        return "Enter the company name.";
      }
      if (draft.sellerType === "estate" && !draft.estateName.trim()) {
        return "Enter the name of the deceased / estate.";
      }
      return null;
    }
    case 2: {
      const id = draft.identity;
      if (!id.fullName.trim()) return "Enter your full legal name.";
      if (!id.phone.trim()) return "Enter your phone number.";
      if (!id.email.trim()) return "Enter your email address.";
      if (!id.idType) return "Select an ID document type.";
      if (!id.identityConfirmed)
        return "Confirm that your identity details are accurate.";
      return null;
    }
    case 3: {
      if (!draft.ownership.method) return "Select how ownership was acquired.";
      if (!draft.ownership.nameOnRecord.trim())
        return "Enter the name on the title / record.";
      return null;
    }
    case 4: {
      if (!draft.location.country.trim()) return "Enter the country.";
      if (!draft.location.city.trim()) return "Enter the city or town.";
      return null;
    }
    case 5: {
      if (!draft.land.title.trim()) return "Enter a listing title.";
      if (!draft.land.propertyType) return "Select a property type.";
      if (draft.land.size == null || Number.isNaN(draft.land.size) || draft.land.size <= 0)
        return "Enter a valid land size.";
      return null;
    }
    case 6: {
      return null;
    }
    case 7: {
      if (draft.documents.length === 0)
        return "Upload at least one supporting document.";
      return null;
    }
    case 8: {
      if (draft.media.photos.length === 0)
        return "Add at least one photo of the land.";
      if (!draft.media.photoConfirmation)
        return "Confirm that your photos accurately represent the land.";
      return null;
    }
    case 9: {
      if (draft.pricing.askingPrice == null || draft.pricing.askingPrice <= 0)
        return "Enter a valid asking price.";
      if (!draft.pricing.currency) return "Select a currency.";
      if (!draft.pricing.escrowChoice) return "Select an escrow preference.";
      return null;
    }
    case 10: {
      const d = draft.disclosures;
      for (const q of DISCLOSURE_QUESTIONS) {
        const answer = toYesNo(d.answers[q.key]);
        if (!answer) return `Answer the disclosure: ${q.label}`;
        if (
          (answer === "yes" || answer === "unknown") &&
          !(d.explanations[q.key] ?? "").trim()
        ) {
          return `Explain your answer for: ${q.label}`;
        }
      }
      if (!d.accurateInfoDeclared)
        return "Confirm that the information provided is accurate.";
      if (!d.authorityDeclared)
        return "Confirm that you have authority to list this land.";
      if (!d.noHiddenLiensDeclared)
        return "Confirm you have disclosed known liens and claims.";
      if (!d.termsAccepted) return "Accept the terms to continue.";
      if (!d.signatureName.trim()) return "Type your full name as signature.";
      return null;
    }
    default:
      return null;
  }
}

/* ─── ListingStepContent ──────────────────────────────────────────────── */

export function ListingStepContent({
  step,
  draft,
  onChange,
}: {
  step: number;
  draft: OwnerListingDraft;
  onChange: OnChange;
}) {
  switch (step) {
    case 1:
      return <Step1SellerType draft={draft} onChange={onChange} />;
    case 2:
      return <Step2Identity draft={draft} onChange={onChange} />;
    case 3:
      return <Step3Ownership draft={draft} onChange={onChange} />;
    case 4:
      return <Step4Location draft={draft} onChange={onChange} />;
    case 5:
      return <Step5LandDetails draft={draft} onChange={onChange} />;
    case 6:
      return <Step6Boundaries draft={draft} onChange={onChange} />;
    case 7:
      return <Step7Documents draft={draft} onChange={onChange} />;
    case 8:
      return <Step8Photos draft={draft} onChange={onChange} />;
    case 9:
      return <Step9Pricing draft={draft} onChange={onChange} />;
    case 10:
      return <Step10Disclosures draft={draft} onChange={onChange} />;
    default:
      return (
        <p className="text-sm text-emerald-950/60">
          Unknown step. Please go back and try again.
        </p>
      );
  }
}
