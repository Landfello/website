import { getAccessToken, isAuthTokenError, sessionExpiredMessage } from "@/lib/session";
import {
  createPropertyInSupabase,
  deletePropertyInSupabase,
  getPropertyFromSupabase,
  listLocalProperties,
  listPropertiesFromSupabase,
  listUserPropertiesFromSupabase,
  mergeProperties,
  removeLocalProperty,
  saveLocalProperty,
  updatePropertyInSupabase,
} from "@/services/supabaseProperties";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export interface Property {
  propertyID?: string;
  userId: string;
  listingType: "sale" | "rent";
  title: string;
  description: string;
  country: string;
  city: string;
  neighborhood?: string;
  /** How the property will be used (Residential, Commercial, etc.) */
  propertyType: "Residential" | "Commercial" | "Agricultural" | "Mixed Use";
  /** What is being sold: Land or House */
  category?: "Land" | "House";
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaAcres: number;
  tenure?: "Freehold" | "Leasehold";
  leaseTerm?: "Short-term" | "Long-term" | "Flexible";
  price?: number;
  monthlyRent?: number;
  tags: string[];
  images: string[];
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  createdAt?: string;
  updatedAt?: string;
  verified?: boolean;
  daysOnMarket?: number;
  status?: string;
  agentName?: string;
  agentCompany?: string;
}

async function getAuthToken(): Promise<string | null> {
  return getAccessToken();
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();

  let data: any = null;
  if (contentType.includes("application/json") && raw) {
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
    }
  }

  if (!response.ok) {
    const msg = data?.detail || data?.error || raw || `Request failed (${response.status})`;
    const text = typeof msg === "string" ? msg : JSON.stringify(msg);
    if (response.status === 401 || isAuthTokenError(text)) {
      throw new Error(sessionExpiredMessage());
    }
    throw new Error(text);
  }

  return data as T;
}

function shouldUseSupabaseFallback(status: number, text: string): boolean {
  return status === 401 || status === 403 || status === 404 || isAuthTokenError(text);
}

export async function createProperty(property: Property): Promise<Property> {
  const token = await getAuthToken();
  if (!token) throw new Error("You must be signed in to create a property");

  const response = await fetch(`${API_BASE_URL}/properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(property),
  });

  if (shouldUseSupabaseFallback(response.status, await response.clone().text())) {
    try {
      return await createPropertyInSupabase(property);
    } catch {
      return saveLocalProperty(property);
    }
  }

  return parseResponse<Property>(response);
}

export async function getUserProperties(userId: string): Promise<Property[]> {
  const token = await getAuthToken();
  if (!token) throw new Error("You must be signed in to view your properties");

  const response = await fetch(`${API_BASE_URL}/properties/user/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (shouldUseSupabaseFallback(response.status, await response.clone().text())) {
    return mergeProperties(await listUserPropertiesFromSupabase(userId), listLocalProperties(userId));
  }
  const fromApi = await parseResponse<Property[]>(response);
  return mergeProperties(
    fromApi,
    mergeProperties(await listUserPropertiesFromSupabase(userId), listLocalProperties(userId)),
  );
}

export async function getPropertyById(propertyId: string, _userId?: string): Promise<Property> {
  const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`);
  if (!response.ok) {
    const fromSupabase = await getPropertyFromSupabase(propertyId);
    if (fromSupabase) return fromSupabase;
    const local = listLocalProperties().find((item) => item.propertyID === propertyId);
    if (local) return local;
  }
  return parseResponse<Property>(response);
}

export async function updateProperty(
  propertyId: string,
  _userId: string,
  updates: Partial<Property>
): Promise<Property> {
  const token = await getAuthToken();
  if (!token) throw new Error("You must be signed in to update a property");

  const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (shouldUseSupabaseFallback(response.status, await response.clone().text())) {
    try {
      return await updatePropertyInSupabase(propertyId, updates);
    } catch {
      const current = listLocalProperties().find((item) => item.propertyID === propertyId);
      if (!current) throw new Error("Could not update listing.");
      return saveLocalProperty({ ...current, ...updates, propertyID: propertyId });
    }
  }

  return parseResponse<Property>(response);
}

export async function deleteProperty(propertyId: string, _userId: string): Promise<void> {
  const token = await getAuthToken();
  if (!token) throw new Error("You must be signed in to delete a property");

  const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (shouldUseSupabaseFallback(response.status, await response.clone().text())) {
    try {
      await deletePropertyInSupabase(propertyId);
    } catch {
      removeLocalProperty(propertyId);
    }
    return;
  }

  if (!response.ok) {
    await parseResponse(response);
  }
}

export async function getAllProperties(filters?: {
  country?: string;
  propertyType?: string;
  category?: "Land" | "House";
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
}): Promise<Property[]> {
  const params = new URLSearchParams();
  if (filters?.country) params.append("country", filters.country);
  if (filters?.propertyType) params.append("propertyType", filters.propertyType);
  if (filters?.category) params.append("category", filters.category);
  if (filters?.minPrice) params.append("minPrice", filters.minPrice.toString());
  if (filters?.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
  if (filters?.minBedrooms) params.append("minBedrooms", filters.minBedrooms.toString());
  if (filters?.minBathrooms) params.append("minBathrooms", filters.minBathrooms.toString());

  const url = params.toString()
    ? `${API_BASE_URL}/properties?${params.toString()}`
    : `${API_BASE_URL}/properties`;

  const response = await fetch(url);
  const fromApi = response.ok ? await parseResponse<Property[]>(response) : [];
  return mergeProperties(
    fromApi,
    mergeProperties(await listPropertiesFromSupabase(), listLocalProperties()),
  );
}
