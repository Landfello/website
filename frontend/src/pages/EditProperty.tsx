import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getPropertyById, updateProperty, Property } from "@/services/propertyService";
import { TopNav } from "@/components/Profile/TopNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  DollarSign,
  Home,
  Ruler,
  FileText,
  Image as ImageIcon,
  Tag,
  Phone,
  Mail,
  X,
  ArrowLeft,
} from "lucide-react";
import { useRoleGate } from "@/hooks/useRoleGate";

function Field({
  label,
  icon,
  children,
  hint,
  required,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-emerald-950 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-950/45">{icon}</div>
        {children}
      </div>
      {hint ? <div className="mt-1 text-xs text-emerald-950/60">{hint}</div> : null}
    </div>
  );
}

export default function EditProperty() {
  useRoleGate("sell");
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [listingType, setListingType] = useState<"sale" | "rent">("sale");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    country: "",
    city: "",
    neighborhood: "",
    propertyType: "Residential",
    areaAcres: "",
    tenure: "Freehold",
    leaseTerm: "Long-term",
    price: "",
    monthlyRent: "",
    tags: [] as string[],
    tagInput: "",
    images: [] as string[],
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  });

  useEffect(() => {
    if (!currentUser || !propertyId) {
      navigate("/my-properties");
      return;
    }

    // Allow both agents and investors to edit their own properties
    // No restriction needed - loadProperty will verify ownership
    loadProperty();
  }, [currentUser, userProfile, propertyId, navigate]);

  const loadProperty = async () => {
    if (!currentUser || !propertyId) return;

    try {
      setLoading(true);
      setError("");
      
      console.log(`Loading property ${propertyId} for user ${currentUser.uid}`);
      const property = await getPropertyById(propertyId, currentUser.uid);
      
      if (!property) {
        setError("Property not found. It may have been deleted or you don't have permission to edit it.");
        setLoading(false);
        return;
      }
      
      // Verify the property belongs to the current user (by userId)
      if (property.userId !== currentUser.uid) {
        setError("You don't have permission to edit this property.");
        setLoading(false);
        return;
      }
      
      setListingType(property.listingType);
      setFormData({
        title: property.title,
        description: property.description,
        country: property.country,
        city: property.city,
        neighborhood: property.neighborhood || "",
        propertyType: property.propertyType,
        areaAcres: property.areaAcres.toString(),
        tenure: property.tenure || "Freehold",
        leaseTerm: property.leaseTerm || "Long-term",
        price: property.price?.toString() || "",
        monthlyRent: property.monthlyRent?.toString() || "",
        tags: property.tags || [],
        tagInput: "",
        images: property.images || [],
        contactName: property.contactName,
        contactPhone: property.contactPhone,
        contactEmail: property.contactEmail,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load property");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: "",
      }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      // Convert files to base64 data URLs for storage (same as AddProperty)
      const imagePromises = Array.from(files).map((file) => {
        return new Promise<string>((resolve, reject) => {
          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            reject(new Error(`File ${file.name} is too large. Maximum size is 5MB.`));
            return;
          }

          // Validate file type
          if (!file.type.startsWith('image/')) {
            reject(new Error(`File ${file.name} is not an image.`));
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            // reader.result is a base64 data URL
            resolve(reader.result as string);
          };
          reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
          reader.readAsDataURL(file);
        });
      });

      const base64Images = await Promise.all(imagePromises);
      
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...base64Images],
      }));
    } catch (err: any) {
      setError(err.message || "Failed to process images");
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    setFormData((prev) => {
      const newImages = [...prev.images];
      if (direction === 'up' && index > 0) {
        [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
      } else if (direction === 'down' && index < newImages.length - 1) {
        [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      }
      return {
        ...prev,
        images: newImages,
      };
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('imageIndex', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('imageIndex'));
    if (dragIndex !== dropIndex) {
      setFormData((prev) => {
        const newImages = [...prev.images];
        const [removed] = newImages.splice(dragIndex, 1);
        newImages.splice(dropIndex, 0, removed);
        return {
          ...prev,
          images: newImages,
        };
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentUser || !propertyId) {
      setError("You must be signed in to edit a property");
      return;
    }

    if (formData.images.length < 2) {
      setError("Please upload at least 2 images of the property");
      return;
    }

    try {
      setSaving(true);

      const updates: Partial<Property> = {
        listingType,
        title: formData.title,
        description: formData.description,
        country: formData.country,
        city: formData.city,
        neighborhood: formData.neighborhood || undefined,
        propertyType: formData.propertyType as Property["propertyType"],
        areaAcres: parseFloat(formData.areaAcres) || 0,
        tenure: listingType === "sale" ? (formData.tenure as "Freehold" | "Leasehold") : undefined,
        leaseTerm: listingType === "rent" ? (formData.leaseTerm as "Short-term" | "Long-term" | "Flexible") : undefined,
        price:
          listingType === "sale"
            ? (() => {
                const n = parseFloat(formData.price);
                return Number.isFinite(n) ? n : undefined;
              })()
            : undefined,
        monthlyRent:
          listingType === "rent"
            ? (() => {
                const n = parseFloat(formData.monthlyRent);
                return Number.isFinite(n) ? n : undefined;
              })()
            : undefined,
        tags: formData.tags,
        images: formData.images,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
      };

      await updateProperty(propertyId, currentUser.uid, updates);
      navigate("/my-properties");
    } catch (err: any) {
      setError(err.message || "Failed to update property. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const propertyTypes = ["Residential", "Commercial", "Agricultural", "Mixed Use"];
  const tenureTypes = ["Freehold", "Leasehold"];
  const leaseTerms = ["Short-term", "Long-term", "Flexible"];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
        <TopNav />
        <div className="mx-auto max-w-4xl px-4 py-10 text-center">
          <div className="text-gray-600">Loading property...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <TopNav />

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/my-properties")}
            className="mb-4 rounded-2xl px-3 py-1.5 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to My Properties
          </Button>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-emerald-950">
            Edit Property
            <span className="block text-emerald-900/70 text-xl mt-1">
              Update your property listing
            </span>
          </h1>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Listing Type */}
          <Card className="rounded-[28px] bg-white/80 ring-1 ring-black/5 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-emerald-950 mb-4">Listing Type</h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setListingType("sale")}
                className={`flex-1 rounded-2xl p-4 text-center transition-colors ring-1 ${
                  listingType === "sale"
                    ? "bg-emerald-900/5 ring-emerald-900/20"
                    : "bg-white ring-black/5 hover:bg-emerald-900/5"
                }`}
              >
                <DollarSign className={`h-6 w-6 mx-auto mb-2 ${listingType === "sale" ? "text-emerald-950" : "text-emerald-950/70"}`} />
                <div className={`text-sm font-semibold ${listingType === "sale" ? "text-emerald-950" : "text-emerald-950/70"}`}>
                  For Sale
                </div>
              </button>
              <button
                type="button"
                onClick={() => setListingType("rent")}
                className={`flex-1 rounded-2xl p-4 text-center transition-colors ring-1 ${
                  listingType === "rent"
                    ? "bg-emerald-900/5 ring-emerald-900/20"
                    : "bg-white ring-black/5 hover:bg-emerald-900/5"
                }`}
              >
                <Home className={`h-6 w-6 mx-auto mb-2 ${listingType === "rent" ? "text-emerald-950" : "text-emerald-950/70"}`} />
                <div className={`text-sm font-semibold ${listingType === "rent" ? "text-emerald-950" : "text-emerald-950/70"}`}>
                  For Rent
                </div>
              </button>
            </div>
          </Card>

          {/* Basic Information */}
          <Card className="rounded-[28px] bg-white/80 ring-1 ring-black/5 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-emerald-950 mb-4">Basic Information</h2>
            <div className="space-y-5">
              <Field label="Property Title" icon={<FileText className="h-4 w-4" />} required>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Beachfront Parcel — 0.9 acres"
                  className="w-full rounded-2xl pl-9"
                  required
                />
              </Field>

              <div>
                <label className="block text-sm font-medium text-emerald-950 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the property, its features, and any important details..."
                  className="w-full rounded-2xl border border-emerald-900/15 px-4 py-3 min-h-[120px] text-sm text-emerald-950 placeholder:text-emerald-950/40 focus:outline-none focus:ring-2 focus:ring-emerald-900/20"
                  required
                />
              </div>
            </div>
          </Card>

          {/* Location */}
          <Card className="rounded-[28px] bg-white/80 ring-1 ring-black/5 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-emerald-950 mb-4">Location</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Country" icon={<MapPin className="h-4 w-4" />} required>
                <Input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="e.g., Ghana"
                  className="w-full rounded-2xl pl-9"
                  required
                />
              </Field>

              <Field label="City" icon={<MapPin className="h-4 w-4" />} required>
                <Input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Accra"
                  className="w-full rounded-2xl pl-9"
                  required
                />
              </Field>

              <Field label="Neighborhood (optional)" icon={<MapPin className="h-4 w-4" />}>
                <Input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  placeholder="e.g., East Legon"
                  className="w-full rounded-2xl pl-9"
                />
              </Field>
            </div>
          </Card>

          {/* Property Details */}
          <Card className="rounded-[28px] bg-white/80 ring-1 ring-black/5 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-emerald-950 mb-4">Property Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Property Type" icon={<Home className="h-4 w-4" />} required>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-emerald-900/15 px-4 py-2.5 pl-9 text-sm text-emerald-950 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900/20"
                  required
                >
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Area (acres)" icon={<Ruler className="h-4 w-4" />} required>
                <Input
                  type="number"
                  name="areaAcres"
                  value={formData.areaAcres}
                  onChange={handleChange}
                  placeholder="0.5"
                  step="0.1"
                  min="0"
                  className="w-full rounded-2xl pl-9"
                  required
                />
              </Field>

              {listingType === "sale" ? (
                <Field label="Tenure" icon={<FileText className="h-4 w-4" />} required>
                  <select
                    name="tenure"
                    value={formData.tenure}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-emerald-900/15 px-4 py-2.5 pl-9 text-sm text-emerald-950 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900/20"
                    required
                  >
                    {tenureTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <Field label="Lease Term" icon={<FileText className="h-4 w-4" />} required>
                  <select
                    name="leaseTerm"
                    value={formData.leaseTerm}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-emerald-900/15 px-4 py-2.5 pl-9 text-sm text-emerald-950 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900/20"
                    required
                  >
                    {leaseTerms.map((term) => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>
          </Card>

          {/* Pricing */}
          <Card className="rounded-[28px] bg-white/80 ring-1 ring-black/5 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-emerald-950 mb-4">Pricing</h2>
            {listingType === "sale" ? (
              <Field label="Price (USD)" icon={<DollarSign className="h-4 w-4" />} required>
                <Input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="50000"
                  min="0"
                  className="w-full rounded-2xl pl-9"
                  required
                />
              </Field>
            ) : (
              <Field label="Monthly Rent (USD)" icon={<DollarSign className="h-4 w-4" />} required>
                <Input
                  type="number"
                  name="monthlyRent"
                  value={formData.monthlyRent}
                  onChange={handleChange}
                  placeholder="500"
                  min="0"
                  className="w-full rounded-2xl pl-9"
                  required
                />
              </Field>
            )}
          </Card>

          {/* Images Gallery */}
          <Card className="rounded-[28px] bg-white/80 ring-1 ring-black/5 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-emerald-950">Property Image Gallery</h2>
              {formData.images.length > 0 && (
                <span className="text-sm text-emerald-950/60 bg-emerald-50 px-3 py-1 rounded-full">
                  {formData.images.length} {formData.images.length === 1 ? 'image' : 'images'}
                </span>
              )}
            </div>
            <div className="space-y-4">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-emerald-900/20 rounded-2xl p-8 text-center hover:border-emerald-900/40 transition-colors">
                <ImageIcon className="h-10 w-10 text-emerald-950/40 mx-auto mb-3" />
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <span className="text-sm font-medium text-emerald-950/70 block mb-1">
                    Click to upload or drag and drop images
                  </span>
                  <div className="text-xs text-emerald-950/50">
                    PNG, JPG, GIF up to 5MB each • At least 2 images required
                  </div>
                </label>
              </div>

              {/* Image Gallery */}
              {formData.images.length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm text-emerald-950/70 mb-2">
                    💡 <strong>Tip:</strong> The first image will be used as the main property photo. Drag images to reorder.
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => {
                      const isBlobUrl = image.startsWith('blob:');
                      return (
                        <div
                          key={index}
                          draggable={!isBlobUrl}
                          onDragStart={(e) => !isBlobUrl && handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => !isBlobUrl && handleDrop(e, index)}
                          className={`relative group bg-gray-100 rounded-xl overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-all ${isBlobUrl ? 'cursor-not-allowed border-red-300' : 'cursor-move'}`}
                        >
                          {/* Primary Image Badge */}
                          {index === 0 && (
                            <div className="absolute top-2 left-2 z-10 bg-emerald-600 text-white text-xs font-semibold px-2 py-1 rounded">
                              Primary
                            </div>
                          )}
                          
                          {/* Image or Placeholder */}
                          {isBlobUrl ? (
                            <div className="w-full h-40 bg-red-50 border-2 border-dashed border-red-300 flex flex-col items-center justify-center text-xs text-red-600 text-center p-2">
                              <X className="h-6 w-6 mb-1 text-red-400" />
                              Image unavailable
                            </div>
                          ) : (
                            <img
                              src={image}
                              alt={`Property image ${index + 1}`}
                              className="w-full h-40 object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="w-full h-40 bg-gray-200 flex flex-col items-center justify-center text-xs text-gray-500">
                                      <svg class="h-6 w-6 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      Image unavailable
                                    </div>
                                  `;
                                }
                              }}
                            />
                          )}
                          
                          {/* Image Number */}
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded">
                            #{index + 1}
                          </div>

                          {/* Action Buttons */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {/* Move Up Button */}
                            {!isBlobUrl && index > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(index, 'up')}
                                className="bg-white/90 hover:bg-white text-emerald-950 p-2 rounded-full transition-colors"
                                title="Move up"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                            )}
                            
                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                              title="Remove image"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            
                            {/* Move Down Button */}
                            {!isBlobUrl && index < formData.images.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(index, 'down')}
                                className="bg-white/90 hover:bg-white text-emerald-950 p-2 rounded-full transition-colors"
                                title="Move down"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Tags/Features */}
          <Card className="rounded-[28px] bg-white/80 ring-1 ring-black/5 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-emerald-950 mb-4">Tags & Features</h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={formData.tagInput}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tagInput: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="e.g., Ocean view, Road access"
                  className="flex-1 rounded-2xl"
                />
                <Button type="button" onClick={handleAddTag} className="rounded-2xl bg-emerald-900 text-white hover:bg-emerald-900/90">
                  <Tag className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="rounded-full bg-emerald-900/5 text-emerald-950 hover:bg-emerald-900/5 ring-1 ring-emerald-900/10 flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="rounded-[28px] bg-white/80 ring-1 ring-black/5 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-emerald-950 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Contact Name" icon={<FileText className="h-4 w-4" />} required>
                <Input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full rounded-2xl pl-9"
                  required
                />
              </Field>

              <Field label="Phone" icon={<Phone className="h-4 w-4" />} required>
                <Input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  className="w-full rounded-2xl pl-9"
                  required
                />
              </Field>

              <Field label="Email" icon={<Mail className="h-4 w-4" />} required>
                <Input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full rounded-2xl pl-9"
                  required
                />
              </Field>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/my-properties")}
              disabled={saving}
              className="rounded-2xl border-emerald-900/15 text-emerald-950 bg-white disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-amber-400 text-emerald-950 hover:bg-amber-300 px-6 py-2.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </main>

      <footer className="border-t border-emerald-900/10 bg-white/70 mt-12">
        <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-emerald-950/60">
          © {new Date().getFullYear()} Landfello. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

