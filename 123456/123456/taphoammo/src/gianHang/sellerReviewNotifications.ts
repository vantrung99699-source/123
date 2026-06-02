import type { Order } from '../ordersTypes';

const STORAGE_KEY = 'taphoammo_seller_seen_review_order_ids';

export function readSeenReviewOrderIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string' && id.length > 0));
  } catch {
    return new Set();
  }
}

export function writeSeenReviewOrderIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore quota */
  }
}

/** Đơn có đánh giá khách mà seller chưa mở mục Đánh giá sau khi gửi. */
export function countUnreadBuyerReviews(orders: Order[], seen: Set<string>): number {
  return orders.filter((o) => o.buyerReview && !seen.has(o.id)).length;
}

/** Đánh dấu đã xem tất cả đánh giá hiện có (khi vào mục Đánh giá). */
export function markAllCurrentBuyerReviewsSeen(orders: Order[]): Set<string> {
  const seen = readSeenReviewOrderIds();
  for (const o of orders) {
    if (o.buyerReview) seen.add(o.id);
  }
  writeSeenReviewOrderIds(seen);
  return new Set(seen);
}
