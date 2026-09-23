import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowRight,
  ChevronDown,
  LayoutGrid,
  Leaf,
  List,
  Search,
  Sprout,
} from "lucide-react";
import { TopNav } from "@/components/Profile/TopNav";
import { ListingTile, propertyToListing } from "@/components/ListingTile";
import { getAllProperties, getPropertyById, Property } from "@/services/propertyService";
import { PropertyDetailsDialog } from "@/components/PropertyDetailsDialog";
import { useRoleGate } from "@/hooks/useRoleGate";
import { useAuth } from "@/contexts/AuthContext";
import { getSavedPropertyIds, toggleSavedPropertyId } from "@/lib/savedProperties";
import { sharePropertyLink } from "@/lib/share";

const PURPOSES = [
  { key: "Residential", label: "Residential" },
  { key: "Agricultural", label: "Agricultural" },
  { key: "Commercial", label: "Commercial" },
  { key: "Mixed Use", label: "Mixed Use" },
] as const;

const AFRICAN_COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon",
  "Central African Republic", "Chad", "Comoros", "Congo", "Côte d'Ivoire", "Djibouti", "DR Congo",
  "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana",
  "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi",
  "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria",
  "Rwanda", "São Tomé and Príncipe", "Senegal", "Seychelles", "Sierra Leone", "Somalia",
  "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
].sort();

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2000&q=80";

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-medium text-emerald-950/70">{label}</div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-xl border border-emerald-950/10 bg-white px-3 pr-8 text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-900/15"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-950/40" />
      </div>
    </label>
  );
}

