import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, ShieldCheck, MapPin, ArrowRight, SlidersHorizontal, CheckCircle2, X, ArrowUpRight } from "lucide-react";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import residentialImage from "@/assets/images/image.jpeg";
import { BrandLogo } from "@/components/BrandLogo";
import { homePathForRole } from "@/lib/roles";

// Landfello — UI Preview (single-file)

const countries = [
  { code: "NG", name: "Nigeria", from: 350000, popular: true },
  { code: "GH", name: "Ghana", from: 420000, popular: true },
  { code: "KE", name: "Kenya", from: 480000, popular: false },
  { code: "ZA", name: "South Africa", from: 550000, popular: true },
  { code: "TZ", name: "Tanzania", from: 380000, popular: false },
  { code: "RW", name: "Rwanda", from: 450000, popular: false },
];

const listingsSeed = [
  {
    id: 1,
    title: "Residential Plot · 500 sqm",
    location: "Accra, Ghana",
    price: 420000,
    type: "Land",
    country: "Ghana",
    tags: ["Verified title", "Road access"],
    image: residentialImage,
  },
  {
    id: 2,
    title: "Beachfront Land · 1,200 sqm",
    location: "Zanzibar, Tanzania",
    price: 850000,
    type: "Land",
    country: "Tanzania",
    tags: ["Surveyed", "Power nearby"],
  },
  {
    id: 3,
    title: "2‑Bed Apartment",
    location: "Lagos, Nigeria",
    price: 680000,
    type: "Home",
    country: "Nigeria",
    tags: ["Verified docs", "Great rental demand"],
  },
  {
    id: 4,
    title: "Farm Land · 2 hectares",
    location: "Nairobi outskirts, Kenya",
    price: 480000,
    type: "Land",
    country: "Kenya",
    tags: ["Water access", "Clear boundaries"],
  },
];

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function getCountryFlag(code: string): string {
  const flagMap: Record<string, string> = {
    NG: "🇳🇬", // Nigeria
    GH: "🇬🇭", // Ghana
    KE: "🇰🇪", // Kenya
    ZA: "🇿🇦", // South Africa
    TZ: "🇹🇿", // Tanzania
    RW: "🇷🇼", // Rwanda
  };
  return flagMap[code] || code;
}

function FlagCircle({ code }: { code: string }) {
  return (
    <span className="text-3xl">{getCountryFlag(code)}</span>
  );
}

function Pill({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/70 ring-1 ring-black/5 px-4 py-3">
      <div className="mt-0.5 text-emerald-900">{icon}</div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-emerald-950">{title}</div>
        <div className="text-xs text-emerald-950/60">{desc}</div>
      </div>
    </div>
  );
}

function Pin({ x, y, label }: { x: string; y: string; label: string }) {
  return (
    <div className="absolute" style={{ left: x, top: y }}>
      <div className="relative -translate-x-1/2 -translate-y-1/2">
        <div className="h-3.5 w-3.5 rounded-full bg-amber-400 ring-4 ring-amber-400/25" />
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/40 px-3 py-1 text-[11px] text-white ring-1 ring-white/10 backdrop-blur">
          {label}
        </div>
      </div>
    </div>
  );
}

