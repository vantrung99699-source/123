/**
 * Đăng ký demo storefront (localStorage). Production: API thật.
 */
const KEY = 'taphoammo_storefront_demo_accounts';

export type StoredStorefrontSignup = {
  email: string;
  username: string;
  password: string;
  /** ISO 8601 — ghi khi đăng ký thành công (bản ghi cũ có thể thiếu). */
  registeredAtIso?: string;
};

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getStorefrontSignupByEmail(email: string): StoredStorefrontSignup | null {
  const k = normEmail(email);
  if (!k) return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Record<string, StoredStorefrontSignup>;
    const row = obj[k];
    return row ? { ...row, email: k } : null;
  } catch {
    return null;
  }
}

export function saveStorefrontSignup(s: Omit<StoredStorefrontSignup, 'email'> & { email: string }): true | 'exists' {
  const email = normEmail(s.email);
  if (!email) return 'exists';
  try {
    const raw = localStorage.getItem(KEY);
    const obj: Record<string, StoredStorefrontSignup> = raw ? JSON.parse(raw) : {};
    if (obj[email]) return 'exists';
    obj[email] = {
      email,
      username: s.username.trim(),
      password: s.password,
      registeredAtIso: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify(obj));
    return true;
  } catch {
    return 'exists';
  }
}

/** Danh sách tài khoản đã đăng ký (demo), mới nhất trước. */
export function listStorefrontSignups(): StoredStorefrontSignup[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const obj = JSON.parse(raw) as Record<string, StoredStorefrontSignup>;
    return Object.values(obj).sort((a, b) => {
      const ta = a.registeredAtIso ? Date.parse(a.registeredAtIso) : 0;
      const tb = b.registeredAtIso ? Date.parse(b.registeredAtIso) : 0;
      return tb - ta;
    });
  } catch {
    return [];
  }
}
