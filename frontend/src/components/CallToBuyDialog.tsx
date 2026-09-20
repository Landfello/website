import { Phone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LANDFELLO_INQUIRY_PHONE, LANDFELLO_INQUIRY_TEL_HREF } from "@/lib/contact";

interface CallToBuyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyTitle?: string;
}

export function CallToBuyDialog({ open, onOpenChange, propertyTitle }: CallToBuyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden">
        <div className="bg-emerald-900 px-6 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
            <Phone className="h-7 w-7" />
          </div>
          <DialogTitle className="text-xl font-semibold">Call to buy this land</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-emerald-100">
            {propertyTitle
              ? `Speak with Landfello about “${propertyTitle}”.`
              : "Speak with Landfello to complete your purchase."}
          </DialogDescription>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-5 text-center">
            <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Dial this number
            </div>
            <a
              href={LANDFELLO_INQUIRY_TEL_HREF}
              className="mt-2 block text-2xl font-semibold tracking-wide text-emerald-950 hover:text-emerald-700"
            >
              {LANDFELLO_INQUIRY_PHONE}
            </a>
          </div>

          <a
            href={LANDFELLO_INQUIRY_TEL_HREF}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            <Phone className="h-4 w-4" />
            Call now
          </a>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-2xl border-emerald-200"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          <p className="text-center text-xs text-emerald-800/70">
            Tap the number or Call now to dial from your phone.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
