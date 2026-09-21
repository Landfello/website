import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Users,
  Eye,
  MapPin,
  BadgeCheck,
  ClipboardCheck,
  Home,
  Lock,
  Camera,
  TreePine,
  HelpingHand,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/BrandLogo";

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/70 ring-1 ring-black/5 px-4 py-3">
      <div className="text-emerald-900">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-emerald-950/60">{label}</div>
        <div className="text-sm font-semibold text-emerald-950">{value}</div>
      </div>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3 rounded-3xl bg-white/70 ring-1 ring-black/5 p-4">
      <div className="mt-0.5 text-emerald-900">{icon}</div>
      <div>
        <div className="text-sm font-semibold text-emerald-950">{title}</div>
        <div className="mt-1 text-sm text-emerald-950/65">{desc}</div>
      </div>
    </div>
  );
}

function CareCard({
  name,
  tagline,
  bullets,
  featured,
  onSelect,
}: {
  name: string;
  tagline: string;
  bullets: string[];
  featured?: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      className={[
        "rounded-[28px] overflow-hidden border-emerald-900/10",
        featured ? "ring-2 ring-emerald-950/30 shadow-sm" : "",
      ].join(" ")}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold text-emerald-950">{name}</div>
              {featured ? (
                <Badge className="rounded-full bg-amber-400/20 text-emerald-950 ring-1 ring-amber-400/30">
                  Recommended
                </Badge>
              ) : null}
            </div>
            <div className="mt-1 text-sm text-emerald-950/65">{tagline}</div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {bullets.map((b) => (
            <div key={b} className="flex items-start gap-2 text-sm text-emerald-950/75">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-900" />
              <span>{b}</span>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <Button
            onClick={onSelect}
            className={[
              "w-full rounded-2xl px-5 py-2.5 font-semibold",
              featured
                ? "bg-amber-400 text-emerald-950 hover:bg-amber-300"
                : "bg-emerald-900 text-white hover:bg-emerald-900/90",
            ].join(" ")}
          >
            Get matched <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 text-xs text-emerald-950/55">
          Partners are reviewed for local presence, references, and reliability before matching.
        </div>
      </CardContent>
    </Card>
  );
}

const CARE_SERVICES = [
  {
    icon: <Eye className="h-5 w-5" />,
    title: "On-site monitoring",
    desc: "Regular visits to check boundaries, occupancy, fencing, and any signs of encroachment.",
  },
  {
    icon: <Camera className="h-5 w-5" />,
    title: "Photo & status updates",
    desc: "Clear reports so you know what’s happening on your land—even if you live abroad.",
  },
  {
    icon: <TreePine className="h-5 w-5" />,
    title: "Upkeep & maintenance",
    desc: "Clearing, marking beacons, basic repairs, and keeping the plot presentable and usable.",
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: "Safety & security support",
    desc: "Help coordinating watchfulness, dispute alerts, and early warning if something looks wrong.",
  },
];

export default function SavingsProgramPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-[52rem] -translate-x-1/2 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute top-40 -left-40 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.2] [background-image:radial-gradient(circle,rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:18px_18px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <BrandLogo showTagline />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="rounded-2xl px-3 py-2 text-xs"
              onClick={() => navigate("/create-account")}
            >
              List your land
            </Button>
            <Button
              className="rounded-2xl bg-amber-400 px-4 py-2 text-xs font-semibold text-emerald-950 hover:bg-amber-300"
              onClick={() => navigate("/create-account")}
            >
              Find a partner
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-8">
        <div className="overflow-hidden rounded-[32px] bg-white/65 shadow-sm ring-1 ring-black/5">
          <div className="grid items-start gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950 px-4 py-2 text-xs font-semibold text-white">
                <HelpingHand className="h-4 w-4" />
                Landfello Partner Program
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-emerald-950 sm:text-5xl">
                Your land, looked after.
                <span className="block text-emerald-900/70">
                  Partner with someone you can trust on the ground.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-base text-emerald-950/70 sm:text-lg">
                Whether you live nearby or abroad, Landfello pairs you with a vetted local partner who
                can manage your land, keep an eye on it, and help make sure it stays safe and secure.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <StatPill
                  icon={<Users className="h-5 w-5" />}
                  label="Local partners"
                  value="Vetted on the ground"
                />
                <StatPill
                  icon={<ShieldCheck className="h-5 w-5" />}
                  label="Land care"
                  value="Managed & monitored"
                />
                <StatPill
                  icon={<BadgeCheck className="h-5 w-5" />}
                  label="Peace of mind"
                  value="Clear updates"
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="rounded-2xl bg-amber-400 px-6 py-3 font-semibold text-emerald-950 hover:bg-amber-300"
                  onClick={() => navigate("/create-account")}
                >
                  Get matched with a partner <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl border-emerald-900/15 bg-white text-emerald-950"
                  onClick={() => navigate("/create-account")}
                >
                  I own land already
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-emerald-950/60">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 ring-1 ring-black/5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-900" />
                  Built for diaspora & local owners
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 ring-1 ring-black/5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-900" />
                  Security-first land care
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 ring-1 ring-black/5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-900" />
                  Transparent partner matching
                </span>
              </div>
            </div>

            {/* Partner preview card */}
            <div className="rounded-[28px] bg-white/80 p-6 shadow-sm ring-1 ring-black/5">
              <div className="text-sm font-semibold text-emerald-950">What your partner helps with</div>
              <p className="mt-1 text-xs text-emerald-950/60">
                Practical support so your land doesn’t sit neglected or at risk.
              </p>

              <div className="mt-5 space-y-3">
                {CARE_SERVICES.map((s) => (
                  <div
                    key={s.title}
                    className="flex gap-3 rounded-2xl bg-emerald-950/[0.03] p-3.5 ring-1 ring-emerald-900/10"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-950 text-white">
                      {s.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-emerald-950">{s.title}</div>
                      <div className="mt-0.5 text-xs leading-snug text-emerald-950/65">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="mt-5 w-full rounded-2xl bg-emerald-900 py-2.5 font-semibold text-white hover:bg-emerald-900/90"
                onClick={() => navigate("/create-account")}
              >
                Request a land-care partner <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="mt-3 text-[11px] text-emerald-950/55">
                You’ll share your location and needs. We introduce a suitable partner for review before any
                arrangement begins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-emerald-950">How partnering works</h2>
          <p className="mt-1 text-sm text-emerald-950/60">
            A simple path from “I need help with my land” to “someone trusted is looking after it.”
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              icon: <ClipboardCheck className="h-5 w-5" />,
              title: "1) Tell us about your land",
              desc: "Share the country, location, plot details, and what you need—visits, upkeep, security awareness, or full oversight.",
            },
            {
              icon: <Users className="h-5 w-5" />,
              title: "2) We match you with a partner",
              desc: "Landfello connects you with a vetted local person or team who knows the area and can manage day-to-day care.",
            },
            {
              icon: <Home className="h-5 w-5" />,
              title: "3) They look after it—you stay informed",
              desc: "Your partner helps keep the land safe and maintained, with updates so you always know its condition.",
            },
          ].map((x) => (
            <Card key={x.title} className="rounded-[28px] border-emerald-900/10 bg-white/70">
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-950 text-white">
                  {x.icon}
                </div>
                <div className="mt-4 text-base font-semibold text-emerald-950">{x.title}</div>
                <div className="mt-2 text-sm text-emerald-950/65">{x.desc}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Why owners use this */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-[32px] bg-white/65 p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-emerald-950">Why owners use Partner Program</h2>
              <p className="mt-1 text-sm text-emerald-950/60">
                Especially helpful if you live overseas, travel often, or simply can’t visit the plot regularly.
              </p>
            </div>
            <Badge className="w-fit rounded-full bg-emerald-900/5 text-emerald-950 ring-1 ring-emerald-900/10">
              Land care & safety
            </Badge>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FeatureRow
              icon={<MapPin className="h-5 w-5" />}
              title="Someone present where your land is"
              desc="A local partner who can visit, check boundaries, and notice problems early—before they become expensive."
            />
            <FeatureRow
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Help keeping your land safe"
              desc="Support watching for encroachment, unauthorized use, and other risks that empty land often faces."
            />
            <FeatureRow
              icon={<Eye className="h-5 w-5" />}
              title="Clear reporting you can trust"
              desc="Photos and status updates so you don’t have to rely on rumors or infrequent trips home."
            />
            <FeatureRow
              icon={<Phone className="h-5 w-5" />}
              title="A direct point of contact"
              desc="One responsible partner to call when you need something handled on the ground."
            />
          </div>
        </div>
      </section>

      {/* Care levels */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-emerald-950">Choose your care level</h2>
            <p className="mt-1 text-sm text-emerald-950/60">
              Match the support you need—from check-ins to fuller day-to-day management.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <CareCard
            name="Check-in"
            tagline="Periodic visits & peace of mind"
            bullets={[
              "Scheduled site visits",
              "Photo updates after each visit",
              "Boundary & occupancy notes",
              "Alert if something looks wrong",
            ]}
            onSelect={() => navigate("/create-account")}
          />
          <CareCard
            name="Watch & care"
            tagline="Best for most absentee owners"
            bullets={[
              "Everything in Check-in",
              "Basic upkeep coordination",
              "Security awareness support",
              "Regular written status summaries",
            ]}
            featured
            onSelect={() => navigate("/create-account")}
          />
          <CareCard
            name="Full oversight"
            tagline="Hands-on local management"
            bullets={[
              "Everything in Watch & care",
              "Closer day-to-day coordination",
              "Priority response for issues",
              "Help preparing land for sale or use",
            ]}
            onSelect={() => navigate("/create-account")}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="relative overflow-hidden rounded-[32px] bg-emerald-950 text-white">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_70%,white,transparent_50%)]" />
          <div className="relative flex flex-col gap-6 p-8 sm:p-10 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-semibold">Don’t leave your land unattended</h3>
              <p className="mt-2 max-w-xl text-white/75">
                Join the Landfello Partner Program and get matched with someone who can manage it, look
                after it, and help keep it safe.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="rounded-2xl bg-amber-400 px-5 py-2.5 font-semibold text-emerald-950 hover:bg-amber-300"
                onClick={() => navigate("/create-account")}
              >
                Find my partner <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                className="rounded-2xl bg-white/10 text-white hover:bg-white/15"
                onClick={() => navigate("/create-account")}
              >
                List my land first
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-emerald-900/10 bg-white/70">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          <div>
            <div className="text-sm font-semibold text-emerald-950">Landfello Partner Program</div>
            <div className="mt-2 text-sm text-emerald-950/60">
              Connect with trusted local partners who help manage, care for, and protect your land.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-emerald-950/70">
            <button onClick={() => navigate("/buy")} className="text-left hover:text-emerald-950">
              Buy
            </button>
            <button onClick={() => navigate("/about")} className="text-left hover:text-emerald-950">
              About
            </button>
            <button
              onClick={() => navigate("/create-account")}
              className="text-left hover:text-emerald-950"
            >
              Get matched
            </button>
            <button onClick={() => navigate("/about")} className="text-left hover:text-emerald-950">
              About
            </button>
          </div>
          <div className="text-sm text-emerald-950/60">
            <div className="font-semibold text-emerald-950">Note</div>
            <div className="mt-2">
              Partner arrangements are agreed between you and your matched partner. Landfello helps with
              introduction, expectations, and clearer communication.
            </div>
          </div>
        </div>
        <div className="px-4 pb-8 text-center text-xs text-emerald-950/50">
          © {new Date().getFullYear()} Landfello. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
