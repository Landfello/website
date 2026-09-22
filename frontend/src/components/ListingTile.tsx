import { ArrowRight, Bath, BedDouble, Camera, Check, Heart, MapPin, Share2 } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { Property } from "@/services/propertyService";

export type Listing = {
  id: string;
  title: string;
  description: string;
  country: string;
  city: string;
  neighborhood?: string;
  priceUSD: number;
  monthlyRent: number;
  listingType: "sale" | "rent";
  areaAcres: number;
  landType: "Residential" | "Agricultural" | "Commercial" | "Mixed Use";
  category: "Land" | "House";
  bedrooms?: number | null;
  bathrooms?: number | null;
  tenure: "Freehold" | "Leasehold";
  verified: boolean;
  imageUrl: string;
  imageCount: number;
  tags: string[];
  daysOnMarket?: number;
  createdAt?: string;
};

export function propertyToListing(property: Property): Listing {
  return {
    id: property.propertyID || "",
    title: property.title,
    description: property.description || "",
    country: property.country,
    city: property.city,
    neighborhood: property.neighborhood,
    priceUSD: property.price || 0,
    monthlyRent: property.monthlyRent || 0,
    listingType: property.listingType,
    areaAcres: property.areaAcres,
    landType: property.propertyType,
    category: property.category === "House" ? "House" : "Land",
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    tenure: property.tenure || "Freehold",
    verified: property.verified || false,
    tags: property.tags || [],
    daysOnMarket: property.daysOnMarket,
    createdAt: property.createdAt,
    imageCount: property.images?.length || 0,
    imageUrl:
      property.images && property.images.length > 0
        ? property.images[0]
        : "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80",
  };
}

export function formatListingPrice(l: Listing): string {
  return l.priceUSD > 0 ? `$${l.priceUSD.toLocaleString()}` : "Price on request";
}

