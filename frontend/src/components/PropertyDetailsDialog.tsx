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
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/services/propertyService";
import { useAuth } from "@/contexts/AuthContext";
import { CallToBuyDialog } from "@/components/CallToBuyDialog";

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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && property) {
      setActiveImageIndex(0);
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
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      window.prompt("Copy this link:", url);
    }
  };

  const images =
    property.images && property.images.length > 0
      ? property.images
      : [
          "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80",
        ];

  const address = `${property.neighborhood ? `${property.neighborhood}, ` : ""}${property.city}, ${property.country}`;
  const listingType = property.listingType === "sale" ? "For sale" : "For rent";
  const priceLabel =
    property.listingType === "sale" && property.price
      ? `$${property.price.toLocaleString()}`
      : property.listingType === "rent" && property.monthlyRent
        ? `$${property.monthlyRent.toLocaleString()}/mo`
        : null;

  const facts = [
    { label: "Property type", value: property.propertyType },
    { label: "Area", value: `${property.areaAcres} Acres` },
    { label: "Tenure", value: property.tenure || "Freehold" },
    { label: "Country", value: property.country },
    { label: "City", value: property.city },
    ...(property.neighborhood ? [{ label: "Neighborhood", value: property.neighborhood }] : []),
  ];

  if (property.listingType === "rent" && property.leaseTerm) {
    facts.push({ label: "Lease term", value: property.leaseTerm });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} modal>
        <DialogContent className="max-w-6xl overflow-hidden rounded-2xl p-0 max-h-[85vh]">
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
                onClick={() => onSave && property.propertyID && onSave(property.propertyID)}
              >
                <Heart className={`h-4 w-4 ${saved ? "fill-red-600 text-red-600" : ""}`} /> Save
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
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-emerald-50">
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
                  </div>
                ) : images.length === 2 ? (
                  <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-xl" style={{ height: "320px" }}>
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="relative h-full min-h-0 overflow-hidden"
                        onClick={() => setActiveImageIndex(idx)}
                      >
                        <img
                          src={img}
                          alt={`Property view ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {idx === 0 ? (
                          <div className="absolute left-3 top-3">
                            <Badge className="rounded-full bg-emerald-900/90 text-emerald-50">
                              {listingType}
                            </Badge>
                          </div>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-xl" style={{ height: "320px" }}>
                    <div className="relative h-full min-h-0">
                      <img
                        src={images[activeImageIndex] || images[0]}
                        alt="Main property view"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute left-3 top-3">
                        <Badge className="rounded-full bg-emerald-900/90 text-emerald-50">
                          {listingType}
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-lg bg-white/90 hover:bg-white text-xs h-7 px-2"
                          onClick={() =>
                            setActiveImageIndex((prev) => (prev + 1) % images.length)
                          }
                        >
                          {images.length} photos
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-rows-2 gap-2 h-full min-h-0">
                      {images.slice(1, 3).map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="relative h-full min-h-0 overflow-hidden"
                          onClick={() => setActiveImageIndex(idx + 1)}
                        >
                          <img
                            src={img}
                            alt={`Property view ${idx + 2}`}
                            className="h-full w-full object-cover"
                          />
                          {idx === 1 && images.length > 3 ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-semibold text-white">
                              +{images.length - 3} more
                            </div>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {images.length > 1 && (
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full border-emerald-200"
                      onClick={() =>
                        setActiveImageIndex((n) => (n - 1 + images.length) % images.length)
                      }
                      aria-label="Previous"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-emerald-700">
                      {activeImageIndex + 1} / {images.length}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full border-emerald-200"
                      onClick={() => setActiveImageIndex((n) => (n + 1) % images.length)}
                      aria-label="Next"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
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
                  <BigStat value={property.areaAcres.toFixed(2)} label="acres" />
                  <BigStat value={property.propertyType} label="type" />
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
                    {priceLabel ? (
                      <div>
                        <div className="text-xs uppercase tracking-wide text-emerald-700/70">
                          Asking price
                        </div>
                        <div className="mt-0.5 text-2xl font-semibold text-emerald-950">
                          {priceLabel}
                        </div>
                      </div>
                    ) : null}

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

      <CallToBuyDialog
        open={showCallDialog}
        onOpenChange={setShowCallDialog}
        propertyTitle={property.title}
      />
    </>
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
