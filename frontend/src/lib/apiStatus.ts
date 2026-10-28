const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export type ApiCapabilities = {
  uploads: boolean;
  accountType: boolean;
  modernAuth: boolean;
};

const STALE: ApiCapabilities = {
  uploads: false,
  accountType: false,
  modernAuth: false,
};

let cached: ApiCapabilities | null = null;
let pending: Promise<ApiCapabilities> | null = null;

function openApiUrl(): string {
  if (API_BASE_URL.startsWith("http")) {
    return `${API_BASE_URL.replace(/\/api$/, "")}/openapi.json`;
  }
  return "/openapi.json";
}

export async function getApiCapabilities(): Promise<ApiCapabilities> {
  if (cached) return cached;
  if (pending) return pending;

  pending = (async () => {
    try {
      const response = await fetch(openApiUrl());
      if (!response.ok) {
        cached = STALE;
        return cached;
      }
      const spec = await response.json();
      const paths = spec?.paths || {};
      cached = {
        uploads: Boolean(paths["/api/uploads"]),
        accountType: Boolean(paths["/api/auth/account-type"]),
        modernAuth: Boolean(paths["/api/uploads"] || paths["/api/auth/account-type"]),
      };
      return cached;
    } catch {
      cached = STALE;
      return cached;
    }
  })();

  return pending;
}
