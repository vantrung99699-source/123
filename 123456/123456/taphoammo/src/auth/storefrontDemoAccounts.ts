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

export function updateStorefrontSignupRecord(
  email: string,
  patch: Partial<Pick<StoredStorefrontSignup, 'username' | 'password'>>
): boolean {
  const k = normEmail(email);
  if (!k) return false;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const obj = JSON.parse(raw) as Record<string, StoredStorefrontSignup>;
    const row = obj[k];
    if (!row) return false;
    if (patch.username != null) row.username = patch.username.trim();
    if (patch.password != null) row.password = patch.password;
    obj[k] = { ...row, email: k };
    localStorage.setItem(KEY, JSON.stringify(obj));
    return true;
  } catch {
    return false;
  }
}

/** Đổi email khóa đăng ký — trả `exists` nếu email mới đã có tài khoản. */
export function migrateStorefrontSignupEmail(
  oldEmail: string,
  newEmail: string
): 'ok' | 'exists' | 'missing' {
  const o = normEmail(oldEmail);
  const n = normEmail(newEmail);
  if (!o || !n) return 'missing';
  if (o === n) return 'ok';
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return 'missing';
    const obj = JSON.parse(raw) as Record<string, StoredStorefrontSignup>;
    const row = obj[o];
    if (!row) return 'missing';
    if (obj[n]) return 'exists';
    delete obj[o];
    obj[n] = { ...row, email: n };
    localStorage.setItem(KEY, JSON.stringify(obj));
    return 'ok';
  } catch {
    return 'missing';
  }
}
