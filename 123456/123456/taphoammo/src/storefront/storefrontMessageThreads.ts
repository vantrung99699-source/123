import type { Order } from '../ordersTypes';
import type { StorefrontAccountMode } from '../auth/roles';
import {
  isStorefrontBuyerAccountMode,
  isStorefrontResellerAccountMode,
  isStorefrontSellerAccountMode,
} from '../auth/roles';
import { isOrderForSeller } from './sellerPaymentHistory';
import {
  buildBuyerSellerThreadId,
  buildThreadIdBetweenPersonas,
  getCurrentMessagingPersona,
  getDemoChatPartnersForMode,
  personaToPartnerProfile,
  resolveBuyerPersona,
} from './storefrontMessagingPersonas';
import type { MessagePartnerProfile } from './storefrontMessagingPersonas';
import {
  ensureDemoCrossModeMessages,
  getLastMessagePreview,
} from './storefrontMessagesStorage';

export type { MessagePartnerProfile } from './storefrontMessagingPersonas';
export {
  buildBuyerSellerThreadId,
  buildResellerBuyerThreadId,
  buildSellerResellerThreadId,
} from './storefrontMessagingPersonas';

/** Tối thiểu field gian hàng admin — tránh import vòng từ HomeView. */
export type MessageGianHangTree = {
  sellerDisplayName?: string;
  createdByName?: string;
  storeImage?: string;
  products?: Array<{ sellerName?: string }>;
};

export interface MessageThreadSummary {
  id: string;
  partner: MessagePartnerProfile;
  lastPreview: string;
  lastActivityMs: number;
  unreadCount: number;
}

function resolveSellerAvatar(
  sellerName: string,
  adminCategories: MessageGianHangTree[] | undefined
): string | undefined {
  const sn = sellerName.trim();
  if (!sn || !adminCategories?.length) return undefined;
  for (const cat of adminCategories) {
    const display = (cat.sellerDisplayName || cat.createdByName || '').trim();
    if (display === sn && cat.storeImage?.trim()) return cat.storeImage.trim();
    for (const p of cat.products ?? []) {
      if ((p.sellerName || '').trim() === sn && cat.storeImage?.trim()) return cat.storeImage.trim();
    }
  }
  return undefined;
}

function pickLatestOrder(orders: Order[]): Order | undefined {
  return [...orders].sort((a, b) => {
    const ta = a.createdAtMs ?? 0;
    const tb = b.createdAtMs ?? 0;
    return tb - ta;
  })[0];
}

function isOrderForReseller(
  order: Order,
  resellerEmail: string,
  resellerExtras: string[]
): boolean {
  const emailNorm = resellerEmail.trim().toLowerCase();
  if (emailNorm && order.resellerReferrerEmail?.trim().toLowerCase() === emailNorm) return true;
  const keys = new Set(
    resellerExtras.map(s => s.trim().toLowerCase()).filter(Boolean)
  );
  const r = order.reseller?.trim().toLowerCase();
  return Boolean(r && keys.has(r));
}

export interface BuildMessageThreadsInput {
  accountMode: StorefrontAccountMode;
  currentLogin: string;
  currentDisplayName: string;
  currentEmail: string;
  sellerIdentityKeys: Set<string>;
  resellerIdentityExtras: string[];
  orders: Order[];
  adminGianHangCategories?: MessageGianHangTree[];
  /** Mở từ chi tiết SP — tạo hội thoại với seller dù chưa có đơn. */
  seedSellerName?: string;
  seedStoreName?: string;
  seedAvatarUrl?: string;
  seedPlatform?: string;
}

