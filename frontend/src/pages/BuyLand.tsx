import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Check,
  ChevronDown,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  Share2,
} from "lucide-react";
import { TopNav } from "@/components/Profile/TopNav";
import { getAllProperties, Property } from "@/services/propertyService";
import { PropertyDetailsDialog } from "@/components/PropertyDetailsDialog";
import { useRoleGate } from "@/hooks/useRoleGate";

// Landfello BUY page (Zillow-inspired)
// Map removed per request — focus on a beautiful, card-first property feed.

type Listing = {
  id: string;
  title: string;
  country: string;
  city: string;
  neighborhood?: string;
  priceUSD: number;
  areaAcres: number;
  landType: "Residential" | "Agricultural" | "Commercial" | "Mixed Use";
  tenure: "Freehold" | "Leasehold";
  verified: boolean;
  imageUrl: string;
  tags?: string[];
  daysOnMarket?: number;
  sellerType?: "Agent" | "Owner";
};

function propertyToListing(property: Property): Listing {
  return {
    id: property.propertyID || "",
    title: property.title,
    country: property.country,
    city: property.city,
    neighborhood: property.neighborhood,
    priceUSD: property.price || 0,
    areaAcres: property.areaAcres,
    landType: property.propertyType,
    tenure: property.tenure || "Freehold",
    verified: property.verified || false,
    tags: property.tags || [],
    daysOnMarket: property.daysOnMarket,
    sellerType: "Agent", // All properties from Cosmos DB are from agents
    imageUrl: property.images && property.images.length > 0 ? property.images[0] : "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80",
  };
}

const HOME_TYPES = [
  { key: "Residential", label: "Residential" },
  { key: "Agricultural", label: "Agricultural" },
  { key: "Commercial", label: "Commercial" },
  { key: "Mixed Use", label: "Mixed Use" },
] as const;

// African countries list
const AFRICAN_COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon",
  "Central African Republic", "Chad", "Comoros", "Congo", "Côte d'Ivoire", "Djibouti", "DR Congo",
  "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana",
  "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi",
  "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria",
  "Rwanda", "São Tomé and Príncipe", "Senegal", "Seychelles", "Sierra Leone", "Somalia",
  "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"
].sort();

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "h-10 px-4 rounded-full bg-emerald-900 text-white text-sm font-medium"
          : "h-10 px-4 rounded-full bg-white border border-black/10 text-emerald-950 text-sm font-medium hover:bg-black/5"
      }
    >
      {children}
    </button>
  );
}

