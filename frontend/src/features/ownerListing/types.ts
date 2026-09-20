export type SellerType = "owner" | "representative" | "company" | "estate";

export type IdentityStatus =
  | "not_started"
  | "in_progress"
  | "verified"
  | "additional_info_required"
  | "unsuccessful";

export type ListingStatus =
  | "draft"
  | "under_review"
  | "verified"
  | "published"
  | "paused"
  | "rejected"
  | "sold"
  | "action_required";

export type TriState = "yes" | "no" | "unknown" | "unsure";

export type FileReviewStatus = "pending" | "approved" | "rejected" | "needs_info";

export type FilePrivacy = "private" | "verified_buyers" | "after_offer";

export type EscrowStatus =
  | "not_started"
  | "pending_setup"
  | "funded"
  | "in_progress"
  | "released"
  | "refunded"
  | "disputed";

export type OfferStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "countered"
  | "withdrawn"
  | "expired";

export type TransactionStageKey =
  | "offer_accepted"
  | "due_diligence"
  | "escrow_funded"
  | "title_transfer"
  | "closing"
  | "completed";

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  reviewStatus: FileReviewStatus;
  privacy: FilePrivacy;
  dataUrl?: string;
  size?: number;
}

export interface CoOwner {
  id: string;
  fullName: string;
  relationship: string;
  phone?: string;
  email?: string;
  consentGiven: boolean;
  sharePercent?: number;
}

export interface ListingPhoto {
  id: string;
  caption: string;
  isCover: boolean;
  order: number;
  dataUrl?: string;
}

export interface Offer {
  id: string;
  buyerName: string;
  amount: number;
  currency: string;
  message?: string;
  status: OfferStatus;
  createdAt: string;
  expiresAt?: string;
  counterAmount?: number;
}

export interface TransactionStage {
  key: TransactionStageKey;
  label: string;
  completed: boolean;
  completedAt?: string;
  note?: string;
}

export interface ListingTransaction {
  stages: TransactionStage[];
  escrowStatus: EscrowStatus;
  escrowProvider?: string;
  acceptedOfferId?: string;
  closingDate?: string;
  notes?: string;
}

export interface FeedbackIssue {
  id: string;
  summary: string;
  documentName?: string;
  reviewerNote: string;
  status: "open" | "resolved" | "dismissed";
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface OwnerListingIdentity {
  fullName: string;
  dob: string;
  citizenship: string;
  residence: string;
  address: string;
  phone: string;
  email: string;
  idType: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  idFront?: UploadedFile | null;
  idBack?: UploadedFile | null;
  selfie?: UploadedFile | null;
  identityStatus: IdentityStatus;
  identityConfirmed: boolean;
}

export interface OwnerListingOwnership {
  method: string;
  nameOnRecord: string;
  acquisitionDate: string;
  registrationDate: string;
  registrationNumber: string;
  parcelNumber: string;
  plotNumber: string;
  titleNumber: string;
  surveyNumber: string;
  registryOffice: string;
  nameMatches: TriState;
  multipleOwners: TriState;
  spouseConsent: TriState;
  customary: TriState;
  authorityApproval: TriState;
  coOwners: CoOwner[];
}

export interface OwnerListingLocation {
  country: string;
  region: string;
  county: string;
  city: string;
  village: string;
  neighborhood: string;
  street: string;
  landmark: string;
  postalCode: string;
  lat?: number;
  lng?: number;
  hideExactLocation: boolean;
  boundaryPoints?: LatLng[];
}

export interface OwnerListingLand {
  title: string;
  propertyType: string;
  size: number | null;
  unit: string;
  currentUse: string;
  intendedUse: string;
  zoning: string;
  developmentStatus: string;
  conditions: Record<string, TriState>;
  infrastructure: Record<string, boolean>;
  environmental: Record<string, TriState>;
  description: string;
}

export interface OwnerListingBoundaries {
  surveyed: TriState;
  surveyDate: string;
  surveyor: string;
  markersVisible: TriState;
  disputes: TriState;
  sizeMatches: TriState;
  north: string;
  south: string;
  east: string;
  west: string;
  surveyUploads: UploadedFile[];
}

export interface OwnerListingPricing {
  askingPrice: number | null;
  currency: string;
  pricePerUnit: number | null;
  negotiable: boolean;
  minOffer: number | null;
  hideMinOffer: boolean;
  acceptOffersInApp: boolean;
  closingTimeline: string;
  paymentOptions: string[];
  installmentsAllowed: boolean;
  installmentMonths: number | null;
  installmentDownPaymentPercent: number | null;
  costResponsibility: Record<string, string>;
  escrowChoice: string;
}

export interface OwnerListingDisclosures {
  answers: Record<string, TriState>;
  explanations: Record<string, string>;
  accurateInfoDeclared: boolean;
  authorityDeclared: boolean;
  noHiddenLiensDeclared: boolean;
  termsAccepted: boolean;
  signatureName: string;
  signatureData: string;
  signedAt: string;
}

export interface OwnerListingMetrics {
  views: number;
  saves: number;
  inquiries: number;
  offers: number;
}

export interface OwnerListingMedia {
  photos: ListingPhoto[];
  videoUrl?: string;
  photoConfirmation: boolean;
}

export interface OwnerListingDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
  currentStep: number;
  status: ListingStatus;

