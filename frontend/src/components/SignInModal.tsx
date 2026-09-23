import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { homePathForRole } from "@/lib/roles";

export function SignInModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowForgotPassword(false);
      setEmail("");
      setPassword("");
      setError("");
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleForgotPasswordSubmit = async (method: "email" | "phone", value: string) => {
    if (method === "email") {
      try {
        await resetPassword(value);
        alert("Password reset link has been sent to your email");
        setShowForgotPassword(false);
      } catch (err: any) {
        alert(err.message || "Failed to send password reset email");
      }
    } else {
      alert("Phone number reset is not available. Please use email.");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const profile = await login(email.trim(), password);
      onClose();
      navigate(homePathForRole(profile.accountType));
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 z-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 my-auto w-full max-w-md rounded-[28px] bg-white ring-1 ring-black/5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            {!showForgotPassword && (
              <>
                <h2 className="text-2xl font-semibold text-emerald-950">Sign in</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 hover:bg-emerald-900/5 transition-colors"
                >
                  <X className="h-5 w-5 text-emerald-950" />
                </button>
              </>
            )}
          </div>

          {showForgotPassword ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="absolute top-6 right-6 rounded-full p-2 hover:bg-emerald-900/5 transition-colors"
              >
                <X className="h-5 w-5 text-emerald-950" />
              </button>
              <ForgotPasswordForm
                onBack={() => setShowForgotPassword(false)}
                onSubmit={handleForgotPasswordSubmit}
              />
            </>
          ) : (
            <form className="space-y-4" onSubmit={handleSignIn}>
              {error && (
                <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-emerald-950 mb-2">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-2xl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-950 mb-2">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-emerald-950/70">
                  <input type="checkbox" className="rounded" />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowForgotPassword(true);
                  }}
                  className="text-emerald-900 hover:text-emerald-950 cursor-pointer underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-emerald-900 text-white hover:bg-emerald-900/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </div>

              <div className="text-center text-sm text-emerald-950/70 pt-4">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/create-account");
                  }}
                  className="text-emerald-900 hover:text-emerald-950 font-semibold underline"
                >
                  Sign up
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
