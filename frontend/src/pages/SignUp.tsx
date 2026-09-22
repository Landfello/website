import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Building2,
  Briefcase,
  Key,
  Phone,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/BrandLogo";

function StrengthBar({ value }: { value: number }) {
  const label = value <= 1 ? "Weak" : value === 2 ? "Fair" : value === 3 ? "Good" : "Strong";
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-emerald-950/60">Password strength</span>
        <span className="text-emerald-950/70 font-medium">{label}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-emerald-900/10 overflow-hidden ring-1 ring-emerald-900/10">
        <div
          className="h-full bg-amber-400 transition-all"
          style={{ width: `${Math.min(100, value * 25)}%` }}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
  hint,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-emerald-950 mb-2">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-950/45">{icon}</div>
        {children}
      </div>
      {hint ? <div className="mt-1 text-xs text-emerald-950/60">{hint}</div> : null}
    </div>
  );
}

function AccountTypeCard({
  active,
  title,
  subtitle,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative rounded-3xl p-4 text-left transition-all",
        "ring-1 ring-black/5 shadow-sm",
        active
          ? "bg-white border-2 border-emerald-900/60"
          : "bg-white/70 hover:bg-white border-2 border-transparent",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            "h-11 w-11 rounded-2xl flex items-center justify-center transition-colors",
            active ? "bg-emerald-950 text-white" : "bg-emerald-950/10 text-emerald-950",
          ].join(" ")}
        >
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold text-emerald-950">{title}</div>
          <div className="text-xs text-emerald-950/60">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

