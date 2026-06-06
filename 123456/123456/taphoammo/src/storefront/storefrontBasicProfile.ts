/**
 * Dữ liệu & thống kê hồ sơ công khai storefront.
 */
import { getStorefrontSignupByEmail } from '../auth/storefrontDemoAccounts';
import type { Order } from '../ordersTypes';

export type BasicProfileGianHangNode = {
  isParent?: boolean;
  sellerDisplayName?: string;
  createdByName?: string;
  products?: { sold?: number }[];
  subCategories?: BasicProfileGianHangNode[];
};

const TELEGRAM_LINK_KEY = 'taphoammo_storefront_telegram_linked_v1';

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function flattenGianHang(nodes: BasicProfileGianHangNode[] | undefined): BasicProfileGianHangNode[] {
  if (!nodes?.length) return [];
  const out: BasicProfileGianHangNode[] = [];
  const walk = (list: BasicProfileGianHangNode[]) => {
    for (const n of list) {
      if (n.isParent) {
        if (n.subCategories?.length) walk(n.subCategories);
      } else {
        out.push(n);
        if (n.subCategories?.length) walk(n.subCategories);
      }
    }
  };
  walk(nodes);
  return out;
}

function sellerKey(cat: BasicProfileGianHangNode): string {
  return norm(cat.sellerDisplayName || cat.createdByName || '');
}

export function isStorefrontTelegramLinked(email: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(TELEGRAM_LINK_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, boolean>;
    return Boolean(map[norm(email)]);
  } catch {
    return false;
  }
}

export function setStorefrontTelegramLinked(email: string, linked: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(TELEGRAM_LINK_KEY);
    const map: Record<string, boolean> = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    map[norm(email)] = linked;
    localStorage.setItem(TELEGRAM_LINK_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export interface StorefrontBasicProfileData {
  username: string;
  displayName: string;
  email: string;
  registeredAtLabel: string;
  memberDays: number;
  level: number;
  isVerified: boolean;
  isActive: boolean;
  purchasedCount: number;
  gianHangCount: number;
  soldProductCount: number;
  postCount: number;
  telegramLinked: boolean;
  insuranceVnd: number;
  insuranceVerified: boolean;
  rating: number;
  ratingCount: number;
  complaintRatePercent: number;
  trustScore: number;
  avgResponseMinutes: number;
  completionRatePercent: number;
}

export function buildStorefrontBasicProfile(params: {
  username: string;
  displayName: string;
  email: string;
  allOrders: Order[];
  gianHangCategories?: BasicProfileGianHangNode[];
}): StorefrontBasicProfileData {
  const username = params.username.trim();
  const displayName = params.displayName.trim() || username;
  const email = norm(params.email);
  const keys = new Set(
    [username, displayName, email].filter(Boolean).map(norm)
  );

  const matchParty = (name: string | undefined) => {
    const n = norm(name || '');
    return n && keys.has(n);
  };

  const purchasedCount = params.allOrders.filter(
    o => matchParty(o.buyerName) || (email && norm(o.buyerName) === email)
  ).length;

  const sellerOrders = params.allOrders.filter(o => matchParty(o.sellerName));
  const soldFromOrders = sellerOrders.filter(o => o.checkoutPaid !== false).length;

  const leaves = flattenGianHang(params.gianHangCategories);
  const myGian = leaves.filter(g => {
    const sk = sellerKey(g);
    return sk && keys.has(sk);
  });
  const gianHangCount = myGian.length;

  let soldFromGian = 0;
  for (const g of myGian) {
    for (const p of g.products ?? []) {
      soldFromGian += typeof p.sold === 'number' ? Math.max(0, p.sold) : 0;
    }
  }
  const soldProductCount = Math.max(soldFromOrders, soldFromGian, sellerOrders.length);

  const complaintOrders = sellerOrders.filter(
    o =>
      o.status === 'Khiếu nại' ||
      o.status === 'Tranh chấp' ||
      Boolean(o.hasComplained)
  ).length;
  const complaintRatePercent =
    sellerOrders.length > 0
      ? Math.round((complaintOrders / sellerOrders.length) * 1000) / 10
      : 0;

  const signup = email ? getStorefrontSignupByEmail(email) : null;
  let registeredAtLabel = '—';
  let memberDays = 15;
  if (signup?.registeredAtIso) {
    const d = new Date(signup.registeredAtIso);
    if (!Number.isNaN(d.getTime())) {
      registeredAtLabel = d.toLocaleDateString('vi-VN');
      memberDays = Math.max(1, Math.floor((Date.now() - d.getTime()) / 86400000));
    }
  } else {
    registeredAtLabel = '28/01/2026';
  }

  const level =
    soldProductCount >= 5000 ? 5 : soldProductCount >= 2000 ? 4 : soldProductCount >= 500 ? 3 : soldProductCount >= 100 ? 2 : 1;

  const ratingCount = Math.max(12, Math.min(999, soldProductCount * 2 + gianHangCount * 5));
  const rating = complaintRatePercent < 1 ? 4.8 : complaintRatePercent < 3 ? 4.5 : 4.2;

  const trustScore = Math.min(
    100,
    Math.max(
      40,
      72 +
        Math.min(20, gianHangCount * 4) +
        Math.min(15, Math.floor(soldProductCount / 100)) -
        Math.floor(complaintRatePercent * 3)
    )
  );

  return {
    username,
    displayName,
    email: params.email,
    registeredAtLabel,
    memberDays,
    level,
    isVerified: gianHangCount > 0 || soldProductCount > 0,
    isActive: true,
    purchasedCount,
    gianHangCount: gianHangCount || (soldProductCount > 0 ? 1 : 0),
    soldProductCount,
    postCount: 0,
    telegramLinked: email ? isStorefrontTelegramLinked(email) : false,
    insuranceVnd: gianHangCount > 0 ? 500_000 : 0,
    insuranceVerified: gianHangCount > 0,
    rating,
    ratingCount,
    complaintRatePercent,
    trustScore,
    avgResponseMinutes: 18,
    completionRatePercent: Math.min(99, 94 + Math.min(5, level)),
  };
}
