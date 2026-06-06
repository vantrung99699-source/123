/** Phiên đăng nhập theo trình duyệt / thiết bị (demo — localStorage). */

const STORAGE_KEY = 'taphoammo_storefront_login_sessions_v1';
const CURRENT_SESSION_KEY = 'taphoammo_storefront_current_session_id';

export type StorefrontLoginDevice = 'desktop' | 'mobile' | 'tablet';

export interface StorefrontLoginSession {
  id: string;
  browser: string;
  os: string;
  device: StorefrontLoginDevice;
  ip: string;
  location: string;
  loginAt: string;
  lastActiveAt: string;
}

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readAll(): Record<string, StorefrontLoginSession[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StorefrontLoginSession[]>;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, StorefrontLoginSession[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

function detectClient(): Pick<StorefrontLoginSession, 'browser' | 'os' | 'device'> {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  let browser = 'Trình duyệt khác';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/CriOS\//i.test(ua)) browser = 'Chrome (iOS)';
  else if (/Chrome\//i.test(ua)) browser = 'Google Chrome';
  else if (/Safari\//i.test(ua)) browser = 'Safari';

  let os = 'Hệ điều hành khác';
  if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let device: StorefrontLoginDevice = 'desktop';
  if (/iPad|Tablet/i.test(ua)) device = 'tablet';
  else if (/Mobile|Android|iPhone/i.test(ua)) device = 'mobile';

  return { browser, os, device };
}

function demoIp(): string {
  const pool = ['113.22.45.18', '171.224.88.92', '14.161.33.7', '192.168.1.42'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function demoLocation(): string {
  const pool = ['Hà Nội, VN', 'TP. Hồ Chí Minh, VN', 'Đà Nẵng, VN', 'Cần Thơ, VN'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function seedDemoSessions(email: string): StorefrontLoginSession[] {
  const now = Date.now();
  return [
    {
      id: `demo-firefox-${email}`,
      browser: 'Mozilla Firefox',
      os: 'Windows',
      device: 'desktop',
      ip: '171.224.88.92',
      location: 'TP. Hồ Chí Minh, VN',
      loginAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      lastActiveAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `demo-safari-${email}`,
      browser: 'Safari',
      os: 'iOS',
      device: 'mobile',
      ip: '14.161.33.7',
      location: 'Đà Nẵng, VN',
      loginAt: new Date(now - 12 * 24 * 60 * 60 * 1000).toISOString(),
      lastActiveAt: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function getOrCreateCurrentSessionId(): string {
  try {
    const existing = sessionStorage.getItem(CURRENT_SESSION_KEY);
    if (existing) return existing;
    const id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(CURRENT_SESSION_KEY, id);
    return id;
  } catch {
    return `sess-${Date.now()}`;
  }
}

export function getCurrentStorefrontSessionId(): string {
  return getOrCreateCurrentSessionId();
}

/** Ghi nhận hoặc cập nhật phiên trình duyệt hiện tại. */
export function recordStorefrontLoginSession(email: string): StorefrontLoginSession {
  const key = normEmail(email);
  const all = readAll();
  const list = all[key] ?? [];
  const sessionId = getOrCreateCurrentSessionId();
  const client = detectClient();
  const now = new Date().toISOString();
  const existingIdx = list.findIndex(s => s.id === sessionId);

  const session: StorefrontLoginSession = {
    id: sessionId,
    ...client,
    ip: existingIdx >= 0 ? list[existingIdx].ip : demoIp(),
    location: existingIdx >= 0 ? list[existingIdx].location : demoLocation(),
    loginAt: existingIdx >= 0 ? list[existingIdx].loginAt : now,
    lastActiveAt: now,
  };

  let next = [...list];
  if (existingIdx >= 0) next[existingIdx] = session;
  else next = [session, ...next];

  if (next.length === 1) {
    next = [session, ...seedDemoSessions(key)];
  }

  next.sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());
  all[key] = next.slice(0, 12);
  writeAll(all);
  return session;
}

export function getStorefrontLoginSessions(email: string): StorefrontLoginSession[] {
  const key = normEmail(email);
  if (!key) return [];
  const all = readAll();
  const list = all[key];
  if (!list?.length) {
    const seeded = seedDemoSessions(key);
    all[key] = seeded;
    writeAll(all);
    return seeded;
  }
  return [...list].sort(
    (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
  );
}

export function revokeStorefrontLoginSession(email: string, sessionId: string): boolean {
  const key = normEmail(email);
  const all = readAll();
  const list = all[key];
  if (!list?.length) return false;
  const next = list.filter(s => s.id !== sessionId);
  if (next.length === list.length) return false;
  all[key] = next;
  writeAll(all);
  return true;
}

export function formatStorefrontSessionTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return '—';
  const diff = Date.now() - ts;
  if (diff < 45_000) return 'Vừa xong';
  if (diff < 3_600_000) {
    const m = Math.max(1, Math.floor(diff / 60_000));
    return `${m} phút trước`;
  }
  if (diff < 86_400_000) {
    const h = Math.max(1, Math.floor(diff / 3_600_000));
    return `${h} giờ trước`;
  }
  if (diff < 7 * 86_400_000) {
    const d = Math.max(1, Math.floor(diff / 86_400_000));
    return `${d} ngày trước`;
  }
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
