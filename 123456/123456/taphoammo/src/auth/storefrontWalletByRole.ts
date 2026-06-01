/**
 * Ví storefront theo vai trò (Người bán / Reseller) — tách khỏi ví Người mua.
 */
export type StorefrontRoleWalletKey = 'seller' | 'reseller';

const KEY = 'taphoammo_storefront_wallet_by_role_v1';

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readMap(): Record<string, Partial<Record<StorefrontRoleWalletKey, number>>> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, Partial<Record<StorefrontRoleWalletKey, number>>>;
    return typeof o === 'object' && o !== null ? o : {};
  } catch {
    return {};
  }
}

export function getStorefrontRoleWalletVnd(email: string, role: StorefrontRoleWalletKey): number {
  const k = normEmail(email);
  if (!k) return 0;
  const map = readMap();
  const v = map[k]?.[role];
  if (typeof v === 'number' && !Number.isNaN(v)) return Math.max(0, Math.floor(v));
  return 0;
}

export function setStorefrontRoleWalletVnd(
  email: string,
  role: StorefrontRoleWalletKey,
  vnd: number
): void {
  const k = normEmail(email);
  if (!k) return;
  const map = readMap();
  const row = map[k] ?? {};
  row[role] = Math.max(0, Math.floor(vnd));
  map[k] = row;
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}
