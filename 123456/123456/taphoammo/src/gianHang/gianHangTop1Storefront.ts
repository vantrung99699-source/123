import type { ShopHubSponsoredItem } from '../components/StorefrontShopHubSections';
import { isLikelyImageUrl } from '../components/StorefrontShopHubSections';
import { flattenGianHangLeaves } from './categorySectionUtils';
import type { Category } from './types';
import {
  resolveCategoryTop1FromLeaves,
  type CategoryTop1Resolution,
  type GianHangTop1State,
} from './gianHangTop1Storage';

export type StorefrontTop1Context = CategoryTop1Resolution & {
  /** Top 1 toàn cục (legacy) — không dùng; mỗi danh mục có top1 riêng trong `top1ByCategory`. */
  top1GianHangId: string | null;
};

export interface StorefrontGianProductLike {
  id: number;
  adminGianHangId?: string;
  name: string;
  seller: string;
  sellerInitial: string;
  rating: number;
  reviews: number;
  sold: number;
  stock: number;
  isOutOfStock?: boolean;
  storefrontBusinessType?: 'Bán sản phẩm' | 'Dịch vụ';
  description: string;
  price: string;
  sellerAvatar?: string;
  businessProducts?: string;
  isSponsored?: boolean;
  isHot?: boolean;
  storefrontCreatedAt?: number;
}

export function listAdminGianHangIds(categories: Category[]): string[] {
  return flattenGianHangLeaves(categories).map((g) => g.id);
}

export function resolveStorefrontTop1Context(
  categories: Category[],
  top1State: GianHangTop1State
): StorefrontTop1Context {
  const leaves = flattenGianHangLeaves(categories);
  const resolved = resolveCategoryTop1FromLeaves(leaves, top1State);
  return {
    ...resolved,
    top1GianHangId: null,
  };
}

export function isStorefrontGianSponsored(
  adminGianHangId: string | undefined,
  ctx: CategoryTop1Resolution
): boolean {
  if (!adminGianHangId) return false;
  return ctx.sponsoredIds.has(adminGianHangId);
}

export function applyTop1FlagsToStorefrontProduct<T extends StorefrontGianProductLike>(
  product: T,
  ctx: CategoryTop1Resolution
): T {
  const gid = product.adminGianHangId;
  if (!gid || !isStorefrontGianSponsored(gid, ctx)) return product;
  return {
    ...product,
    isSponsored: true,
    isHot: true,
    tags: [...(product as { tags?: string[] }).tags ?? [], 'TÀI TRỢ', 'TOP 1'],
  };
}

/** Ưu tiên gian Top 1 trong từng danh mục (nhiều danh mục có thể cùng có Top 1). */
export function sortStorefrontProductsWithTop1First<T extends StorefrontGianProductLike>(
  products: T[],
  ctx: CategoryTop1Resolution
): T[] {
  const isCategoryTop1 = (p: T) => {
    const gid = p.adminGianHangId;
    if (!gid) return false;
    const key = ctx.gianHangIdToCategoryKey.get(gid);
    if (!key) return false;
    return ctx.top1ByCategory.get(key) === gid;
  };

  const top: T[] = [];
  const rest: T[] = [];
  for (const p of products) {
    if (isCategoryTop1(p)) top.push(p);
    else rest.push(p);
  }
  return [...top, ...rest];
}

export function adminProductToSponsoredHubItem(p: StorefrontGianProductLike): ShopHubSponsoredItem {
  const storeImg = p.sellerAvatar?.trim();
  const image =
    storeImg && isLikelyImageUrl(storeImg) ? storeImg : '🏪';
  return {
    id: p.id,
    title: p.name,
    seller: p.seller,
    sellerInitial: p.sellerInitial,
    rating: p.rating,
    reviews: p.reviews,
    sold: p.sold,
    stock: p.stock,
    isOutOfStock: p.isOutOfStock,
    isService: p.storefrontBusinessType === 'Dịch vụ',
    description: p.description,
    businessLine: p.businessProducts,
    price: p.price,
    image,
    promoBadges: [
      { label: 'Top 1', variant: 'accent' },
      { label: 'Tài trợ' },
    ],
  };
}
