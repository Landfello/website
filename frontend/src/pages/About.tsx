import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Users,
  Target,
  Heart,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "@/components/BrandLogo";

function ValueCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-[24px] border-emerald-900/10">
      <CardContent className="p-6">
        <div className="text-emerald-900 mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-emerald-950 mb-2">{title}</h3>
        <p className="text-sm text-emerald-950/70">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function About() {
  const navigate = useNavigate();

  const values = [
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "Verification first",
      description:
        "Every listing undergoes comprehensive verification. We check titles, confirm boundaries, and ensure clear documentation before you invest.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Local expertise",
      description:
        "We work with trusted local partners across Africa who understand the legal landscape, market conditions, and cultural context.",
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Transparency",
      description:
        "Clear pricing, detailed property information, and honest communication. No hidden fees, no surprises—just straightforward real estate investment.",
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Built for the diaspora",
      description:
        "Designed for Africans living abroad and locals alike. We understand the unique challenges of investing from a distance and make it accessible.",
    },
  ];

  const features = [
    "Verified property listings across 12+ African countries",
    "Title verification and legal documentation checks",
    "Local partner network for on-the-ground support",
    "Secure escrow services for safe transactions",
    "Landfello Partner Program to build toward your investment",
    "Step by step guidance through the purchase process",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <BrandLogo showTagline />
          <Button variant="ghost" onClick={() => navigate("/")} className="rounded-2xl px-3 py-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to home
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-6">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-emerald-950 mt-4">
            What is Landfello?
            <span className="block text-emerald-900/70">Making land ownership in Africa accessible and secure</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-emerald-950/70">
            Landfello is a platform that connects people with verified land and real estate opportunities across
            Africa. We make it easier for locals and the diaspora to invest in property with confidence, backed by
            thorough verification, local expertise, and a clear process.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-[28px] bg-white/70 ring-1 ring-black/5 p-8 sm:p-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/10 flex items-center justify-center flex-shrink-0">
              <Target className="h-6 w-6 text-emerald-900" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-emerald-950 mb-3">Our mission</h2>
              <p className="text-base text-emerald-950/70 leading-relaxed">
                To democratize land ownership in Africa by removing barriers, reducing risk, and providing clear
                pathways for investment. We believe that owning land should be accessible, transparent, and secure
                for everyone—whether you're living in Africa or part of the diaspora.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-emerald-950 mb-2">What we stand for</h2>
          <p className="text-sm text-emerald-950/60">The principles that guide everything we do</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {values.map((value, idx) => (
            <ValueCard key={idx} {...value} />
          ))}
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-[28px] bg-emerald-950 text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%)]" />
          <div className="relative p-8 sm:p-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-3">What we offer</h2>
                <p className="text-white/80 mb-6">
                  A comprehensive platform designed to make land investment in Africa straightforward and secure.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/90 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Africa Section */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-semibold text-emerald-950 mb-4">Why invest in African land?</h2>
            <p className="text-base text-emerald-950/70 mb-4">
              Africa represents one of the world's most promising real estate markets. With growing populations,
              urbanization, and economic development, land ownership offers both personal security and investment
              potential.
            </p>
            <p className="text-base text-emerald-950/70 mb-6">
              However, the process has historically been complex, risky, and difficult to navigate—especially for
              those living abroad. Landfello exists to change that.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-emerald-900 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-emerald-950">Growing markets</div>
                  <div className="text-xs text-emerald-950/65">
                    Rapid urbanization and economic growth create investment opportunities
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-900 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-emerald-950">Long-term value</div>
                  <div className="text-xs text-emerald-950/65">
                    Land ownership provides security and potential for appreciation
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-emerald-900 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-emerald-950">Connection to home</div>
                  <div className="text-xs text-emerald-950/65">
                    For the diaspora, owning land maintains ties to heritage and family
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <Card className="rounded-[28px] border-emerald-900/10 overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-emerald-100 to-emerald-50" />
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-emerald-950 mb-2">Our commitment</h3>
                <p className="text-sm text-emerald-950/70 mb-4">
                  We're committed to building a platform that makes land ownership accessible, transparent, and
                  secure. Every listing is verified, every process is clear, and every transaction is protected.
                </p>
                <Button
                  className="w-full rounded-2xl bg-emerald-900 text-white hover:bg-emerald-900/90"
                  onClick={() => navigate('/')}
                >
                  Browse listings <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-[28px] bg-emerald-950 text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%)]" />
          <div className="relative p-8 sm:p-10 text-center">
            <h3 className="text-2xl font-semibold mb-3">Ready to explore opportunities?</h3>
            <p className="text-white/75 max-w-xl mx-auto mb-6">
              Browse verified listings, learn about our process, or start saving toward your land purchase goal.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                className="rounded-2xl bg-amber-400 text-emerald-950 hover:bg-amber-300 px-5 py-2.5 font-semibold"
                onClick={() => navigate("/")}
              >
                Browse listings
              </Button>
              <Button
                variant="secondary"
                className="rounded-2xl bg-white/10 text-white hover:bg-white/15"
                onClick={() => navigate('/faq')}
              >
                Resources
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-emerald-900/10 bg-white/70">
        <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-emerald-950/60">
          © {new Date().getFullYear()} Landfello. This is a UI concept preview.
        </div>
      </footer>
    </div>
  );
}

