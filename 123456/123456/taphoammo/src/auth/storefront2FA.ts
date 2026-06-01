/** Trạng thái 2FA demo storefront (localStorage). Production: API + TOTP thật. */

const KEY = 'taphoammo_storefront_2fa_enabled';

/** Mã demo — sau khi quét QR, app giả lập trả về mã này để xác nhận. */
export const STOREFRONT_2FA_DEMO_CODE = '123456';

export const STOREFRONT_2FA_DEMO_SECRET = 'TAPHOAMMO-DEMO-2FA-KEY';

export const STOREFRONT_2FA_DEMO_BACKUP_CODES = [
  '8F2A-9K1L-4M3P',
  'Q7WN-2H5R-9X6C',
  'B4YD-6T8V-1Z0K',
] as const;

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isStorefront2FAEnabled(email: string): boolean {
  const k = normEmail(email);
  if (!k) return false;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const obj = JSON.parse(raw) as Record<string, boolean>;
    return obj[k] === true;
  } catch {
    return false;
  }
}

export function setStorefront2FAEnabled(email: string, enabled: boolean): void {
  const k = normEmail(email);
  if (!k) return;
  try {
    const raw = localStorage.getItem(KEY);
    const obj: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    if (enabled) obj[k] = true;
    else delete obj[k];
    localStorage.setItem(KEY, JSON.stringify(obj));
  } catch {
    /* ignore quota */
  }
}

export function verifyStorefront2FACode(code: string): boolean {
  const digits = code.replace(/\D/g, '');
  return digits.length === 6 && digits === STOREFRONT_2FA_DEMO_CODE;
}
