import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";

const faqs = [
  {
    q: "How does buying land on Landfello work?",
    a: "Browse verified listings, open a property, then tap Buy land to get the Landfello inquiry number. Call to complete due diligence and purchase with guided support.",
  },
  {
    q: "What does “Verified” mean?",
    a: "A verified listing has undergone document and ownership checks through Landfello or a trusted local partner. You should still complete final legal review before closing.",
  },
  {
    q: "Can I list my land for sale?",
    a: "Yes. Create a Real Estate Agent account, then use Sell / Add Property to upload at least two photos and your listing details.",
  },
  {
    q: "Which countries are supported?",
    a: "Landfello focuses on African markets including Ghana, Nigeria, Kenya, Tanzania, Rwanda, and South Africa, with more corridors added over time.",
  },
  {
    q: "How do I talk to an expert?",
    a: "Use Talk to an expert on the home page or visit Contact to call or message the Landfello team about a listing or purchase path.",
  },
];

export default function FAQ() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
          <HelpCircle className="h-4 w-4" />
          FAQs
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-emerald-950">
          Frequently asked questions
        </h1>
        <p className="mt-2 text-emerald-950/70 max-w-2xl">
          Quick answers about browsing listings, verification, and completing a purchase with Landfello.
        </p>

        <div className="mt-8 space-y-3">
          {faqs.map((item, index) => {
            const open = openIndex === index;
            return (
              <div
                key={item.q}
                className="rounded-[24px] bg-white/80 ring-1 ring-black/5 shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenIndex(open ? null : index)}
                  aria-expanded={open}
                >
                  <span className="text-sm font-semibold text-emerald-950">{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-emerald-900 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {open ? (
                  <div className="px-5 pb-4 text-sm leading-relaxed text-emerald-950/70">{item.a}</div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Button
            className="rounded-2xl bg-amber-400 text-emerald-950 hover:bg-amber-300 font-semibold"
            onClick={() => navigate("/create-account")}
          >
            Create account
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl border-emerald-900/15"
            onClick={() => navigate("/contact")}
          >
            Still need help?
          </Button>
        </div>
      </main>
    </div>
  );
}
