import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { StepperShell } from "@/features/ownerListing/components";
import {
  ListingStepContent,
  validateStep,
  withoutEmptyCoOwners,
} from "@/features/ownerListing/steps/ListingSteps";
import { getListing, saveListing } from "@/features/ownerListing/store";
import { STEP_META, type OwnerListingDraft } from "@/features/ownerListing/types";

export default function OwnerListingFlow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState<OwnerListingDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const stepFromQuery = Number(searchParams.get("step"));

  useEffect(() => {
    if (!id) return;
    const listing = getListing(id);
    if (!listing) {
      navigate("/sell/owner", { replace: true });
      return;
    }
    const nextStep =
      Number.isFinite(stepFromQuery) && stepFromQuery >= 1 && stepFromQuery <= 10
        ? stepFromQuery
        : listing.currentStep;
    setDraft({
      ...listing,
      currentStep: nextStep,
      ownership: {
        ...listing.ownership,
        coOwners: listing.ownership.coOwners.filter(
          (c) => c.fullName.trim() || (c.email ?? "").trim(),
        ),
      },
    });
  }, [id, navigate, stepFromQuery]);

  const stepMeta = useMemo(() => {
    const step = draft?.currentStep ?? 1;
    return STEP_META.find((s) => s.step === step) ?? STEP_META[0];
  }, [draft?.currentStep]);

  const isIncompleteDraft = draft?.status === "draft";

  useEffect(() => {
    if (!isIncompleteDraft || !dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, isIncompleteDraft]);

  const persist = useCallback(
    (next: OwnerListingDraft) => {
      setSaving(true);
      try {
        const saved = saveListing(next);
        setDraft(saved);
        setDirty(false);
        return saved;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const onChange = (
    patch:
      | Partial<OwnerListingDraft>
      | ((prev: OwnerListingDraft) => OwnerListingDraft),
  ) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      return next;
    });
    setDirty(true);
    setValidationError(null);
  };

  const onBack = () => {
    if (!draft) return;
    if (draft.currentStep <= 1) {
      if (dirty && isIncompleteDraft) {
        const ok = window.confirm("Leave without saving this step? Unsaved changes may be lost.");
        if (!ok) return;
      }
      navigate("/sell/owner");
      return;
    }
    const next = { ...draft, currentStep: draft.currentStep - 1 };
    persist(next);
    setSearchParams({ step: String(next.currentStep) }, { replace: true });
  };

  const onSaveExit = () => {
    if (!draft) return;
    persist(draft);
    navigate("/sell/owner/dashboard");
  };

  const onContinue = () => {
    if (!draft) return;
    const sanitized = withoutEmptyCoOwners(draft);
    const error = validateStep(sanitized.currentStep, sanitized);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);

    if (sanitized.currentStep >= 10) {
      persist(sanitized);
      navigate(`/sell/owner/listing/${sanitized.id}/review`);
      return;
    }

    const next = { ...sanitized, currentStep: sanitized.currentStep + 1 };
    persist(next);
    setSearchParams({ step: String(next.currentStep) }, { replace: true });
  };

  if (!draft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emerald-50 text-sm text-emerald-950/70">
        Loading listing…
      </div>
    );
  }

  return (
    <StepperShell
      step={draft.currentStep}
      title={stepMeta.title}
      description={stepMeta.description}
      continueLabel={
        draft.currentStep >= 10 ? "Review listing" : stepMeta.continueLabel
      }
      onBack={onBack}
      onSaveExit={onSaveExit}
      onContinue={onContinue}
      continueDisabled={draft.currentStep === 1 && !draft.sellerType}
      saving={saving}
    >
      {validationError ? (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      ) : null}
      <ListingStepContent step={draft.currentStep} draft={draft} onChange={onChange} />
    </StepperShell>
  );
}
