import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { TopNav } from "@/components/Profile/TopNav";
import { ListingTile, propertyToListing } from "@/components/ListingTile";
import { PropertyDetailsDialog } from "@/components/PropertyDetailsDialog";
import { Button } from "@/components/ui/button";
import { getSavedPropertyIds, toggleSavedPropertyId } from "@/lib/savedProperties";
import { getAllProperties, type Property } from "@/services/propertyService";
import { sharePropertyLink } from "@/lib/share";

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { currentUser, userProfile, loading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>(() => getSavedPropertyIds());
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState<Property | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      navigate("/", { replace: true, state: { openSignIn: true } });
      return;
    }
    if (userProfile?.accountType === "agent") {
      navigate("/my-properties", { replace: true });
    }
  }, [loading, currentUser, userProfile, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setFetching(true);
        const rows = await getAllProperties();
        if (!cancelled) setProperties(rows);
      } catch {
        if (!cancelled) setProperties([]);
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const savedListings = useMemo(() => {
    const set = new Set(savedIds);
    return properties
      .filter((p) => p.propertyID && set.has(p.propertyID))
      .map(propertyToListing);
  }, [properties, savedIds]);

  if (loading || !currentUser || userProfile?.accountType === "agent") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <TopNav />
      <div className="mx-auto max-w-[1400px] px-3 py-8 sm:px-4">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-emerald-800">
              <Heart className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">Buyer dashboard</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-emerald-950">Saved land</h1>
            <p className="mt-2 text-sm text-emerald-950/65">
              Properties you bookmarked while browsing. Open one to review details or call to buy.
            </p>
          </div>
          <Button
            type="button"
            className="rounded-2xl bg-emerald-900 text-white hover:bg-emerald-800"
            onClick={() => navigate("/")}
          >
            Browse more land
          </Button>
        </div>

        {fetching ? (
          <div className="rounded-3xl border border-emerald-950/8 bg-white p-10 text-center text-sm text-emerald-950/60">
            Loading your saved properties…
          </div>
        ) : savedListings.length === 0 ? (
          <div className="rounded-3xl border border-emerald-950/8 bg-white p-10 text-center">
            <div className="text-lg font-semibold text-emerald-950">No saved properties yet</div>
            <p className="mt-1 text-sm text-emerald-950/60">
              Tap the heart on a listing to save it here.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 rounded-2xl"
              onClick={() => navigate("/")}
            >
              Explore listings
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {savedListings.map((l) => (
              <ListingTile
                key={l.id}
                l={l}
                saved
                onToggleSave={(id) => setSavedIds(toggleSavedPropertyId(id))}
                onShare={async (id) => {
                  const listing = properties.find((p) => p.propertyID === id);
                  await sharePropertyLink(id, listing?.title);
                }}
                onClick={() => {
                  const full = properties.find((p) => p.propertyID === l.id) || null;
                  setSelected(full);
                  setDialogOpen(Boolean(full));
                }}
              />
            ))}
          </div>
        )}
      </div>

      <PropertyDetailsDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelected(null);
        }}
        property={selected}
        saved={selected ? savedIds.includes(selected.propertyID || "") : false}
        onSave={(id) => setSavedIds(toggleSavedPropertyId(id))}
      />
    </div>
  );
}
