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