export default function LandfelloBuyPage() {
  useRoleGate("buy");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { currentUser, userProfile } = useAuth();
  const isAgent = userProfile?.accountType === "agent";
  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "Land" | "House">("all");
  const [propertyPurpose, setPropertyPurpose] = useState("all");
  const [beds, setBeds] = useState("any");
  const [baths, setBaths] = useState("any");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [freeholdOnly, setFreeholdOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(() => searchParams.get("saved") === "1");
  const [moreOpen, setMoreOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [view, setView] = useState<"grid" | "list">("grid");

  const [savedIds, setSavedIds] = useState<string[]>(() => getSavedPropertyIds());

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleSave = (id: string) => {
    if (!id) return;
    if (!currentUser) {
      navigate("/", { state: { openSignIn: true } });
      return;
    }
    setSavedIds(toggleSavedPropertyId(id));
  };

  const shareProperty = async (id: string) => {
    if (!id) return;
    const listing = properties.find((p) => p.propertyID === id);
    await sharePropertyLink(id, listing?.title);
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

  useEffect(() => {
    const countryParam = searchParams.get("country");
    if (countryParam) setCountryFilter(countryParam);
    setSavedOnly(searchParams.get("saved") === "1");
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function openFromQuery() {
      const propertyId = searchParams.get("property");
      if (!propertyId || loading) return;

      let match = properties.find((p) => p.propertyID === propertyId) || null;
      if (!match) {
        try {
          match = await getPropertyById(propertyId);
        } catch {
          match = null;
        }
      }
      if (cancelled || !match) return;
      setSelectedProperty(match);
      setDialogOpen(true);
    }

    openFromQuery();
    return () => {
      cancelled = true;
    };
  }, [loading, properties, searchParams]);

  useEffect(() => {
    let cancelled = false;
    async function fetchProperties() {
      try {
        setLoading(true);
        setError(null);
        const fetchedProperties = await getAllProperties(
          countryFilter ? { country: countryFilter } : undefined
        );
        if (!cancelled) setProperties(fetchedProperties);
      } catch (err: any) {
        console.error("Error fetching properties:", err);
        if (!cancelled) {
          setError(err.message || "Failed to load properties");
          setProperties([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProperties();
    return () => {
      cancelled = true;
    };
  }, [countryFilter]);

  const filtered = useMemo(() => {
    const listings = properties.map(propertyToListing);
    const q = query.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;

    const next = listings.filter((l) => {
      if (countryFilter && l.country !== countryFilter) return false;
      const hay = `${l.title} ${l.city} ${l.country} ${l.neighborhood ?? ""} ${l.landType} ${l.category} ${l.tenure} ${l.description} ${(l.tags || []).join(" ")}`
        .toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (categoryFilter !== "all" && l.category !== categoryFilter) return false;
      if (propertyPurpose !== "all" && l.landType !== propertyPurpose) return false;
      if (onlyVerified && !l.verified) return false;
      if (freeholdOnly && l.tenure !== "Freehold") return false;
      if (savedOnly && !savedIds.includes(l.id)) return false;
      if (beds !== "any" && l.category === "House") {
        const minBeds = parseInt(beds, 10);
        if (!l.bedrooms || l.bedrooms < minBeds) return false;
      }
      if (baths !== "any" && l.category === "House") {
        const minBaths = parseInt(baths, 10);
        if (!l.bathrooms || l.bathrooms < minBaths) return false;
      }
      const amount = l.priceUSD;
      if (min != null && !Number.isNaN(min) && amount > 0 && amount < min) return false;
      if (max != null && !Number.isNaN(max) && amount > max) return false;
      return true;
    });

    next.sort((a, b) => {
      if (sortBy === "price_asc") return a.priceUSD - b.priceUSD;
      if (sortBy === "price_desc") return b.priceUSD - a.priceUSD;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return next;
  }, [
    properties,
    query,
    countryFilter,
    categoryFilter,
    propertyPurpose,
    beds,
    baths,
    onlyVerified,
    freeholdOnly,
    savedOnly,
    savedIds,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  const clearFilters = () => {
    setCountryFilter("");
    setSearchParams((prev) => {
      prev.delete("country");
      prev.delete("saved");
      return prev;
    });
    setCategoryFilter("all");
    setPropertyPurpose("all");
    setBeds("any");
    setBaths("any");
    setMinPrice("");
    setMaxPrice("");
    setOnlyVerified(false);
    setFreeholdOnly(false);
    setSavedOnly(false);
    setQuery("");
  };

  const setSavedFilter = (on: boolean) => {
    setSavedOnly(on);
    setSearchParams((prev) => {
      if (on) prev.set("saved", "1");
      else prev.delete("saved");
      return prev;
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <TopNav />

      <section className="mx-auto max-w-[1400px] px-3 pt-4 sm:px-4">
        <div className="relative min-h-[280px] overflow-hidden rounded-[28px] md:min-h-[320px]">
          <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10" />

          <div className="relative z-10 flex min-h-[280px] flex-col justify-center px-6 py-10 md:min-h-[320px] md:px-10 lg:max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
              Land opportunities, a brighter tomorrow
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Find the perfect piece of land
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/80 md:text-base">
              Discover land, homes, and investment opportunities across Africa and beyond.
            </p>

            <form
              className="mt-6 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 shadow-lg"
              onSubmit={(e) => e.preventDefault()}
            >
              <Search className="ml-3 h-4 w-4 shrink-0 text-emerald-950/40" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by country, city, neighborhood, or keyword..."
                className="h-10 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
              />
              <Button
                type="submit"
                className="h-10 shrink-0 rounded-full bg-emerald-800 px-5 text-sm text-white hover:bg-emerald-900"
              >
                Search
              </Button>
            </form>
          </div>

          <div className="absolute right-6 top-6 hidden w-56 rounded-2xl border border-white/25 bg-white/15 p-5 text-white shadow-lg backdrop-blur-md lg:block">
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Sprout className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold">Invest in what matters</div>
            <p className="mt-1 text-xs leading-relaxed text-white/80">
              Land today. Generational tomorrow.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-3 py-6 sm:px-4 lg:grid-cols-[250px_1fr]">
        <aside className="h-fit rounded-[24px] border border-emerald-950/8 bg-white p-5 shadow-sm lg:sticky lg:top-20">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold text-emerald-950">Filters</div>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
            >
              Reset all
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-1.5 text-xs font-medium text-emerald-950/70">Property Type</div>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-emerald-50 p-1">
                {([
                  ["all", "Any"],
                  ["Land", "Land"],
                  ["House", "House"],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategoryFilter(key)}
                    className={`h-8 rounded-lg text-[11px] font-semibold ${
                      categoryFilter === key
                        ? "bg-emerald-800 text-white shadow-sm"
                        : "text-emerald-900/70 hover:bg-white/70"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <FilterSelect
              label="Country"
              value={countryFilter}
              onChange={(value) => {
                setCountryFilter(value);
                setSearchParams((prev) => {
                  if (value) prev.set("country", value);
                  else prev.delete("country");
                  return prev;
                });
              }}
            >
              <option value="">All countries</option>
              {AFRICAN_COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect label="User Purpose" value={propertyPurpose} onChange={setPropertyPurpose}>
              <option value="all">All purposes</option>
              {PURPOSES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </FilterSelect>

            <div className="grid grid-cols-2 gap-2">
              <FilterSelect label="Beds" value={beds} onChange={setBeds}>
                <option value="any">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </FilterSelect>
              <FilterSelect label="Baths" value={baths} onChange={setBaths}>
                <option value="any">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </FilterSelect>
            </div>

            <div>
              <div className="mb-1.5 text-xs font-medium text-emerald-950/70">Price Range</div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="$ Min"
                  className="h-10 rounded-xl"
                />
                <Input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="$ Max"
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-emerald-950/10 px-3 py-2 text-sm text-emerald-950"
            >
              More Filters
              <ChevronDown className={`h-4 w-4 transition ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            {moreOpen ? (
              <div className="space-y-3 rounded-xl bg-emerald-50/70 p-3">
                <label className="flex items-center gap-2 text-sm text-emerald-950">
                  <Checkbox checked={onlyVerified} onCheckedChange={(v) => setOnlyVerified(Boolean(v))} />
                  Verified only
                </label>
                <label className="flex items-center gap-2 text-sm text-emerald-950">
                  <Checkbox checked={freeholdOnly} onCheckedChange={(v) => setFreeholdOnly(Boolean(v))} />
                  Freehold only
                </label>
                <label className="flex items-center gap-2 text-sm text-emerald-950">
                  <Checkbox checked={savedOnly} onCheckedChange={(v) => setSavedFilter(Boolean(v))} />
                  Saved only
                </label>
              </div>
            ) : null}

            <Button
              type="button"
              className="h-11 w-full rounded-xl bg-emerald-900 text-white hover:bg-emerald-900/90"
            >
              Apply Filters
            </Button>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium text-emerald-950">
              {loading ? "Loading listings…" : `${filtered.length} ${filtered.length === 1 ? "property" : "properties"} found`}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-950/55">Sort by</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="h-9 appearance-none rounded-lg border border-emerald-950/10 bg-white px-3 pr-8 text-xs text-emerald-950"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price (Low–High)</option>
                  <option value="price_desc">Price (High–Low)</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-950/40" />
              </div>
              <div className="inline-flex rounded-lg border border-emerald-950/10 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${
                    view === "grid" ? "bg-emerald-800 text-white" : "text-emerald-900/60"
                  }`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${
                    view === "list" ? "bg-emerald-800 text-white" : "text-emerald-900/60"
                  }`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {error && !loading ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
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
          ) : null}

          {!loading && !error ? (
            <>
              <div
                className={
                  view === "grid"
                    ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid gap-4"
                }
              >
                {filtered.map((l) => (
                  <ListingTile
                    key={l.id}
                    l={l}
                    compact={view === "list"}
                    saved={savedIds.includes(l.id)}
                    onToggleSave={toggleSave}
                    onShare={shareProperty}
                    onClick={() => {
                      const fullProperty = properties.find((p) => p.propertyID === l.id);
                      if (fullProperty) openProperty(fullProperty);
                    }}
                  />
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-black/5 bg-white p-10 text-center">
                  <div className="text-lg font-semibold text-emerald-950">
                    {savedOnly ? "No saved properties yet" : "No matches"}
                  </div>
                  <div className="mt-1 text-sm text-emerald-950/60">
                    {savedOnly
                      ? "Tap Save on a listing to bookmark it here."
                      : "Try adjusting filters or searching a different city/country."}
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

              <div className="mt-8 overflow-hidden rounded-[24px] border border-emerald-200/70 bg-gradient-to-r from-emerald-50 to-white px-6 py-5 sm:px-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                      <Leaf className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-emerald-950">
                        {isAgent
                          ? "Ready to list another property?"
                          : "Own a property and want to list it?"}
                      </div>
                      <p className="text-xs text-emerald-950/65">
                        {isAgent
                          ? "Go to your dashboard to manage listings or publish a new one."
                          : "Create an agent account to publish land and house listings."}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() =>
                      navigate(isAgent ? "/my-properties" : "/create-account")
                    }
                    className="rounded-full bg-emerald-800 px-5 text-white hover:bg-emerald-900"
                  >
                    {isAgent ? "Dashboard" : "Sell"}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : null}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-[22px] bg-emerald-900/5" />
              ))}
            </div>
          ) : null}
        </div>
      </div>

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
