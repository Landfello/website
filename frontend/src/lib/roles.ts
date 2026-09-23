import { AccountType, getStoredUser } from "@/lib/session";

/** Marketplace home — same listings browse for guests, buyers, and agents. */
export function homePathForRole(_accountType?: AccountType | null): string {
  return "/";
}

/** Agent listing management; buyers stay on marketplace. */
export function dashboardPathForRole(accountType?: AccountType | null): string {
  if (accountType === "agent") return "/my-properties";
  return "/";
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
