/**
 * Hồ sơ / trạng thái người dùng do admin quản lý (localStorage demo).
 */
import { getStorefrontHoVaTenForEmail, setStorefrontHoVaTenForEmail } from '../auth/storefrontHoVaTenByEmail';
import { setStorefront2FAEnabled, isStorefront2FAEnabled } from '../auth/storefront2FA';
import {
  getStorefrontSignupByEmail,
  updateStorefrontSignupRecord,
  migrateStorefrontSignupEmail,
} from '../auth/storefrontDemoAccounts';
import {
  getAdminUserBalanceVnd,
  setStorefrontWalletVndForEmail,
} from '../auth/storefrontWalletByEmail';
import {
  getStorefrontRoleWalletVnd,
  setStorefrontRoleWalletVnd,
  type StorefrontRoleWalletKey,
} from '../auth/storefrontWalletByRole';

const PHONE_KEY = 'taphoammo_admin_user_phone_by_email';
const FACEBOOK_KEY = 'taphoammo_admin_user_facebook_by_email';
const BAN_KEY = 'taphoammo_admin_user_ban_by_email';
const LEDGER_KEY = 'taphoammo_admin_user_ledger_by_email';

export interface AdminUserLedgerEntry {
  id: string;
  atIso: string;
  kind:
    | 'topup'
    | 'deduct'
    | 'set_balance'
    | 'purchase'
    | 'sale'
    | 'reseller'
    | 'withdraw'
    | 'refund'
    | 'other';
  amountVnd: number;
  label: string;
  detail?: string;
}

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readStringMap(key: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, string>;
    return typeof o === 'object' && o !== null ? o : {};
  } catch {
    return {};
  }
}

