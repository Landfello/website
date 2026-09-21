import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessSell } from "@/lib/roles";

/**
 * Guests may browse buy listings. Signed-in agents and investors can both
 * browse the marketplace. Sell / listing management requires an agent account.
 */
export function useRoleGate(mode: "buy" | "sell") {
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (mode === "buy") {
      return;
    }

    if (!currentUser) {
      navigate("/create-account", { replace: true });
      return;
    }

    if (!canAccessSell(userProfile?.accountType)) {
      navigate("/buy", { replace: true });
    }
  }, [mode, currentUser, userProfile, loading, navigate]);
}
