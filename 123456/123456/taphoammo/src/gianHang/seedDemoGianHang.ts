import { demoStoreImageForGian } from './demoStoreImages';
import type { Category, Product, WarehouseItem } from './types';

export const SEED_DEMO_GIAN_PRICE = '1đ';

function buildDemoWarehouse(count: number, stamp: number): WarehouseItem[] {
  const time = '10/10/2025 10:00';
  return Array.from({ length: count }, (_, i) => ({
    id: `WH-SEED-${stamp}-${i + 1}`,
    content: `demo_acc_${i + 1}|DemoPass${1000 + i}|mail${i + 1}@demo.test`,
    time,
  }));
}

function buildDemoServiceProduct(opts: {
  id: string;
  name: string;
  sellerName: string;
}): Product {
  return {
    id: opts.id,
    name: opts.name,
    price: SEED_DEMO_GIAN_PRICE,
    stock: 999,
    sold: 0,
    fee: '10%',
    status: 'Đang bán',
    active: true,
    date: '10/10/2025 10:00',
    sellerName: opts.sellerName,
  };
}

function buildDemoProduct(opts: {
  id: string;
  name: string;
  sellerName: string;
  stock: number;
  warehouseItems?: WarehouseItem[];
}): Product {
  return {
    id: opts.id,
    name: opts.name,
    price: SEED_DEMO_GIAN_PRICE,
    stock: opts.stock,
    sold: 0,
    fee: '10%',
    status: 'Đang bán',
    active: true,
    date: '10/10/2025 10:00',
    sellerName: opts.sellerName,
    warehouseItems: opts.warehouseItems,
  };
}

const defaultGianConfig: Category['configuration'] = {
  refundRate: 100,
  isSingleProduct: false,
  isReseller: true,
  resellerDefaultPercent: 10,
  isPrivateWarehouse: false,
  isLiveUidCheck: false,
  allowPreOrder: true,
  saleType: 'Newest',
};

const defaultServiceGianConfig: Category['configuration'] = {
  ...defaultGianConfig,
  allowPreOrder: false,
  isPrivateWarehouse: false,
};

