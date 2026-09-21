import { AccountType, getStoredUser } from "@/lib/session";

/** Where a signed-in user should land after auth, by role. */
export function homePathForRole(accountType?: AccountType | null): string {
  if (accountType === "agent") return "/my-properties";
  return "/buy";
}

export function homePathFromSession(): string {
  const stored = getStoredUser();
  return homePathForRole(stored?.profile?.accountType);
}

/** Marketplace browse is open to guests, investors, and agents. */
export function canAccessBuy(_accountType?: AccountType | null): boolean {
  return true;
}

/** Only agent accounts can list / manage properties for sale. */
export function canAccessSell(accountType?: AccountType | null): boolean {
  return accountType === "agent";
}
