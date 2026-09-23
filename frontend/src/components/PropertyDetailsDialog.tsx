import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Phone,
  Check,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/services/propertyService";
import { useAuth } from "@/contexts/AuthContext";
import { CallToBuyDialog } from "@/components/CallToBuyDialog";
import { sharePropertyLink } from "@/lib/share";
import { cn } from "@/lib/utils";

const ScrollArea = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`overflow-y-auto ${className || ""}`}>{children}</div>
);

interface PropertyDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
  onSave?: (propertyId: string) => void;
  saved?: boolean;
}

export function PropertyDetailsDialog({
  open,
  onOpenChange,
  property,
  onSave,
  saved = false,
}: PropertyDetailsDialogProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && property) {
      setLightboxOpen(false);
      setLightboxIndex(0);
      setShowCallDialog(false);
      setCopied(false);
    }
  }, [open, property]);

  if (!property) return null;

  const canBuy = property.listingType === "sale" && property.status !== "sold";

  const handleBuyLand = () => {
    if (!currentUser) {
      onOpenChange(false);
      navigate("/create-account");
      return;
    }
    setShowCallDialog(true);
  };

  const handleShare = async () => {
    if (!property.propertyID) return;
    try {
      const result = await sharePropertyLink(property.propertyID, property.title);
      if (result === "copied" || result === "prompted") {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      window.prompt(
        "Copy this link:",
        `${window.location.origin}/?property=${encodeURIComponent(property.propertyID)}`
      );
    }
  };

  const images =
    property.images && property.images.length > 0
      ? property.images
      : [
          "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80",
        ];

  const openLightbox = (index: number) => {
    setLightboxIndex(Math.max(0, Math.min(index, images.length - 1)));
    setLightboxOpen(true);
  };

  const address = `${property.neighborhood ? `${property.neighborhood}, ` : ""}${property.city}, ${property.country}`;
  const listingType = "For sale";
  const priceLabel = property.price
    ? `$${property.price.toLocaleString()}`
    : "Price on request";

  const facts = [
    { label: "Category", value: property.category === "House" ? "House" : "Land" },
    { label: "User purpose", value: property.propertyType },
    { label: "Area", value: `${property.areaAcres} Acres` },
    ...(property.category === "House" && property.bedrooms
      ? [{ label: "Bedrooms", value: String(property.bedrooms) }]
      : []),
    ...(property.category === "House" && property.bathrooms
      ? [{ label: "Bathrooms", value: String(property.bathrooms) }]
      : []),
    { label: "Tenure", value: property.tenure || "Freehold" },
    { label: "Country", value: property.country },
    { label: "City", value: property.city },
    ...(property.neighborhood ? [{ label: "Neighborhood", value: property.neighborhood }] : []),
  ];

  if (property.tags?.length) {
    facts.push({ label: "Features", value: property.tags.join(", ") });
  }

  const handleSaveClick = () => {
    if (!currentUser) {
      onOpenChange(false);
      navigate("/create-account");
      return;
    }
    if (onSave && property.propertyID) onSave(property.propertyID);
  };

  const extraCount = Math.max(0, images.length - 3);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} modal>
        <DialogContent
          className={cn(
            "max-w-6xl overflow-hidden rounded-2xl p-0 max-h-[85vh]",
            lightboxOpen && "pointer-events-none"
          )}
        >
          <DialogTitle className="sr-only">{property.title}</DialogTitle>
          <DialogDescription className="sr-only">
            {property.description || `Details for ${property.title} in ${address}`}
          </DialogDescription>
          <div className="flex items-center justify-between border-b border-emerald-100 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Back"
                onClick={() => onOpenChange(false)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="text-sm text-emerald-700">Back to search</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="gap-2 rounded-full"
                onClick={handleSaveClick}
              >
                <Heart className={`h-4 w-4 ${saved ? "fill-red-600 text-red-600" : ""}`} />{" "}
                {saved ? "Saved" : "Save"}
              </Button>
              <Button variant="ghost" className="gap-2 rounded-full" onClick={handleShare}>
                {copied ? <Check className="h-4 w-4 text-emerald-700" /> : <Share2 className="h-4 w-4" />}
                {copied ? "Copied" : "Share"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            <div className="lg:col-span-8 bg-white overflow-y-auto max-h-[calc(85vh-60px)]">
              <div className="relative p-4">
                {images.length === 1 ? (
                  <button
                    type="button"
                    className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-emerald-50"
                    onClick={() => openLightbox(0)}
                  >
                    <img
                      src={images[0]}
                      alt="Main property view"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute left-3 top-3">
                      <Badge className="rounded-full bg-emerald-900/90 text-emerald-50">
                        {listingType}
                      </Badge>
                    </div>
                  </button>
                ) : (
                  <div
                    className="grid grid-cols-2 gap-2 overflow-hidden rounded-xl"
                    style={{ height: "320px" }}
                  >
                    <button
                      type="button"
                      className="relative h-full min-h-0 overflow-hidden"
                      onClick={() => openLightbox(0)}
                    >
                      <img
                        src={images[0]}
                        alt="Main property view"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute left-3 top-3">
                        <Badge className="rounded-full bg-emerald-900/90 text-emerald-50">
                          {listingType}
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <span className="inline-flex items-center rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-emerald-950 shadow-sm">
                          {images.length} photos
                        </span>
                      </div>
                    </button>

                    <div className="grid grid-rows-2 gap-2 h-full min-h-0">
                      {images.slice(1, 3).map((img, idx) => {
                        const imageIndex = idx + 1;
                        const isLastTile = idx === images.slice(1, 3).length - 1;
                        const showMoreOverlay = isLastTile && extraCount > 0;
                        return (
                          <button
                            key={imageIndex}
                            type="button"
                            className="relative h-full min-h-0 overflow-hidden"
                            onClick={() =>
                              openLightbox(showMoreOverlay ? Math.min(3, images.length - 1) : imageIndex)
                            }
                          >
                            <img
                              src={img}
                              alt={`Property view ${imageIndex + 1}`}
                              className="h-full w-full object-cover"
                            />
                            {showMoreOverlay ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                                +{extraCount} more
                              </div>
                            ) : null}
                          </button>
                        );
                      })}
                      {images.length === 2 ? (
                        <button
                          type="button"
                          className="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-emerald-50 text-sm font-medium text-emerald-800"
                          onClick={() => openLightbox(0)}
                        >
                          View photos
                        </button>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-4 pb-4">
                <div className="mt-2">
                  <div className="text-2xl font-bold tracking-tight text-emerald-950">
                    {property.title}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-sm text-emerald-700">
                    <MapPin className="h-4 w-4" />
                    {address}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <BigStat value={property.category === "House" ? "House" : "Land"} label="category" />
                  <BigStat value={property.propertyType} label="purpose" />
                  <BigStat value={property.areaAcres.toFixed(2)} label="acres" />
                  {property.category === "House" && property.bedrooms ? (
                    <BigStat value={String(property.bedrooms)} label="beds" />
                  ) : null}
                  {property.category === "House" && property.bathrooms ? (
                    <BigStat value={String(property.bathrooms)} label="baths" />
                  ) : null}
                  <BigStat value={property.tenure || "Freehold"} label="tenure" />
                </div>

                <div className="mt-3 rounded-xl border border-emerald-100 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-emerald-950">About this property</div>
                    {property.verified && (
                      <Badge className="rounded-full bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="mr-1 h-3 w-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-800">
                    {property.description || "No description available."}
                  </p>

                  {property.tags && property.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {property.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="rounded-full border-emerald-200 text-emerald-800"
                        >
                          <Sparkles className="mr-1 h-3.5 w-3.5" /> {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 border-l border-emerald-100 bg-white overflow-y-auto max-h-[calc(85vh-60px)]">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-5">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-emerald-700/70">
                        Asking price
                      </div>
                      <div className="mt-0.5 text-2xl font-semibold text-emerald-950">
                        {priceLabel}
                      </div>
                    </div>

                    {property.status === "sold" ? (
                      <Button className="w-full h-11 rounded-xl" disabled>
                        Sold
                      </Button>
                    ) : canBuy ? (
                      <Button
                        className="w-full h-11 rounded-xl bg-emerald-800 hover:bg-emerald-900 gap-2 text-base font-semibold"
                        onClick={handleBuyLand}
                      >
                        <Phone className="h-4 w-4" />
                        Buy land
                      </Button>
                    ) : null}

                    {canBuy && property.status !== "sold" ? (
                      <p className="text-xs leading-relaxed text-emerald-700/80">
                        We’ll share the Landfello number so you can call and complete the purchase.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
                      <ShieldCheck className="h-4 w-4 text-emerald-700" />
                      Verified details
                    </div>
                    <dl className="mt-3 divide-y divide-emerald-100 border-t border-b border-emerald-100">
                      {facts.map((f) => (
                        <div key={f.label} className="flex items-center justify-between py-2.5 text-sm">
                          <dt className="text-emerald-700">{f.label}</dt>
                          <dd className="font-medium text-emerald-950">{f.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PhotoLightbox
        open={lightboxOpen}
        images={images}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxOpen(false)}
        title={property.title}
      />

      <CallToBuyDialog
        open={showCallDialog}
        onOpenChange={setShowCallDialog}
        propertyTitle={property.title}
      />
    </>
  );
}

function PhotoLightbox({
  open,
  images,
  index,
  onIndexChange,
  onClose,
  title,
}: {
  open: boolean;
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  title: string;
}) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onIndexChange((index - 1 + images.length) % images.length);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onIndexChange((index + 1) % images.length);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, images.length, onIndexChange]);

  const goPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onIndexChange((index - 1 + images.length) % images.length);
  };
  const goNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onIndexChange((index + 1) % images.length);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        data-photo-lightbox=""
        overlayClassName="z-[199] bg-black/90"
        className="fixed inset-0 left-0 top-0 z-[200] flex h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-black p-0 text-white shadow-none data-[state=open]:zoom-in-100 [&>button]:hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{title} photos</DialogTitle>
        <DialogDescription className="sr-only">
          Photo {index + 1} of {images.length}
        </DialogDescription>

        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium sm:text-base">{title}</div>
            <div className="text-xs text-white/70">
              {index + 1} / {images.length}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Close photos"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16">
          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:left-4"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:right-4"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}

          <img
            key={images[index]}
            src={images[index]}
            alt={`${title} photo ${index + 1}`}
            className="max-h-full max-w-full object-contain"
            draggable={false}
          />
        </div>

        {images.length > 1 ? (
          <div className="shrink-0 overflow-x-auto border-t border-white/10 px-4 py-3">
            <div className="mx-auto flex w-max gap-2">
              {images.map((img, i) => (
                <button
                  key={`${i}-${img.slice(0, 32)}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onIndexChange(i);
                  }}
                  className={`h-16 w-24 shrink-0 overflow-hidden rounded-md ring-2 transition ${
                    i === index ? "ring-white" : "ring-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" draggable={false} />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function BigStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-emerald-100 bg-white p-2 text-center">
      <div className="text-base font-bold text-emerald-950 truncate">{value}</div>
      <div className="text-xs text-emerald-700">{label}</div>
    </div>
  );
}
