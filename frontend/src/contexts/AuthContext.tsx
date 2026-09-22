import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AccountType,
  AppUser,
  UserProfile,
  clearSession,
  getStoredToken,
  getStoredUser,
  persistSession,
  toAppUser,
} from "@/lib/session";

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
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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

  async function signup(
    email: string,
    password: string,
    accountType: AccountType,
    profileData?: Partial<UserProfile>
  ): Promise<UserProfile> {
    if (!accountType || (accountType !== "agent" && accountType !== "investor")) {
      throw new Error(`Invalid account type: ${accountType}`);
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
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = await parseJson(response);
    applyAuth(data.token, data.user);
    return data.user.profile as UserProfile;
  }

  async function logout() {
    clearSession();
    setCurrentUser(null);
    setUserProfile(null);
  }

  async function signInWithGoogle() {
    throw new Error("Google sign-in is not configured in this demo. Use email/password.");
  }

  async function resetPassword(_email: string) {
    throw new Error("Password reset is not available in the local demo yet.");
  }

  async function updateProfilePicture(imageFile: File): Promise<string> {
    const token = getStoredToken();
    if (!token) throw new Error("You must be signed in to update your profile picture");

    if (!imageFile.type.startsWith("image/")) {
      throw new Error("Please choose an image file");
    }
    if (imageFile.size > 4 * 1024 * 1024) {
      throw new Error("Image is too large. Maximum size is 4MB.");
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(imageFile);
    });

    const response = await fetch(`${API_BASE_URL}/auth/photo`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ photoURL: dataUrl }),
    });
    const user = await parseJson(response);
    applyAuth(token, user);
    return dataUrl;
  }

  async function refreshUserProfile() {
    const token = getStoredToken();
    if (!token) return;
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await parseJson(response);
    applyAuth(token, user);
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!userProfile) throw new Error("No user logged in");
    // Local-only profile merge for demo (backend profile update can be added later)
    const next = { ...userProfile, ...updates };
    setUserProfile(next);
    const stored = getStoredUser();
    if (stored) {
      persistSession(getStoredToken() || "", { ...stored, profile: next });
    }
  }

  async function changePassword() {
    throw new Error("Change password is not available in the local demo yet.");
  }

  async function changeEmail() {
    throw new Error("Change email is not available in the local demo yet.");
  }

  async function deactivateAccount() {
    throw new Error("Account deactivation is not available in the local demo yet.");
  }

  useEffect(() => {
    const token = getStoredToken();
    const stored = getStoredUser();
    if (token && stored) {
      setCurrentUser(toAppUser(stored.uid, stored.email, stored.photoURL));
      setUserProfile(stored.profile);
      // Refresh from API in background
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
        .catch(() => {
          // Keep local session if API is briefly unavailable
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    signInWithGoogle,
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
