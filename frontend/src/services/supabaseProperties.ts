import { getSupabase } from "@/lib/supabase";
import type { Property } from "@/services/propertyService";

type PropertyRow = {
  property_id: string;
  user_id: string;
  listing_type: Property["listingType"];
  title: string;
  description: string | null;
  country: string;
  city: string;
  neighborhood: string | null;
  property_type: string;
  category: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_acres: number;
  tenure: string | null;
  lease_term: string | null;
  price: number | null;
  monthly_rent: number | null;
  tags: string[] | null;
  images: string[] | null;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  created_at?: string;
  updated_at?: string;
  verified?: boolean;
  days_on_market?: number;
  status?: string;
};

export function rowToProperty(row: PropertyRow): Property {
  return {
    propertyID: row.property_id,
    userId: row.user_id,
    listingType: row.listing_type,
    title: row.title,
    description: row.description || "",
    country: row.country,
    city: row.city,
    neighborhood: row.neighborhood || undefined,
    propertyType: (row.property_type as Property["propertyType"]) || "Residential",
    category: (row.category as Property["category"]) || "Land",
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    areaAcres: row.area_acres,
    tenure: (row.tenure as Property["tenure"]) || "Freehold",
    leaseTerm: (row.lease_term as Property["leaseTerm"]) || undefined,
    price: row.price ?? undefined,
    monthlyRent: row.monthly_rent ?? undefined,
    tags: row.tags || [],
    images: row.images || [],
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    verified: Boolean(row.verified),
    daysOnMarket: row.days_on_market || 0,
    status: row.status || "available",
  };
}

function propertyToRow(property: Property, propertyId: string): PropertyRow {
  return {
    property_id: propertyId,
    user_id: property.userId,
    listing_type: property.listingType,
    title: property.title,
    description: property.description || "",
    country: property.country,
    city: property.city,
    neighborhood: property.neighborhood || null,
    property_type: property.propertyType,
    category: property.category || "Land",
    bedrooms: property.bedrooms ?? null,
    bathrooms: property.bathrooms ?? null,
    area_acres: property.areaAcres,
    tenure: property.tenure || "Freehold",
    lease_term: property.leaseTerm || null,
    price: property.price ?? null,
    monthly_rent: property.monthlyRent ?? null,
    tags: property.tags || [],
    images: property.images || [],
    contact_name: property.contactName,
    contact_phone: property.contactPhone,
    contact_email: property.contactEmail,
    verified: true,
    days_on_market: 0,
    status: "available",
  };
}

async function ensurePublicUser(property: Property): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("users").upsert(
    {
      id: property.userId,
      email: property.contactEmail,
      account_type: "agent",
      account_type_chosen: true,
      first_name: property.contactName?.split(" ")[0] || null,
      last_name: property.contactName?.split(" ").slice(1).join(" ") || null,
      phone_number: property.contactPhone || null,
    },
    { onConflict: "id" },
  );
}

export async function listPropertiesFromSupabase(): Promise<Property[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "available")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => rowToProperty(row as PropertyRow));
}

export async function listUserPropertiesFromSupabase(userId: string): Promise<Property[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => rowToProperty(row as PropertyRow));
}

export async function getPropertyFromSupabase(propertyId: string): Promise<Property | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToProperty(data as PropertyRow);
}

export async function createPropertyInSupabase(property: Property): Promise<Property> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Cloud database is not configured.");
  }
  await ensurePublicUser(property);
  const propertyId = property.propertyID || crypto.randomUUID();
  const { data, error } = await supabase
    .from("properties")
    .insert(propertyToRow(property, propertyId))
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message || "Could not publish listing.");
  }
  return rowToProperty(data as PropertyRow);
}

export async function updatePropertyInSupabase(
  propertyId: string,
  updates: Partial<Property>,
): Promise<Property> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Cloud database is not configured.");
  }
  const patch: Record<string, unknown> = {};
  if (updates.title != null) patch.title = updates.title;
  if (updates.description != null) patch.description = updates.description;
  if (updates.country != null) patch.country = updates.country;
  if (updates.city != null) patch.city = updates.city;
  if (updates.neighborhood != null) patch.neighborhood = updates.neighborhood;
  if (updates.propertyType != null) patch.property_type = updates.propertyType;
  if (updates.category != null) patch.category = updates.category;
  if (updates.bedrooms != null) patch.bedrooms = updates.bedrooms;
  if (updates.bathrooms != null) patch.bathrooms = updates.bathrooms;
  if (updates.areaAcres != null) patch.area_acres = updates.areaAcres;
  if (updates.tenure != null) patch.tenure = updates.tenure;
  if (updates.price != null) patch.price = updates.price;
  if (updates.tags != null) patch.tags = updates.tags;
  if (updates.images != null) patch.images = updates.images;
  if (updates.contactName != null) patch.contact_name = updates.contactName;
  if (updates.contactPhone != null) patch.contact_phone = updates.contactPhone;
  if (updates.contactEmail != null) patch.contact_email = updates.contactEmail;

  const { data, error } = await supabase
    .from("properties")
    .update(patch)
    .eq("property_id", propertyId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message || "Could not update listing.");
  }
  return rowToProperty(data as PropertyRow);
}

export async function deletePropertyInSupabase(propertyId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Cloud database is not configured.");
  }
  const { error } = await supabase.from("properties").delete().eq("property_id", propertyId);
  if (error) {
    throw new Error(error.message || "Could not delete listing.");
  }
}

const LOCAL_KEY = "landfello_local_listings";

export function listLocalProperties(userId?: string): Property[] {
  try {
    const items = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") as Property[];
    return userId ? items.filter((item) => item.userId === userId) : items;
  } catch {
    return [];
  }
}

export function saveLocalProperty(property: Property): Property {
  const next = {
    ...property,
    propertyID: property.propertyID || crypto.randomUUID(),
    status: property.status || "available",
    createdAt: property.createdAt || new Date().toISOString(),
  };
  const items = listLocalProperties().filter((item) => item.propertyID !== next.propertyID);
  items.unshift(next);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  return next;
}

export function removeLocalProperty(propertyId: string): void {
  const items = listLocalProperties().filter((item) => item.propertyID !== propertyId);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

export function mergeProperties(primary: Property[], extra: Property[]): Property[] {
  const seen = new Set(primary.map((item) => item.propertyID).filter(Boolean));
  return [
    ...primary,
    ...extra.filter((item) => item.propertyID && !seen.has(item.propertyID)),
  ];
}