function writeStringMap(key: string, map: Record<string, string>): void {
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function readBanMap(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(BAN_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, boolean>;
    return typeof o === 'object' && o !== null ? o : {};
  } catch {
    return {};
  }
}

export function getAdminUserPhone(email: string): string {
  const map = readStringMap(PHONE_KEY);
  return (map[normEmail(email)] ?? '').trim();
}

export function setAdminUserPhone(email: string, phone: string): void {
  const k = normEmail(email);
  if (!k) return;
  const map = readStringMap(PHONE_KEY);
  const t = phone.trim();
  if (t) map[k] = t;
  else delete map[k];
  writeStringMap(PHONE_KEY, map);
}

export function getAdminUserFacebook(email: string): string {
  const map = readStringMap(FACEBOOK_KEY);
  return (map[normEmail(email)] ?? '').trim();
}

export function setAdminUserFacebook(email: string, facebook: string): void {
  const k = normEmail(email);
  if (!k) return;
  const map = readStringMap(FACEBOOK_KEY);
  const t = facebook.trim();
  if (t) map[k] = t;
  else delete map[k];
  writeStringMap(FACEBOOK_KEY, map);
}

export function isAdminUserBanned(email: string): boolean {
  const map = readBanMap();
  return map[normEmail(email)] === true;
}

export function setAdminUserBanned(email: string, banned: boolean): void {
  const k = normEmail(email);
  if (!k) return;
  const map = readBanMap();
  if (banned) map[k] = true;
  else delete map[k];
  try {
    localStorage.setItem(BAN_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function readLedgerMap(): Record<string, AdminUserLedgerEntry[]> {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, AdminUserLedgerEntry[]>;
    return typeof o === 'object' && o !== null ? o : {};
  } catch {
    return {};
  }
}

export function getAdminUserLedgerEntries(email: string): AdminUserLedgerEntry[] {
  const map = readLedgerMap();
  const rows = map[normEmail(email)];
  return Array.isArray(rows) ? [...rows] : [];
}

export function appendAdminUserLedgerEntry(
  email: string,
  entry: Omit<AdminUserLedgerEntry, 'id' | 'atIso'> & { id?: string; atIso?: string }
): void {
  const k = normEmail(email);
  if (!k) return;
  const map = readLedgerMap();
  const prev = map[k] ?? [];
  const row: AdminUserLedgerEntry = {
    id: entry.id ?? `adm-${Date.now()}-${prev.length}`,
    atIso: entry.atIso ?? new Date().toISOString(),
    kind: entry.kind,
    amountVnd: entry.amountVnd,
    label: entry.label,
    detail: entry.detail,
  };
  map[k] = [row, ...prev].slice(0, 200);
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function migrateStringMapKey(key: string, oldEmail: string, newEmail: string): void {
  const o = normEmail(oldEmail);
  const n = normEmail(newEmail);
  if (!o || !n || o === n) return;
  const map = readStringMap(key);
  if (map[o] != null) {
    map[n] = map[o];
    delete map[o];
    writeStringMap(key, map);
  }
}

function migrateBanKey(oldEmail: string, newEmail: string): void {
  const o = normEmail(oldEmail);
  const n = normEmail(newEmail);
  if (!o || !n || o === n) return;
  const map = readBanMap();
  if (map[o]) {
    map[n] = true;
    delete map[o];
    try {
      localStorage.setItem(BAN_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }
}

function migrateLedgerKey(oldEmail: string, newEmail: string): void {
  const o = normEmail(oldEmail);
  const n = normEmail(newEmail);
  if (!o || !n || o === n) return;
  const map = readLedgerMap();
  if (map[o]?.length) {
    map[n] = [...(map[n] ?? []), ...map[o]];
    delete map[o];
    try {
      localStorage.setItem(LEDGER_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }
}

function migrateRoleWallet(oldEmail: string, newEmail: string): void {
  const roles: StorefrontRoleWalletKey[] = ['seller', 'reseller'];
  for (const role of roles) {
    const v = getStorefrontRoleWalletVnd(oldEmail, role);
    if (v > 0) {
      const existing = getStorefrontRoleWalletVnd(newEmail, role);
      setStorefrontRoleWalletVnd(newEmail, role, existing + v);
      setStorefrontRoleWalletVnd(oldEmail, role, 0);
    }
  }
}

function migrateBuyerWallet(oldEmail: string, newEmail: string): void {
  const v = getAdminUserBalanceVnd(oldEmail, 0);
  if (v > 0) {
    const next = getAdminUserBalanceVnd(newEmail, 0);
    setStorefrontWalletVndForEmail(newEmail, next + v);
    setStorefrontWalletVndForEmail(oldEmail, 0);
  }
}

function migrateHoVaTen(oldEmail: string, newEmail: string): void {
  const ho = getStorefrontHoVaTenForEmail(oldEmail);
  if (ho) {
    setStorefrontHoVaTenForEmail(newEmail, ho);
    setStorefrontHoVaTenForEmail(oldEmail, '');
  }
}

function migrate2FA(oldEmail: string, newEmail: string): void {
  if (isStorefront2FAEnabled(oldEmail)) {
    setStorefront2FAEnabled(newEmail, true);
    setStorefront2FAEnabled(oldEmail, false);
  }
}

export interface AdminUserProfilePatch {
  email?: string;
  username?: string;
  fullName?: string;
  phone?: string;
  facebook?: string;
}

export type SaveAdminUserProfileResult = 'ok' | 'email_exists' | 'not_found' | 'invalid';

/** Admin lưu hồ sơ — email/SĐT có thể đổi; có quyền gỡ 2FA riêng. */
export function saveAdminUserProfile(
  currentEmail: string,
  patch: AdminUserProfilePatch
): SaveAdminUserProfileResult {
  const oldEmail = normEmail(currentEmail);
  if (!oldEmail) return 'invalid';

  const nextEmail = patch.email != null ? normEmail(patch.email) : oldEmail;
  if (!nextEmail || !nextEmail.includes('@')) return 'invalid';

  if (nextEmail !== oldEmail) {
    const migrated = migrateStorefrontSignupEmail(oldEmail, nextEmail);
    if (migrated === 'exists') return 'email_exists';
    migrateStringMapKey(PHONE_KEY, oldEmail, nextEmail);
    migrateStringMapKey(FACEBOOK_KEY, oldEmail, nextEmail);
    migrateBanKey(oldEmail, nextEmail);
    migrateLedgerKey(oldEmail, nextEmail);
    migrateBuyerWallet(oldEmail, nextEmail);
    migrateRoleWallet(oldEmail, nextEmail);
    migrateHoVaTen(oldEmail, nextEmail);
    migrate2FA(oldEmail, nextEmail);
  }

  const emailForFields = nextEmail;

  if (patch.fullName != null) {
    setStorefrontHoVaTenForEmail(emailForFields, patch.fullName);
  }
  if (patch.phone != null) setAdminUserPhone(emailForFields, patch.phone);
  if (patch.facebook != null) setAdminUserFacebook(emailForFields, patch.facebook);

  const signup = getStorefrontSignupByEmail(emailForFields);
  if (signup && patch.username != null && patch.username.trim()) {
    updateStorefrontSignupRecord(emailForFields, { username: patch.username.trim() });
  }

  return 'ok';
}

export function adminRemoveUser2FA(email: string): void {
  setStorefront2FAEnabled(email, false);
}
