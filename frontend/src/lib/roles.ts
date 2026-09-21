import { AccountType, getStoredUser } from "@/lib/session";

/** Where a signed-in user should land after auth, by role. */
export function homePathForRole(accountType?: AccountType | null): string {
  if (accountType === "agent") return "/sell";
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

/** Any signed-in account can list land. */
export function canAccessSell(accountType?: AccountType | null): boolean {
  return Boolean(accountType);
}
