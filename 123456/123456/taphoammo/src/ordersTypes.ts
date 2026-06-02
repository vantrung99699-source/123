import type { OrderFailureKind } from './orderFailureLabel';
import type { RefundOfferStatus } from './orderRefund';

/**
 * Đơn hàng — dùng chung storefront (khách mua) và panel quản lý.
 */
/** Một dòng sản phẩm đã giao vào kho người mua sau thanh toán. */
export interface DeliveredWarehouseItem {
  id: string;
  content: string;
  time?: string;
  /** Người mua báo lỗi SP — hiển thị trong kho đã bán của người bán. */
  buyerReportedDefective?: boolean;
  buyerReportedAtMs?: number;
}

export type OrderStatus =
  | 'Hoàn thành'
  | 'Đang thực hiện'
  | 'Khiếu nại'
  | 'Tạm giữ tiền'
  | 'Thất bại'
  | 'Chờ xác nhận'
  | 'Tranh chấp';

export interface Order {
  id: string;
  purchaseDate: string;
  sellerName: string;
  categoryName: string;
  productName: string;
  buyerName: string;
  quantity: number;
  unitPrice: string;
  discount: string;
  totalAmount: string;
  refund: string;
  status: OrderStatus;
  order_type?: 'product' | 'service';
  previousStatus?: OrderStatus;
  hasComplained?: boolean;
  isWarrantyProcessed?: boolean;
  warrantedFromId?: string;
  warrantedToId?: string;
  platform?: string;
  /** Tên / email người giới thiệu (reseller) — có thì tính hoa hồng. */
  reseller?: string;
  /** Email người giới thiệu lúc thanh toán — dùng khớp đơn trong hub Reseller. */
  resellerReferrerEmail?: string;
  storeName?: string;
  platformFee?: string;
  /** % phí sàn lúc thanh toán (theo loại SP/DV admin). */
  platformFeePercent?: number;
  /** % chiết khấu reseller lúc thanh toán (trên tổng đơn). */
  resellerPercent?: number;
  resellerFee?: string;
  complaintReason?: string;
  content?: string;
  /** Nội dung giao hàng do seller nhập khi chuyển Đang thực hiện → Tạm giữ tiền (đơn dịch vụ) */
  deliveryContent?: string;
  /** Đã thanh toán (trừ ví) qua storefront — đơn thật trong lịch sử mua hàng */
  checkoutPaid?: boolean;
  /** Thời điểm tạo đơn (ms), dùng sắp xếp lịch sử */
  createdAtMs?: number;
  /** Bắt đầu đếm 3 ngày tạm giữ (DV: lúc shop giao → Tạm giữ tiền; SP: thường = createdAtMs). */
  escrowHoldStartedAtMs?: number;
  /**
   * Kiểm thử: cộng thêm ms vào “bây giờ” khi tính hết 3 ngày (nút +3 ngày).
   * Không dùng trên production API — chỉ UI demo.
   */
  simulatedTimeAdvanceMs?: number;
  /** @deprecated Dùng simulatedTimeAdvanceMs */
  escrowSimulatedAdvanceMs?: number;
  /** Thời điểm chuyển sang Tranh chấp (ms) — đếm 3 ngày hoàn tiền nếu người mua không hủy. */
  disputeStartedAtMs?: number;
  /** Đã tự hoàn tiền sau hết hạn tranh chấp — tránh xử lý lặp. */
  disputeAutoRefunded?: boolean;
  /** Thời điểm chuyển sang Khiếu nại (ms) — đếm 3 ngày → Thất bại nếu không hủy. */
  complaintStartedAtMs?: number;
  /** Đã tự Thất bại sau hết hạn khiếu nại — tránh xử lý lặp. */
  complaintAutoFailed?: boolean;
  /**
   * Dòng kho đã giao cho người mua (trừ kho seller khi thanh toán storefront).
   * Có `deliveredItems` vẫn có thể `status === 'Tạm giữ tiền'` — sàn giữ tiền (xem docs/storefront-order-escrow.md).
   */
  deliveredItems?: DeliveredWarehouseItem[];
  /** Id mặt hàng admin (trong gian hàng). */
  adminMatHangId?: string;
  /** Id gian hàng admin. */
  adminGianHangId?: string;
  /** Đánh giá người mua cho đơn (sau Hoàn thành / Tạm giữ tiền). */
  buyerReview?: OrderBuyerReview;
  /** Yêu cầu đặt trước từ storefront (chưa trừ ví). */
  isPreOrder?: boolean;
  /** Ghi chú khách khi gửi đặt trước. */
  preOrderNote?: string;
  /** Chỉ số biến thể mặt hàng lúc khách đặt trước (seller giao từ kho). */
  preOrderVariantIndex?: number;
  /** Seller đã trừ kho và giao dòng sản phẩm cho khách. */
  preOrderFulfilled?: boolean;
  /**
   * Hạn giao tối đa (ngày) — khách chọn lúc đặt trước; đơn dịch vụ mặc định 7.
   * Quá hạn không giao / không xác nhận → tự Thất bại.
   */
  deliveryDeadlineDays?: number;
  /** Đã tự Thất bại vì quá hạn giao đặt trước. */
  preOrderAutoFailed?: boolean;
  /** Shop đã chấp nhận đơn dịch vụ (bắt đầu đếm hạn giao). */
  serviceAcceptedAtMs?: number;
  /** Đã tự Thất bại đơn dịch vụ (không xác nhận hoặc không giao đúng hạn). */
  serviceAutoFailed?: boolean;
  /** Nguồn thất bại — nhãn phụ (xem `orderFailureLabel.ts`). */
  failureKind?: OrderFailureKind;
  /** Số lượng SP admin đề xuất hoàn một phần. */
  partialRefundQuantity?: number;
  /** Khách chấp nhận / từ chối đề xuất hoàn một phần từ admin. */
  refundOfferStatus?: RefundOfferStatus;
  /** Số lượng SP đề xuất bảo hành (chờ khách xác nhận). */
  warrantyOfferQuantity?: number;
  /** Khách chấp nhận / từ chối đề xuất bảo hành từ admin. */
  warrantyOfferStatus?: RefundOfferStatus;
}

