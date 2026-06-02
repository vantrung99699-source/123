import { flattenGianHangLeaves } from './categorySectionUtils';
import type { Category } from './types';
import type { Order, OrderBuyerReview } from '../ordersTypes';

export interface SellerReviewRow {
  orderId: string;
  date: string;
  buyer: string;
  storeName: string;
  platform: string;
  productName: string;
  comment: string;
  reply: string;
  rating: number;
  adminGianHangId?: string;
  buyerReview: OrderBuyerReview;
}

export function findGianHangLeafById(
  categories: Category[],
  gianHangId: string | undefined
): Category | undefined {
  if (!gianHangId?.trim()) return undefined;
  return flattenGianHangLeaves(categories).find((g) => g.id === gianHangId);
}

export function resolveOrderStoreDisplayName(
  order: Order,
  categories?: Category[]
): string {
  const leaf = findGianHangLeafById(categories ?? [], order.adminGianHangId);
  return (
    order.storeName?.trim() ||
    leaf?.name?.trim() ||
    order.categoryName?.trim() ||
    'Gian hàng'
  );
}

export function resolveOrderStorePlatform(
  order: Order,
  categories?: Category[]
): string {
  const leaf = findGianHangLeafById(categories ?? [], order.adminGianHangId);
  return leaf?.platform?.trim() || order.platform?.trim() || 'Khác';
}

export interface CatalogReviewItem {
  orderId: string;
  user: string;
  rating: number;
  time: string;
  comment: string;
  sellerReply?: string;
  createdAtMs: number;
}

function maskBuyerName(name: string): string {
  const t = name.trim();
  if (t.length <= 2) return `${t}***`;
  return `${t.slice(0, 2)}***${t.slice(-1)}`;
}

function formatReviewDateMs(ms: number): string {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Đánh giá khách trên tab Reviews của gian (theo adminGianHangId). */
export function buildCatalogReviewsForGianHang(
  orders: Order[],
  adminGianHangId: string
): CatalogReviewItem[] {
  const gid = adminGianHangId.trim();
  if (!gid) return [];
  return orders
    .filter((o) => o.adminGianHangId === gid && o.buyerReview)
    .map((o) => {
      const review = o.buyerReview!;
      return {
        orderId: o.id,
        user: maskBuyerName(o.buyerName),
        rating: review.rating,
        time: formatReviewDateMs(review.createdAtMs),
        comment: review.comment,
        sellerReply: review.sellerReply?.trim() || undefined,
        createdAtMs: review.createdAtMs,
      };
    })
    .sort((a, b) => b.createdAtMs - a.createdAtMs);
}

export function computeCatalogRatingStats(
  reviews: CatalogReviewItem[],
  fallbackRating: number,
  fallbackCount: number
): { rating: number; count: number } {
  if (reviews.length === 0) {
    return { rating: fallbackRating, count: fallbackCount };
  }
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  const avg = sum / reviews.length;
  return {
    rating: Math.round(avg * 10) / 10,
    count: reviews.length,
  };
}

export function buildSellerReviewRowsFromOrders(
  orders: Order[],
  categories?: Category[]
): SellerReviewRow[] {
  return orders
    .filter((o) => o.buyerReview)
    .map((o) => {
      const review = o.buyerReview!;
      return {
        orderId: o.id,
        date: o.purchaseDate,
        buyer: o.buyerName,
        storeName: resolveOrderStoreDisplayName(o, categories),
        platform: resolveOrderStorePlatform(o, categories),
        productName: o.productName,
        comment: review.comment,
        reply: review.sellerReply?.trim() || '',
        rating: review.rating,
        adminGianHangId: o.adminGianHangId,
        buyerReview: review,
      };
    })
    .sort((a, b) => (b.buyerReview.createdAtMs ?? 0) - (a.buyerReview.createdAtMs ?? 0));
}
