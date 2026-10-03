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
const PENDING_ROLE_KEY = "landfello_pending_role";

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

/** Google returns with a code, hash tokens, callback path, or chosen account type. */
function isAuthCallback(pathname: string, search: string, hash: string) {
  if (pathname === "/auth/callback") return true;
  const params = new URLSearchParams(search);
  return (
    params.has("code") ||
    params.has("error") ||
    params.has("error_description") ||
    params.has("accountType") ||
    /access_token|refresh_token|provider_token|error_description/.test(hash)
  );
}

function roleFromValue(value: string | null | undefined): AccountType | null {
  return value === "agent" || value === "investor" ? value : null;
}

function readPendingRole(): AccountType | null {
  try {
    return (
      roleFromValue(localStorage.getItem(PENDING_ROLE_KEY)) ||
      roleFromValue(sessionStorage.getItem(PENDING_ROLE_KEY))
    );
  } catch {
    return null;
  }
}

function writePendingRole(accountType?: AccountType) {
  try {
    if (accountType) {
      localStorage.setItem(PENDING_ROLE_KEY, accountType);
      sessionStorage.setItem(PENDING_ROLE_KEY, accountType);
    } else {
      localStorage.removeItem(PENDING_ROLE_KEY);
      sessionStorage.removeItem(PENDING_ROLE_KEY);
    }
  } catch {
    // ignore storage failures
  }
}

function clearPendingRole() {
  try {
    localStorage.removeItem(PENDING_ROLE_KEY);
    sessionStorage.removeItem(PENDING_ROLE_KEY);
  } catch {
    // ignore
  }
}

/** Role chosen before Google, then the return URL, then Supabase metadata. */
function roleForCallback(
  search: string,
  metadata?: Record<string, unknown> | null
): AccountType | null {
  const fromMeta = metadata?.account_type;
  return (
    readPendingRole() ||
    roleFromValue(new URLSearchParams(search).get("accountType")) ||
    roleFromValue(typeof fromMeta === "string" ? fromMeta : null)
  );
}

function currentPathWithQuery() {
  return window.location.pathname + window.location.search;
}

function shouldLeaveFor(dest: string) {
  if (isAuthCallback(window.location.pathname, window.location.search, window.location.hash)) {
    return true;
  }
  return currentPathWithQuery() !== dest;
}