export interface OrderBuyerReview {
  rating: number;
  comment: string;
  createdAtMs: number;
  /** Phản hồi của người bán trên đánh giá. */
  sellerReply?: string;
  sellerReplyAtMs?: number;
}

/** Số cuối trong mã đơn (ORD-835150) — so sánh số học */
export function orderIdSortKey(id: string): number {
  const runs = id.match(/\d+/g);
  if (!runs?.length) return 0;
  const n = parseInt(runs[runs.length - 1]!, 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Parse `DD/MM/YYYY HH:mm` từ đơn mẫu — dùng khi không có createdAtMs */
export function parsePurchaseDateToMs(s: string): number | undefined {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return undefined;
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  const y = parseInt(m[3], 10);
  const h = parseInt(m[4], 10);
  const mi = parseInt(m[5], 10);
  const t = new Date(y, mo, d, h, mi).getTime();
  return Number.isNaN(t) ? undefined : t;
}

/**
 * Thời điểm ưu tiên để sort mới nhất trước:
 * 1) createdAtMs (thanh toán / tạo đơn thật)
 * 2) ngày mua trên chuỗi
 * 3) fallback số trong mã đơn
 */
export function orderNewestSortKey(o: Order): number {
  if (typeof o.createdAtMs === 'number' && !Number.isNaN(o.createdAtMs)) return o.createdAtMs;
  const fromDate = parsePurchaseDateToMs(o.purchaseDate);
  if (fromDate != null) return fromDate;
  return orderIdSortKey(o.id);
}

/** Mới nhất trước: theo created_at (createdAtMs) DESC, hòa thì order_id DESC */
export function compareOrdersNewestFirst(a: Order, b: Order): number {
  const ka = orderNewestSortKey(a);
  const kb = orderNewestSortKey(b);
  if (kb !== ka) return kb - ka;
  return orderIdSortKey(b.id) - orderIdSortKey(a.id);
}