export function buildStorefrontMessageThreads(input: BuildMessageThreadsInput): MessageThreadSummary[] {
  const {
    accountMode,
    currentLogin,
    currentDisplayName,
    currentEmail,
    sellerIdentityKeys,
    resellerIdentityExtras,
    orders,
    adminGianHangCategories,
    seedSellerName,
    seedStoreName,
    seedAvatarUrl,
    seedPlatform,
  } = input;

  const session = {
    login: currentLogin,
    displayName: currentDisplayName,
    email: currentEmail,
  };
  ensureDemoCrossModeMessages(currentEmail, session);

  const buyerKey = resolveBuyerPersona(session).login;
  const map = new Map<string, { partner: MessagePartnerProfile; orders: Order[] }>();

  const upsertBuyerSeller = (
    buyerName: string,
    sellerName: string,
    order?: Order,
    extra?: Partial<MessagePartnerProfile>
  ) => {
    const b = buyerName.trim();
    const s = sellerName.trim();
    if (!b || !s) return;
    const id = buildBuyerSellerThreadId(b, s);
    const existing = map.get(id);
    const ordersForThread = existing ? [...existing.orders] : [];
    if (order && !ordersForThread.some(x => x.id === order.id)) ordersForThread.push(order);
    const latest = pickLatestOrder(ordersForThread);
    const isBuyerView = isStorefrontBuyerAccountMode(accountMode);
    map.set(id, {
      orders: ordersForThread,
      partner: {
        role: isBuyerView ? 'seller' : 'buyer',
        displayName: isBuyerView ? s : b,
        loginName: isBuyerView ? undefined : b,
        storeName: isBuyerView ? latest?.storeName || order?.storeName || seedStoreName : undefined,
        platform: latest?.platform || order?.platform || extra?.platform || seedPlatform,
        avatarUrl: isBuyerView
          ? resolveSellerAvatar(s, adminGianHangCategories) || seedAvatarUrl
          : undefined,
        lastOrderId: latest?.id,
        lastProductName: latest?.productName,
        lastOrderQuantity: latest?.quantity,
        lastOrderTotalAmount: latest?.totalAmount,
        lastOrderPurchaseDate: latest?.purchaseDate,
        orderCount: ordersForThread.length,
        ...extra,
      },
    });
  };

  const buyerKeys = new Set(
    [buyerKey, currentDisplayName.trim()].filter(Boolean).map(s => s.toLowerCase())
  );

  if (isStorefrontBuyerAccountMode(accountMode)) {
    for (const o of orders) {
      const bn = o.buyerName?.trim().toLowerCase();
      if (!bn || !buyerKeys.has(bn)) continue;
      upsertBuyerSeller(o.buyerName, o.sellerName, o);
    }
    if (seedSellerName?.trim()) {
      upsertBuyerSeller(resolveBuyerPersona(session).login, seedSellerName, undefined, {
        storeName: seedStoreName,
        avatarUrl: seedAvatarUrl,
        platform: seedPlatform,
      });
    }
  } else if (isStorefrontSellerAccountMode(accountMode)) {
    for (const o of orders) {
      if (!isOrderForSeller(o, sellerIdentityKeys)) continue;
      upsertBuyerSeller(o.buyerName, o.sellerName, o);
    }
  } else if (isStorefrontResellerAccountMode(accountMode)) {
    const resellerKey = currentEmail.trim() || currentLogin.trim();
    for (const o of orders) {
      if (!isOrderForReseller(o, currentEmail, resellerIdentityExtras)) continue;
      const buyer = o.buyerName?.trim();
      if (!buyer) continue;
      const id = buildResellerBuyerThreadId(resellerKey, buyer);
      const existing = map.get(id);
      const ordersForThread = existing ? [...existing.orders] : [];
      if (!ordersForThread.some(x => x.id === o.id)) ordersForThread.push(o);
      const latest = pickLatestOrder(ordersForThread);
      map.set(id, {
        orders: ordersForThread,
        partner: {
          role: 'buyer',
          displayName: buyer,
          loginName: buyer,
          storeName: latest?.storeName,
          platform: latest?.platform,
          lastOrderId: latest?.id,
          lastProductName: latest?.productName,
          lastOrderQuantity: latest?.quantity,
          lastOrderTotalAmount: latest?.totalAmount,
          lastOrderPurchaseDate: latest?.purchaseDate,
          orderCount: ordersForThread.length,
        },
      });
    }
  }

  const selfPersona = getCurrentMessagingPersona(accountMode, session);
  for (const partnerPersona of getDemoChatPartnersForMode(accountMode, session)) {
    const threadId = buildThreadIdBetweenPersonas(selfPersona, partnerPersona);
    const existing = map.get(threadId);
    const demoPartner = personaToPartnerProfile(partnerPersona);
    map.set(threadId, {
      orders: existing?.orders ?? [],
      partner: existing
        ? {
            ...demoPartner,
            orderCount: Math.max(existing.partner.orderCount, demoPartner.orderCount),
            lastOrderId: existing.partner.lastOrderId ?? demoPartner.lastOrderId,
            lastProductName: existing.partner.lastProductName ?? demoPartner.lastProductName,
            lastOrderQuantity: existing.partner.lastOrderQuantity ?? demoPartner.lastOrderQuantity,
            lastOrderTotalAmount:
              existing.partner.lastOrderTotalAmount ?? demoPartner.lastOrderTotalAmount,
            lastOrderPurchaseDate:
              existing.partner.lastOrderPurchaseDate ?? demoPartner.lastOrderPurchaseDate,
            storeName: existing.partner.storeName ?? demoPartner.storeName,
            avatarUrl: existing.partner.avatarUrl ?? demoPartner.avatarUrl,
          }
        : demoPartner,
    });
  }

  const threads: MessageThreadSummary[] = [...map.entries()].map(([id, { partner }]) => {
    const last = getLastMessagePreview(currentEmail, id);
    return {
      id,
      partner,
      lastPreview:
        last?.text ??
        (partner.lastProductName
          ? `Đơn ${partner.lastOrderId ?? ''} · ${partner.lastProductName}`
          : `Tin nhắn với ${partner.displayName}`),
      lastActivityMs: last?.sentAtMs ?? 0,
      unreadCount: 0,
    };
  });

  threads.sort((a, b) => {
    if (b.lastActivityMs !== a.lastActivityMs) return b.lastActivityMs - a.lastActivityMs;
    const oa = a.partner.orderCount > 0 ? 1 : 0;
    const ob = b.partner.orderCount > 0 ? 1 : 0;
    if (ob !== oa) return ob - oa;
    return a.partner.displayName.localeCompare(b.partner.displayName, 'vi');
  });

  return threads;
}

/** Hội thoại buyer ↔ seller từ đơn (dùng mở Nhắn tin từ admin / đánh giá). */
export function resolveBuyerSellerThreadIdFromOrder(order: {
  buyerName?: string;
  sellerName?: string;
}): string | null {
  const buyer = order.buyerName?.trim();
  const seller = order.sellerName?.trim();
  if (!buyer || !seller) return null;
  return buildBuyerSellerThreadId(buyer, seller);
}
