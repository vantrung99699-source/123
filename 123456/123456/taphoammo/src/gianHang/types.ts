export type Status = 'Đang bán' | 'Tạm ngưng' | 'Chờ duyệt' | 'Đóng' | 'Đã hủy';
export type BusinessLine = 'Bán sản phẩm' | 'Dịch vụ';

export interface WarehouseItem {
  id: string;
  content: string;
  time: string;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  stock: number;
  sold: number;
  fee: string;
  status: Status;
  active: boolean;
  /** Admin Panel đóng/tạm ngưng — người bán không được bật lại qua cột Bật/Tắt. */
  sellerToggleLocked?: boolean;
  date: string;
  sellerName?: string;
  warehouseItems?: WarehouseItem[];
}

export interface Category {
  id: string;
  name: string;
  originalName?: string;
  tags?: string[];
  platform?: string;
  date?: string;
  description?: string;
  shortDescription?: string;
  productDetails?: string;
  storeImage?: string;
  classification?: {
    businessType: string;
    category: string;
    product: string;
  };
  configuration?: {
    refundRate: number;
    isSingleProduct: boolean;
    isReseller: boolean;
    resellerDefaultPercent?: number;
    isPrivateWarehouse: boolean;
    isLiveUidCheck: boolean;
    /** Khách có thể bấm «Đặt trước» trên storefront (khi hết hàng hoặc theo chính sách shop). */
    allowPreOrder?: boolean;
    saleType: 'Newest' | 'Oldest' | 'Random';
  };
  price?: string;
  products?: Product[];
  subCategories?: Category[];
  isParent?: boolean;
  iconName?: string;
  businessLine?: BusinessLine;
  createdAt?: number;
  sellerDisplayName?: string;
  createdByName?: string;
  /** Email người tạo gian — dùng gửi thông báo phê duyệt storefront */
  createdByEmail?: string;
  status?: Status;
}

export type GianHangLeaf = Category & {
  platformIconName?: string;
  /** Id nền tảng/danh mục cha chứa gian hàng con */
  platformParentId?: string;
};
