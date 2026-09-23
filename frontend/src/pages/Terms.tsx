import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <BrandLogo showTagline />
          <Button variant="ghost" onClick={() => navigate("/buy")} className="rounded-2xl px-3 py-2 text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to home
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950 text-white px-4 py-2 text-xs font-semibold">
          <FileText className="h-4 w-4" />
          Terms of Service
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-emerald-950">
          Terms of Service
        </h1>
        <p className="mt-2 text-emerald-950/70 max-w-2xl">
          Last updated: September 22, 2026. By creating an account or using Landfello, you agree to these terms.
        </p>

        <div className="mt-8 space-y-6">
          {[
            {
              title: "1. The service",
              body: "Landfello is a marketplace that helps people discover, inquire about, and list land and houses for sale across Africa. We provide tools for listings, inquiry routing, and guided purchase support. We are not a law firm, escrow bank, or title insurer.",
            },
            {
              title: "2. Accounts",
              body: "You must provide accurate account information. Investor accounts can browse and save listings. Agent accounts can publish and manage property listings. You are responsible for activity under your account and for keeping login credentials secure.",
            },
            {
              title: "3. Listings",
              body: "Agents must only list properties they are authorized to sell, with accurate descriptions, photos, pricing, and ownership details. Landfello may remove listings that appear fraudulent, incomplete, or misleading. A verified badge means documents were reviewed; it does not guarantee title.",
            },
            {
              title: "4. Purchases and inquiries",
              body: "Inquiries may be routed through Landfello so buyers and sellers can complete due diligence. Final purchase contracts, payment, and title transfer happen under applicable local law with qualified local professionals. Landfello does not guarantee that any listing will sell or that any inquiry will result in a completed transaction.",
            },
            {
              title: "5. Acceptable use",
              body: "You agree not to misuse the platform, scrape contact data, post illegal content, attempt unauthorized access, or use Landfello to facilitate fraud. We may suspend accounts that violate these rules.",
            },
            {
              title: "6. Privacy",
              body: "We collect account and listing information needed to operate the marketplace. See our Legal page for a summary of how we handle data. Contact us if you need to update or delete personal information we hold about you.",
            },
            {
              title: "7. Limitation of liability",
              body: "To the fullest extent permitted by law, Landfello is not liable for losses arising from property transactions, title defects, third-party conduct, or downtime. Use of the platform is at your own risk.",
            },
            {
              title: "8. Changes",
              body: "We may update these terms from time to time. Continued use of Landfello after changes means you accept the updated terms. If you do not agree, stop using the service and contact us to close your account.",
            },
          ].map((section) => (
            <section
              key={section.title}
              className="rounded-[28px] bg-white/80 ring-1 ring-black/5 shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-emerald-950">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-emerald-950/70">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            className="rounded-2xl bg-emerald-900 text-white hover:bg-emerald-800"
            onClick={() => navigate("/contact")}
          >
            Contact us
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl border-emerald-900/15"
            onClick={() => navigate("/legal")}
          >
            Legal overview
          </Button>
        </div>
      </main>
    </div>
  );
}
