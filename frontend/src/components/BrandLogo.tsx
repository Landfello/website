import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { homePathForRole } from "@/lib/roles";
import logoImage from "@/assets/images/LandFelloLogo.png";

type BrandLogoProps = {
  onClick?: () => void;
  /** Show the tagline under the wordmark */
  showTagline?: boolean;
  className?: string;
  size?: "sm" | "md";
};

/**
 * Nav brand mark — icon and wordmark are vertically centered as one unit.
 * Guests and buyers go to Buy; agents go to their dashboard.
 */
export function BrandLogo({
  onClick,
  showTagline = false,
  className,
  size = "md",
}: BrandLogoProps) {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const iconBox = size === "sm" ? "h-8 w-8 rounded-xl" : "h-10 w-10 rounded-2xl";
  const iconImg = size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const titleClass =
    size === "sm"
      ? "text-base font-semibold leading-none text-emerald-950"
      : "text-base font-semibold leading-none text-emerald-950 sm:text-lg";

  const goHome = () => {
    if (!currentUser) {
      navigate("/buy");
      return;
    }
    navigate(homePathForRole(userProfile?.accountType));
  };

  return (
    <button
      type="button"
      onClick={onClick ?? goHome}
      className={cn(
        "inline-flex items-center gap-2.5 text-left hover:opacity-80 transition-opacity",
        className
      )}
    >
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center bg-white shadow-sm ring-1 ring-emerald-900/10 overflow-hidden",
          iconBox
        )}
      >
        <img
          src={logoImage}
          alt=""
          aria-hidden
          className={cn("object-contain object-center", iconImg)}
        />
      </span>
      <span className="flex flex-col justify-center gap-0.5">
        <span className={titleClass}>Landfello</span>
        {showTagline ? (
          <span className="text-[10px] leading-tight text-emerald-950/60 sm:text-xs">
            Land & real estate in Africa
          </span>
        ) : null}
      </span>
    </button>
  );
}