/** Sáu gian demo mặc định — phân loại đúng admin, giá 1đ, kho nhỏ. */
export function buildSeedDemoGianHangLeaves(): Category[] {
  const stamp = Date.now();

  return [
    {
      id: 'cat-1',
      name: 'Kho Facebook Via demo',
      tags: ['TRÙNG', 'RESELLER'],
      platform: 'tài khoản',
      classification: {
        businessType: 'Bán sản phẩm',
        category: 'tài khoản',
        product: 'Tài khoản FB (4%)',
      },
      businessLine: 'Bán sản phẩm',
      iconName: 'Facebook',
      configuration: { ...defaultGianConfig },
      date: '10/10/2025 10:00',
      shortDescription: 'Gian demo Facebook — test mua hàng storefront.',
      description: 'Gian demo Facebook — test mua hàng storefront.',
      createdByName: 'admin_store',
      sellerDisplayName: 'admin_store',
      storeImage: demoStoreImageForGian({ iconName: 'Facebook', platform: 'tài khoản' }),
      status: 'Đang bán',
      createdAt: stamp - 3000,
      products: [
        buildDemoProduct({
          id: 'MHD-SEED-FB-1',
          name: 'Via Facebook demo',
          sellerName: 'admin_store',
          stock: 8,
          warehouseItems: buildDemoWarehouse(8, stamp + 1),
        }),
      ],
      subCategories: [],
    },
    {
      id: 'cat-2',
      name: 'Kho Instagram demo',
      tags: ['TRÙNG', 'RESELLER'],
      platform: 'tài khoản',
      classification: {
        businessType: 'Bán sản phẩm',
        category: 'tài khoản',
        product: 'Tài khoản Instagram (4%)',
      },
      businessLine: 'Bán sản phẩm',
      iconName: 'Instagram',
      configuration: { ...defaultGianConfig, resellerDefaultPercent: 5 },
      date: '11/10/2025 09:00',
      shortDescription: 'Gian demo Instagram — có reseller 5%.',
      description: 'Gian demo Instagram — có reseller 5%.',
      createdByName: 'reseller_pro',
      sellerDisplayName: 'reseller_pro',
      storeImage: demoStoreImageForGian({ iconName: 'Instagram', platform: 'tài khoản' }),
      status: 'Đang bán',
      createdAt: stamp - 2000,
      products: [
        buildDemoProduct({
          id: 'MHD-SEED-IG-1',
          name: 'Acc Instagram demo',
          sellerName: 'reseller_pro',
          stock: 6,
          warehouseItems: buildDemoWarehouse(6, stamp + 2),
        }),
      ],
      subCategories: [],
    },
    {
      id: 'cat-3',
      name: 'Cho thuê BM Ads demo',
      tags: ['Uy tín'],
      platform: 'tài khoản',
      classification: {
        businessType: 'Bán sản phẩm',
        category: 'tài khoản',
        product: 'Tài khoản BM (4%)',
      },
      businessLine: 'Bán sản phẩm',
      iconName: 'Globe',
      configuration: {
        ...defaultGianConfig,
        isReseller: false,
        resellerDefaultPercent: undefined,
      },
      date: '12/10/2025 14:00',
      shortDescription: 'Gian demo thuê BM — không bật reseller.',
      description: 'Gian demo thuê BM — không bật reseller.',
      createdByName: 'global_ads',
      sellerDisplayName: 'global_ads',
      storeImage: demoStoreImageForGian({ iconName: 'Globe', platform: 'tài khoản' }),
      status: 'Đang bán',
      createdAt: stamp - 1000,
      products: [
        buildDemoProduct({
          id: 'MHD-SEED-BM-1',
          name: 'BM quảng cáo demo',
          sellerName: 'global_ads',
          stock: 3,
          warehouseItems: buildDemoWarehouse(3, stamp + 3),
        }),
      ],
      subCategories: [],
    },
    {
      id: 'cat-4',
      name: 'Kho TikTok demo',
      tags: ['MỚI', 'RESELLER'],
      platform: 'tài khoản',
      classification: {
        businessType: 'Bán sản phẩm',
        category: 'tài khoản',
        product: 'Tài khoản TikTok (3%)',
      },
      businessLine: 'Bán sản phẩm',
      iconName: 'Music',
      configuration: { ...defaultGianConfig, resellerDefaultPercent: 8 },
      date: '13/10/2025 11:00',
      shortDescription: 'Gian demo TikTok — reseller 8%.',
      description: 'Gian demo TikTok — reseller 8%.',
      createdByName: 'tiktok_shop',
      sellerDisplayName: 'tiktok_shop',
      storeImage: demoStoreImageForGian({ iconName: 'Music', platform: 'tài khoản' }),
      status: 'Đang bán',
      createdAt: stamp - 500,
      products: [
        buildDemoProduct({
          id: 'MHD-SEED-TT-1',
          name: 'Acc TikTok demo',
          sellerName: 'tiktok_shop',
          stock: 5,
          warehouseItems: buildDemoWarehouse(5, stamp + 4),
        }),
      ],
      subCategories: [],
    },
    {
      id: 'cat-5',
      name: 'Kho Twitter / X demo',
      tags: ['TRÙNG'],
      platform: 'tài khoản',
      classification: {
        businessType: 'Bán sản phẩm',
        category: 'tài khoản',
        product: 'Tài khoản Twitter (4%)',
      },
      businessLine: 'Bán sản phẩm',
      iconName: 'Twitter',
      configuration: { ...defaultGianConfig, isReseller: false },
      date: '14/10/2025 08:30',
      shortDescription: 'Gian demo Twitter — không reseller.',
      description: 'Gian demo Twitter — không reseller.',
      createdByName: 'x_social',
      sellerDisplayName: 'x_social',
      storeImage: demoStoreImageForGian({ iconName: 'Twitter', platform: 'tài khoản' }),
      status: 'Đang bán',
      createdAt: stamp - 400,
      products: [
        buildDemoProduct({
          id: 'MHD-SEED-X-1',
          name: 'Acc Twitter demo',
          sellerName: 'x_social',
          stock: 4,
          warehouseItems: buildDemoWarehouse(4, stamp + 5),
        }),
      ],
      subCategories: [],
    },
    {
      id: 'cat-6',
      name: 'Kho Gmail demo',
      tags: ['Uy tín', 'RESELLER'],
      platform: 'Gmail',
      classification: {
        businessType: 'Bán sản phẩm',
        category: 'Gmail',
        product: 'Gmail (4%)',
      },
      businessLine: 'Bán sản phẩm',
      iconName: 'Chrome',
      configuration: { ...defaultGianConfig, resellerDefaultPercent: 10 },
      date: '15/10/2025 16:00',
      shortDescription: 'Gian demo Gmail — nền tảng mail.',
      description: 'Gian demo Gmail — nền tảng mail.',
      createdByName: 'mail_demo',
      sellerDisplayName: 'mail_demo',
      storeImage: demoStoreImageForGian({ iconName: 'Chrome', platform: 'Gmail' }),
      status: 'Đang bán',
      createdAt: stamp - 300,
      products: [
        buildDemoProduct({
          id: 'MHD-SEED-GM-1',
          name: 'Gmail cổ demo',
          sellerName: 'mail_demo',
          stock: 50,
          warehouseItems: buildDemoWarehouse(50, stamp + 6),
        }),
      ],
      subCategories: [],
    },
  ];
}

