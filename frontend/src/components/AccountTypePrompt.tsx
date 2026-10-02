import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function AccountTypePrompt() {
  const { currentUser, userProfile, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!currentUser || !userProfile || userProfile.accountTypeChosen !== false) {
    return null;
  }

  const choose = async (accountType: "investor" | "agent") => {
    setError("");
    setSaving(true);
    try {
      await updateProfile({ accountType });
    } catch (err: any) {
      setError(err.message || "Could not save account type");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-emerald-950">How will you use Landfello?</h2>
        <p className="mt-2 text-sm text-emerald-950/70">
          Pick once. Agents can list properties. Buyers browse and save listings.
        </p>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-5 grid gap-3">
          <Button
            type="button"
            disabled={saving}
            className="rounded-2xl bg-emerald-900 text-white hover:bg-emerald-800"
            onClick={() => choose("investor")}
          >
            I want to browse and buy
          </Button>
          <Button
            type="button"
            disabled={saving}
            variant="outline"
            className="rounded-2xl"
            onClick={() => choose("agent")}
          >
            I want to list properties
          </Button>
        </div>
      </div>
    </div>
  );
}