export function ListingTile({
  l,
  saved,
  onToggleSave,
  onShare,
  onClick,
  compact,
}: {
  l: Listing;
  saved: boolean;
  onToggleSave: (id: string) => void;
  onShare: (id: string) => void | Promise<void>;
  onClick: () => void;
  compact?: boolean;
}) {
  const [shareLabel, setShareLabel] = useState("Share");
  const address = `${l.neighborhood ? `${l.neighborhood}, ` : ""}${l.city}, ${l.country}`;
  const featured = l.verified && (l.daysOnMarket ?? 99) > 4;
  const hotDeal = (l.daysOnMarket ?? 99) <= 4 || l.tags.some((t) => /hot|deal/i.test(t));

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onShare(l.id);
      setShareLabel("Copied!");
      window.setTimeout(() => setShareLabel("Share"), 2000);
    } catch {
      setShareLabel("Share");
    }
  };

  const metaPills = (
    <div className="flex flex-wrap gap-1.5">
      <span className="rounded-full border border-emerald-950/10 bg-emerald-50/80 px-2 py-0.5 text-[11px] text-emerald-900">
        {l.category}
      </span>
      <span className="rounded-full border border-emerald-950/10 bg-emerald-50/80 px-2 py-0.5 text-[11px] text-emerald-900">
        {l.areaAcres} acres
      </span>
      <span className="rounded-full border border-emerald-950/10 bg-emerald-50/80 px-2 py-0.5 text-[11px] text-emerald-900">
        {l.landType}
      </span>
      {l.category === "House" && l.bedrooms ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-950/10 bg-emerald-50/80 px-2 py-0.5 text-[11px] text-emerald-900">
          <BedDouble className="h-3 w-3" />
          {l.bedrooms} bed
        </span>
      ) : null}
      {l.category === "House" && l.bathrooms ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-950/10 bg-emerald-50/80 px-2 py-0.5 text-[11px] text-emerald-900">
          <Bath className="h-3 w-3" />
          {l.bathrooms} bath
        </span>
      ) : null}
      {l.tags.slice(0, compact ? 3 : 2).map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-emerald-950/10 bg-white px-2 py-0.5 text-[11px] text-emerald-900/80"
        >
          {tag}
        </span>
      ))}
    </div>
  );

  if (compact) {
    return (
      <Card
        className="group cursor-pointer overflow-hidden rounded-2xl border border-emerald-950/8 bg-white shadow-sm transition-all hover:shadow-md"
        onClick={onClick}
      >
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            <div className="relative h-44 w-full shrink-0 sm:h-auto sm:w-56 md:w-64">
              <img src={l.imageUrl} alt={l.title} className="h-full w-full object-cover sm:absolute sm:inset-0" />
              <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                {hotDeal ? (
                  <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                    Hot Deal
                  </span>
                ) : featured ? (
                  <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-950 shadow-sm">
                    Featured
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                aria-label={saved ? "Unsave" : "Save"}
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-emerald-900 shadow-sm hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(l.id);
                }}
              >
                <Heart className={`h-4 w-4 ${saved ? "fill-red-500 text-red-500" : ""}`} />
              </button>
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-base font-semibold leading-snug text-emerald-950">
                    {l.title}
                  </h3>
                  <div className="shrink-0 text-lg font-bold text-emerald-700">
                    {formatListingPrice(l)}
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-emerald-950/60">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{address}</span>
                </div>
                <div className="mt-3">{metaPills}</div>
                {l.description ? (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-emerald-950/60">
                    {l.description}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 flex items-center gap-4 border-t border-emerald-950/8 pt-3 text-xs font-medium text-emerald-900/70">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 hover:text-emerald-950"
                  onClick={handleShareClick}
                >
                  {shareLabel === "Copied!" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-700" />
                  ) : (
                    <Share2 className="h-3.5 w-3.5" />
                  )}
                  {shareLabel}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 hover:text-emerald-950"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSave(l.id);
                  }}
                >
                  <Heart className={`h-3.5 w-3.5 ${saved ? "fill-red-500 text-red-500" : ""}`} />
                  {saved ? "Saved" : "Save"}
                </button>
                <span className="ml-auto inline-flex items-center gap-1 text-emerald-800">
                  View Details
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="group cursor-pointer overflow-hidden rounded-[22px] border border-emerald-950/8 bg-white shadow-sm transition-all hover:shadow-lg"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="relative h-44">
          <img src={l.imageUrl} alt={l.title} className="h-full w-full object-cover" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {featured ? (
              <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-950 shadow-sm">
                Featured
              </span>
            ) : null}
            {hotDeal ? (
              <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                Hot Deal
              </span>
            ) : null}
          </div>
          <button
            type="button"
            aria-label={saved ? "Unsave" : "Save"}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-emerald-900 shadow-sm hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(l.id);
            }}
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-red-500 text-red-500" : ""}`} />
          </button>
          {l.imageCount > 0 ? (
            <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white">
              <Camera className="h-3 w-3" />
              {l.imageCount}
            </div>
          ) : null}
        </div>

        <div className="p-4">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-emerald-950">
            {l.title}
          </h3>
          <div className="mt-1 text-lg font-bold text-emerald-700">{formatListingPrice(l)}</div>
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-950/60">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{address}</span>
          </div>

          <div className="mt-3">{metaPills}</div>

          {l.description ? (
            <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-emerald-950/60">
              {l.description}
            </p>
          ) : null}

          <div className="mt-4 flex items-center gap-4 border-t border-emerald-950/8 pt-3 text-xs font-medium text-emerald-900/70">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 hover:text-emerald-950"
              onClick={handleShareClick}
            >
              {shareLabel === "Copied!" ? (
                <Check className="h-3.5 w-3.5 text-emerald-700" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
              {shareLabel}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 hover:text-emerald-950"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(l.id);
              }}
            >
              <Heart className={`h-3.5 w-3.5 ${saved ? "fill-red-500 text-red-500" : ""}`} />
              {saved ? "Saved" : "Save"}
            </button>
            <span className="ml-auto inline-flex items-center gap-1 text-emerald-800">
              View Details
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