  sellerType: SellerType | "";
  ownerName: string;
  relationship: string;
  companyName: string;
  companyRegistrationNumber: string;
  companyRole: string;
  estateName: string;
  estateRole: string;
  probateReference: string;

  identity: OwnerListingIdentity;
  ownership: OwnerListingOwnership;
  location: OwnerListingLocation;
  land: OwnerListingLand;
  boundaries: OwnerListingBoundaries;
  documents: UploadedFile[];
  media: OwnerListingMedia;
  pricing: OwnerListingPricing;
  disclosures: OwnerListingDisclosures;

  verificationBadges: string[];
  metrics: OwnerListingMetrics;
  offers?: Offer[];
  transaction?: ListingTransaction;
  feedbackIssues?: FeedbackIssue[];
}

export interface StepMeta {
  step: number;
  title: string;
  description: string;
  continueLabel: string;
}

export const STEP_META: StepMeta[] = [
  {
    step: 1,
    title: "Who is selling the land?",
    description:
      "Tell us whether you own the land directly or are authorized to represent the owner.",
    continueLabel: "Continue",
  },
  {
    step: 2,
    title: "Verify your identity",
    description:
      "Identity verification helps protect buyers and prevents fraudulent listings.",
    continueLabel: "Submit Identity Verification",
  },
  {
    step: 3,
    title: "How did you obtain the land?",
    description:
      "This information helps us determine which ownership documents are required.",
    continueLabel: "Continue",
  },
  {
    step: 4,
    title: "Where is the land located?",
    description:
      "Add the city and area so buyers can understand where the property is.",
    continueLabel: "Continue",
  },
  {
    step: 5,
    title: "Tell buyers about the land",
    description:
      "Provide accurate details about the land, permitted use, access, and current condition.",
    continueLabel: "Continue",
  },
  {
    step: 6,
    title: "Confirm the property boundaries",
    description:
      "Clear boundary information helps prevent disputes and allows buyers to understand exactly what is being sold.",
    continueLabel: "Continue",
  },
  {
    step: 7,
    title: "Upload ownership and supporting documents",
    description:
      "Documents will be reviewed before the listing receives an ownership verification badge.",
    continueLabel: "Submit Documents for Review",
  },
  {
    step: 8,
    title: "Show the property clearly",
    description:
      "Upload recent photos that accurately represent the land and surrounding area.",
    continueLabel: "Continue",
  },
  {
    step: 9,
    title: "Set your asking price",
    description: "Choose your price, payment preferences, and offer settings.",
    continueLabel: "Save Pricing",
  },
  {
    step: 10,
    title: "Disclose any legal or financial issues",
    description: "Accurate disclosures protect both the seller and potential buyers.",
    continueLabel: "Review Listing",
  },
];

