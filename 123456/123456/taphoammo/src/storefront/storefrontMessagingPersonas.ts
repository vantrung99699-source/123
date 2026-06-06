import type { StorefrontAccountMode } from '../auth/roles';
import {
  isStorefrontBuyerAccountMode,
  isStorefrontResellerAccountMode,
  isStorefrontSellerAccountMode,
} from '../auth/roles';
export type MessagingPersonaId = 'buyer' | 'seller' | 'reseller';

export type MessagePartnerRole = 'buyer' | 'seller';

export interface MessagePartnerProfile {
  personaId?: MessagingPersonaId;
  role: MessagePartnerRole;
  displayName: string;
  loginName?: string;
  email?: string;
  storeName?: string;
  platform?: string;
  avatarUrl?: string;
  lastOrderId?: string;
  lastProductName?: string;
  lastOrderQuantity?: number;
  lastOrderTotalAmount?: string;
  lastOrderPurchaseDate?: string;
  orderCount: number;
  /** Hội thoại hỗ trợ chính thức từ TapHoaMMO (chat với sàn). */
  isPlatformSupport?: boolean;
}

function slug(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '_').slice(0, 48) || 'unknown';
}

export function buildBuyerSellerThreadId(buyerKey: string, sellerKey: string): string {
  return `bs:${slug(buyerKey)}:${slug(sellerKey)}`;
}

export function buildResellerBuyerThreadId(resellerKey: string, buyerKey: string): string {
  return `rb:${slug(resellerKey)}:${slug(buyerKey)}`;
}

export interface MessagingPersona {
  id: MessagingPersonaId;
  login: string;
  displayName: string;
  email?: string;
  storeName?: string;
  platform?: string;
  avatarUrl?: string;
  demoOrderId?: string;
  demoProductName?: string;
}

/** Người bán demo — tài khoản riêng (khác người mua / reseller). */
export const DEMO_SELLER_PERSONA: MessagingPersona = {
  id: 'seller',
  login: 'king_tiktok_shop',
  displayName: 'KingTikTok VN',
  storeName: 'SHOP XU HƯỚNG',
  platform: 'TikTok',
  demoOrderId: 'ORD-882715',
  demoProductName: 'VPS Windows 4GB RAM - 1 Tháng',
};

/** Reseller demo — tài khoản riêng. */
export const DEMO_RESELLER_PERSONA: MessagingPersona = {
  id: 'reseller',
  login: 'reseller_benson',
  displayName: 'Benson Reseller',
  email: 'reseller.demo@taphoammo.vn',
};

export function resolveBuyerPersona(session: {
  login: string;
  displayName: string;
  email: string;
}): MessagingPersona {
  return {
    id: 'buyer',
    login: session.login.trim() || 'nguoi_mua_demo',
    displayName: session.displayName.trim() || session.login || 'Người mua',
    email: session.email.trim() || undefined,
    demoOrderId: 'ORD-882715',
    demoProductName: 'VPS Windows 4GB RAM - 1 Tháng',
  };
}

export function getCurrentMessagingPersona(
  accountMode: StorefrontAccountMode,
  session: { login: string; displayName: string; email: string }
): MessagingPersona {
  if (isStorefrontSellerAccountMode(accountMode)) return { ...DEMO_SELLER_PERSONA };
  if (isStorefrontResellerAccountMode(accountMode)) return { ...DEMO_RESELLER_PERSONA };
  return resolveBuyerPersona(session);
}

export function buildSellerResellerThreadId(sellerKey: string, resellerKey: string): string {
  return `sr:${slug(sellerKey)}:${slug(resellerKey)}`;
}

/** Id hội thoại ổn định giữa hai persona (không phụ thuộc chế độ đang xem). */
export function buildThreadIdBetweenPersonas(a: MessagingPersona, b: MessagingPersona): string {
  const ids = new Set<MessagingPersonaId>([a.id, b.id]);
  if (ids.has('buyer') && ids.has('seller')) {
    const buyer = a.id === 'buyer' ? a : b;
    const seller = a.id === 'seller' ? a : b;
    return buildBuyerSellerThreadId(buyer.login, seller.login);
  }
  if (ids.has('buyer') && ids.has('reseller')) {
    const buyer = a.id === 'buyer' ? a : b;
    const reseller = a.id === 'reseller' ? a : b;
    return buildResellerBuyerThreadId(reseller.login, buyer.login);
  }
  if (ids.has('seller') && ids.has('reseller')) {
    const seller = a.id === 'seller' ? a : b;
    const reseller = a.id === 'reseller' ? a : b;
    return buildSellerResellerThreadId(seller.login, reseller.login);
  }
  return `dm:${slug(a.login)}:${slug(b.login)}`;
}

export function personaToPartnerProfile(partner: MessagingPersona): MessagePartnerProfile {
  return {
    personaId: partner.id,
    role: partner.id === 'seller' ? 'seller' : 'buyer',
    displayName: partner.displayName,
    loginName: partner.login,
    email: partner.email,
    storeName: partner.storeName,
    platform: partner.platform,
    avatarUrl: partner.avatarUrl,
    lastOrderId: partner.demoOrderId,
    lastProductName: partner.demoProductName,
    lastOrderQuantity: partner.demoOrderId ? 1 : undefined,
    lastOrderTotalAmount: partner.demoOrderId ? '120.000đ' : undefined,
    lastOrderPurchaseDate: partner.demoOrderId ? '01/01/2026 10:00' : undefined,
    orderCount: partner.demoOrderId ? 1 : 0,
  };
}

/** Hai persona còn lại — để thử chat chéo 3 chế độ. */
export function getDemoChatPartnersForMode(
  accountMode: StorefrontAccountMode,
  session: { login: string; displayName: string; email: string }
): MessagingPersona[] {
  const buyer = resolveBuyerPersona(session);
  if (isStorefrontBuyerAccountMode(accountMode)) {
    return [DEMO_SELLER_PERSONA, DEMO_RESELLER_PERSONA];
  }
  if (isStorefrontSellerAccountMode(accountMode)) {
    return [buyer, DEMO_RESELLER_PERSONA];
  }
  return [buyer, DEMO_SELLER_PERSONA];
}

export function resolvePersonaById(
  id: MessagingPersonaId,
  session: { login: string; displayName: string; email: string }
): MessagingPersona {
  if (id === 'seller') return { ...DEMO_SELLER_PERSONA };
  if (id === 'reseller') return { ...DEMO_RESELLER_PERSONA };
  return resolveBuyerPersona(session);
}

export function getDemoThreadPreview(partner: MessagingPersona): string {
  if (partner.id === 'seller') return 'Chào shop, mình vừa mua VPS — cho hỏi thời gian giao hàng?';
  if (partner.id === 'reseller') return 'Chào bạn, mình là Reseller giới thiệu — cần hỗ trợ đơn qua link cứ nhắn.';
  return 'Ok bạn, mình đã mua qua link của bạn rồi nhé.';
}
