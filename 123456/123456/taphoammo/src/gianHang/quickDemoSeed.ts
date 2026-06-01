import { demoStoreImageForGian } from './demoStoreImages';
import type { BusinessLine, Category, Product, WarehouseItem } from './types';

export const QUICK_DEMO_DEFAULT_PRICE = '1đ';

function formatViDateTimeNow(): string {
  const d = new Date();
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function buildDemoWarehouseItems(count: number, stamp: number): WarehouseItem[] {
  const time = formatViDateTimeNow();
  const shortStamp = (stamp % 1_000_000).toString(36);
  return Array.from({ length: count }, (_, i) => ({
    id: `WHD-${shortStamp}-${i + 1}`,
    content: `demo_ig_${i + 1}|DemoPass${1000 + i}|mail${i + 1}@demo.test`,
    time,
  }));
}

export interface QuickDemoGianHangOptions {
  sellerDisplayName: string;
  createdByName?: string;
  /** Loại gian: sản phẩm (có kho) hoặc dịch vụ (không kho). */
  businessLine?: BusinessLine;
  /** Tên nền tảng cha — gán vào `Category.platform` */
  parentPlatformName?: string;
  warehouseLineCount?: number;
  price?: string;
}

/** Gian hàng + 1 mặt hàng đã phê duyệt — dùng thử storefront / mua hàng. */
export function buildQuickDemoGianHangWithProduct(opts: QuickDemoGianHangOptions): Category {
  const stamp = Date.now();
  const dateStr = formatViDateTimeNow();
  const seller = (opts.sellerDisplayName || 'Demo Seller').slice(0, 60);
  const createdBy = (opts.createdByName || seller).slice(0, 60);
  const line: BusinessLine = opts.businessLine ?? 'Bán sản phẩm';
  const isService = line === 'Dịch vụ';
  const price = opts.price ?? QUICK_DEMO_DEFAULT_PRICE;
  const shortTime = new Date(stamp).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let product: Product;
  let classification: Category['classification'];
  let iconName: string;
  let gianName: string;
  let platform: string;

  if (isService) {
    const serviceCategory = 'Tăng tương tác';
    const serviceProductType = 'Dịch vụ Facebook (4%)';
    platform = opts.parentPlatformName || serviceCategory;
    classification = {
      businessType: 'Dịch vụ',
      category: serviceCategory,
      product: serviceProductType,
    };
    iconName = 'Facebook';
    gianName = `Gian dịch vụ demo ${shortTime}`;
    product = {
      id: `MHD-${(stamp % 1_000_000).toString(36)}`,
      name: `Tăng tương tác FB demo ${shortTime}`,
      price,
      stock: 999,
      sold: 0,
      fee: '10%',
      status: 'Đang bán',
      active: true,
      date: dateStr,
      sellerName: seller,
    };
  } else {
    const warehouseCount = Math.max(5, Math.min(50, opts.warehouseLineCount ?? 12));
    const warehouseItems = buildDemoWarehouseItems(warehouseCount, stamp);
    platform = opts.parentPlatformName || 'tài khoản';
    classification = {
      businessType: 'Bán sản phẩm',
      category: 'Instagram',
      product: 'Tài khoản Instagram (4%)',
    };
    iconName = 'Instagram';
    gianName = `Kho Instagram demo ${shortTime}`;
    product = {
      id: `MHD-${(stamp % 1_000_000).toString(36)}`,
      name: `Acc Instagram demo ${shortTime}`,
      price,
      stock: warehouseItems.length,
      sold: 0,
      fee: '10%',
      status: 'Đang bán',
      active: true,
      date: dateStr,
      sellerName: seller,
      warehouseItems,
    };
  }

  return {
    id: `GHD-${(stamp % 1_000_000).toString(36)}`,
    name: gianName,
    tags: ['TRÙNG', 'RESELLER'],
    platform,
    classification,
    configuration: {
      refundRate: 100,
      isSingleProduct: false,
      isReseller: true,
      resellerDefaultPercent: 10,
      isPrivateWarehouse: false,
      isLiveUidCheck: false,
      allowPreOrder: !isService,
      saleType: 'Newest',
    },
    date: dateStr,
    shortDescription: isService
      ? 'Gian DV demo — đã duyệt, test đặt dịch vụ storefront.'
      : 'Gian demo — đã duyệt, có kho sẵn để test mua hàng.',
    description: isService
      ? 'Gian DV demo — đã duyệt, test đặt dịch vụ storefront.'
      : 'Gian demo — đã duyệt, có kho sẵn để test mua hàng.',
    productDetails: isService
      ? 'Dịch vụ tăng tương tác demo. Tự động tạo bởi nút «Tạo nhanh».'
      : 'Tài khoản Instagram demo. Tự động tạo bởi nút «Tạo nhanh».',
    isParent: false,
    iconName,
    products: [product],
    subCategories: [],
    createdAt: stamp,
    sellerDisplayName: seller,
    createdByName: createdBy,
    status: 'Đang bán',
    businessLine: line,
    storeImage: demoStoreImageForGian({
      iconName,
      platform,
      classificationCategory: classification.category,
    }),
  };
}