export default function SignUp() {
  const navigate = useNavigate();
  const { signup, signInWithGoogle } = useAuth();

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accountType, setAccountType] = useState<"investor" | "agent">("investor");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    securityCode: "",
  });

  const passwordStrength = useMemo(() => {
    const p = formData.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordStrength < 2) {
      setError("Password is too weak. Please use a stronger password.");
      return;
    }

    if (accountType === "agent" && !formData.securityCode) {
      setError("Security code is required for agents");
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (!accountType || (accountType !== "agent" && accountType !== "investor")) {
        setError("Invalid account type selected. Please refresh and try again.");
        setLoading(false);
        return;
      }

      const profileData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
      };

      if (accountType === "agent" && formData.companyName) {
        profileData.companyName = formData.companyName;
      }
      if (accountType === "agent" && formData.securityCode) {
        profileData.licenseNumber = formData.securityCode.trim();
      }

      await signup(formData.email.trim(), formData.password, accountType, profileData);
      navigate(accountType === "agent" ? "/my-properties" : "/buy");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError("");
      await signInWithGoogle();
      navigate("/buy");
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      {/* Background accents (removes "plain white" feeling) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-[52rem] -translate-x-1/2 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute top-40 -left-40 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <BrandLogo showTagline />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="rounded-2xl px-3 py-2 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Back to home
            </Button>
          </div>
        </div>
      </header>

      {/* Main (two-column layout so it doesn't feel empty) */}
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-start">
          {/* Left brand panel */}
          <section className="hidden lg:block">
            <div className="rounded-[36px] bg-white/60 ring-1 ring-black/5 shadow-sm overflow-hidden">
              <div className="p-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950 text-white px-4 py-2 text-xs font-semibold">
                  <Sparkles className="h-4 w-4" />
                  Invest & list across Africa
                </div>

                <h2 className="mt-5 text-4xl font-semibold tracking-tight text-emerald-950">
                  Build wealth with real land opportunities.
                </h2>
                <p className="mt-3 text-emerald-950/70 max-w-xl">
                  Landfello helps investors browse verified listings and helps agents showcase properties
                  professionally—end-to-end, in one place.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    { t: "Verified listings", d: "Reduce risk & uncertainty" },
                    { t: "Secure identity", d: "Trusted account types" },
                    { t: "Guided purchase", d: "Support when needed" },
                    { t: "Agent tools", d: "List & manage easily" },
                  ].map((x) => (
                    <div
                      key={x.t}
                      className="rounded-3xl bg-white/70 ring-1 ring-black/5 p-4"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
                        <CheckCircle2 className="h-4 w-4 text-emerald-900" />
                        {x.t}
                      </div>
                      <div className="mt-1 text-xs text-emerald-950/60">{x.d}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-3xl bg-gradient-to-r from-emerald-950 to-emerald-800 text-white p-6">
                  <div className="text-sm font-semibold">Tip</div>
                  <div className="mt-1 text-sm text-white/85">
                    You can switch account types later—create an account now and explore.
                  </div>
                </div>
              </div>

              <div className="border-t border-emerald-900/10 bg-white/60 px-8 py-6">
                <div className="text-xs text-emerald-950/60">
                  © {new Date().getFullYear()} Landfello. This is a UI concept preview.
                </div>
              </div>
            </div>
          </section>

          {/* Right form panel */}
          <section>
            <div className="rounded-[36px] bg-white/80 ring-1 ring-black/5 shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-emerald-950">
                  Create your account
                </h1>
                <p className="mt-2 text-emerald-950/70">
                  {accountType === "investor"
                    ? "Join Landfello to browse verified opportunities, save toward a goal, and get guided purchase support."
                    : "Join Landfello as a real estate agent to list properties, connect with investors, and grow your business."}
                </p>

                {/* Account Type Selection (cleaner + feels "designed") */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-emerald-950 mb-3">
                    Account type
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <AccountTypeCard
                      active={accountType === "investor"}
                      title="Investor"
                      subtitle="Purchase land & property"
                      icon={<User className="h-5 w-5" />}
                      onClick={() => setAccountType("investor")}
                    />
                    <AccountTypeCard
                      active={accountType === "agent"}
                      title="Real Estate Agent"
                      subtitle="List & manage properties"
                      icon={<Briefcase className="h-5 w-5" />}
                      onClick={() => setAccountType("agent")}
                    />
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="First name" icon={<User className="h-4 w-4" />}>
                      <Input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="John"
                        className="w-full rounded-2xl pl-9 bg-white"
                        required
                      />
                    </Field>

                    <Field label="Last name" icon={<User className="h-4 w-4" />}>
                      <Input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Doe"
                        className="w-full rounded-2xl pl-9 bg-white"
                        required
                      />
                    </Field>
                  </div>

                  <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john.doe@example.com"
                      className="w-full rounded-2xl pl-9 bg-white"
                      required
                    />
                  </Field>

                  <Field label="Phone number" icon={<Phone className="h-4 w-4" />}>
                    <Input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="+1234567890"
                      className="w-full rounded-2xl pl-9 bg-white"
                      required
                    />
                  </Field>

                  {accountType === "agent" && (
                    <div className="rounded-3xl bg-emerald-900/5 ring-1 ring-emerald-900/10 p-5 space-y-4">
                      <div className="text-sm font-semibold text-emerald-950">
                        Agent verification
                      </div>

                      <Field label="Company name (optional)" icon={<Building2 className="h-4 w-4" />}>
                        <Input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          placeholder="ABC Realty"
                          className="w-full rounded-2xl pl-9 bg-white"
                        />
                      </Field>

                      <Field
                        label="Security Code"
                        icon={<Key className="h-4 w-4" />}
                        hint="Required for agent verification."
                      >
                        <Input
                          type="text"
                          name="securityCode"
                          value={formData.securityCode}
                          onChange={handleChange}
                          placeholder="Enter your security code"
                          className="w-full rounded-2xl pl-9 bg-white"
                          required
                        />
                      </Field>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-emerald-950 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-950/45">
                        <Lock className="h-4 w-4" />
                      </div>
                      <Input
                        type={showPass ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a strong password"
                        className="w-full rounded-2xl pl-9 pr-12 bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-950/55 hover:text-emerald-950"
                        aria-label="Toggle password visibility"
                      >
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <StrengthBar value={passwordStrength} />
                    <div className="mt-2 grid sm:grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-emerald-900/5 ring-1 ring-emerald-900/10 px-3 py-2 text-xs text-emerald-950/70">
                        • 8+ characters
                      </div>
                      <div className="rounded-2xl bg-emerald-900/5 ring-1 ring-emerald-900/10 px-3 py-2 text-xs text-emerald-950/70">
                        • Mix letters & numbers
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-950 mb-2">
                      Confirm password
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-950/45">
                        <Lock className="h-4 w-4" />
                      </div>
                      <Input
                        type={showConfirm ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        className="w-full rounded-2xl pl-9 pr-12 bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-950/55 hover:text-emerald-950"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <input type="checkbox" className="mt-1 rounded" required />
                    <label className="text-emerald-950/70">
                      I agree to the{" "}
                      <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-900 hover:text-emerald-950 font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a
                        href="/legal"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-900 hover:text-emerald-950 font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Privacy Policy
                      </a>
                    </label>
                  </div>

                  {error && (
                    <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="pt-2 space-y-3">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-2xl bg-amber-400 text-emerald-950 hover:bg-amber-300 px-5 py-2.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Creating account..." : "Create account"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleSignUp}
                      disabled={loading}
                      className="w-full rounded-2xl border-emerald-900/15 text-emerald-950 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </Button>
                  </div>

                  <div className="text-center text-sm text-emerald-950/70 pt-2">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate('/', { state: { openSignIn: true } })}
                      className="text-emerald-900 hover:text-emerald-950 font-semibold"
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