function ListingTile({
  l,
  saved,
  onToggleSave,
  onShare,
  onClick,
}: {
  l: Listing;
  saved: boolean;
  onToggleSave: (id: string) => void;
  onShare: (id: string) => void;
  onClick: () => void;
}) {
  const address = `${l.neighborhood ? `${l.neighborhood}, ` : ""}${l.city}, ${l.country}`;
  
  return (
    <Card 
      className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-all cursor-pointer shadow-sm"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={l.imageUrl}
            alt={l.title}
            className="w-full h-48 object-cover"
          />

          {/* Location pin in bottom right */}
          <div className="absolute bottom-2 right-2">
            <div className="bg-gray-800/90 rounded p-1.5 hover:bg-gray-800 transition-colors">
              <MapPin className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3">
          {/* Title */}
          <div className="text-lg font-semibold text-gray-900 mb-1.5 line-clamp-2">
            {l.title}
          </div>

          {/* Specifications */}
          <div className="text-xs text-gray-700 mb-1.5">
            {l.areaAcres} acres • {l.landType} • {l.tenure}
          </div>

          {/* Address */}
          <div className="text-xs text-gray-600 mb-2">
            {address}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {/* Gray tags for location/type */}
            <span className="px-2 py-0.5 rounded-full text-xs text-gray-700 bg-gray-100 border border-gray-300">
              {l.country}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs text-gray-700 bg-gray-100 border border-gray-300">
              {l.landType}
            </span>
            {/* Yellow/cream tags for features */}
            {l.tags?.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs text-gray-700 bg-amber-50 border border-amber-200"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Share and Save Icons */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Share"
              onClick={(e) => {
                e.stopPropagation();
                onShare(l.id);
              }}
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(l.id);
              }}
              className={`flex items-center gap-1 transition-colors ${
                saved
                  ? "text-red-600 hover:text-red-700"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              aria-label={saved ? "Unsave" : "Save"}
            >
              <Heart className={`h-4 w-4 ${saved ? "fill-red-600" : ""}`} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LandfelloBuyPage() {
  useRoleGate("buy");
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Search
  const [query, setQuery] = useState("");
  
  // Country filter from URL
  const [countryFilter, setCountryFilter] = useState<string>("");

  // Filters (Zillow-like)
  const [status, setStatus] = useState<"for_sale" | "coming_soon">("for_sale");
  const [beds, setBeds] = useState<"any" | "1+" | "2+" | "3+" | "4+" | "5+">("any");
  const [baths, setBaths] = useState<"any" | "1+" | "1.5+" | "2+" | "3+" | "4+">("any");
  const [homeTypes, setHomeTypes] = useState<Record<string, boolean>>(() => ({
    Residential: true,
    Agricultural: true,
    Commercial: true,
    "Mixed Use": true,
  }));
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [freeholdOnly, setFreeholdOnly] = useState(false);

  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("landfello_saved_properties");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  
  // Properties from Cosmos DB
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Property details dialog
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("landfello_saved_properties", JSON.stringify(next));
      return next;
    });
  };

  const shareProperty = async (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("property", id);
    try {
      await navigator.clipboard.writeText(url.toString());
    } catch {
      window.prompt("Copy this link:", url.toString());
    }
  };

  const openProperty = (property: Property) => {
    setSelectedProperty(property);
    setDialogOpen(true);
    const next = new URLSearchParams(searchParams);
    if (property.propertyID) {
      next.set("property", property.propertyID);
      setSearchParams(next, { replace: true });
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      const next = new URLSearchParams(searchParams);
      next.delete("property");
      setSearchParams(next, { replace: true });
    }
  };

  // Read country from URL parameter on mount
  useEffect(() => {
    const countryParam = searchParams.get("country");
    if (countryParam) {
      setCountryFilter(countryParam);
    }
  }, [searchParams]);

  // Open property from ?property= URL (shared links)
  useEffect(() => {
    if (loading || properties.length === 0) return;
    const propertyId = searchParams.get("property");
    if (!propertyId) return;
    const match = properties.find((p) => p.propertyID === propertyId);
    if (match) {
      setSelectedProperty(match);
      setDialogOpen(true);
    }
  }, [loading, properties, searchParams]);

  // Fetch properties from Cosmos DB
  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        setError(null);
        
        // Build filters for API call
        const apiFilters: any = {
          listingType: "sale", // Only get properties for sale
        };
        
        // Add country filter if set
        if (countryFilter) {
          apiFilters.country = countryFilter;
        }
        
        // Add property type filter if any are selected
        const activeTypes = Object.entries(homeTypes).filter(([, v]) => v).map(([k]) => k);
        if (activeTypes.length > 0 && activeTypes.length < 4) {
          // If not all types selected, we'll filter client-side
        }
        
        const fetchedProperties = await getAllProperties(apiFilters);
        setProperties(fetchedProperties);
      } catch (err: any) {
        console.error("Error fetching properties:", err);
        setError(err.message || "Failed to load properties");
        setProperties([]); // Fallback to empty array
      } finally {
        setLoading(false);
      }
    }
    
    fetchProperties();
  }, [countryFilter]); // Re-fetch when country filter changes

  const activeHomeTypes = useMemo(
    () => Object.entries(homeTypes).filter(([, v]) => v).map(([k]) => k),
    [homeTypes]
  );

  // Convert properties to listings and apply client-side filters
  const filtered = useMemo(() => {
    // Convert Cosmos DB properties to Listing format
    const listings = properties.map(propertyToListing);
    
    const q = query.trim().toLowerCase();

    return listings.filter((l) => {
      // Filter by country if countryFilter is set (already filtered by API, but double-check)
      if (countryFilter && l.country !== countryFilter) return false;

      // Search query filter
      const hay = `${l.title} ${l.city} ${l.country} ${l.neighborhood ?? ""} ${l.landType} ${l.tenure}`
        .toLowerCase();
      if (q && !hay.includes(q)) return false;

      // Property type filter
      if (!activeHomeTypes.includes(l.landType)) return false;
      
      // Verified filter
      if (onlyVerified && !l.verified) return false;
      
      // Tenure filter
      if (freeholdOnly && l.tenure !== "Freehold") return false;

      // Status filter
      if (status === "coming_soon") return false;

      return true;
    });
  }, [properties, query, countryFilter, activeHomeTypes, onlyVerified, freeholdOnly, status]);

  const filterCount = useMemo(() => {
    let c = 0;
    if (countryFilter) c += 1;
    if (beds !== "any" || baths !== "any") c += 1;
    const allTypesOn = Object.values(homeTypes).every(Boolean);
    if (!allTypesOn) c += 1;
    if (onlyVerified) c += 1;
    if (freeholdOnly) c += 1;
    if (status !== "for_sale") c += 1;
    return c;
  }, [countryFilter, beds, baths, homeTypes, onlyVerified, freeholdOnly, status]);

  const clearFilters = () => {
    setCountryFilter("");
    setSearchParams((prev) => {
      prev.delete("country");
      return prev;
    });
    setStatus("for_sale");
    setBeds("any");
    setBaths("any");
    setHomeTypes({
      Residential: true,
      Agricultural: true,
      Commercial: true,
      "Mixed Use": true,
    });
    setOnlyVerified(false);
    setFreeholdOnly(false);
  };

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <TopNav />
      
      {/* Search + filter row */}
      <div className="sticky top-[57px] z-30 border-b border-black/5 bg-white">
        <div className="mx-auto max-w-[1400px] px-2 sm:px-3 md:px-4 py-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-950/40" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by country, city, neighborhood, or keyword"
                  className="h-9 rounded-lg bg-[#f6f7fb] border-black/10 pl-8 text-sm shadow-sm"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {/* For Sale */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="rounded-lg border-2 border-blue-500 bg-blue-50 text-gray-800 hover:bg-blue-100 h-8 px-3 text-xs">
                      For Sale
                      <ChevronDown className="h-3 w-3 ml-1.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52 rounded-2xl">
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <button
                      type="button"
                      onClick={() => setStatus("for_sale")}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-black/5"
                    >
                      For sale
                      {status === "for_sale" ? <Check className="h-4 w-4" /> : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("coming_soon")}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-black/5"
                    >
                      Coming soon
                      {status === "coming_soon" ? <Check className="h-4 w-4" /> : null}
                    </button>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Country */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className={`rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 h-8 px-3 text-xs ${
                        countryFilter ? "border-emerald-500 bg-emerald-50" : ""
                      }`}
                    >
                      {countryFilter || "Country"}
                      <ChevronDown className="h-3 w-3 ml-1.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[280px] rounded-2xl max-h-[400px] overflow-y-auto">
                    <div className="text-sm font-semibold text-emerald-950 mb-3">Select Country</div>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCountryFilter("");
                          setSearchParams((prev) => {
                            prev.delete("country");
                            return prev;
                          });
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-black/5 ${
                          !countryFilter ? "bg-emerald-50" : ""
                        }`}
                      >
                        All Countries
                        {!countryFilter ? <Check className="h-4 w-4 text-emerald-900" /> : null}
                      </button>
                      {AFRICAN_COUNTRIES.map((country) => (
                        <button
                          key={country}
                          type="button"
                          onClick={() => {
                            setCountryFilter(country);
                            setSearchParams((prev) => {
                              prev.set("country", country);
                              return prev;
                            });
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-black/5 ${
                            countryFilter === country ? "bg-emerald-50" : ""
                          }`}
                        >
                          {country}
                          {countryFilter === country ? <Check className="h-4 w-4 text-emerald-900" /> : null}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Beds & Baths (kept for Zillow pattern) */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 h-8 px-3 text-xs">
                      Beds & Baths
                      <ChevronDown className="h-3 w-3 ml-1.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[340px] rounded-2xl">
                    <div className="text-sm font-semibold text-emerald-950">Bedrooms</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(["any", "1+", "2+", "3+", "4+", "5+"] as const).map((v) => (
                        <Chip key={v} active={beds === v} onClick={() => setBeds(v)}>
                          {v === "any" ? "Any" : v}
                        </Chip>
                      ))}
                    </div>
                    <div className="mt-5 text-sm font-semibold text-emerald-950">Bathrooms</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(["any", "1+", "1.5+", "2+", "3+", "4+"] as const).map((v) => (
                        <Chip key={v} active={baths === v} onClick={() => setBaths(v)}>
                          {v === "any" ? "Any" : v}
                        </Chip>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-end">
                      <Button type="button" className="rounded-xl bg-emerald-900 text-white hover:bg-emerald-900/90">
                        Apply
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Home type */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 h-8 px-3 text-xs">
                      Home Type
                      <ChevronDown className="h-3 w-3 ml-1.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[260px] rounded-2xl">
                    <div className="text-sm font-semibold text-emerald-950">Land / property type</div>
                    <div className="mt-3 space-y-3">
                      {HOME_TYPES.map((t) => (
                        <label key={t.key} className="flex items-center gap-3 text-sm text-emerald-950">
                          <Checkbox
                            checked={!!homeTypes[t.key]}
                            onCheckedChange={(v) => setHomeTypes((prev) => ({ ...prev, [t.key]: Boolean(v) }))}
                          />
                          {t.label}
                        </label>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-end">
                      <Button type="button" className="rounded-xl bg-emerald-900 text-white hover:bg-emerald-900/90">
                        Apply
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* More */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 h-8 px-3 text-xs">
                      More
                      {filterCount > 0 ? (
                        <span className="ml-1.5 inline-flex h-4 min-w-4 px-1 rounded-full bg-blue-600 text-white text-[10px] items-center justify-center">
                          {filterCount}
                        </span>
                      ) : null}
                      <ChevronDown className="h-3 w-3 ml-1.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[320px] rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-emerald-950">More filters</div>
                      <Button type="button" variant="ghost" className="rounded-xl" onClick={clearFilters}>
                        Reset
                      </Button>
                    </div>
                    <div className="mt-4 space-y-3">
                      <label className="flex items-center gap-3 text-sm text-emerald-950">
                        <Checkbox checked={onlyVerified} onCheckedChange={(v) => setOnlyVerified(Boolean(v))} />
                        Verified only
                      </label>
                      <label className="flex items-center gap-3 text-sm text-emerald-950">
                        <Checkbox checked={freeholdOnly} onCheckedChange={(v) => setFreeholdOnly(Boolean(v))} />
                        Freehold only
                      </label>
                      <div className="rounded-xl border border-black/10 bg-[#f6f7fb] p-3">
                        <div className="text-xs text-emerald-950/60">Tip</div>
                        <div className="text-sm text-emerald-950 mt-1">
                          Add more filters later: lot size, proximity to road, utilities, zoning.
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-end">
                      <Button type="button" className="rounded-xl bg-emerald-900 text-white hover:bg-emerald-900/90">
                        Apply
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button type="button" className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 h-8 px-3 text-xs">
                  Save search
                </Button>

                <Button type="button" variant="ghost" className="rounded-lg h-8 px-3 text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                  Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[1400px] px-2 sm:px-3 md:px-4 py-4 pb-24">
        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-emerald-950">Loading properties...</div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
            <div className="text-lg font-semibold text-red-900">Error loading properties</div>
            <div className="mt-1 text-sm text-red-700">{error}</div>
            <Button
              type="button"
              variant="outline"
              className="mt-4 rounded-2xl border-red-300 text-red-900"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Beautiful grid */}
        {!loading && !error && (
          <>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {filtered.map((l) => (
                <ListingTile 
                  key={l.id} 
                  l={l} 
                  saved={savedIds.includes(l.id)} 
                  onToggleSave={toggleSave}
                  onShare={shareProperty}
                  onClick={() => {
                    const fullProperty = properties.find(p => p.propertyID === l.id);
                    if (fullProperty) {
                      openProperty(fullProperty);
                    }
                  }}
                />
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-black/5 bg-white p-10 text-center">
                <div className="text-lg font-semibold text-emerald-950">No matches</div>
                <div className="mt-1 text-sm text-emerald-950/60">
                  Try adjusting filters or searching a different city/country.
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 rounded-2xl border-black/10"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
      
      {/* Property Details Dialog */}
      <PropertyDetailsDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        property={selectedProperty}
        onSave={(propertyId) => toggleSave(propertyId)}
        saved={selectedProperty ? savedIds.includes(selectedProperty.propertyID || "") : false}
      />
    </div>
  );
}
