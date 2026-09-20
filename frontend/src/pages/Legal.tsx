import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";

export default function Legal() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <BrandLogo showTagline />
          <Button variant="ghost" onClick={() => navigate("/")} className="rounded-2xl px-3 py-2 text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to home
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950 text-white px-4 py-2 text-xs font-semibold">
          <ShieldCheck className="h-4 w-4" />
          Legal
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-emerald-950">
          Legal information
        </h1>
        <p className="mt-2 text-emerald-950/70 max-w-2xl">
          Landfello helps buyers and sellers navigate African land transactions with clearer documentation
          and local expertise. The notes below summarize how we handle listings, verification, and your data.
        </p>

        <div className="mt-8 space-y-6">
          {[
            {
              title: "Listings & verification",
              body: "Verified badges indicate that Landfello or a partner has reviewed key ownership and boundary documents. Verification reduces risk but does not replace independent legal counsel in your jurisdiction.",
            },
            {
              title: "Terms of use",
              body: "By using Landfello you agree to provide accurate account information, use the platform for lawful property inquiry and listing activity, and not misuse contact details obtained through the service.",
            },
            {
              title: "Privacy",
              body: "We collect account details and listing information needed to operate the marketplace. Inquiry calls may be routed through Landfello so buyers and sellers can complete purchases securely.",
            },
            {
              title: "Liability",
              body: "Land transactions remain subject to local law. Landfello is not a law firm and does not guarantee title outcomes. Always confirm final paperwork with a qualified local attorney before funds change hands.",
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

        <div className="mt-8">
          <Button
            className="rounded-2xl bg-emerald-900 text-white hover:bg-emerald-800"
            onClick={() => navigate("/contact")}
          >
            Contact us with legal questions
          </Button>
        </div>
      </main>
    </div>
  );
}
