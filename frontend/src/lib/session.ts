import { getSupabase } from "@/lib/supabase";

const TOKEN_KEY = "landfello_token";
const USER_KEY = "landfello_user";

export type AccountType = "investor" | "agent";

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  getIdToken: () => Promise<string>;
}

export interface UserProfile {
  accountType: AccountType;
  accountTypeChosen?: boolean;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  licenseNumber?: string;
  companyName?: string;
  specialties?: string[];
  yearsExp?: number;
  serviceAreas?: string[];
  photoURL?: string;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthTokenError(message: string): boolean {
  return /invalid or expired token|jwt expired|session expired|token has expired/i.test(
    message,
  );
}

export function sessionExpiredMessage(): string {
  return "Your session expired. Please sign out and sign in again.";
}

export async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    let session = data.session;
    const expiresAtMs = session?.expires_at ? session.expires_at * 1000 : 0;
    const needsRefresh = Boolean(session) && (!expiresAtMs || expiresAtMs < Date.now() + 60_000);

    if (needsRefresh) {
      const { data: refreshed, error } = await supabase.auth.refreshSession();
      if (!error && refreshed.session) {
        session = refreshed.session;
      } else if (expiresAtMs && expiresAtMs < Date.now()) {
        session = null;
      }
    }

    if (session?.access_token) {
      localStorage.setItem(TOKEN_KEY, session.access_token);
      return session.access_token;
    }
  }
  return getStoredToken();
}

export function getStoredUser(): { uid: string; email: string; photoURL?: string | null; profile: UserProfile } | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function persistSession(token: string, user: { uid: string; email: string; photoURL?: string | null; profile: UserProfile }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function toAppUser(uid: string, email: string, photoURL?: string | null): AppUser {
  return {
    uid,
    email,
    photoURL: photoURL || null,
    getIdToken: async () => {
      const token = getStoredToken();
      if (!token) throw new Error("Not authenticated");
      return token;
    },
  };
}
