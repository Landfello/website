import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, LayoutDashboard, LogOut, Plus, Settings, Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";
import { SignInModal } from "@/components/SignInModal";
import { homePathForRole } from "@/lib/roles";

export function TopNav({ userName }: { userName?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, userProfile } = useAuth();
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  useEffect(() => {
    if (location.state?.openSignIn) {
      setIsSignInOpen(true);
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const displayName =
    (currentUser as any)?.displayName ||
    currentUser?.email?.split("@")[0] ||
    userName ||
    "Guest";
  const userEmail = currentUser?.email || "";

  const isAgent = userProfile?.accountType === "agent";
  const dashboardPath = homePathForRole(userProfile?.accountType);

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s: string) => s[0]?.toUpperCase())
      .join("") || "U";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-emerald-900/10 bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
        <BrandLogo size="sm" />

        <div className="flex items-center gap-4 ml-auto">
          {currentUser ? (
            <>
              {isAgent ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(dashboardPath)}
                    className={`hidden sm:inline-flex rounded-lg border-emerald-900/20 text-emerald-900 hover:bg-emerald-50 px-4 py-1.5 text-sm font-medium gap-1.5 ${
                      location.pathname === "/my-properties" ? "bg-emerald-50" : ""
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button
                    type="button"
                    onClick={() => navigate("/add-property")}
                    className="hidden sm:inline-flex rounded-lg bg-emerald-900 text-white hover:bg-emerald-900/90 px-4 py-1.5 text-sm font-medium gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    List a Property
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/create-account")}
                  className="hidden sm:inline-flex rounded-lg border-emerald-900/20 text-emerald-900 hover:bg-emerald-50 px-4 py-1.5 text-sm font-medium gap-1.5"
                >
                  <Store className="h-4 w-4" />
                  Sell
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" className="rounded-2xl px-2">
                    <Avatar className="h-9 w-9">
                      {currentUser?.photoURL && (
                        <AvatarImage src={currentUser.photoURL} alt={displayName} />
                      )}
                      <AvatarFallback className="bg-emerald-900/10 text-emerald-950 font-semibold">
                        {initials || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                  <DropdownMenuLabel>
                    <div>
                      <div className="font-semibold">{displayName}</div>
                      {userEmail && (
                        <div className="text-xs text-gray-500 font-normal">{userEmail}</div>
                      )}
                      <div className="mt-1 text-xs font-medium text-emerald-700 capitalize">
                        {isAgent ? "Agent account" : "Buyer account"}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAgent ? (
                    <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/create-account")}>
                        <Store className="h-4 w-4 mr-2" />
                        Sell
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/?saved=1")}>
                        <Heart className="h-4 w-4 mr-2" />
                        Saved
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                className="hidden sm:inline-flex text-sm font-medium text-emerald-900 hover:text-emerald-700 px-0"
                onClick={() => setIsSignInOpen(true)}
              >
                Sign in
              </Button>
              <Button
                type="button"
                className="rounded-full bg-amber-400 text-emerald-950 hover:bg-amber-300 px-5 py-2 text-sm font-semibold"
                onClick={() => navigate("/create-account")}
              >
                Sell
              </Button>
            </>
          )}
        </div>
      </div>
      </div>

      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
    </>
  );
}
