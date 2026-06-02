import type { Order } from '../ordersTypes';
import type { RefundOfferStatus } from '../orderRefund';
import { resolveBuyerOwnerEmailForOrder } from './resolveBuyerEmail';
import { resolveBuyerSellerThreadIdFromOrder } from './storefrontMessageThreads';
import { resolvePendingActionMessageForOrder } from './storefrontMessagesStorage';

export type WarrantyOfferStatus = RefundOfferStatus;

/** Đơn thay thế do shop bảo hành — không tính phí sàn / Reseller. */
export function isWarrantyReplacementOrder(order: Order): boolean {
  return Boolean(order.warrantedFromId?.trim());
}

export function buildWarrantyOfferPatch(order: Order, warrantyQuantity: number): Partial<Order> {
  return {
    warrantyOfferStatus: 'pending_buyer',
    warrantyOfferQuantity: warrantyQuantity,
  };
}

export function hasPendingWarrantyOffer(order: Order): boolean {
  return order.warrantyOfferStatus === 'pending_buyer';
}

function generateWarrantyOrderId(existingIds: Set<string>): string {
  let newOrderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  while (existingIds.has(newOrderId)) {
    newOrderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  }
  return newOrderId;
}

/** Khách chấp nhận bảo hành — tạo đơn thay thế như admin «Giải quyết khiếu nại». */
export function buildWarrantyAcceptResult(
  source: Order,
  warrantyQuantity: number,
  allOrders: Order[]
): { newOrder: Order; originalPatch: Partial<Order> } | null {
  if (source.isWarrantyProcessed) return null;
  const qty = Math.min(Math.max(1, Math.floor(warrantyQuantity)), source.quantity);
  const existingIds = new Set(allOrders.map(o => o.id));
  const newOrderId = generateWarrantyOrderId(existingIds);
  const now = new Date();
  const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const newOrder: Order = {
    ...source,
    id: newOrderId,
    purchaseDate: formattedDate,
    quantity: qty,
    discount: source.unitPrice,
    totalAmount: '0đ',
    status: 'Tạm giữ tiền',
    warrantedFromId: source.id,
    isWarrantyProcessed: false,
    hasComplained: false,
    warrantyOfferStatus: undefined,
    warrantyOfferQuantity: undefined,
    order_type: source.order_type,
    createdAtMs: now.getTime(),
    platformFee: '0đ',
    platformFeePercent: 0,
    reseller: undefined,
    resellerReferrerEmail: undefined,
    resellerPercent: undefined,
    resellerFee: '0đ',
  };

  const originalPatch: Partial<Order> = {
    isWarrantyProcessed: true,
    warrantedToId: newOrderId,
    status: 'Hoàn thành',
    warrantyOfferStatus: 'accepted',
    warrantyOfferQuantity: undefined,
  };

  return { newOrder, originalPatch };
}

export function buildWarrantyRejectPatch(): Partial<Order> {
  return {
    warrantyOfferStatus: 'rejected',
    warrantyOfferQuantity: undefined,
  };
}

export interface WarrantyOfferQuantities {
  offer: number;
  max: number;
}

/** SL bảo hành shop đề xuất (từ đơn hoặc tin nhắn chờ duyệt). */
export function resolveWarrantyOfferQuantities(
  order: Order,
  sessionFallbackEmail = ''
): WarrantyOfferQuantities | null {
  if (hasPendingWarrantyOffer(order)) {
    return {
      offer: order.warrantyOfferQuantity ?? order.quantity,
      max: order.quantity,
    };
  }

  if (
    order.warrantyOfferQuantity != null &&
    order.warrantyOfferQuantity > 0 &&
    order.warrantyOfferStatus !== 'accepted' &&
    order.warrantyOfferStatus !== 'rejected' &&
    !order.isWarrantyProcessed
  ) {
    return { offer: order.warrantyOfferQuantity, max: order.quantity };
  }

  const buyerEmail = resolveBuyerOwnerEmailForOrder(order, sessionFallbackEmail);
  const threadId = resolveBuyerSellerThreadIdFromOrder(order);
  if (!buyerEmail || !threadId) return null;

  const msg = resolvePendingActionMessageForOrder(buyerEmail, threadId, order.id, 'warranty');
  const action = msg?.action;
  if (!action || action.kind !== 'warranty' || action.status !== 'pending') return null;

  const offer = action.offerQuantity ?? order.warrantyOfferQuantity;
  if (offer == null || offer < 1) return null;

  return {
    offer,
    max: action.orderQuantity ?? order.quantity,
  };
}

export function hasResolvableWarrantyOffer(
  order: Order,
  sessionFallbackEmail = ''
): boolean {
  return resolveWarrantyOfferQuantities(order, sessionFallbackEmail) != null;
}
