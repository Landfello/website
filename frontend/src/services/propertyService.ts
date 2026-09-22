import { getStoredToken } from "@/lib/session";

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
  return getStoredToken();
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
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return data as T;
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

  return parseResponse<Property>(response);
}

export async function getUserProperties(userId: string): Promise<Property[]> {
  const token = await getAuthToken();
  if (!token) throw new Error("You must be signed in to view your properties");

  const response = await fetch(`${API_BASE_URL}/properties/user/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<Property[]>(response);
}

export async function getPropertyById(propertyId: string, _userId?: string): Promise<Property> {
  const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`);
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

  return parseResponse<Property>(response);
}

export async function deleteProperty(propertyId: string, _userId: string): Promise<void> {
  const token = await getAuthToken();
  if (!token) throw new Error("You must be signed in to delete a property");

  const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

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
  return parseResponse<Property[]>(response);
}