function emptyIdentity(): OwnerListingIdentity {
  return {
    fullName: "",
    dob: "",
    citizenship: "",
    residence: "",
    address: "",
    phone: "",
    email: "",
    idType: "",
    phoneVerified: false,
    emailVerified: false,
    idFront: null,
    idBack: null,
    selfie: null,
    identityStatus: "not_started",
    identityConfirmed: false,
  };
}

function emptyOwnership(): OwnerListingOwnership {
  return {
    method: "",
    nameOnRecord: "",
    acquisitionDate: "",
    registrationDate: "",
    registrationNumber: "",
    parcelNumber: "",
    plotNumber: "",
    titleNumber: "",
    surveyNumber: "",
    registryOffice: "",
    nameMatches: "unknown",
    multipleOwners: "no",
    spouseConsent: "unknown",
    customary: "unknown",
    authorityApproval: "unknown",
    coOwners: [],
  };
}

function emptyLocation(): OwnerListingLocation {
  return {
    country: "",
    region: "",
    county: "",
    city: "",
    village: "",
    neighborhood: "",
    street: "",
    landmark: "",
    postalCode: "",
    hideExactLocation: false,
    boundaryPoints: [],
  };
}

function emptyLand(): OwnerListingLand {
  return {
    title: "",
    propertyType: "",
    size: null,
    unit: "acres",
    currentUse: "",
    intendedUse: "",
    zoning: "",
    developmentStatus: "",
    conditions: {},
    infrastructure: {},
    environmental: {},
    description: "",
  };
}

function emptyBoundaries(): OwnerListingBoundaries {
  return {
    surveyed: "unknown",
    surveyDate: "",
    surveyor: "",
    markersVisible: "unknown",
    disputes: "unknown",
    sizeMatches: "unknown",
    north: "",
    south: "",
    east: "",
    west: "",
    surveyUploads: [],
  };
}

function emptyPricing(): OwnerListingPricing {
  return {
    askingPrice: null,
    currency: "GHS",
    pricePerUnit: null,
    negotiable: true,
    minOffer: null,
    hideMinOffer: false,
    acceptOffersInApp: true,
    closingTimeline: "",
    paymentOptions: [],
    installmentsAllowed: false,
    installmentMonths: null,
    installmentDownPaymentPercent: null,
    costResponsibility: {},
    escrowChoice: "",
  };
}

function emptyDisclosures(): OwnerListingDisclosures {
  return {
    answers: {},
    explanations: {},
    accurateInfoDeclared: false,
    authorityDeclared: false,
    noHiddenLiensDeclared: false,
    termsAccepted: false,
    signatureName: "",
    signatureData: "",
    signedAt: "",
  };
}

function emptyMetrics(): OwnerListingMetrics {
  return {
    views: 0,
    saves: 0,
    inquiries: 0,
    offers: 0,
  };
}

export function createEmptyDraft(): OwnerListingDraft {
  const now = new Date().toISOString();
  return {
    id: `listing_${crypto.randomUUID()}`,
    createdAt: now,
    updatedAt: now,
    currentStep: 1,
    status: "draft",

    sellerType: "",
    ownerName: "",
    relationship: "",
    companyName: "",
    companyRegistrationNumber: "",
    companyRole: "",
    estateName: "",
    estateRole: "",
    probateReference: "",

    identity: emptyIdentity(),
    ownership: emptyOwnership(),
    location: emptyLocation(),
    land: emptyLand(),
    boundaries: emptyBoundaries(),
    documents: [],
    media: {
      photos: [],
      photoConfirmation: false,
    },
    pricing: emptyPricing(),
    disclosures: emptyDisclosures(),

    verificationBadges: [],
    metrics: emptyMetrics(),
  };
}