function MarketSnapshotVisual() {
  return (
    <div className="relative rounded-[28px] overflow-hidden ring-1 ring-black/5 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_30%,white,transparent_40%),radial-gradient(circle_at_80%_70%,white,transparent_45%)]" />

      <div className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-white/70 text-xs">Market snapshot</div>
            <div className="mt-1 text-white text-lg font-semibold">
              Verified opportunities across Africa
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white ring-1 ring-white/15">
                <ShieldCheck className="h-3.5 w-3.5" /> Title checks
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white ring-1 ring-white/15">
                <CheckCircle2 className="h-3.5 w-3.5" /> Local partners
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white ring-1 ring-white/15">
                <MapPin className="h-3.5 w-3.5" /> Clear locations
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-amber-400/20 ring-1 ring-amber-400/30 px-3 py-2">
            <div className="text-[11px] text-white/70">Avg review</div>
            <div className="text-white font-semibold">48h</div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white/10 ring-1 ring-white/10 p-4">
          <div className="relative h-56">
            {/* Africa Continent SVG Map */}
            <svg
              viewBox="0 0 500 600"
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* More realistic Africa continent outline */}
              <path
                d="M 50 80 
                   C 60 70, 80 60, 100 55
                   C 120 50, 140 48, 160 50
                   C 180 52, 200 58, 220 65
                   C 240 72, 260 80, 280 90
                   C 300 100, 320 110, 340 120
                   C 360 130, 380 140, 400 150
                   C 420 160, 440 170, 450 180
                   C 460 190, 465 200, 470 210
                   C 475 220, 480 230, 485 240
                   C 490 250, 492 260, 490 270
                   C 488 280, 485 290, 480 300
                   C 475 310, 470 320, 465 330
                   C 460 340, 455 350, 450 360
                   C 445 370, 440 380, 435 390
                   C 430 400, 425 410, 420 420
                   C 415 430, 410 440, 405 450
                   C 400 460, 395 470, 390 480
                   C 385 490, 380 500, 375 510
                   C 370 520, 365 530, 360 540
                   C 355 550, 350 560, 345 570
                   C 340 580, 335 585, 330 590
                   C 325 595, 320 598, 315 600
                   C 310 600, 305 598, 300 595
                   C 295 592, 290 588, 285 583
                   C 280 578, 275 572, 270 565
                   C 265 558, 260 550, 255 540
                   C 250 530, 245 520, 240 510
                   C 235 500, 230 490, 225 480
                   C 220 470, 215 460, 210 450
                   C 205 440, 200 430, 195 420
                   C 190 410, 185 400, 180 390
                   C 175 380, 170 370, 165 360
                   C 160 350, 155 340, 150 330
                   C 145 320, 140 310, 135 300
                   C 130 290, 125 280, 120 270
                   C 115 260, 110 250, 105 240
                   C 100 230, 95 220, 90 210
                   C 85 200, 80 190, 75 180
                   C 70 170, 65 160, 60 150
                   C 55 140, 52 130, 50 120
                   C 48 110, 50 100, 50 90
                   Z"
                fill="rgba(255,255,255,0.18)"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="2"
                className="drop-shadow-lg"
              />
              
              {/* Gulf of Guinea indentation (West Africa) */}
              <path
                d="M 120 280
                   C 130 290, 150 300, 170 310
                   C 190 320, 210 330, 230 340
                   C 250 350, 270 360, 290 370
                   C 310 380, 330 390, 350 400
                   C 370 410, 390 420, 410 430
                   C 430 440, 450 450, 470 460
                   C 480 470, 485 480, 488 490
                   C 490 500, 488 510, 485 520
                   C 482 530, 478 540, 475 550
                   C 472 560, 470 570, 468 580
                   C 466 590, 465 595, 460 600"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1.5"
              />
              
              {/* Horn of Africa (Somalia/Ethiopia region) */}
              <path
                d="M 420 200
                   C 430 190, 440 180, 450 170
                   C 460 160, 470 150, 480 140
                   C 490 130, 495 120, 498 110
                   C 500 100, 498 90, 495 80
                   C 492 70, 488 60, 485 50
                   C 482 40, 478 30, 475 20
                   C 472 10, 470 5, 465 2
                   C 460 0, 455 2, 450 5
                   C 445 8, 440 12, 435 18
                   C 430 24, 425 30, 420 38
                   C 415 46, 410 54, 405 62
                   C 400 70, 395 78, 390 86
                   C 385 94, 380 102, 375 110
                   C 370 118, 365 126, 360 134
                   C 355 142, 350 150, 345 158
                   C 340 166, 335 174, 330 182
                   C 325 190, 320 198, 315 206
                   Z"
                fill="rgba(255,255,255,0.15)"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
              />
              
              {/* Madagascar (island off southeast coast) */}
              <ellipse
                cx="480"
                cy="520"
                rx="25"
                ry="80"
                fill="rgba(255,255,255,0.12)"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1"
                transform="rotate(-15 480 520)"
              />
            </svg>

            {/* Position pins based on approximate geographic locations */}
            {/* Lagos, Nigeria - West Africa coast */}
            <Pin x="25%" y="42%" label="Lagos" />
            {/* Accra, Ghana - West Africa coast, slightly north of Lagos */}
            <Pin x="22%" y="38%" label="Accra" />
            {/* Nairobi, Kenya - East Africa, inland */}
            <Pin x="68%" y="52%" label="Nairobi" />
            {/* Zanzibar, Tanzania - East Africa, island off coast */}
            <Pin x="72%" y="58%" label="Zanzibar" />

            {/* Subtle grid overlay */}
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle,rgba(255,255,255,0.3)_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 p-3">
              <div className="text-[11px] text-white/70">Countries</div>
              <div className="text-white font-semibold">12</div>
            </div>
            <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 p-3">
              <div className="text-[11px] text-white/70">Listings</div>
              <div className="text-white font-semibold">1,240+</div>
            </div>
            <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 p-3">
              <div className="text-[11px] text-white/70">From</div>
              <div className="text-white font-semibold">$350k</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignInModal({ isOpen, onClose, navigate }: { isOpen: boolean; onClose: () => void; navigate: (path: string) => void }) {
  const { login, signInWithGoogle, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setShowForgotPassword(false);
      setEmail("");
      setPassword("");
      setError("");
      setLoading(false);
    }
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
      const profile = await login(email, password);
      onClose();
      navigate(homePathForRole(profile.accountType));
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      await signInWithGoogle();
      onClose();
      const { getStoredUser } = await import("@/lib/session");
      navigate(homePathForRole(getStoredUser()?.profile?.accountType));
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 z-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative z-10 w-full max-w-md rounded-[28px] bg-white ring-1 ring-black/5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            {!showForgotPassword && (
              <>
                <h2 className="text-2xl font-semibold text-emerald-950">Sign in</h2>
                <button
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
                <label className="block text-sm font-medium text-emerald-950 mb-2">
                  Email
                </label>
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
                <label className="block text-sm font-medium text-emerald-950 mb-2">
                  Password
                </label>
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
                  style={{ pointerEvents: 'auto', zIndex: 20 }}
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
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full rounded-2xl border-emerald-900/15 text-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Sign in with Google
                </Button>
              </div>

              <div className="text-center text-sm text-emerald-950/70 pt-4">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate('/create-account')}
                  className="text-emerald-900 hover:text-emerald-950 font-semibold underline"
                >
                  Sign up
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LandfelloUIPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile } = useAuth();
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<string>("All");
  const [kind, setKind] = useState<string>("All");
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  // Logged-in users skip marketing home — land on their role home
  useEffect(() => {
    if (currentUser) {
      navigate(homePathForRole(userProfile?.accountType), { replace: true });
    }
  }, [currentUser, userProfile, navigate]);

  // Check if we should open the sign-in modal when navigating from sign-up page
  useEffect(() => {
    if (location.state?.openSignIn) {
      setIsSignInOpen(true);
      // Clear the state to prevent reopening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const countriesForFilter = useMemo(() => ["All", ...Array.from(new Set(countries.map((c) => c.name)))], []);
  const kindsForFilter = ["All", "Land", "Home"]; 

  const listings = useMemo(() => {
    return listingsSeed
      .filter((l) => (country === "All" ? true : l.country === country))
      .filter((l) => (kind === "All" ? true : l.type === kind))
      .filter((l) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (l.title + " " + l.location + " " + l.country)
          .toLowerCase()
          .includes(q);
      });
  }, [query, country, kind]);

  if (currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <BrandLogo size="sm" />

          {/* Navigation - positioned closer to logo */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-emerald-900/80 ml-8">
            <button 
              onClick={() => navigate('/buy')} 
              className="relative hover:text-emerald-700 transition-colors after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-700 after:transition-all hover:after:w-full"
            >
              Buy Property
            </button>
            <button 
              onClick={() => navigate('/create-account')} 
              className="relative hover:text-emerald-700 transition-colors after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-700 after:transition-all hover:after:w-full"
            >
              Sell as agent
            </button>
            <button 
              onClick={() => navigate('/partner-program')} 
              className="relative hover:text-emerald-700 transition-colors after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-700 after:transition-all hover:after:w-full"
            >
              Landfello Partner Program
            </button>
            <button 
              onClick={() => navigate('/about')} 
              className="relative hover:text-emerald-700 transition-colors after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-700 after:transition-all hover:after:w-full"
            >
              How it works
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4 ml-auto">
            <Button 
              variant="ghost" 
              className="hidden sm:inline-flex text-sm font-medium text-emerald-900 hover:text-emerald-700 px-0"
              onClick={() => setIsSignInOpen(true)}
            >
              Sign in
            </Button>
            <Button 
              className="rounded-full bg-amber-400 text-emerald-950 hover:bg-amber-300 px-5 py-2 text-sm font-semibold"
              onClick={() => navigate('/create-account')}
            >
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-6">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>

            <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight text-emerald-950">
              Own land. Build wealth.
              <span className="block text-emerald-900/70">Invest in Africa with confidence.</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-emerald-950/70 max-w-xl">
              Find verified land and real estate across Africa—transparent ownership checks, guided due diligence,
              and a clear purchase process built for locals and the diaspora.
            </p>

            {/* Search */}
            <div className="mt-6 rounded-3xl bg-white/80 ring-1 ring-black/5 p-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="h-4 w-4 text-emerald-950/50 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by city, country, or property type…"
                    className="pl-9 rounded-2xl"
                  />
                </div>
                <Button className="rounded-2xl bg-amber-400 text-emerald-950 hover:bg-amber-300 px-5 py-2.5 font-semibold">
                  Browse listings <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              <div className="mt-3 grid sm:grid-cols-3 gap-2">
                <Pill
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  title="Title verification"
                  desc="Reduce ownership risk"
                />
                <Pill
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  title="Local experts"
                  desc="On-the-ground partners"
                />
                <Pill
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  title="Clear process"
                  desc="Step-by-step guidance"
                />
              </div>
            </div>
          </div>

          {/* Right visual */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-[28px] bg-emerald-900/5 blur-2xl" />
            <MarketSnapshotVisual />
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section id="featured" className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-[28px] bg-white/70 ring-1 ring-black/5 p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-emerald-950">Featured listings</h2>
              <p className="mt-1 text-sm text-emerald-950/60">Curated, verified opportunities with clear documentation.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-10 rounded-2xl bg-white ring-1 ring-emerald-900/15 px-3 text-sm text-emerald-950 outline-none"
                >
                  {countriesForFilter.map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className="h-10 rounded-2xl bg-white ring-1 ring-emerald-900/15 px-3 text-sm text-emerald-950 outline-none"
                >
                  {kindsForFilter.map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </div>
              <Button className="rounded-2xl bg-amber-400 text-emerald-950 hover:bg-amber-300 px-5 py-2.5 font-semibold">Request a call</Button>
            </div>
          </div>

          <div className="mt-5 grid md:grid-cols-2 gap-4">
            {listings.map((l) => (
              <Card key={l.id} className="rounded-[24px] border-emerald-900/10 overflow-hidden">
                {l.image ? (
                  <div className="h-56 overflow-hidden">
                    <img src={l.image} alt={l.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-56 bg-gradient-to-br from-emerald-100 to-emerald-50" />
                )}
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-emerald-950">{l.title}</div>
                      <div className="mt-1 text-xs text-emerald-950/60 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {l.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-emerald-950/60">Starting at</div>
                      <div className="text-lg font-semibold text-emerald-950">{formatMoney(l.price)}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className="rounded-full bg-emerald-900/5 text-emerald-950 hover:bg-emerald-900/5 ring-1 ring-emerald-900/10">{l.country}</Badge>
                    <Badge className="rounded-full bg-emerald-900/5 text-emerald-950 hover:bg-emerald-900/5 ring-1 ring-emerald-900/10">{l.type}</Badge>
                    {l.tags.map((t) => (
                      <Badge key={t} className="rounded-full bg-amber-400/20 text-emerald-950 ring-1 ring-amber-400/30">{t}</Badge>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <Button className="rounded-2xl bg-emerald-900 text-white hover:bg-emerald-900/90">View details</Button>
                    <Button
                      type="button"
                      className="rounded-md bg-emerald-900 text-white hover:bg-emerald-900/90"
                    >
                      Contact agent
                      <ArrowUpRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Country */}
      <section id="browse" className="mx-auto max-w-6xl px-4 pb-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-emerald-950">Explore by country</h2>
            <p className="mt-1 text-sm text-emerald-950/60">Start with verified markets and compare entry prices.</p>
          </div>
          <Button variant="outline" className="rounded-2xl border-emerald-900/15 text-emerald-950">
            <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
          </Button>
        </div>

        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {countries.map((c) => (
            <Card key={c.name} className="rounded-[24px] border-emerald-900/10 hover:shadow-sm transition">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FlagCircle code={c.code} />
                    <div>
                      <div className="font-semibold text-emerald-950">{c.name}</div>
                      <div className="text-xs text-emerald-950/60">From {formatMoney(c.from)}</div>
                    </div>
                  </div>
                  {c.popular && (
                    <Badge className="rounded-full bg-amber-400/20 text-emerald-950 ring-1 ring-amber-400/30">Popular</Badge>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <Button
                    onClick={() => navigate(`/buy-land?country=${encodeURIComponent(c.name)}`)}
                    className="rounded-2xl bg-emerald-900 text-white hover:bg-emerald-900/90"
                  >
                    View listings
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 pb-14">
        <div className="mb-8">
          <button
            onClick={() => navigate('/how-it-works')}
            className="text-2xl font-semibold text-emerald-950 hover:text-emerald-900 cursor-pointer transition-colors"
          >
            How it works
          </button>
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          {[ 
            {
              title: "1) Browse verified listings",
              desc: "Search by country, city, and property type. Every listing is structured for clarity.",
            },
            {
              title: "2) Due diligence & legal review",
              desc: "We coordinate title checks, surveys, and local verification through trusted partners.",
            },
            {
              title: "3) Secure purchase & ownership",
              desc: "Pay securely, finalize paperwork, and receive confirmation with clear next steps.",
            },
          ].map((x) => (
            <Card key={x.title} className="rounded-[24px] border-emerald-900/10">
              <CardContent className="p-6">
                <div className="text-sm font-semibold text-emerald-950">{x.title}</div>
                <div className="mt-2 text-sm text-emerald-950/65">{x.desc}</div>
                <div className="mt-4">
                  <Badge className="rounded-full bg-emerald-900/5 text-emerald-950 hover:bg-emerald-900/5 ring-1 ring-emerald-900/10">
                    <ShieldCheck className="h-4 w-4 mr-2" /> Trust-first
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-[28px] bg-emerald-950 text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_70%,white,transparent_50%)]" />
          <div className="relative p-8 sm:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-2xl font-semibold">Ready to own land in Africa?</h3>
              <p className="mt-2 text-white/75 max-w-xl">
                Tell us your budget and preferred country. We'll match you with verified opportunities and a clear path to purchase.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                className="rounded-2xl bg-amber-400 text-emerald-950 hover:bg-amber-300 px-5 py-2.5 font-semibold"
                onClick={() => navigate('/create-account')}
              >
                Start now
              </Button>
              <Button
                variant="secondary"
                className="rounded-2xl bg-white/10 text-white hover:bg-white/15"
                onClick={() => navigate('/contact')}
              >
                Talk to an expert
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-emerald-900/10 bg-white/70">
        <div className="mx-auto max-w-6xl px-4 py-6 grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm font-semibold text-emerald-950">Landfello</div>
            <div className="mt-2 text-sm text-emerald-950/60">
              Africa‑focused land and real estate platform built around verification, clarity, and local expertise.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-emerald-950/70">
            <button 
              onClick={() => navigate('/how-it-works')} 
              className="hover:text-emerald-950 text-sm text-emerald-950/70 bg-transparent border-none cursor-pointer p-0 text-left"
            >
              How it works
            </button>
            <button
              onClick={() => navigate('/legal')}
              className="hover:text-emerald-950 text-sm text-emerald-950/70 bg-transparent border-none cursor-pointer p-0 text-left"
            >
              Legal
            </button>
            <button
              onClick={() => navigate('/faq')}
              className="hover:text-emerald-950 text-sm text-emerald-950/70 bg-transparent border-none cursor-pointer p-0 text-left"
            >
              FAQs
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="hover:text-emerald-950 text-sm text-emerald-950/70 bg-transparent border-none cursor-pointer p-0 text-left"
            >
              Contact
            </button>
          </div>
          <div className="text-sm text-emerald-950/60">
            <div className="font-semibold text-emerald-950">Quick note</div>
            <div className="mt-2">
              This preview is a UI concept. When you go live, connect listings to your database and plug in your real verification workflow.
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 text-center text-xs text-emerald-950/50">© {new Date().getFullYear()} Landfello. All rights reserved.</div>
      </footer>

      {/* Sign In Modal */}
      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} navigate={navigate} />
    </div>
  );
}

