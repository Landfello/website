import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AccountType,
  AppUser,
  UserProfile,
  clearSession,
  getAccessToken,
  getStoredToken,
  getStoredUser,
  persistSession,
  toAppUser,
} from "@/lib/session";
import { getSupabase } from "@/lib/supabase";
import { dashboardPathForRole } from "@/lib/roles";
import { uploadImageFiles } from "@/services/uploads";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

interface AuthContextType {
  currentUser: AppUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (
    email: string,
    password: string,
    accountType: AccountType,
    profileData?: Partial<UserProfile>
  ) => Promise<UserProfile>;
  login: (email: string, password: string) => Promise<UserProfile>;
  signInWithGoogle: (accountType?: AccountType) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfilePicture: (imageFile: File) => Promise<string>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  changeEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  deactivateAccount: (currentPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

const PENDING_ROLE_KEY = "landfello_pending_role";

/** Google returns to the site with a code, hash tokens, or the chosen account type. */
function isAuthCallback(search: string, hash: string) {
  const params = new URLSearchParams(search);
  return (
    params.has("code") ||
    params.has("accountType") ||
    /access_token|refresh_token|provider_token|error_description/.test(hash)
  );
}

function roleFromValue(value: string | null): AccountType | null {
  return value === "agent" || value === "investor" ? value : null;
}

function leaveAuthCallback(role: AccountType | null) {
  const dest = dashboardPathForRole(role);
  const here = window.location.pathname;
  if (here === dest && !window.location.search && !window.location.hash) return;
  window.location.replace(dest);
}

async function parseJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.error || `Request failed (${response.status})`);
  }
  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAuth = (token: string, user: any) => {
    const profile = user.profile as UserProfile;
    persistSession(token, {
      uid: user.uid,
      email: user.email,
      photoURL: user.photoURL,
      profile,
    });
    setCurrentUser(toAppUser(user.uid, user.email, user.photoURL));
    setUserProfile(profile);
  };

  async function loadProfile(token: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await parseJson(response);
    applyAuth(token, user);
    return user.profile as UserProfile;
  }

  async function signup(
    email: string,
    password: string,
    accountType: AccountType,
    profileData?: Partial<UserProfile>
  ): Promise<UserProfile> {
    if (!accountType || (accountType !== "agent" && accountType !== "investor")) {
      throw new Error(`Invalid account type: ${accountType}`);
    }

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            account_type: accountType,
            account_type_chosen: true,
            first_name: profileData?.firstName,
            last_name: profileData?.lastName,
            phone_number: profileData?.phoneNumber,
          },
        },
      });
      if (error) throw new Error(error.message);
      if (!data.session) {
        throw new Error("Check your email to confirm your account, then sign in.");
      }
      return loadProfile(data.session.access_token);
    }

    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password,
        accountType,
        firstName: profileData?.firstName,
        lastName: profileData?.lastName,
        phoneNumber: profileData?.phoneNumber,
        licenseNumber: profileData?.licenseNumber,
        companyName: profileData?.companyName,
      }),
    });
    const data = await parseJson(response);
    applyAuth(data.token, data.user);
    return data.user.profile as UserProfile;
  }

  async function login(email: string, password: string): Promise<UserProfile> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw new Error(error.message);
      if (!data.session) throw new Error("Sign in failed");
      return loadProfile(data.session.access_token);
    }

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = await parseJson(response);
    applyAuth(data.token, data.user);
    return data.user.profile as UserProfile;
  }

  async function signInWithGoogle(accountType?: AccountType) {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error("Google sign-in is not configured yet.");
    }
    const redirect = new URL(window.location.origin + "/");
    if (accountType) redirect.searchParams.set("accountType", accountType);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirect.toString(),
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) throw new Error(error.message);
  }

  async function logout() {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    clearSession();
    setCurrentUser(null);
    setUserProfile(null);
  }

  async function resetPassword(email: string) {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error("Password reset is not available until Supabase Auth is configured.");
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + "/",
    });
    if (error) throw new Error(error.message);
  }

  async function updateProfilePicture(imageFile: File): Promise<string> {
    const token = await getAccessToken();
    if (!token) throw new Error("You must be signed in to update your profile picture");

    const [url] = await uploadImageFiles([imageFile]);
    const response = await fetch(`${API_BASE_URL}/auth/photo`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ photoURL: url }),
    });
    const user = await parseJson(response);
    applyAuth(token, user);
    return url;
  }

  async function refreshUserProfile() {
    const token = await getAccessToken();
    if (!token) return;
    await loadProfile(token);
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!userProfile) throw new Error("No user logged in");
    if (updates.accountType) {
      const token = await getAccessToken();
      if (!token) throw new Error("You must be signed in");
      const response = await fetch(`${API_BASE_URL}/auth/account-type`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accountType: updates.accountType }),
      });
      const user = await parseJson(response);
      applyAuth(token, user);
      return;
    }
    const next = { ...userProfile, ...updates };
    setUserProfile(next);
    const stored = getStoredUser();
    if (stored) {
      persistSession(getStoredToken() || "", { ...stored, profile: next });
    }
  }

  async function changePassword(_currentPassword: string, newPassword: string) {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error("Change password is not available until Supabase Auth is configured.");
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  async function changeEmail(_currentPassword: string, newEmail: string) {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error("Change email is not available until Supabase Auth is configured.");
    }
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) throw new Error(error.message);
  }

  async function deactivateAccount() {
    throw new Error("Account deactivation is not available yet.");
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const searchAtLoad = window.location.search;
      const hashAtLoad = window.location.hash;
      const fromAuthCallback = isAuthCallback(searchAtLoad, hashAtLoad);
      const supabase = getSupabase();
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        const picked = roleFromValue(new URLSearchParams(searchAtLoad).get("accountType"));
        if (token && fromAuthCallback && !cancelled) {
          if (picked) sessionStorage.setItem(PENDING_ROLE_KEY, picked);
          let role = picked;
          if (!role) {
            try {
              role = (await loadProfile(token)).accountType;
            } catch {
              role = null;
            }
          }
          const dest = dashboardPathForRole(role);
          const stillOnCallback =
            window.location.pathname !== dest ||
            Boolean(window.location.search) ||
            Boolean(window.location.hash);
          if (stillOnCallback) {
            window.location.replace(dest);
            return;
          }
        }
        if (token) {
          const pending = roleFromValue(sessionStorage.getItem(PENDING_ROLE_KEY));
          try {
            if (pending) {
              sessionStorage.removeItem(PENDING_ROLE_KEY);
              try {
                const response = await fetch(`${API_BASE_URL}/auth/account-type`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ accountType: pending }),
                });
                const user = await parseJson(response);
                applyAuth(token, user);
              } catch {
                await loadProfile(token);
              }
            } else {
              await loadProfile(token);
            }
          } catch {
            clearSession();
            setCurrentUser(null);
            setUserProfile(null);
          }
        }
        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (cancelled) return;
          if (!session) {
            clearSession();
            setCurrentUser(null);
            setUserProfile(null);
            return;
          }
          if (fromAuthCallback) {
            if (picked) sessionStorage.setItem(PENDING_ROLE_KEY, picked);
            leaveAuthCallback(picked);
            return;
          }
          try {
            await loadProfile(session.access_token);
          } catch {
            // Profile row may not exist yet; keep the session token for a retry.
          }
        });
        if (!cancelled) setLoading(false);
        return;
      }

      const token = getStoredToken();
      const stored = getStoredUser();
      if (token && stored) {
        setCurrentUser(toAppUser(stored.uid, stored.email, stored.photoURL));
        setUserProfile(stored.profile);
        fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
          .then(async (res) => {
            if (!res.ok) {
              clearSession();
              setCurrentUser(null);
              setUserProfile(null);
              return;
            }
            const user = await res.json();
            applyAuth(token, user);
          })
          .catch(() => {})
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      } else if (!cancelled) {
        setLoading(false);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    signInWithGoogle,
    logout,
    resetPassword,
    updateProfilePicture,
    updateProfile,
    refreshUserProfile,
    changePassword,
    changeEmail,
    deactivateAccount,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
