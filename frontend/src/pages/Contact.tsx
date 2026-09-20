import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { LANDFELLO_INQUIRY_PHONE, LANDFELLO_INQUIRY_TEL_HREF } from "@/lib/contact";

export default function Contact() {
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
          <MessageCircle className="h-4 w-4" />
          Contact
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-emerald-950">
          Talk to a Landfello expert
        </h1>
        <p className="mt-2 text-emerald-950/70 max-w-2xl">
          Tell us your budget and preferred country. We’ll match you with verified opportunities and a clear
          path to purchase.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href={LANDFELLO_INQUIRY_TEL_HREF}
            className="rounded-[28px] bg-emerald-950 text-white p-6 shadow-sm hover:bg-emerald-900 transition-colors"
          >
            <Phone className="h-6 w-6" />
            <div className="mt-4 text-lg font-semibold">Call us</div>
            <div className="mt-1 text-sm text-white/75">Speak with an expert about a listing or purchase.</div>
            <div className="mt-4 text-base font-semibold tracking-wide">{LANDFELLO_INQUIRY_PHONE}</div>
          </a>

          <a
            href="mailto:hello@landfello.com"
            className="rounded-[28px] bg-white/80 ring-1 ring-black/5 p-6 shadow-sm hover:bg-white transition-colors"
          >
            <Mail className="h-6 w-6 text-emerald-900" />
            <div className="mt-4 text-lg font-semibold text-emerald-950">Email us</div>
            <div className="mt-1 text-sm text-emerald-950/70">
              Send questions about verification, listings, or account support.
            </div>
            <div className="mt-4 text-base font-semibold text-emerald-950">hello@landfello.com</div>
          </a>
        </div>

        <div className="mt-8 rounded-[28px] bg-white/80 ring-1 ring-black/5 p-6">
          <h2 className="text-lg font-semibold text-emerald-950">What to have ready</h2>
          <ul className="mt-3 space-y-2 text-sm text-emerald-950/70">
            <li>• Preferred country and city or region</li>
            <li>• Approximate budget and timeline</li>
            <li>• Whether you are buying for investment, building, or farming</li>
            <li>• Any listing ID or property title you already viewed on Landfello</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