/** Drop OAuth query/hash junk so a failed callback cannot leave a blank ?code= page. */
function cleanAuthParamsFromUrl() {
  const url = new URL(window.location.href);
  [
    "code",
    "state",
    "error",
    "error_description",
    "error_code",
    "accountType",
  ].forEach((key) => url.searchParams.delete(key));
  url.hash = "";
  const next =
    url.pathname === "/auth/callback"
      ? "/"
      : url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : "");
  window.history.replaceState({}, "", next);
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

  async function applyAccountType(token: string, accountType: AccountType): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/auth/account-type`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ accountType }),
    });
    const user = await parseJson(response);
    applyAuth(token, user);
    return user.profile as UserProfile;
  }

  /**
   * Load (or create) the API profile for a Supabase session, apply any role
   * chosen before Google OAuth, then send the user to the right dashboard.
   */
  async function completeSignedInSession(
    token: string,
    metadata: Record<string, unknown> | null | undefined,
    options: { redirect: boolean; search?: string }
  ): Promise<UserProfile | null> {
    const preferred =
      roleForCallback(options.search ?? window.location.search, metadata) ||
      readPendingRole();

    let profile: UserProfile;
    if (preferred) {
      clearPendingRole();
      try {
        profile = await applyAccountType(token, preferred);
      } catch {
        profile = await loadProfile(token);
      }
    } else {
      profile = await loadProfile(token);
    }

    if (!options.redirect) return profile;

    // New Google users who haven't picked buyer vs agent stay on home for the prompt.
    const dest =
      profile.accountTypeChosen === false ? "/" : dashboardPathForRole(profile.accountType);

    if (shouldLeaveFor(dest)) {
      window.location.replace(dest);
      return null;
    }
    return profile;
  }

  async function adoptApiSession(data: {
    token: string;
    refreshToken?: string | null;
    user: any;
  }): Promise<UserProfile> {
    applyAuth(data.token, data.user);
    const supabase = getSupabase();
    if (supabase && data.refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: data.token,
        refresh_token: data.refreshToken,
      });
      if (error) {
        console.warn("Could not sync Supabase session:", error.message);
      }
    }
    return data.user.profile as UserProfile;
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

    // Always use the API for email/password so accounts are created already confirmed
    // (no "check your email" step). Google OAuth stays on the Supabase client path.
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
    return adoptApiSession(data);
  }

  async function login(email: string, password: string): Promise<UserProfile> {
    // API path also auto-confirms older unconfirmed email/password accounts.
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = await parseJson(response);
    return adoptApiSession(data);
  }

  async function signInWithGoogle(accountType?: AccountType) {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error("Google sign-in is not configured yet.");
    }
    writePendingRole(accountType);

    // Must be listed under Supabase → Authentication → URL Configuration → Redirect URLs.
    // If it is missing, Supabase falls back to the Site URL (often production) and local
    // Google sign-in breaks with a blank ?code= page.
    const redirect = new URL(`${window.location.origin}/auth/callback`);
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
      redirectTo: `${window.location.origin}/auth/callback`,
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
      await applyAccountType(token, updates.accountType);
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
    let handlingAuthEvent = false;
    let navigatingAway = false;
    let unsubscribe: (() => void) | undefined;

    async function boot() {
      const searchAtLoad = window.location.search;
      const hashAtLoad = window.location.hash;
      const pathAtLoad = window.location.pathname;
      const fromAuthCallback = isAuthCallback(pathAtLoad, searchAtLoad, hashAtLoad);
      const supabase = getSupabase();

      try {
        if (supabase) {
          const params = new URLSearchParams(searchAtLoad);
          const authCode = params.get("code");
          const authError = params.get("error_description") || params.get("error");

          if (authError) {
            console.warn("OAuth provider error:", authError);
            cleanAuthParamsFromUrl();
          } else if (authCode) {
            // Exchange on this exact origin. If Google returned to the wrong host
            // (e.g. production while you started on localhost), PKCE fails — recover
            // by clearing the URL instead of leaving a blank page.
            const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);
            if (error || !data.session) {
              console.warn(
                "OAuth code exchange failed:",
                error?.message || "No session. Is this redirect URL allow-listed in Supabase?"
              );
              cleanAuthParamsFromUrl();
            } else if (!cancelled) {
              const profile = await completeSignedInSession(
                data.session.access_token,
                data.session.user?.user_metadata as Record<string, unknown> | undefined,
                { redirect: true, search: searchAtLoad }
              );
              if (profile === null) {
                navigatingAway = true;
                return;
              }
            }
          } else {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
              console.warn("Supabase getSession failed:", error.message);
            }

            const session = data.session;
            if (session?.access_token && !cancelled) {
              try {
                const profile = await completeSignedInSession(
                  session.access_token,
                  session.user?.user_metadata as Record<string, unknown> | undefined,
                  { redirect: fromAuthCallback, search: searchAtLoad }
                );
                if (profile === null) {
                  navigatingAway = true;
                  return;
                }
              } catch (err) {
                console.warn("Failed to load profile for session:", err);
                clearSession();
                if (!cancelled) {
                  setCurrentUser(null);
                  setUserProfile(null);
                }
                if (fromAuthCallback) cleanAuthParamsFromUrl();
              }
            } else if (fromAuthCallback) {
              cleanAuthParamsFromUrl();
            }
          }

          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
            if (cancelled || handlingAuthEvent || navigatingAway) return;

            if (event === "INITIAL_SESSION") {
              return;
            }

            if (!nextSession) {
              clearSession();
              setCurrentUser(null);
              setUserProfile(null);
              return;
            }

            if (event !== "SIGNED_IN" && event !== "TOKEN_REFRESHED") {
              return;
            }

            handlingAuthEvent = true;
            try {
              const redirect = event === "SIGNED_IN" && fromAuthCallback;
              await completeSignedInSession(
                nextSession.access_token,
                nextSession.user?.user_metadata as Record<string, unknown> | undefined,
                { redirect, search: searchAtLoad }
              );
            } catch (err) {
              console.warn("Auth state profile sync failed:", err);
            } finally {
              handlingAuthEvent = false;
            }
          });

          unsubscribe = () => subscription.unsubscribe();
          return;
        }

        const token = getStoredToken();
        const stored = getStoredUser();
        if (token && stored) {
          setCurrentUser(toAppUser(stored.uid, stored.email, stored.photoURL));
          setUserProfile(stored.profile);
          try {
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
              clearSession();
              setCurrentUser(null);
              setUserProfile(null);
            } else {
              const user = await res.json();
              applyAuth(token, user);
            }
          } catch {
            // Keep cached session if the API is briefly unreachable.
          }
        }
      } catch (err) {
        console.warn("Auth boot failed:", err);
        if (fromAuthCallback) cleanAuthParamsFromUrl();
      } finally {
        if (!cancelled && !navigatingAway) setLoading(false);
      }
    }

    boot();

    return () => {
      cancelled = true;
      unsubscribe?.();
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

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-emerald-50 px-6">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-emerald-900/20 border-t-emerald-900" />
            <p className="mt-4 text-sm font-medium text-emerald-950">Loading Landfello…</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
