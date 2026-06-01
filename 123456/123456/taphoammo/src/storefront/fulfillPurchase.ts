import type { Category, Product, WarehouseItem } from '../gianHang/types';

function parsePriceToVndNumber(priceStr: string): number {
  const digits = priceStr.replace(/[^\d]/g, '');
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? 0 : n;
}

function isSellableMatHang(p: Product): boolean {
  const name = (p.name || '').trim();
  if (!name) return false;
  if (p.status !== 'Đang bán') return false;
  if (p.active === false) return false;
  return parsePriceToVndNumber(p.price || '') > 0;
}

function findGianHangLeaf(cats: Category[], gianHangId: string): Category | undefined {
  for (const cat of cats) {
    if (!cat.isParent && cat.id === gianHangId) return cat;
    if (cat.subCategories?.length) {
      const found = findGianHangLeaf(cat.subCategories, gianHangId);
      if (found) return found;
    }
  }
  return undefined;
}

function updateMatHangInTree(
  cats: Category[],
  gianHangId: string,
  matHangId: string,
  patch: Product
): Category[] {
  return cats.map(cat => {
    if (!cat.isParent && cat.id === gianHangId && cat.products) {
      return {
        ...cat,
        products: cat.products.map(p => (p.id === matHangId ? patch : p)),
      };
    }
    if (cat.subCategories?.length) {
      return { ...cat, subCategories: updateMatHangInTree(cat.subCategories, gianHangId, matHangId, patch) };
    }
    return cat;
  });
}

export type FulfillPurchaseResult =
  | {
      ok: true;
      categories: Category[];
      items: WarehouseItem[];
      matHangId: string;
      matHangName: string;
    }
  | { ok: false; message: string };

/** Trừ dòng kho seller và trả về sản phẩm giao cho người mua. */
export function fulfillPurchaseInCategories(
  categories: Category[],
  adminGianHangId: string,
  variantIndex: number,
  quantity: number
): FulfillPurchaseResult {
  const leaf = findGianHangLeaf(categories, adminGianHangId);
  if (!leaf) {
    return { ok: false, message: 'Không tìm thấy gian hàng.' };
  }

  const sellable = (leaf.products ?? []).filter(isSellableMatHang);
  if (sellable.length === 0) {
    return { ok: false, message: 'Gian hàng không còn mặt hàng đang bán.' };
  }

  const idx = Math.min(Math.max(0, variantIndex), sellable.length - 1);
  const matHang = sellable[idx]!;
  const warehouse = matHang.warehouseItems ?? [];

  if (warehouse.length < quantity) {
    const available = warehouse.length;
    if (available <= 0) {
      return { ok: false, message: 'Kho chưa có sản phẩm để giao. Vui lòng thử lại sau.' };
    }
    return {
      ok: false,
      message: `Kho chỉ còn ${available.toLocaleString('vi-VN')} sản phẩm. Vui lòng giảm số lượng.`,
    };
  }

  const allocated = warehouse.slice(0, quantity);
  const remaining = warehouse.slice(quantity);
  const updatedMatHang: Product = {
    ...matHang,
    warehouseItems: remaining,
    stock: remaining.length,
    sold: (matHang.sold ?? 0) + quantity,
  };

  return {
    ok: true,
    categories: updateMatHangInTree(categories, leaf.id, matHang.id, updatedMatHang),
    items: allocated,
    matHangId: matHang.id,
    matHangName: matHang.name,
  };
}