/** Gian demo loại hình Dịch vụ — không kho, giá 1đ, phân loại khớp Quản lý loại SP tab Dịch vụ. */
export function buildSeedDemoGianHangServiceLeaves(): Category[] {
  const stamp = Date.now();

  return [
    {
      id: 'svc-cat-1',
      name: 'DV Tăng like Facebook demo',
      tags: ['AUTO', 'RESELLER'],
      platform: 'Tăng tương tác',
      classification: {
        businessType: 'Dịch vụ',
        category: 'Tăng tương tác',
        product: 'Dịch vụ Facebook (4%)',
      },
      businessLine: 'Dịch vụ',
      iconName: 'Facebook',
      configuration: { ...defaultServiceGianConfig },
      date: '10/10/2025 10:00',
      shortDescription: 'Gian dịch vụ tăng tương tác Facebook — test đặt dịch vụ storefront.',
      description: 'Gian dịch vụ tăng tương tác Facebook — test đặt dịch vụ storefront.',
      productDetails:
        'Dịch vụ tăng like, comment, share Fanpage và bài viết. Giao tự động sau thanh toán, hỗ trợ bảo hành tụt trong 7 ngày. Demo storefront.',
      createdByName: 'social_boost_vn',
      sellerDisplayName: 'social_boost_vn',
      storeImage: demoStoreImageForGian({
        iconName: 'Facebook',
        classificationCategory: 'Tăng tương tác',
      }),
      status: 'Đang bán',
      createdAt: stamp - 2500,
      products: [
        buildDemoServiceProduct({
          id: 'MHD-SEED-DV-FB-1',
          name: 'Tăng like FB bài viết demo',
          sellerName: 'social_boost_vn',
        }),
      ],
      subCategories: [],
    },
    {
      id: 'svc-cat-2',
      name: 'DV TikTok view & follow demo',
      tags: ['MỚI', 'RESELLER'],
      platform: 'Tăng tương tác',
      classification: {
        businessType: 'Dịch vụ',
        category: 'Tăng tương tác',
        product: 'Dịch vụ Tiktok (4%)',
      },
      businessLine: 'Dịch vụ',
      iconName: 'Music',
      configuration: { ...defaultServiceGianConfig, resellerDefaultPercent: 8 },
      date: '11/10/2025 09:30',
      shortDescription: 'Gian TikTok view, follow — reseller 8%, test đặt DV.',
      description: 'Gian TikTok view, follow — reseller 8%, test đặt DV.',
      productDetails:
        'Tăng view video, follow kênh TikTok Việt và quốc tế. Cam kết không drop trong 24h đầu. Phù hợp test luồng đơn dịch vụ trên sàn.',
      createdByName: 'tiktok_boost_pro',
      sellerDisplayName: 'tiktok_boost_pro',
      storeImage: demoStoreImageForGian({ iconName: 'Music', platform: 'Tăng tương tác' }),
      status: 'Đang bán',
      createdAt: stamp - 2000,
      products: [
        buildDemoServiceProduct({
          id: 'MHD-SEED-DV-TT-1',
          name: 'Buff view TikTok demo',
          sellerName: 'tiktok_boost_pro',
        }),
      ],
      subCategories: [],
    },
    {
      id: 'svc-cat-3',
      name: 'DV Youtube subscribe demo',
      tags: ['Uy tín'],
      platform: 'Tăng tương tác',
      classification: {
        businessType: 'Dịch vụ',
        category: 'Tăng tương tác',
        product: 'Dịch vụ Youtube (4%)',
      },
      businessLine: 'Dịch vụ',
      iconName: 'Youtube',
      configuration: { ...defaultServiceGianConfig, isReseller: false },
      date: '12/10/2025 14:00',
      shortDescription: 'Gian sub Youtube — không reseller, giao tay hoặc auto.',
      description: 'Gian sub Youtube — không reseller, giao tay hoặc auto.',
      productDetails:
        'Dịch vụ tăng subscriber và view Youtube. Hỗ trợ kênh mới và kênh cũ, báo cáo tiến độ qua đơn hàng. Gian demo cho admin và storefront.',
      createdByName: 'yt_growth_shop',
      sellerDisplayName: 'yt_growth_shop',
      storeImage: demoStoreImageForGian({ iconName: 'Youtube', platform: 'Tăng tương tác' }),
      status: 'Đang bán',
      createdAt: stamp - 1500,
      products: [
        buildDemoServiceProduct({
          id: 'MHD-SEED-DV-YT-1',
          name: 'Sub Youtube kênh demo',
          sellerName: 'yt_growth_shop',
        }),
      ],
      subCategories: [],
    },
    {
      id: 'svc-cat-4',
      name: 'DV Code tool MMO demo',
      tags: ['DEV', 'RESELLER'],
      platform: 'Dịch vụ phần mềm',
      classification: {
        businessType: 'Dịch vụ',
        category: 'Dịch vụ phần mềm',
        product: 'Dịch vụ code tool (6%)',
      },
      businessLine: 'Dịch vụ',
      iconName: 'Code',
      configuration: { ...defaultServiceGianConfig, resellerDefaultPercent: 12 },
      date: '13/10/2025 11:00',
      shortDescription: 'Gian làm tool, script MMO — phân loại dịch vụ phần mềm.',
      description: 'Gian làm tool, script MMO — phân loại dịch vụ phần mềm.',
      productDetails:
        'Dịch vụ viết tool auto, extension, script theo yêu cầu. Bàn giao source hoặc file cài đặt, hỗ trợ chỉnh sửa trong 48h. Demo giá 1đ để test thanh toán.',
      createdByName: 'mmo_dev_studio',
      sellerDisplayName: 'mmo_dev_studio',
      storeImage: demoStoreImageForGian({
        iconName: 'Code',
        classificationCategory: 'Dịch vụ phần mềm',
      }),
      status: 'Đang bán',
      createdAt: stamp - 1000,
      products: [
        buildDemoServiceProduct({
          id: 'MHD-SEED-DV-TOOL-1',
          name: 'Làm tool Chrome extension demo',
          sellerName: 'mmo_dev_studio',
        }),
      ],
      subCategories: [],
    },
    {
      id: 'svc-cat-5',
      name: 'DV Zalo member group demo',
      tags: ['TRÙNG', 'RESELLER'],
      platform: 'Tăng tương tác',
      classification: {
        businessType: 'Dịch vụ',
        category: 'Tăng tương tác',
        product: 'Dịch vụ Zalo (4%)',
      },
      businessLine: 'Dịch vụ',
      iconName: 'Zalo',
      configuration: { ...defaultServiceGianConfig, resellerDefaultPercent: 10 },
      date: '14/10/2025 08:00',
      shortDescription: 'Gian kéo member Zalo, nhóm Zalo — test đặt dịch vụ.',
      description: 'Gian kéo member Zalo, nhóm Zalo — test đặt dịch vụ.',
      productDetails:
        'Tăng thành viên nhóm Zalo, mời bạn bè, tương tác nhóm. Không cần kho hàng, xử lý đơn theo link nhóm khách cung cấp. Gian demo Zalo trên storefront.',
      createdByName: 'zalo_marketing',
      sellerDisplayName: 'zalo_marketing',
      storeImage: demoStoreImageForGian({ iconName: 'Zalo', platform: 'Tăng tương tác' }),
      status: 'Đang bán',
      createdAt: stamp - 500,
      products: [
        buildDemoServiceProduct({
          id: 'MHD-SEED-DV-ZL-1',
          name: 'Kéo member nhóm Zalo demo',
          sellerName: 'zalo_marketing',
        }),
      ],
      subCategories: [],
    },
  ];
}
