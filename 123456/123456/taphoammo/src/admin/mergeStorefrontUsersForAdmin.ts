/**
 * Gộp người dùng đăng ký storefront (localStorage — xem docs/storefront-auth-signup-parent.md)
 * vào danh sách Quản lý người dùng admin.
 */
import { listStorefrontSignups, type StoredStorefrontSignup } from '../auth/storefrontDemoAccounts';
import { getAdminUserBalanceVnd } from '../auth/storefrontWalletByEmail';
import type { AdminUser } from './types';

const SF_AVATAR_COLORS = [
  'bg-teal-100 text-teal-700',
  'bg-cyan-100 text-cyan-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-fuchsia-100 text-fuchsia-700',
];

function hashEmail(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function formatVndAdmin(n: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.floor(n)))} đ`;
}

function parseVndStatic(s: string): number {
  return Number(String(s).replace(/\D/g, '')) || 0;
}

function formatRegisteredAt(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function signupToAdminUser(s: StoredStorefrontSignup, stt: number): AdminUser {
  const wallet = getAdminUserBalanceVnd(s.email, 0);
  const slug = s.email.replace(/[^a-z0-9]/gi, '').slice(0, 12).toUpperCase() || 'USER';
  return {
    id: `sf-${s.email}`,
    stt,
    userId: `SF-${slug}`,
    username: s.username,
    createdAt: formatRegisteredAt(s.registeredAtIso),
    name: s.username,
    email: s.email,
    balance: formatVndAdmin(wallet),
    totalDeposit: '0 đ',
    totalSpent: '0 đ',
    status: 'Hoạt động',
    avatarColor: SF_AVATAR_COLORS[Math.abs(hashEmail(s.email)) % SF_AVATAR_COLORS.length],
    userSource: 'storefront_signup',
  };
}

/** Storefront trước (mới đăng ký trước), sau đó mock — trùng email thì ưu storefront. */
export function mergeAdminUsersWithStorefront(mockUsers: AdminUser[]): AdminUser[] {
  const signups = listStorefrontSignups();
  const signupEmails = new Set(signups.map((x) => x.email.toLowerCase()));
  const storefrontRows = signups.map((s, i) => signupToAdminUser(s, i + 1));
  const mockFiltered = mockUsers
    .filter((u) => !signupEmails.has(u.email.trim().toLowerCase()))
    .map((u, i) => {
      const fallback = parseVndStatic(u.balance);
      return {
        ...u,
        stt: storefrontRows.length + i + 1,
        userSource: 'mock' as const,
        balance: formatVndAdmin(getAdminUserBalanceVnd(u.email, fallback)),
      };
    });
  return [...storefrontRows, ...mockFiltered];
}
