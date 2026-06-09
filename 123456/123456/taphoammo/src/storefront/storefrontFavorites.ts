/**
 * Gian hàng yêu thích — demo localStorage theo email người mua.
 */

export interface StorefrontFavoriteEntry {
  productKey: string;
  savedAtMs: number;
}

const STORAGE_KEY = 'taphoammo_storefront_favorite_shops_v1';

function normOwnerKey(email: string): string {
  const e = email.trim().toLowerCase();
  return e || '__guest__';
}

export function productToFavoriteKey(product: {
  adminGianHangId?: string;
  id: number;
}): string {
  return product.adminGianHangId ? `gh:${product.adminGianHangId}` : `id:${product.id}`;
}

function readAllBuckets(): Record<string, StorefrontFavoriteEntry[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StorefrontFavoriteEntry[]>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAllBuckets(buckets: Record<string, StorefrontFavoriteEntry[]>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buckets));
  } catch {
    /* ignore */
  }
}

export function listStorefrontFavorites(buyerEmail: string): StorefrontFavoriteEntry[] {
  const owner = normOwnerKey(buyerEmail);
  const bucket = readAllBuckets()[owner] ?? [];
  return [...bucket].sort((a, b) => b.savedAtMs - a.savedAtMs);
}

export function listStorefrontFavoriteKeys(buyerEmail: string): string[] {
  return listStorefrontFavorites(buyerEmail).map((e) => e.productKey);
}

export function isStorefrontFavorite(buyerEmail: string, productKey: string): boolean {
  return listStorefrontFavoriteKeys(buyerEmail).includes(productKey);
}

/** Bật/tắt yêu thích — trả về trạng thái mới (true = đã lưu). */
export function toggleStorefrontFavorite(
  buyerEmail: string,
  productKey: string
): boolean {
  const owner = normOwnerKey(buyerEmail);
  const buckets = readAllBuckets();
  const list = [...(buckets[owner] ?? [])];
  const idx = list.findIndex((e) => e.productKey === productKey);
  if (idx >= 0) {
    list.splice(idx, 1);
    buckets[owner] = list;
    writeAllBuckets(buckets);
    return false;
  }
  list.unshift({ productKey, savedAtMs: Date.now() });
  buckets[owner] = list;
  writeAllBuckets(buckets);
  return true;
}
