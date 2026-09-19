import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProperties, deleteProperty, Property } from "@/services/propertyService";
import { TopNav } from "@/components/Profile/TopNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Edit, Trash2, Plus } from "lucide-react";
import { useRoleGate } from "@/hooks/useRoleGate";

function formatStatus(property: Property) {
  return property.status === "sold" ? "Sold" : "Available";
}

export default function MyProperties() {
  useRoleGate("sell");
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadProperties();
    } else {
      navigate("/");
    }
  }, [currentUser, userProfile, navigate]);

  const loadProperties = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      // Always show only the user's own properties
      const userProperties = await getUserProperties(currentUser.uid);
      setProperties(userProperties);
    } catch (err: any) {
      setError(err.message || "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!currentUser) return;

    if (!confirm("Are you sure you want to delete this property?")) {
      return;
    }

    try {
      setDeletingId(propertyId);
      await deleteProperty(propertyId, currentUser.uid);
      setProperties(properties.filter((p) => p.propertyID !== propertyId));
    } catch (err: any) {
      alert(err.message || "Failed to delete property");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (propertyId: string) => {
    navigate(`/edit-property/${propertyId}`);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <TopNav />

      <div className="mx-auto max-w-[1400px] px-2 sm:px-3 md:px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              Active Listings
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your property listings - add, edit, or delete
            </p>
          </div>
          <Button
            onClick={() => navigate("/add-property")}
            className="rounded-lg bg-emerald-900 text-white hover:bg-emerald-900/90 shadow-sm hover:shadow-md transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-900 mb-4"></div>
            <div className="text-gray-600">Loading properties...</div>
          </div>
        ) : properties.length === 0 ? (
          <Card className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="text-lg font-semibold text-gray-900 mb-2">No properties yet</div>
            <div className="text-sm text-gray-600 mb-6">
              Start by adding your first property listing
            </div>
            <Button
              onClick={() => navigate("/add-property")}
              className="rounded-lg bg-emerald-900 text-white hover:bg-emerald-900/90 shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Property
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {properties.map((property) => (
              <Card key={property.propertyID} className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-all duration-200">
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="relative">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-emerald-100 to-emerald-50" />
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge className={property.verified ? "bg-green-600 text-white" : "bg-gray-600 text-white"}>
                        {property.verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="text-xl font-semibold text-gray-900 mb-2">
                      {property.title}
                    </div>

                    <div className="text-sm text-emerald-800 mb-1">
                      {formatStatus(property)}
                    </div>

                    <div className="text-xs text-gray-600 mb-3 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {property.neighborhood ? `${property.neighborhood}, ` : ""}
                      {property.city}, {property.country}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <Badge className="rounded-full bg-gray-100 text-gray-700 border border-gray-300 text-xs">
                        {property.propertyType}
                      </Badge>
                      <Badge className="rounded-full bg-gray-100 text-gray-700 border border-gray-300 text-xs">
                        {property.areaAcres} acres
                      </Badge>
                      {property.listingType === "sale" && property.tenure && (
                        <Badge className="rounded-full bg-gray-100 text-gray-700 border border-gray-300 text-xs">
                          {property.tenure}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleEdit(property.propertyID!)}
                        className="flex-1 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Edit className="h-4 w-4 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleDelete(property.propertyID!)}
                        disabled={deletingId === property.propertyID}
                        className="rounded-lg border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

