import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, Shield, Star, User, Filter, TrendingUp, Eye, CheckCircle, CheckCircle2, ArrowRight, ChevronRight, ChevronLeft, X, LogOut, Clock, Wallet, Calendar, ShoppingBag, Package, FileText, ExternalLink, Settings, Edit2, Phone, Mail, MessageCircle, ArrowLeft, Loader2, AlertCircle, Store, Handshake, Copy, Monitor, Smartphone, Tablet, MoreVertical } from 'lucide-react';
import { PurchasedOrdersView } from './PurchasedOrdersView';
import { orderIdSortKey, orderNewestSortKey, type DeliveredWarehouseItem, type Order } from './ordersTypes';
import type { FulfillPurchaseResult } from './storefront/fulfillPurchase';
import { reportDefectiveItemsOnOrder } from './storefront/reportDefectiveItems';
import {
  isAdminImpersonatingStorefront,
  getAdminImpersonateTargetEmail,
  clearAdminImpersonateFlag,
} from './auth/adminImpersonateStorefront';
import {
  applyDefectiveUploadToOrder,
  parseDefectiveUploadText,
} from './storefront/defectiveItemUpload';
import { appendSellerSoldWarehouseEntries } from './storefront/sellerSoldWarehouse';
import type { PaymentHistory } from './admin/types';
import { readStorefrontNotificationSettings } from './admin/adminStorefrontNotificationSettings';
import {
  markStorefrontPopupDismissed,
  resolveActiveStorefrontPopup,
  type StorefrontPopupNotification,
} from './admin/adminStorefrontPopupNotifications';
import { listActiveStorefrontTopUpNotices } from './admin/adminStorefrontTopUpNotices';
import { OrderDetailView } from './OrderDetailView';
import { ServiceOrderDetailView } from './ServiceOrderDetailView';
import {
  getSessionDisplayName,
  getSessionLoginUsername,
  setSessionDisplayName,
  setSessionLoginUsername,
  setSessionBuyerEmail,
  getStorefrontAccountMode,
  isStorefrontBuyerAccountMode,
  isStorefrontCustomerAccountMode,
  isStorefrontSellerAccountMode,
  isStorefrontResellerAccountMode,
  setStorefrontAccountMode,
  STOREFRONT_VIRTUAL_ACCOUNT,
  type StorefrontAccountMode,
} from './auth/roles';
import {
  getStorefrontHoVaTenForEmail,
  setStorefrontHoVaTenForEmail,
  capStorefrontUsername,
} from './auth/storefrontHoVaTenByEmail';
import { getStorefrontSignupByEmail } from './auth/storefrontDemoAccounts';
import {
  isStorefront2FAEnabled,
  setStorefront2FAEnabled,
  STOREFRONT_2FA_DEMO_BACKUP_CODES,
  STOREFRONT_2FA_DEMO_CODE,
  STOREFRONT_2FA_DEMO_SECRET,
  verifyStorefront2FACode,
} from './auth/storefront2FA';
import {
  getStorefrontRoleWalletVnd,
  setStorefrontRoleWalletVnd,
} from './auth/storefrontWalletByRole';
import { StorefrontAuthDropdown, type StorefrontLoginPayload } from './components/StorefrontAuthDropdown';
import { StorefrontBasicInfoPage } from './components/StorefrontBasicInfoPage';
import { StorefrontFavoriteHeartButton } from './components/StorefrontFavoriteHeartButton';
import {
  listStorefrontFavoriteKeys,
  productToFavoriteKey,
  toggleStorefrontFavorite,
} from './storefront/storefrontFavorites';
import {
  buildStorefrontBasicProfile,
  setStorefrontTelegramLinked,
} from './storefront/storefrontBasicProfile';
import { StorefrontSellerRegistrationModal } from './storefront/StorefrontSellerRegistrationModal';
import {
  hasPendingSellerRegistration,
  isSellerRegistrationApproved,
} from './storefront/storefrontSellerRegistration';
import {
  isStorefrontTelegramOrderNotifEnabled,
  setStorefrontTelegramOrderNotifEnabled,
} from './storefront/storefrontTelegramNotificationPrefs';
import {
  countUnreadStorefrontUserNotifications,
  listStorefrontUserNotifications,
  markAllStorefrontUserNotificationsRead,
  markStorefrontUserNotificationRead,
} from './storefront/storefrontUserNotifications';
import {
  formatStorefrontSessionTime,
  getCurrentStorefrontSessionId,
  getStorefrontLoginSessions,
  recordStorefrontLoginSession,
  revokeStorefrontLoginSession,
  type StorefrontLoginSession,
} from './auth/storefrontLoginSessions';
import { StorefrontGuestHeader } from './components/StorefrontGuestHeader';
import { StorefrontHeaderNavCategoryDropdown } from './components/StorefrontHeaderNavCategoryDropdown';
import { StorefrontHeaderNavToolsDropdown } from './components/StorefrontHeaderNavToolsDropdown';
import { StorefrontToolPage } from './components/StorefrontToolsPage';
import {
  isStorefrontToolPage,
  storefrontPageToToolId,
  toolIdToStorefrontPage,
  type StorefrontToolId,
  type StorefrontToolPageId,
} from './storefront/storefrontTools';
import { StorefrontTelegramConnectPanel } from './components/StorefrontTelegramConnectPanel';
import { StorefrontTelegramConnectSuccessModal } from './components/StorefrontTelegramConnectSuccessModal';
import { StorefrontGuestLanding } from './components/StorefrontGuestLanding';
import { StorefrontLandingFooter } from './components/StorefrontLandingFooter';
import {
  StorefrontInfoPage,
  type StorefrontInfoTabId,
} from './components/StorefrontInfoPage';
import { StorefrontSupportPage } from './components/StorefrontSupportPage';
import { StorefrontSharePage } from './components/StorefrontSharePage';
import { buildSupportThreadIdForBuyerEmail } from './storefront/sellerRegistrationApprovalNotify';
import { StorefrontTopBar } from './components/StorefrontTopBar';
import {
  StorefrontShopHubSections,
  HubStockLabel,
  isLikelyImageUrl,
  type ShopHubSponsoredItem,
} from './components/StorefrontShopHubSections';
import type { GianHangTop1State } from './gianHang/gianHangTop1Storage';
import {
  adminProductToSponsoredHubItem,
  applyTop1FlagsToStorefrontProduct,
  resolveStorefrontTop1Context,
  sortSponsoredProductsByCategorySelection,
  sortStorefrontProductsWithTop1First,
} from './gianHang/gianHangTop1Storefront';
import { ProductReviewsContent } from './components/ProductReviewsContent';
import {
  buildCatalogReviewsForGianHang,
  computeCatalogRatingStats,
} from './gianHang/orderBuyerReviews';
import { resolveBuyerSellerThreadIdFromOrder } from './storefront/storefrontMessageThreads';
import type { StorefrontMessagesNavState } from './storefront/storefrontMessagesNav';
import { useStorefrontLocale } from './i18n/storefrontLocale';
import { useStorefrontCurrency } from './i18n/storefrontCurrency';
import { isPreOrderAwaitingFulfillment } from './orderStatusBadge';
import { getResolvedRefundVnd, isPartialRefundOrder } from './orderRefund';
import {
  buildPlatformFeeFieldsForCheckout,
  resolvePlatformFeePercentFromProductTypeLabel,
} from './storefront/orderPlatformFee';
import type { PaymentHistoryItem, PaymentHistoryType } from './storefront/paymentHistoryTypes';
import {
  buildSellerEscrowReleaseLedgerItem,
  buildSellerPartialRefundPayoutLedgerItem,
  buildSellerPayoutRows,
  isOrderForSeller,
  sumSellerPayoutByStatus,
  type SellerPayoutRow,
} from './storefront/sellerPaymentHistory';
import { SellerWithdrawModal } from './storefront/SellerWithdrawModal';
import {
  formatSellerWithdrawDate,
  getSellerWithdrawHistory,
  getSellerWithdrawnVnd,
  type SellerWithdrawRecord,
} from './storefront/sellerWithdraw';
import { StorefrontTopUpView } from './storefront/StorefrontTopUpView';
import { StorefrontMessagesView } from './storefront/StorefrontMessagesView';
import { buildBuyerSellerThreadId, resolveBuyerPersona } from './storefront/storefrontMessagingPersonas';
import { buildStorefrontMessageThreads } from './storefront/storefrontMessageThreads';
import { buildResellerCommissionLedgerItem } from './storefront/resellerPaymentHistory';
import {
  computeDiscountCodeOffVnd,
  formatAppliedDiscountLabel,
  incrementDiscountCodeUsage,
  validateDiscountCodeForCheckout,
} from './storefront/discountCodeApply';
import type { DiscountCodeRow } from './admin/discountCodesStorage';
import {
  DELIVERY_DEADLINE_DAYS_DEFAULT,
  DELIVERY_DEADLINE_DAYS_MAX,
  DELIVERY_DEADLINE_DAYS_MIN,
  parseDeliveryDeadlineDaysInput,
} from './storefront/deliveryDeadlineDays';
import { getGianHangResellerPercent } from './gianHang/categorySectionUtils';
import type { Category } from './gianHang/types';
import {
  findPendingResellerRequest,
  getResellerApprovedPercent,
  getResellerEffectivePercentForBuyer,
  getResellerMinimumNextPercent,
  getResellerShopDefaultPercent,
  submitResellerRequest,
  validateResellerRequestedPercent,
  type ResellerRequest,
} from './reseller/resellerRequests';
import {
  buildDemoResellerReferrerForGian,
  buildResellerFeeFieldsForBuyerCheckout,
  isOrderForResellerReferrer,
  parseResellerRefFromSearch,
  readResellerReferrerFromStorage,
  resolveResellerReferrerForBuyerCheckout,
  writeResellerReferrerToStorage,
  type ResellerReferrerContext,
} from './storefront/orderResellerFee';
import { ResellerStorefrontHub } from './storefront/ResellerStorefrontHub';

// Platform icon components
const TikTokIcon = () => (
  <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-lg">
    <svg viewBox="0 0 24 24" width="32" height="32" fill="white">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.52a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.05a8.27 8.27 0 004.76 1.52V7.12a4.83 4.83 0 01-1-.43z"/>
    </svg>
  </div>
);

const FacebookIcon = () => (
  <div className="w-16 h-16 bg-[#1877F2] rounded-2xl flex items-center justify-center shadow-lg">
    <svg viewBox="0 0 24 24" width="32" height="32" fill="white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  </div>
);

const TelegramIcon = () => (
  <div className="w-16 h-16 bg-[#26A5E4] rounded-2xl flex items-center justify-center shadow-lg">
    <svg viewBox="0 0 24 24" width="32" height="32" fill="white">
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  </div>
);

const GmailIcon = () => (
  <div className="w-16 h-16 bg-gradient-to-br from-red-500 via-yellow-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
    <span className="text-white font-bold text-2xl">M</span>
  </div>
);

const NetflixIcon = () => (
  <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-lg">
    <span className="text-[#E50914] font-bold text-3xl">N</span>
  </div>
);

const WindowsIcon = () => (
  <div className="w-16 h-16 bg-[#00A4EF] rounded-2xl flex items-center justify-center shadow-lg">
    <span className="text-white font-bold text-2xl">W</span>
  </div>
);

// Product type
interface Product {
  id: number;
  name: string;
  sellerAvatar: string;
  rating: number;
  reviews: number;
  sold: number;
  description: string;
  seller: string;
  sellerInitial: string;
  stock: number;
  price: string;
  originalPrice?: string;
  discount?: number;
  /** Giá VND từng biến thể (cùng thứ tự với `businessProducts`). Trang chi tiết dùng để hiển thị giá chính xác; trang chủ vẫn dùng `price` (khoảng ước lượng gian hàng). */
  variantPrices?: number[];
  /** Tồn kho từng biến thể (cùng thứ tự với `businessProducts` / mặt hàng đang bán). */
  variantStocks?: number[];
  tags: string[];
  extraTags?: string[];
  isSponsored?: boolean;
  isOutOfStock?: boolean;
  hasKhongTrung?: boolean;
  isHot?: boolean;
  viewers?: number;
  /** Tên loại sản phẩm (hiển thị trên thẻ: Sản phẩm: …) */
  productTypeLabel?: string;
  businessProducts?: string;
  /** Mô tả chi tiết đầy đủ (tab Mô tả — có thể rất dài) */
  longDescription?: string;
  /** Thời điểm tạo gian (admin) — sắp xếp «Mới nhất» */
  storefrontCreatedAt?: number;
  /** `Category.id` gốc khi thẻ lấy từ Quản lý gian hàng */
  adminGianHangId?: string;
  /** Loại hình gian admin — ưu tiên khi gán `order_type` lúc thanh toán (xem `docs/don-hang-sau-khi-mua-san-pham-vs-dich-vu.md`). */
  storefrontBusinessType?: 'Bán sản phẩm' | 'Dịch vụ';
  /** Gian hàng bật «Cho phép đặt trước» trong Cấu hình. */
  allowPreOrder?: boolean;
  /** % phí sàn từ loại SP/DV (classification.product). */
  platformFeePercent?: number;
  /** Gian admin bật «Cho phép Reseller» — hiện nút 🤝 trên chi tiết SP. */
  storefrontResellerEnabled?: boolean;
  /** % chiết khấu reseller mặc định của gian (null = ẩn). */
  storefrontResellerPercent?: number;
}

const sampleProducts: Product[] = [
  {
    id: 1,
    name: 'SHOP XU HƯỚNG - TIKTOK TRIỆU VIEW - TÀI KHOẢN UY TÍN SỐ 1 VN',
    sellerAvatar: 'https://img.icons8.com/color/480/tiktok.png',
    rating: 5, reviews: 999, sold: 5000,
    description: 'KÊNH TIKTOK ĐÃ MỞ LIVE, SHOP. PHÙ HỢP LIVE BÁN HÀNG',
    longDescription:
      '=== PHẦN MÔ TẢ CHI TIẾT (VÍ DỤ NỘI DUNG DÀI NHƯ THỰC TẾ) ===\n\n' +
      '• Loại tài khoản: Kênh TikTok đã bật LIVE Shopping, gắn Shop, profile xu hướng; phù hợp livestream bán hàng, affiliate và review sản phẩm.\n\n' +
      '• Hình thức giao: Mật khẩu/tài khoản giao qua hệ thống tự động ngay sau khi thanh toán thành công. Trong giờ cao điểm có thể chậm 5–15 phút; vui lòng kiểm tra mục Lịch sử đơn hàng và hộp thư.\n\n' +
      '• Cam kết shop: Hàng kiểm duyệt trước khi niêm yết; log cập nhật theo lô (Acc cổ / Acc mới / Shop đã tách) để anh chị dễ lựa. Không bán acc trùng máy chủ với lô khác trong cùng phiên (ghi rõ khi mua).\n\n' +
      '• Cấu hình biến thể: Các dòng "1K FL", ">1K FL", "có video cổ", " đã live tháng X" là ví dụ biến thể thực tế — mỗi dòng có độ tuổi acc, số video/ live history, mức bảo hành khác nhau. Vui lòng đọc kỹ bảng chọn biến thể bên trên trước khi "Mua hàng".\n\n' +
      '• Bảo hành & xử lý sự cố: Đổi 1–1 trong 24h nếu không đăng nhập được/không đúng loại đã chọn (có video màn hình và timestamp). Sau 24h hoặc sau khi đổi mật khẩu/email thứ bậc thứ hai do người mua chủ động, shop không hoàn tiền theo chính sách nền tảng.\n\n' +
      '• Lưu ý pháp lý & nền tảng: Người mua tự chịu trách nhiệm sử dụng tài khoản đúng Điều khoản TikTok và pháp luật địa phương. Shop không hỗ trợ hành vi spam, vượt chuẩn quảng cáo, hoặc nội dung vi phạm.\n\n' +
      '• Hướng dẫn nhận hàng nhanh: (1) Đăng nhập bằng thông tin trong đơn; (2) Bật 2FA nếu có; (3) Không đổi email/số điện thoại trong 24h đầu để tránh hiểu nhầm bảo hành; (4) Liên hệ support qua kênh Nhắn tin trên shop nếu lỗi đăng nhập.\n\n' +
      '• Đoạn mô tả bổ sung để kiểm tra cuộn dài — Lorem thực tế thay bằng văn bản bán hàng: Shop cam kết log minh bạch, cập nhật tồn kho ảo theo phút cho các biến thể "hot". Khi hết hàng, hệ thống tự ẩn biến thể hoặc chuyển sang "Đặt trước" tùy cấu hình seller. Mỗi lần restock, email tóm tắt gửi cho khách đã bật thông báo (nếu có).\n\n' +
      '• FAQ nhanh: Hỏi: Có hỗ trợ đổi proxy không? Đáp: Không — người mua tự cấu hình mạng. Hỏi: Acc có livestream bị cấm cờ không? Đáp: Kiểm tra mục ghi chú từng biến thể; mặc định là chưa có cờ sau 7 ngày từ thời điểm shop nhận handover.\n\n' +
      '• Kết thúc mô tả dài — anh chị scroll xuống để xem danh sách biến thể và lưu ý vàng bên dưới.',
    businessProducts: 'TIKTOK 1K FL - SHOP - CÓ VIDEO CỔ - ACC CỔ 2021 | TIKTOK >1K FL - SHOP - CÓ VIDEO - Tạo > 100 Tuần | TIKTOK 1K FL - SHOP - LIVE - kênh tháng 5 2023',
    seller: 'KingTikTok_VN', sellerInitial: 'K', stock: 99,
    price: '10,000đ - 20,000đ', originalPrice: '35,000đ', discount: 43,
    variantPrices: [10000, 15000, 20000],
    tags: ['Bảo hành 24/7', '1 đổi 1', 'Hỗ trợ Ultra'],
    extraTags: ['Đã ngâm'],
    isSponsored: true, hasKhongTrung: true, isHot: true,
    viewers: 23,
    productTypeLabel: 'Tài khoản TikTok',
  },
  {
    id: 2,
    name: 'FACEBOOK VIỆT CỔ 1000-5000 BẠN BÈ TẠO 2005-2022 NHẮN TIN KẾT BẠN...',
    sellerAvatar: 'https://img.icons8.com/color/480/facebook-new.png',
    rating: 4.8, reviews: 150, sold: 2974,
    description: 'Facebook Việt cổ tạo 2005-2022, có sẵn 1000-5000 bạn bè, bao trâu chạy ads',
    businessProducts: 'FB Việt 1000 Bạn - Cổ 2018 | FB Việt 3000 Bạn - Cổ 2015 | FB Việt 5000 Bạn - Cổ 2010 - Marketplace',
    seller: 'shopbancaccu...', sellerInitial: 'S', stock: 1597,
    price: '49,999đ', originalPrice: '79,000đ', discount: 37,
    tags: ['Bảo hành 24/7', '1 đổi 1', 'Hỗ trợ Ultra'],
    extraTags: ['Ads Ngon', 'Kèm 2FA'],
    hasKhongTrung: true, isHot: true,
    viewers: 15,
    productTypeLabel: 'Tài khoản FB',
  },
  {
    id: 3,
    name: 'Tài Khoản TikTok Nhiều Quốc Gia Việt Và Ngoại Tạo 1-24 Tháng Dùng Siêu Ngon...',
    sellerAvatar: 'https://img.icons8.com/fluency/480/tiktok.png',
    rating: 4.5, reviews: 42, sold: 666,
    description: 'TikTok clone ngoại, 100 tuần tuổi. Tiền tệ EURO, USD, Bảng Anh, Hàn, Nhật',
    businessProducts: 'TikTok Việt 1-6 Tháng | TikTok Ngoại US/UK 3-12 Tháng | TikTok Hàn/Nhật Cổ > 100 Tuần',
    seller: 'viafbngon1111', sellerInitial: 'V', stock: 444,
    price: '15,000đ', originalPrice: '25,000đ', discount: 40,
    tags: ['Bảo hành 24/7', '1 đổi 1', 'Hỗ trợ Ultra'],
    extraTags: ['Đã ngâm'],
    hasKhongTrung: true,
    viewers: 8,
    productTypeLabel: 'Tài khoản TikTok',
  },
  {
    id: 4,
    name: 'NETFLIX PREMIUM 4K HD ULTRA (bảo hành 24/7) - Xem phim thả ga không lo...',
    sellerAvatar: 'https://img.icons8.com/color/480/netflix.png',
    rating: 4.9, reviews: 310, sold: 512,
    description: 'Tài khoản Netflix Premium chính chủ, xem 4K HDR, không bị out, bảo hành trọn đời',
    businessProducts: 'Netflix Premium 1 Tháng | Netflix Premium 6 Tháng | Netflix Premium 12 Tháng - 4K UHD',
    seller: 'tranhduc', sellerInitial: 'T', stock: 0,
    price: '25,000đ',
    tags: ['Bảo hành 24/7', '1 đổi 1', 'Hỗ trợ Ultra'],
    isOutOfStock: true,
    productTypeLabel: 'Tài khoản Netflix',
  },
  {
    id: 5,
    name: 'Tài khoản Telegram Ngâm Lâu - Siêu Trâu - Giá Rẻ - Chuyên Spam / Airdrop /...',
    sellerAvatar: 'https://img.icons8.com/color/480/telegram-app.png',
    rating: 4.2, reviews: 15, sold: 120,
    description: 'Telegram đã ngâm trên 6 tháng, siêu trâu. Phù hợp spam, add member, seeding',
    businessProducts: 'Telegram Ngâm 6 Tháng - VN | Telegram Ngâm 1 Năm - Ngoại | Telegram Cổ 2020 - Session String',
    seller: 'shoptaikhoan888', sellerInitial: 'S', stock: 1548,
    price: '5,500đ', originalPrice: '12,000đ', discount: 54,
    tags: ['Bảo hành 24/7', '1 đổi 1', 'Hỗ trợ Ultra'],
    hasKhongTrung: true,
    viewers: 5,
    productTypeLabel: 'Tài khoản Telegram',
  },
  {
    id: 6,
    name: 'Gmail New Random IP US/VN - Reg Tay - Bao Login All Device - Trâu Bò',
    sellerAvatar: 'https://img.icons8.com/color/480/gmail-new.png',
    rating: 4.3, reviews: 1024, sold: 15420,
    description: 'Gmail reg tay thủ công, bao login mọi thiết bị, IP sạch US/VN, trâu bò',
    businessProducts: 'Gmail US Random IP - New | Gmail VN Số Đẹp - Aged | Gmail PVA Verified - Bulk 100+',
    seller: 'mailsaigon', sellerInitial: 'M', stock: 5000,
    price: '3,500đ - 5,000đ',
    variantPrices: [3500, 4200, 5000],
    tags: ['Bảo hành 24/7', '1 đổi 1', 'Hỗ trợ Ultra'],
    extraTags: ['Trust cao'],
    viewers: 12,
    productTypeLabel: 'Tài khoản Gmail',
  },
  {
    id: 7,
    name: 'Facebook Philippin new, cổ cho ae chạy ads, spam (Có 2fa) - Bao trâu',
    sellerAvatar: 'https://img.icons8.com/fluency/480/facebook-new.png',
    rating: 4.3, reviews: 12, sold: 89,
    description: 'Facebook Philippin cổ, đã bật 2FA, bao trâu cho anh em chạy ads, spam',
    businessProducts: 'FB Philippin New 2024 - Có 2FA | FB Philippin Cổ 2020 - Ads | FB Philippin Clone - Spam Group',
    seller: 'hqvmn', sellerInitial: 'H', stock: 129,
    price: '12,000đ',
    tags: ['Bảo hành 24/7', '1 đổi 1', 'Hỗ trợ Ultra'],
    extraTags: ['Ads Ngon', 'Kèm 2FA'],
    hasKhongTrung: false,
    productTypeLabel: 'Tài khoản FB',
  },
  {
    id: 8,
    name: 'Key Windows 10/11 Pro Bản Quyền Vĩnh Viễn - Bảo Hành Trọn Đời',
    sellerAvatar: 'https://img.icons8.com/color/480/windows-11.png',
    rating: 4.9, reviews: 1250, sold: 5600,
    description: 'Key Windows 10/11 Pro retail chính hãng, kích hoạt online, bảo hành trọn đời',
    businessProducts: 'Key Win 10 Pro - Retail | Key Win 11 Pro - Retail | Office 365 - 1 Năm | Office 2021 - Vĩnh Viễn',
    seller: 'SoftKeyVN', sellerInitial: 'S', stock: 9999,
    price: '99,000đ', originalPrice: '250,000đ', discount: 60,
    tags: ['Bảo hành 24/7', '1 đổi 1', 'Hỗ trợ Ultra'],
    extraTags: ['Bản quyền', 'Bảo hành trọn đời'],
    hasKhongTrung: false, isHot: true,
    viewers: 31,
    productTypeLabel: 'Key Windows / Office',
  },
];

/** Thêm nhiều gian hàng (lặp bộ mẫu + hậu tố) để cuộn / Xem thêm */
function buildExtendedStorefrontCatalog(base: Product[]): Product[] {
  const suffixes = [' · Mở rộng', ' · Uy tín', ' · Mới về'];
  const out: Product[] = [...base];
  let nextId = 10_000;
  for (let b = 0; b < suffixes.length; b++) {
    for (const p of base) {
      nextId += 1;
      out.push({
        ...p,
        id: nextId,
        name:
          p.name.length > 56
            ? `${p.name.slice(0, 56)}…${suffixes[b]}`
            : `${p.name}${suffixes[b]}`,
        seller: b === 0 ? p.seller : `${p.seller}_${b + 1}`,
        isSponsored: false,
        isHot: b === 1 ? nextId % 2 === 0 : false,
      });
    }
  }
  return out;
}

const STOREFRONT_FULL_CATALOG: Product[] = buildExtendedStorefrontCatalog(sampleProducts);

/** Quảng cáo sidebar — badge nhỏ (kiểu thẻ sản phẩm: Bảo hành / ưu đãi). */
type SponsoredAdPromoBadge = { label: string; variant?: 'default' | 'accent' };

const sponsoredAds: {
  id: number;
  title: string;
  seller: string;
  sellerInitial: string;
  rating: number;
  reviews: number;
  sold: number;
  description: string;
  /** Danh mục kinh doanh (pipe |), hiển thị như thẻ sản phẩm «Kinh doanh: …». */
  businessLine?: string;
  promoBadges?: SponsoredAdPromoBadge[];
  price: string;
  image: string;
}[] = [
  {
    id: 1,
    title: 'Dịch vụ Tăng Like, Follow Uy Tín - Giá Rẻ Nhất Thị Trường',
    seller: 'SocialBoost_VN',
    sellerInitial: 'S',
    rating: 4.9,
    reviews: 2188,
    sold: 12_450,
    description:
      'Tăng tương tác thật — giao dịch tự động trên hệ thống, có bảo hành tụt và đội ngũ hỗ trợ xuyên suốt.',
    businessLine:
      'TIKTOK 1K FL - SHOP - CÓ VIDEO CỔ - ACC CỔ 2021 | TIKTOK >1K FL - SHOP - CÓ VIDEO - Tạo > 100 Tuần | TIKTOK 1K FL - SHOP - LIVE - kênh Live bán hàng | Like/Comment/Share Reels & TikTok tốc độ | Follow Instagram / Facebook Page | View livestream đa nền tảng',
    promoBadges: [
      { label: 'Auto 100%', variant: 'accent' },
      { label: 'Bảo hành tụt' },
      { label: 'Hỗ trợ 24/7' },
      { label: 'Gói tuần / tháng tiết kiệm' },
    ],
    price: '10,000đ - 20,000đ',
    image: '🚀',
  },
  {
    id: 2,
    title: 'Cho Thuê Tài Khoản Quảng Cáo Facebook - Bao Lên Camp Xanh',
    seller: 'AdsRentalPro',
    sellerInitial: 'A',
    rating: 5,
    reviews: 412,
    sold: 892,
    description: 'Tài khoản trust cao, tối ưu lên camp — kèm tư vấn và hỗ trợ kỹ thuật liên tục.',
    businessLine:
      'BM 50 - Camp xanh - spend ổn định | BM 350 verified - invoice đầy đủ | TK QC cá nhân / doanh nghiệp | Clone ads US / EU / VN | Pixel + Catalog tối ưu | Hỗ trợ appeal & kháng nghị policy',
    promoBadges: [
      { label: 'Trust cao', variant: 'accent' },
      { label: 'Bao lên camp' },
      { label: 'Hỗ trợ 24/24' },
      { label: 'BM 50 / 350' },
    ],
    price: '500,000đ - 1,000,000đ',
    image: '📱',
  },
  {
    id: 3,
    title: 'Gmail Google US — Random IP, đăng nhập ổn định, phù hợp ads & workspace',
    seller: 'MailVault_Global',
    sellerInitial: 'M',
    rating: 4.8,
    reviews: 6_204,
    sold: 38_900,
    description: 'Tài khoản mới tạo hoặc đã warm nhẹ — hỗ trợ đổi recovery, hướng dẫn bảo mật 2FA.',
    businessLine: 'Gmail US random IP | Gmail edu | Drive 15GB | Alias & forwarding | Khôi phục khi die trong 24h',
    promoBadges: [
      { label: 'Đăng nhập ngay', variant: 'accent' },
      { label: 'Random IP US' },
      { label: 'Hỗ trợ 2FA' },
    ],
    price: '15,000đ - 45,000đ',
    image: '📧',
  },
  {
    id: 4,
    title: 'Proxy Residential / Datacenter — băng thông cao, rotation theo yêu cầu',
    seller: 'ProxyLane_VN',
    sellerInitial: 'P',
    rating: 4.7,
    reviews: 1_089,
    sold: 5_620,
    description: 'Pool đa quốc gia, session sticky hoặc rotate mỗi request — dashboard theo dõi traffic.',
    businessLine: 'Residential US/EU/VN | Datacenter speed | SOCKS5 & HTTP | API whitelist | Trial 24h',
    promoBadges: [
      { label: 'Trial 24h', variant: 'accent' },
      { label: 'API đầy đủ' },
      { label: 'Sticky session' },
    ],
    price: '80,000đ / GB',
    image: '🌐',
  },
  {
    id: 5,
    title: 'Thiết kế Landing Page chuyển đổi — WordPress / Next, tối ưu Core Web Vitals',
    seller: 'PixelCraft_Studio',
    sellerInitial: 'C',
    rating: 5,
    reviews: 256,
    sold: 412,
    description: 'Brief rõ ràng, 2 vòng chỉnh sửa, bàn giao source và hosting checklist.',
    businessLine: 'Landing bán khóa học | Funnel lead | Tích hợp form & pixel | Dark mode | Đa ngôn ngữ',
    promoBadges: [
      { label: '2 vòng sửa', variant: 'accent' },
      { label: 'CWV tối ưu' },
    ],
    price: '2.500.000đ - 8.000.000đ',
    image: '🎨',
  },
  {
    id: 6,
    title: 'Tài khoản Netflix Premium 4K — slot gia đình, gia hạn tự động trên hệ thống',
    seller: 'StreamSlot_Pro',
    sellerInitial: 'N',
    rating: 4.6,
    reviews: 3_421,
    sold: 19_200,
    description: 'Ghép profile riêng, không chia sẻ mật khẩu — nhắc hạn qua email và ví nền tảng.',
    businessLine: 'Netflix 4K profile | Spotify family slot | YouTube Premium VN | Hỗ trợ đổi thiết bị',
    promoBadges: [
      { label: 'Gia hạn auto', variant: 'accent' },
      { label: 'Profile riêng' },
      { label: 'Không pass chung' },
    ],
    price: '65,000đ / tháng',
    image: '🎬',
  },
  {
    id: 7,
    title: 'Boost rank Liên Quân / Liên Minh — cày rank có stream, cam kết không toxic',
    seller: 'RankCarry_ESports',
    sellerInitial: 'R',
    rating: 4.9,
    reviews: 892,
    sold: 2_340,
    description: 'Đội ngũ challenger/master theo server VN — báo cáo trận, lịch linh hoạt buổi tối & cuối tuần.',
    businessLine: 'Liên Quân rank | LMHT duoQ | Valorant placement | Coaching voice | Ẩn danh tuyệt đối',
    promoBadges: [
      { label: 'Stream private', variant: 'accent' },
      { label: 'Không toxic' },
      { label: 'Hoàn tiền nếu lose streak' },
    ],
    price: '150,000đ - 2.500.000đ',
    image: '🎮',
  },
];

/** Quảng cáo tài trợ hiển thị tối đa 3 thẻ (sidebar catalog + carousel trang hub). */
const SPONSORED_ADS_DISPLAY_MAX = 3;
const sponsoredAdsDisplay = sponsoredAds.slice(0, SPONSORED_ADS_DISPLAY_MAX);

// Live purchase notifications
const liveNotifications = [
  { buyer: 'Nguyễn V***n', product: 'TikTok Triệu View', time: '30 giây trước', avatar: '🧑' },
  { buyer: 'Trần T***g', product: 'Facebook Cổ 5000 Bạn', time: '1 phút trước', avatar: '👨' },
  { buyer: 'Lê H***a', product: 'Key Windows 11 Pro', time: '2 phút trước', avatar: '👩' },
  { buyer: 'Phạm D***c', product: 'Gmail US Random IP', time: '3 phút trước', avatar: '🧑‍💻' },
  { buyer: 'Hoàng M***h', product: 'Telegram Ngâm Lâu', time: '5 phút trước', avatar: '👤' },
];

// Countdown Timer Component
const CountdownTimer = () => {
  const [time, setTime] = useState({ hours: 2, minutes: 47, seconds: 33 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5">
      {[pad(time.hours), pad(time.minutes), pad(time.seconds)].map((unit, i) => (
        <React.Fragment key={i}>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1.5 min-w-[40px] text-center">
            <span className="text-white font-bold text-lg tabular-nums">{unit}</span>
          </div>
          {i < 2 && <span className="text-white/80 font-bold text-lg animate-pulse">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

// Live notification toast
const LiveNotificationToast = () => {
  const [currentNotif, setCurrentNotif] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentNotif(prev => (prev + 1) % liveNotifications.length);
        setVisible(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, [dismissed]);

  if (dismissed) return null;

  const notif = liveNotifications[currentNotif];

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 transition-all duration-500 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 px-4 py-3 flex items-center gap-3 max-w-xs relative" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <button onClick={() => setDismissed(true)} className="absolute -top-2 -right-2 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors">
          <X size={10} />
        </button>
        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-xl flex-shrink-0">
          {notif.avatar}
        </div>
        <div>
          <p className="text-[12px] text-gray-800">
            <span className="font-bold">{notif.buyer}</span> vừa mua
          </p>
          <p className="text-[12px] font-semibold text-[#22c55e]">{notif.product}</p>
          <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
            <CheckCircle size={10} className="text-green-500" /> {notif.time}
          </p>
        </div>
      </div>
    </div>
  );
};

// Star Rating Component
const StarRating = ({ rating, size = 11 }: { rating: number; size?: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={size}
          className={star <= Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  );
};

// CSS Animations (inline style tag)
const AnimationStyles = () => (
  <style>{`
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-4px); }
    }
    @keyframes pulse-ring {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(1.4); opacity: 0; }
    }
    @keyframes slide-in-up {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes gradient-x {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    @keyframes count-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .animate-float { animation: float 3s ease-in-out infinite; }
    .animate-slide-in { animation: slide-in-up 0.4s ease-out forwards; }
    .animate-gradient { animation: gradient-x 3s ease infinite; background-size: 200% 200%; }
    .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
    .btn-buy { 
      position: relative; overflow: hidden; 
      transition: all 0.3s ease;
    }
    .btn-buy::after {
      content: ''; position: absolute; top: 50%; left: 50%;
      width: 0; height: 0; border-radius: 50%;
      background: rgba(255,255,255,0.3);
      transition: width 0.6s, height 0.6s, top 0.6s, left 0.6s;
    }
    .btn-buy:hover::after {
      width: 300px; height: 300px; top: -100px; left: -100px;
    }
    .btn-buy:hover { transform: scale(1.05); box-shadow: 0 4px 15px rgba(34,197,94,0.4); }
    .discount-badge {
      position: relative;
    }
    .discount-badge::before {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: inherit;
      background: linear-gradient(135deg, #ef4444, #f97316, #ef4444);
      background-size: 200% 200%;
      animation: gradient-x 2s ease infinite;
      z-index: -1;
    }
    .stock-warning { color: #ef4444; font-weight: 700; }
    .stock-low-pulse { animation: count-pulse 1.5s ease-in-out infinite; }
    @keyframes storefront-marquee {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }
    .storefront-marquee-track {
      display: flex;
      width: max-content;
      animation: storefront-marquee 45s linear infinite;
    }
    @keyframes header-nav-menu-in {
      from { opacity: 0; transform: translateY(-8px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .header-nav-menu-panel {
      animation: header-nav-menu-in 0.2s ease-out;
    }
  `}</style>
);

function parsePriceToVndNumber(priceStr: string): number {
  const segments = priceStr.split(/\s*-\s*/);
  const parseOne = (p: string): number => {
    const digits = p.replace(/\D/g, '');
    return digits ? parseInt(digits, 10) : 0;
  };
  if (!segments[0]) return 0;
  if (segments.length >= 2) {
    const a = parseOne(segments[0]);
    const b = parseOne(segments[1]);
    return a && b ? Math.round((a + b) / 2) : a || b;
  }
  return parseOne(segments[0]);
}

function parseCatalogFilterPriceInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = parsePriceToVndNumber(trimmed);
  return n > 0 ? n : null;
}

function getStorefrontProductPriceBounds(product: Product): { min: number; max: number } {
  const variants = product.variantPrices?.filter((v) => v > 0);
  if (variants && variants.length > 0) {
    return { min: Math.min(...variants), max: Math.max(...variants) };
  }
  const segments = product.price.split(/\s*-\s*/);
  if (segments.length >= 2) {
    const a = parsePriceToVndNumber(segments[0]);
    const b = parsePriceToVndNumber(segments[1]);
    if (a > 0 && b > 0) return { min: Math.min(a, b), max: Math.max(a, b) };
  }
  const single = parsePriceToVndNumber(product.price);
  return { min: single, max: single };
}

/** Tránh cộng ví trùng khi React Strict Mode chạy effect hai lần (hoàn tiền đơn Thất bại đã checkout). */
const storefrontRefundRecordedOrderIds = new Set<string>();
const storefrontSellerPayoutRecordedOrderIds = new Set<string>();
const storefrontSellerPartialPayoutRecordedOrderIds = new Set<string>();
const storefrontResellerPayoutRecordedOrderIds = new Set<string>();
const storefrontResellerPartialPayoutRecordedOrderIds = new Set<string>();

/** Cây gian hàng từ Admin — field dùng cho storefront (xem `docs/gian_hang.md`). */
export type StorefrontAdminGianHangTree = {
  id: string;
  name: string;
  isParent?: boolean;
  platform?: string;
  date?: string;
  description?: string;
  shortDescription?: string;
  productDetails?: string;
  storeImage?: string;
  price?: string;
  tags?: string[];
  createdAt?: number;
  /** Tên người bán storefront (form gian hàng admin) */
  sellerDisplayName?: string;
  /** Fallback tên bán hàng (demo / dữ liệu cũ); ưu tiên `sellerDisplayName` (xem `docs/tenmathang.md`). */
  createdByName?: string;
  classification?: { businessType?: string; category?: string; product?: string };
  configuration?: {
    isReseller?: boolean;
    resellerDefaultPercent?: number;
    allowPreOrder?: boolean;
  };
  /** Chỉ hiển thị storefront khi đã duyệt (Đang bán hoặc không set) */
  status?: 'Đang bán' | 'Tạm ngưng' | 'Chờ duyệt' | 'Đã hủy';
  /** Mặt hàng trong gian — cột «Tên mặt hàng» / «Đơn giá» (xem `docs/tenmathang.md`). */
  products?: Array<{
    id?: string;
    name: string;
    price?: string;
    sellerName?: string;
    active?: boolean;
    status?: 'Đang bán' | 'Tạm ngưng' | 'Chờ duyệt' | 'Đã hủy';
    /** Tồn kho mặt hàng — đồng bộ cột «Tồn» trong Quản lý gian hàng */
    stock?: number;
    sold?: number;
    warehouseItems?: Array<{ id: string; content: string; time: string }>;
  }>;
  subCategories?: StorefrontAdminGianHangTree[];
};

function storefrontMatHangStockValue(p: { stock?: number }): number {
  if (typeof p.stock !== 'number' || !Number.isFinite(p.stock)) return 0;
  return Math.max(0, Math.floor(p.stock));
}

function storefrontMatHangSoldValue(p: { sold?: number }): number {
  if (typeof p.sold !== 'number' || !Number.isFinite(p.sold)) return 0;
  return Math.max(0, Math.floor(p.sold));
}

/** Mặt hàng được tính là đang mở bán trên storefront (có tên, giá > 0, trạng thái Đang bán, không tắt). */
function isStorefrontSellableMatHang(
  p: NonNullable<StorefrontAdminGianHangTree['products']>[number]
): boolean {
  const name = (typeof p.name === 'string' ? p.name : '').trim();
  if (!name) return false;
  if (p.status !== 'Đang bán') return false;
  if (p.active === false) return false;
  return parsePriceToVndNumber(p.price || '') > 0;
}

function adminGianHangProductTypeStrip(label: string): string {
  return label.replace(/\s*\(\s*[\d.,]+\s*%?\s*\)\s*$/, '').trim();
}

function storefrontAdminGianHangTimestamp(cat: StorefrontAdminGianHangTree): number {
  if (typeof cat.createdAt === 'number' && cat.createdAt > 0) return cat.createdAt;
  const d = cat.date?.trim();
  if (!d) return 0;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(d);
  if (!m) return 0;
  return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10)).getTime();
}

function flattenStorefrontAdminGianHang(
  nodes: StorefrontAdminGianHangTree[] | undefined
): StorefrontAdminGianHangTree[] {
  if (!nodes?.length) return [];
  const out: StorefrontAdminGianHangTree[] = [];
  const walk = (list: StorefrontAdminGianHangTree[]) => {
    for (const n of list) {
      if (n.isParent) {
        if (n.subCategories?.length) walk(n.subCategories);
      } else {
        out.push(n);
        if (n.subCategories?.length) walk(n.subCategories);
      }
    }
  };
  walk(nodes);
  return out;
}

function normStorefrontSellerKey(s: string): string {
  return s.trim().toLowerCase();
}

function buildStorefrontSellerMatchKeys(
  username: string,
  displayName?: string,
  email?: string
): Set<string> {
  return new Set(
    [username, displayName, email].filter(Boolean).map((v) => normStorefrontSellerKey(v!))
  );
}

function collectGianHangIdsForSellerKeys(
  nodes: StorefrontAdminGianHangTree[] | undefined,
  keys: Set<string>
): Set<string> {
  const ids = new Set<string>();
  for (const leaf of flattenStorefrontAdminGianHang(nodes)) {
    const sk = normStorefrontSellerKey(leaf.sellerDisplayName || leaf.createdByName || '');
    if (sk && keys.has(sk)) ids.add(leaf.id);
  }
  return ids;
}

function storefrontProductMatchesSeller(
  product: Product,
  keys: Set<string>,
  gianHangIds: Set<string>
): boolean {
  if (product.adminGianHangId && gianHangIds.has(product.adminGianHangId)) return true;
  const sellerKey = normStorefrontSellerKey(product.seller || '');
  return sellerKey.length > 0 && keys.has(sellerKey);
}

function findStorefrontAdminGianHangById(
  nodes: StorefrontAdminGianHangTree[] | undefined,
  gianHangId: string
): StorefrontAdminGianHangTree | undefined {
  if (!nodes?.length) return undefined;
  for (const leaf of flattenStorefrontAdminGianHang(nodes)) {
    if (leaf.id === gianHangId) return leaf;
  }
  return undefined;
}

/** Số lượng tối đa đặt một lần cho gói dịch vụ (không giới hạn bởi kho). */
const STOREFRONT_SERVICE_MAX_QTY = 1_000_000;

function isStorefrontServiceProduct(
  product: Product,
  menuLine: 'Bán sản phẩm' | 'Dịch vụ' = 'Bán sản phẩm'
): boolean {
  if (product.storefrontBusinessType === 'Dịch vụ') return true;
  if (product.storefrontBusinessType === 'Bán sản phẩm') return false;
  return menuLine === 'Dịch vụ';
}

/** Tồn kho có thể mua — ưu tiên dữ liệu admin live, sau đó snapshot trên thẻ. */
function getDetailPurchasableStock(
  product: Product,
  selectedVariant: number,
  adminCategories?: StorefrontAdminGianHangTree[],
  menuLine: 'Bán sản phẩm' | 'Dịch vụ' = 'Bán sản phẩm'
): number {
  if (isStorefrontServiceProduct(product, menuLine)) return STOREFRONT_SERVICE_MAX_QTY;
  if (product.isOutOfStock) return 0;

  if (product.adminGianHangId && adminCategories?.length) {
    const cat = findStorefrontAdminGianHangById(adminCategories, product.adminGianHangId);
    if (cat) {
      const sellable = (cat.products ?? []).filter(isStorefrontSellableMatHang);
      if (sellable.length === 0) return 0;
      const idx = Math.min(Math.max(0, selectedVariant), sellable.length - 1);
      return storefrontMatHangStockValue(sellable[idx]);
    }
  }

  if (product.variantStocks && product.variantStocks.length > 0) {
    const idx = Math.min(Math.max(0, selectedVariant), product.variantStocks.length - 1);
    return Math.max(0, product.variantStocks[idx] ?? 0);
  }

  return Math.max(0, product.stock);
}

function storefrontStockQuantityError(qty: number, maxStock: number): string | null {
  if (maxStock <= 0) return 'Sản phẩm đã hết hàng.';
  if (qty > maxStock) {
    return `Kho chỉ còn ${maxStock.toLocaleString('vi-VN')} sản phẩm. Vui lòng giảm số lượng.`;
  }
  return null;
}

/** Tránh trùng id với `STOREFRONT_FULL_CATALOG` (mở rộng từ ~10_000). */
function adminNumericProductIdFromStringId(adminId: string): number {
  let h = 0;
  for (let i = 0; i < adminId.length; i++) {
    h = Math.imul(31, h) + adminId.charCodeAt(i) | 0;
  }
  return 7_000_000 + (Math.abs(h) % 900_000);
}

function storefrontDefaultAvatarForPlatform(platform?: string): string {
  const p = (platform || '').toLowerCase();
  if (p.includes('tiktok')) return 'https://img.icons8.com/color/480/tiktok.png';
  if (p.includes('facebook') || /\bfb\b/.test(p)) return 'https://img.icons8.com/color/480/facebook-new.png';
  if (p.includes('telegram')) return 'https://img.icons8.com/color/480/telegram-app.png';
  if (p.includes('gmail') || p.includes('mail')) return 'https://img.icons8.com/color/480/gmail-new.png';
  if (p.includes('netflix')) return 'https://img.icons8.com/color/480/netflix.png';
  if (p.includes('windows') || p.includes('office')) return 'https://img.icons8.com/color/480/windows-11.png';
  return 'https://img.icons8.com/fluency/480/shop.png';
}

function storefrontAdminGianHangToProduct(cat: StorefrontAdminGianHangTree): Product | null {
  if (cat.status && cat.status !== 'Đang bán') return null;
  const rawType = cat.classification?.product?.trim();
  if (!rawType) return null;
  const productTypeLabel = adminGianHangProductTypeStrip(rawType);
  if (!productTypeLabel) return null;

  const sellableMatHang = (cat.products ?? []).filter(isStorefrontSellableMatHang);
  if (sellableMatHang.length === 0) return null;

  const descPrimary = (cat.shortDescription || cat.description || '').trim();
  /** Tên người bán: khớp header admin — sellerDisplayName → sellerName mặt hàng → createdByName (legacy) → tên gian (xem `docs/tenmathang.md`). */
  const sellerExplicit = (cat.sellerDisplayName || '').trim();
  const sellerFromMatHang = cat.products
    ?.map(p => (typeof p.sellerName === 'string' ? p.sellerName.trim() : ''))
    .find(s => s.length > 0);
  const sellerLegacy = (cat.createdByName || '').trim();
  const shopTitle = (cat.name || '').trim();
  const sellerRaw =
    sellerExplicit ||
    sellerFromMatHang ||
    sellerLegacy ||
    shopTitle ||
    'Gian hàng';
  const seller = sellerRaw.length > 96 ? `${sellerRaw.slice(0, 96)}…` : sellerRaw;
  const sellerInitial = (seller.charAt(0) || 'G').toUpperCase();

  const pd = cat.productDetails?.trim();
  /** Dòng «Kinh doanh: …» — chỉ mặt hàng đang mở bán có giá. */
  const matHangList = sellableMatHang
    .map(p => (typeof p.name === 'string' ? p.name.trim() : ''))
    .filter(Boolean);
  const businessProducts =
    matHangList.length > 0 ? matHangList.slice(0, 16).join(' | ') : undefined;

  const sellableSlice = sellableMatHang.slice(0, 16);
  const variantPrices = sellableSlice
    .map(p => parsePriceToVndNumber(p.price || ''))
    .filter(v => v > 0);
  const variantStocks = sellableSlice.map(p => storefrontMatHangStockValue(p));
  const minUnitVnd = variantPrices.length > 0 ? Math.min(...variantPrices) : 0;
  if (minUnitVnd <= 0) return null;
  const price = formatVnd(minUnitVnd);

  const longBody = [cat.productDetails, cat.description].filter(Boolean).join('\n\n').trim();
  const longDescription = longBody || descPrimary || undefined;

  const rawBt = cat.classification?.businessType?.trim();
  const storefrontBusinessType: 'Bán sản phẩm' | 'Dịch vụ' | undefined =
    rawBt === 'Dịch vụ' ? 'Dịch vụ' : rawBt === 'Bán sản phẩm' ? 'Bán sản phẩm' : undefined;

  const isServiceGianHang = storefrontBusinessType === 'Dịch vụ';
  const resellerPercent = getGianHangResellerPercent(cat as Category);

  /** Tổng tồn / đã bán các mặt hàng đang mở bán — khớp bảng admin */
  const totalStock = isServiceGianHang
    ? sellableMatHang.length
    : sellableMatHang.reduce((sum, p) => sum + storefrontMatHangStockValue(p), 0);
  const totalSold = sellableMatHang.reduce((sum, p) => sum + storefrontMatHangSoldValue(p), 0);
  const variantStocksForCard = isServiceGianHang
    ? sellableSlice.map(() => STOREFRONT_SERVICE_MAX_QTY)
    : sellableSlice.map(p => storefrontMatHangStockValue(p));

  return {
    id: adminNumericProductIdFromStringId(cat.id),
    adminGianHangId: cat.id,
    name: cat.name,
    sellerAvatar: cat.storeImage?.trim() || storefrontDefaultAvatarForPlatform(cat.platform),
    rating: 5,
    reviews: 0,
    sold: totalSold,
    description: descPrimary ? (descPrimary.length > 160 ? `${descPrimary.slice(0, 160)}…` : descPrimary) : cat.name,
    longDescription,
    seller,
    sellerInitial,
    stock: totalStock,
    isOutOfStock: isServiceGianHang ? false : totalStock <= 0,
    price,
    tags: cat.tags?.length ? [...cat.tags] : ['Gian hàng mới', 'Uy tín'],
    hasKhongTrung: cat.configuration ? !cat.configuration.isReseller : true,
    isHot: true,
    productTypeLabel,
    businessProducts,
    variantPrices,
    variantStocks: variantStocksForCard.length > 0 ? variantStocksForCard : undefined,
    storefrontCreatedAt: storefrontAdminGianHangTimestamp(cat),
    storefrontBusinessType,
    allowPreOrder: isServiceGianHang ? false : cat.configuration?.allowPreOrder === true,
    platformFeePercent: resolvePlatformFeePercentFromProductTypeLabel(rawType),
    storefrontResellerEnabled: resellerPercent != null,
    storefrontResellerPercent: resellerPercent ?? undefined,
  };
}

function formatVnd(n: number): string {
  return `${n.toLocaleString('vi-VN')}đ`;
}

/** Nhãn tồn kho trên thẻ catalog */
function StorefrontStockBadge({
  stock,
  isOutOfStock,
  isService,
}: {
  stock: number;
  isOutOfStock?: boolean;
  isService?: boolean;
}) {
  if (isService) {
    return (
      <span className="text-[13px] font-semibold text-violet-700 shrink-0" title="Gói dịch vụ">
        Đặt hàng ngay
      </span>
    );
  }
  if (isOutOfStock || stock <= 0) {
    return (
      <span className="text-[13px] font-semibold text-red-600 shrink-0" title="Hết hàng">
        Hết hàng
      </span>
    );
  }

  const lowStock = stock < 100;

  return (
    <span
      className="inline-flex items-baseline gap-1 text-[13px] tabular-nums shrink-0"
      title={lowStock ? 'Tồn kho thấp' : 'Còn hàng'}
    >
      <span className="font-medium text-gray-500">Tồn kho</span>
      <span
        className={`font-bold ${
          lowStock ? 'text-orange-600 stock-low-pulse' : 'text-[#22c55e]'
        }`}
      >
        {stock.toLocaleString('vi-VN')}
      </span>
    </span>
  );
}

function getDetailUnitPriceVnd(product: Product, selectedVariant: number): number {
  if (product.variantPrices && product.variantPrices.length > 0) {
    const idx = Math.min(Math.max(0, selectedVariant), product.variantPrices.length - 1);
    const p = product.variantPrices[idx];
    if (p != null && p > 0) return p;
  }
  return parsePriceToVndNumber(product.price);
}

/** Nhãn biến thể trang chi tiết: có `businessProducts` → tách ` | `; gian admin không có mặt hàng → `[]` (không dùng `product.name` làm mặt hàng giả). */
function storefrontMatHangVariantLabels(product: Product): string[] {
  const bp = product.businessProducts?.trim();
  if (bp) return bp.split(' | ').map(s => s.trim()).filter(Boolean);
  if (product.adminGianHangId) return [];
  return [product.name];
}

function formatPurchaseDateNow(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function generateUniqueOrderId(existing: Order[]): string {
  const maxKey = existing.reduce((max, o) => Math.max(max, orderIdSortKey(o.id)), 0);
  let next = maxKey + 1;
  let id = `ORD-${next}`;
  while (existing.some(o => o.id === id)) {
    next += 1;
    id = `ORD-${next}`;
  }
  return id;
}

/** Mã đơn thanh toán storefront: `GD-` + đúng 6 chữ số (ví dụ GD-343232). */
function generateUniqueGdOrderIdSixDigit(existing: Order[]): string {
  const taken = new Set(existing.map(o => o.id));
  let maxNum = 0;
  for (const o of existing) {
    const m = /^GD-(\d{6})$/.exec(o.id);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n)) maxNum = Math.max(maxNum, n);
    }
  }
  for (let n = maxNum + 1; n <= 999999; n++) {
    const id = `GD-${String(n).padStart(6, '0')}`;
    if (!taken.has(id)) return id;
  }
  for (let i = 0; i < 500; i++) {
    const n = Math.floor(Math.random() * 1_000_000);
    const id = `GD-${String(n).padStart(6, '0')}`;
    if (!taken.has(id)) return id;
  }
  for (let n = 0; n < 1_000_000; n++) {
    const id = `GD-${String(n).padStart(6, '0')}`;
    if (!taken.has(id)) return id;
  }
  return 'GD-000000';
}

/** Đồng bộ admin Lịch sử giao dịch khi thanh toán storefront (skill thanh-toan). */
function buildAdminPaymentHistoryFromCheckout(p: {
  orderId: string;
  amountVnd: number;
  purchaseDate: string;
  balanceBeforeVnd: number;
  balanceAfterVnd: number;
  sellerName: string;
  buyerLogin: string;
  buyerDisplayName: string;
}): PaymentHistory {
  const amt = p.amountVnd.toLocaleString('vi-VN');
  const b0 = p.balanceBeforeVnd.toLocaleString('vi-VN');
  const b1 = p.balanceAfterVnd.toLocaleString('vi-VN');
  return {
    id: p.orderId,
    userId: p.buyerLogin,
    name: p.buyerDisplayName,
    amount: `-${amt} đ`,
    type: 'Mua hàng',
    status: 'Thành công',
    time: p.purchaseDate,
    reason: `Thanh toán cho đơn hàng ${p.orderId}`,
    balanceBefore: `${b0} đ`,
    balanceAfter: `${b1} đ`,
    calculation: `${b0} - ${amt} = ${b1} đ`,
    sellerName: p.sellerName,
  };
}

// Product Detail View Component (Full Page)
const ProductDetailView = ({
  product,
  buyerName,
  walletBalanceVnd,
  setWalletBalanceVnd,
  setAllOrders,
  allOrders = [],
  onAfterPaymentSuccess,
  onAfterPreOrderSuccess,
  onCheckoutPaid,
  onFulfillPurchase,
  onOpenMessages,
  onOpenSellerProfile = () => {},
  storefrontMenuLine,
  storefrontAdminGianHangCategories,
  resellerRequests = [],
  onResellerRequestsChange,
  storefrontLoggedIn = true,
  storefrontBuyerEmail = '',
  resellerReferrer = null,
  storefrontAccountMode = 'buyer',
  onRequireLogin,
  isFavorited = false,
  onToggleFavorite,
}: {
  product: Product;
  buyerName: string;
  walletBalanceVnd: number;
  setWalletBalanceVnd: React.Dispatch<React.SetStateAction<number>>;
  setAllOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  /** Đơn toàn hệ thống — đồng bộ tab Reviews với đánh giá từ đơn đã mua. */
  allOrders?: Order[];
  onAfterPaymentSuccess: (orderId: string) => void;
  /** Sau gửi đặt trước thành công — chuyển sang Đơn hàng đã mua. */
  onAfterPreOrderSuccess?: (orderId: string) => void;
  /** Trừ kho seller và lấy dòng sản phẩm giao cho người mua. */
  onFulfillPurchase?: (
    adminGianHangId: string,
    variantIndex: number,
    quantity: number
  ) => FulfillPurchaseResult;
  /** Mở trang nhắn tin với người bán của sản phẩm. */
  onOpenMessages?: () => void;
  /** Xem hồ sơ công khai người bán. */
  onOpenSellerProfile?: (sellerName: string) => void;
  /** Menu header SP/DV — dùng khi sản phẩm không có `storefrontBusinessType` từ gian admin. */
  storefrontMenuLine: 'Bán sản phẩm' | 'Dịch vụ';
  storefrontAdminGianHangCategories?: StorefrontAdminGianHangTree[];
  /** Ghi lịch sử giao dịch (mã đơn + số tiền thanh toán) — xem skill thanh-toan / thanh_toan.md */
  onCheckoutPaid?: (info: {
    orderId: string;
    amountVnd: number;
    purchaseDate: string;
    balanceBeforeVnd: number;
    balanceAfterVnd: number;
    sellerName: string;
  }) => void;
  resellerRequests?: ResellerRequest[];
  onResellerRequestsChange?: React.Dispatch<React.SetStateAction<ResellerRequest[]>>;
  storefrontLoggedIn?: boolean;
  storefrontBuyerEmail?: string;
  resellerReferrer?: ResellerReferrerContext | null;
  storefrontAccountMode?: StorefrontAccountMode;
  /** Khách chưa đăng nhập — mở form đăng ký / đăng nhập thay vì thanh toán. */
  onRequireLogin?: () => void;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'api'>('description');
  /** Chuỗi để cho phép xóa hết rồi nhập số mới (không bị kẹt ở 1 như input number ép ngay) */
  const [quantityInput, setQuantityInput] = useState('1');
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCodeRow | null>(null);
  const [discountCodeHint, setDiscountCodeHint] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isResellerOpen, setIsResellerOpen] = useState(false);
  const [isPreOrderOpen, setIsPreOrderOpen] = useState(false);
  const [isPreOrderStockNoticeOpen, setIsPreOrderStockNoticeOpen] = useState(false);
  const [preOrderNote, setPreOrderNote] = useState('');
  const [preOrderSubmitted, setPreOrderSubmitted] = useState(false);
  const [preOrderCreatedId, setPreOrderCreatedId] = useState<string | null>(null);
  const [preOrderError, setPreOrderError] = useState<string | null>(null);
  const [deliveryDeadlineDaysInput, setDeliveryDeadlineDaysInput] = useState(
    String(DELIVERY_DEADLINE_DAYS_DEFAULT)
  );
  const deliveryDeadlineDays = parseDeliveryDeadlineDaysInput(deliveryDeadlineDaysInput);
  const effectiveResellerReferrer = useMemo(
    () =>
      resolveResellerReferrerForBuyerCheckout({
        storedReferrer: resellerReferrer,
        gianHangId: product.adminGianHangId,
        buyerEmail: storefrontBuyerEmail,
        isBuyerAccountMode: isStorefrontBuyerAccountMode(storefrontAccountMode),
      }),
    [
      resellerReferrer,
      product.adminGianHangId,
      storefrontBuyerEmail,
      storefrontAccountMode,
    ]
  );
  const [resellerTab, setResellerTab] = useState<'reseller' | 'quick-sell'>('reseller');
  const [resellerDiscount, setResellerDiscount] = useState('');
  const [resellerDiscountError, setResellerDiscountError] = useState<string | null>(null);
  const [resellerMessage, setResellerMessage] = useState('');
  const [quickSellRate, setQuickSellRate] = useState('');
  const [quickSellResult, setQuickSellResult] = useState<{ link: string; rate: number } | null>(null);
  const [quickSellLinkCopied, setQuickSellLinkCopied] = useState(false);
  const [resellerLinkCopied, setResellerLinkCopied] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [serviceRequestNote, setServiceRequestNote] = useState('');
  const [purchaseFlow, setPurchaseFlow] = useState<'idle' | 'processing' | 'success'>('idle');
  const [paymentSuccessOrder, setPaymentSuccessOrder] = useState<Order | null>(null);
  const isPurchaseBusy = purchaseFlow !== 'idle';

  const isServiceProduct = isStorefrontServiceProduct(product, storefrontMenuLine);
  const matHangVariantLabels = storefrontMatHangVariantLabels(product);
  const storefrontNoMatHang =
    Boolean(product.adminGianHangId) && matHangVariantLabels.length === 0;

  useEffect(() => {
    setSelectedVariant(0);
    setQuantityInput('1');
    setCheckoutError(null);
    setServiceRequestNote('');
    setDeliveryDeadlineDaysInput(String(DELIVERY_DEADLINE_DAYS_DEFAULT));
  }, [product.id]);

  const maxPurchasableStock = useMemo(
    () =>
      getDetailPurchasableStock(
        product,
        selectedVariant,
        storefrontAdminGianHangCategories,
        storefrontMenuLine
      ),
    [product, selectedVariant, storefrontAdminGianHangCategories, storefrontMenuLine]
  );

  useEffect(() => {
    setQuantityInput(prev => {
      const n = prev === '' ? 1 : parseInt(prev, 10);
      const parsed = isNaN(n) || n < 1 ? 1 : n;
      if (maxPurchasableStock <= 0) return '1';
      if (parsed > maxPurchasableStock) return String(maxPurchasableStock);
      return prev === '' ? prev : String(parsed);
    });
  }, [maxPurchasableStock, selectedVariant]);

  const quantity = useMemo(() => {
    if (quantityInput === '') return 1;
    const n = parseInt(quantityInput, 10);
    if (isNaN(n)) return 1;
    return Math.max(1, n);
  }, [quantityInput]);

  const checkoutSummary = useMemo(() => {
    const v = storefrontMatHangVariantLabels(product);
    const tenMatHang =
      v.length > 0
        ? (v[Math.min(Math.max(0, selectedVariant), v.length - 1)] ?? v[0]!)
        : product.adminGianHangId
          ? 'Chưa có mặt hàng'
          : product.name;
    const qty = quantity;
    const unitSale = getDetailUnitPriceVnd(product, selectedVariant);
    const unitOrig = product.originalPrice ? parsePriceToVndNumber(product.originalPrice) : null;
    const saleTotal = unitSale * qty;
    let listTotal = (unitOrig && unitOrig > unitSale ? unitOrig : unitSale) * qty;
    let promoOff = Math.max(0, listTotal - saleTotal);
    if ((!unitOrig || unitOrig <= unitSale) && product.discount && product.discount > 0 && product.discount < 100) {
      listTotal = Math.round((saleTotal * 100) / (100 - product.discount));
      promoOff = Math.max(0, listTotal - saleTotal);
    }
    const codeOff = appliedDiscount ? computeDiscountCodeOffVnd(saleTotal, appliedDiscount) : 0;
    const tongGiamGia = promoOff + codeOff;
    const tongThanhToan = Math.max(0, saleTotal - codeOff);
    return {
      tenMatHang,
      qty,
      tongTien: listTotal,
      giamGia: tongGiamGia,
      tongThanhToan,
      saleTotal,
      codeOff,
      promoOff,
      appliedDiscountCode: appliedDiscount?.code,
    };
  }, [product, quantity, selectedVariant, appliedDiscount]);

  const clampQuantityInput = () => {
    setQuantityInput(prev => {
      if (maxPurchasableStock <= 0) return '1';
      if (prev === '' || parseInt(prev, 10) < 1 || isNaN(parseInt(prev, 10))) return '1';
      const n = parseInt(prev, 10);
      return String(Math.min(Math.max(1, n), maxPurchasableStock));
    });
  };

  const parsedQuantity =
    quantityInput === ''
      ? 1
      : Math.max(1, parseInt(quantityInput, 10) || 1);

  const applyQuantityDelta = (delta: number) => {
    const q = parsedQuantity;
    if (delta > 0 && maxPurchasableStock > 0 && q >= maxPurchasableStock) {
      setCheckoutError(storefrontStockQuantityError(maxPurchasableStock + 1, maxPurchasableStock));
      return;
    }
    const next = q + delta;
    if (delta > 0 && maxPurchasableStock > 0 && next > maxPurchasableStock) {
      setQuantityInput(String(maxPurchasableStock));
      setCheckoutError(storefrontStockQuantityError(next, maxPurchasableStock));
      return;
    }
    const capped =
      maxPurchasableStock > 0 ? Math.min(next, maxPurchasableStock) : Math.max(1, next);
    setQuantityInput(String(Math.max(1, capped)));
    setCheckoutError(storefrontStockQuantityError(capped, maxPurchasableStock));
  };

  const complaintRate = (Math.random() * 0.5).toFixed(1);

  const resellerPercent = useMemo(() => {
    if (product.storefrontResellerEnabled !== true) return null;
    if (
      typeof product.storefrontResellerPercent === 'number' &&
      Number.isFinite(product.storefrontResellerPercent)
    ) {
      return product.storefrontResellerPercent;
    }
    if (product.adminGianHangId && storefrontAdminGianHangCategories?.length) {
      const cat = findStorefrontAdminGianHangById(
        storefrontAdminGianHangCategories,
        product.adminGianHangId
      );
      if (cat) return getGianHangResellerPercent(cat as Category);
    }
    return null;
  }, [product, storefrontAdminGianHangCategories]);

  const showResellerActions = resellerPercent != null;

  const gianHangId = product.adminGianHangId ?? '';

  const gianHangDisplayName = useMemo(() => {
    if (!product.adminGianHangId || !storefrontAdminGianHangCategories?.length) {
      return product.name;
    }
    const cat = findStorefrontAdminGianHangById(
      storefrontAdminGianHangCategories,
      product.adminGianHangId
    );
    return cat?.name?.trim() || product.name;
  }, [product.adminGianHangId, product.name, storefrontAdminGianHangCategories]);

  const gianHangCatalogReviews = useMemo(() => {
    if (!product.adminGianHangId?.trim()) return [];
    return buildCatalogReviewsForGianHang(allOrders, product.adminGianHangId);
  }, [allOrders, product.adminGianHangId]);

  const gianHangCatalogRating = useMemo(
    () =>
      computeCatalogRatingStats(gianHangCatalogReviews, product.rating, product.reviews),
    [gianHangCatalogReviews, product.rating, product.reviews]
  );

  const applyDiscountCode = () => {
    const result = validateDiscountCodeForCheckout(discountCode, gianHangDisplayName);
    if (!result.ok) {
      setAppliedDiscount(null);
      setDiscountCodeHint(result.message);
      return;
    }
    setAppliedDiscount(result.row);
    setDiscountCodeHint(formatAppliedDiscountLabel(result.row));
  };

  const clearAppliedDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCodeHint(null);
  };

  const ensureDiscountBeforeCheckout = (): boolean => {
    if (!discountCode.trim()) return true;
    if (appliedDiscount) return true;
    const result = validateDiscountCodeForCheckout(discountCode, gianHangDisplayName);
    if (!result.ok) {
      setCheckoutError(result.message);
      return false;
    }
    setAppliedDiscount(result.row);
    setDiscountCodeHint(formatAppliedDiscountLabel(result.row));
    return true;
  };

  const consumeAppliedDiscountIfAny = () => {
    if (!appliedDiscount?.id) return;
    incrementDiscountCodeUsage(appliedDiscount.id);
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountCodeHint(null);
  };
  const gianHangName = useMemo(() => {
    if (!gianHangId || !storefrontAdminGianHangCategories?.length) return product.name;
    const cat = findStorefrontAdminGianHangById(storefrontAdminGianHangCategories, gianHangId);
    return cat?.name ?? product.name;
  }, [gianHangId, product.name, storefrontAdminGianHangCategories]);

  const resellerShopDefaultPercent = useMemo(() => {
    if (resellerPercent == null || !gianHangId) return null;
    return getResellerShopDefaultPercent(resellerRequests, gianHangId, resellerPercent);
  }, [resellerPercent, gianHangId, resellerRequests]);

  const effectiveResellerPercent = useMemo(() => {
    if (resellerShopDefaultPercent == null) return null;
    if (!storefrontBuyerEmail.trim()) return resellerShopDefaultPercent;
    return getResellerEffectivePercentForBuyer(
      resellerRequests,
      storefrontBuyerEmail,
      gianHangId,
      resellerShopDefaultPercent
    );
  }, [resellerShopDefaultPercent, resellerRequests, storefrontBuyerEmail, gianHangId]);

  const resellerMinPercent = useMemo(() => {
    if (!showResellerActions || resellerShopDefaultPercent == null || !gianHangId) return null;
    return getResellerMinimumNextPercent(
      resellerRequests,
      storefrontBuyerEmail,
      gianHangId,
      resellerShopDefaultPercent
    );
  }, [
    showResellerActions,
    resellerShopDefaultPercent,
    gianHangId,
    resellerRequests,
    storefrontBuyerEmail,
  ]);

  const pendingResellerRequest = useMemo(() => {
    if (!gianHangId || !storefrontBuyerEmail.trim()) return undefined;
    return findPendingResellerRequest(resellerRequests, storefrontBuyerEmail, gianHangId);
  }, [resellerRequests, storefrontBuyerEmail, gianHangId]);

  const approvedResellerPercent = useMemo(() => {
    if (!gianHangId || !storefrontBuyerEmail.trim() || resellerShopDefaultPercent == null) return null;
    return getResellerApprovedPercent(
      resellerRequests,
      storefrontBuyerEmail,
      gianHangId,
      resellerShopDefaultPercent
    );
  }, [resellerRequests, storefrontBuyerEmail, gianHangId, resellerShopDefaultPercent]);

  const syncResellerDiscountError = (raw: string) => {
    if (!raw.trim()) {
      setResellerDiscountError(null);
      return;
    }
    if (resellerMinPercent == null) {
      setResellerDiscountError(null);
      return;
    }
    const check = validateResellerRequestedPercent(raw, resellerMinPercent);
    setResellerDiscountError(check.ok ? null : check.message);
  };

  useEffect(() => {
    if (resellerDiscount.trim()) syncResellerDiscountError(resellerDiscount);
  }, [resellerMinPercent, resellerDiscount]);

  const handleSubmitResellerRequest = () => {
    if (!showResellerActions || resellerShopDefaultPercent == null || !gianHangId) return;
    if (!storefrontLoggedIn || !storefrontBuyerEmail.trim()) {
      window.alert('Vui lòng đăng nhập để gửi yêu cầu Reseller.');
      return;
    }
    if (resellerMinPercent == null) return;
    const check = validateResellerRequestedPercent(resellerDiscount, resellerMinPercent);
    if (!check.ok) {
      setResellerDiscountError(check.message);
      window.alert(check.message);
      return;
    }
    const result = submitResellerRequest(resellerRequests, {
      gianHangId,
      gianHangName,
      productId: String(product.id),
      productName: product.name,
      requesterEmail: storefrontBuyerEmail,
      requesterName: buyerName,
      gianDefaultPercent: resellerShopDefaultPercent,
      requestedPercent: check.value,
      message: resellerMessage,
    });
    if (!result.ok) {
      window.alert(result.message);
      return;
    }
    onResellerRequestsChange?.(result.requests);
    window.alert(
      result.updated
        ? `Đã cập nhật yêu cầu lên ${requested}% — chờ shop duyệt.`
        : `Đã gửi yêu cầu ${requested}% — chờ shop duyệt trong Quản lý Reseller.`
    );
    setResellerDiscount('');
    setResellerDiscountError(null);
    setResellerMessage('');
  };

  const closePurchaseFlow = () => {
    setPurchaseFlow('idle');
    setPaymentSuccessOrder(null);
  };

  const requireLoginForPurchase = () => {
    if (storefrontLoggedIn) return false;
    onRequireLogin?.();
    return true;
  };

  const goToBuyerWarehouse = (orderId: string) => {
    closePurchaseFlow();
    onAfterPaymentSuccess(orderId);
  };

  /** Chỉ đặt trước khi hết tồn kho mua ngay (theo biến thể đang chọn). */
  const canSubmitPreOrder =
    !storefrontNoMatHang && maxPurchasableStock <= 0;

  const handlePreOrderSubmit = () => {
    if (!canSubmitPreOrder) return;
    if (!ensureDiscountBeforeCheckout()) return;
    const unitSale = getDetailUnitPriceVnd(product, selectedVariant);
    const amount = checkoutSummary.tongThanhToan;
    if (walletBalanceVnd < amount) {
      setPreOrderError('Số dư không đủ để thanh toán đặt trước.');
      return;
    }
    setPreOrderError(null);
    const purchaseDate = formatPurchaseDateNow();
    const discAmount = checkoutSummary.promoOff + checkoutSummary.codeOff;
    let createdId: string | null = null;
    setAllOrders(prev => {
      const newId = generateUniqueGdOrderIdSixDigit(prev);
      createdId = newId;
      const cat = product.name.length > 120 ? `${product.name.slice(0, 120)}…` : product.name;
      const note = preOrderNote.trim();
      const newOrder: Order = {
        id: newId,
        purchaseDate,
        sellerName: product.seller,
        categoryName: cat,
        productName: checkoutSummary.tenMatHang,
        buyerName,
        quantity: checkoutSummary.qty,
        unitPrice: formatVnd(unitSale),
        discount: discAmount > 0 ? formatVnd(discAmount) : '0đ',
        totalAmount: formatVnd(amount),
        refund: '0đ',
        /** Thanh toán ngay — sàn tạm giữ tiền cho đến khi seller giao từ kho. */
        status: 'Tạm giữ tiền',
        order_type: 'product',
        isPreOrder: true,
        preOrderNote: note || undefined,
        preOrderVariantIndex: selectedVariant,
        deliveryDeadlineDays,
        checkoutPaid: true,
        createdAtMs: Date.now(),
        escrowHoldStartedAtMs: Date.now(),
        adminGianHangId: product.adminGianHangId,
        content: note
          ? `Đặt trước · ${formatVnd(amount)} · ${note}`
          : `Đặt trước · ${formatVnd(amount)}`,
        ...buildPlatformFeeFieldsForCheckout(
          amount,
          product.platformFeePercent ??
            resolvePlatformFeePercentFromProductTypeLabel(product.productTypeLabel || '')
        ),
        ...buildResellerFeeFieldsForBuyerCheckout({
          totalVnd: amount,
          buyerEmail: storefrontBuyerEmail,
          gianHangId: product.adminGianHangId,
          gianResellerPercent: resellerPercent,
          referrer: effectiveResellerReferrer,
          isBuyerAccountMode: isStorefrontBuyerAccountMode(storefrontAccountMode),
          requests: resellerRequests,
        }),
      };
      return [newOrder, ...prev];
    });
    if (createdId) {
      setWalletBalanceVnd(w => w - amount);
      consumeAppliedDiscountIfAny();
      onCheckoutPaid?.({
        orderId: createdId,
        amountVnd: amount,
        purchaseDate,
        balanceBeforeVnd: walletBalanceVnd,
        balanceAfterVnd: walletBalanceVnd - amount,
        sellerName: product.seller,
      });
      setPreOrderCreatedId(createdId);
      setPreOrderSubmitted(true);
    }
  };

  const closePreOrderFlow = (navigateToOrders: boolean) => {
    const orderId = preOrderCreatedId;
    setIsPreOrderOpen(false);
    setPreOrderSubmitted(false);
    setPreOrderNote('');
    setPreOrderCreatedId(null);
    if (navigateToOrders && orderId) {
      onAfterPreOrderSuccess?.(orderId);
    }
  };

  const handleCheckoutPay = async () => {
    if (isPurchaseBusy || storefrontNoMatHang) return;
    if (!ensureDiscountBeforeCheckout()) return;
    if (isServiceProduct) {
      const note = serviceRequestNote.trim();
      if (note.length < 10) {
        setCheckoutError('Vui lòng nhập nội dung yêu cầu (ít nhất 10 ký tự): link, UID, số lượng like…');
        return;
      }
      if (note.length > 2000) {
        setCheckoutError('Nội dung yêu cầu tối đa 2000 ký tự.');
        return;
      }
    }
    if (!isServiceProduct && product.isOutOfStock) return;
    const liveMaxStock = getDetailPurchasableStock(
      product,
      selectedVariant,
      storefrontAdminGianHangCategories,
      storefrontMenuLine
    );
    if (!isServiceProduct) {
      const stockErr = storefrontStockQuantityError(checkoutSummary.qty, liveMaxStock);
      if (stockErr) {
        setCheckoutError(stockErr);
        return;
      }
    }
    const amount = checkoutSummary.tongThanhToan;
    if (walletBalanceVnd < amount) {
      setCheckoutError('Số dư không đủ để thanh toán.');
      return;
    }
    setCheckoutError(null);
    setIsCheckoutOpen(false);
    setPurchaseFlow('processing');

    const checkoutOrderType: 'product' | 'service' =
      product.storefrontBusinessType === 'Dịch vụ'
        ? 'service'
        : product.storefrontBusinessType === 'Bán sản phẩm'
          ? 'product'
          : storefrontMenuLine === 'Dịch vụ'
            ? 'service'
            : 'product';

    const minProcessingMs = 1400;
    const startedAt = Date.now();

    let deliveredItems: DeliveredWarehouseItem[] | undefined;
    let adminMatHangId: string | undefined;
    if (product.adminGianHangId && checkoutOrderType !== 'service') {
      if (!onFulfillPurchase) {
        setPurchaseFlow('idle');
        setCheckoutError('Không thể giao hàng từ kho. Vui lòng thử lại sau.');
        return;
      }
      const fulfillment = onFulfillPurchase(
        product.adminGianHangId,
        selectedVariant,
        checkoutSummary.qty
      );
      if (!fulfillment.ok) {
        setPurchaseFlow('idle');
        setCheckoutError(fulfillment.message);
        return;
      }
      deliveredItems = fulfillment.items.map(i => ({
        id: i.id,
        content: i.content,
        time: i.time,
      }));
      adminMatHangId = fulfillment.matHangId;
    }

    const elapsed = Date.now() - startedAt;
    if (elapsed < minProcessingMs) {
      await new Promise(r => setTimeout(r, minProcessingMs - elapsed));
    }

    const unitSale = getDetailUnitPriceVnd(product, selectedVariant);
    const discAmount = checkoutSummary.promoOff + checkoutSummary.codeOff;
    const purchaseDate = formatPurchaseDateNow();
    const serviceOrderContent = serviceRequestNote.trim();
    let createdOrderForSuccess: Order | null = null;
    let newOrderIdForHistory: string | null = null;
    setAllOrders(prev => {
      const newId = generateUniqueGdOrderIdSixDigit(prev);
      newOrderIdForHistory = newId;
      const cat = product.name.length > 120 ? `${product.name.slice(0, 120)}…` : product.name;
      const now = Date.now();
      const newOrder: Order = {
        id: newId,
        purchaseDate,
        sellerName: product.seller,
        categoryName: cat,
        productName: checkoutSummary.tenMatHang,
        buyerName,
        quantity: checkoutSummary.qty,
        unitPrice: formatVnd(unitSale),
        discount: discAmount > 0 ? formatVnd(discAmount) : '0đ',
        totalAmount: formatVnd(amount),
        refund: '0đ',
        /**
         * SP: Tạm giữ tiền + giao kho ngay.
         * DV: Chờ xác nhận — seller thực hiện (tăng like, …) rồi giao nội dung.
         */
        status: checkoutOrderType === 'service' ? 'Chờ xác nhận' : 'Tạm giữ tiền',
        order_type: checkoutOrderType,
        checkoutPaid: true,
        createdAtMs: now,
        ...(checkoutOrderType !== 'service' ? { escrowHoldStartedAtMs: now } : {}),
        deliveredItems,
        adminMatHangId,
        adminGianHangId: product.adminGianHangId,
        content: checkoutOrderType === 'service' ? serviceOrderContent : undefined,
        deliveryDeadlineDays,
        ...buildPlatformFeeFieldsForCheckout(
          amount,
          product.platformFeePercent ??
            resolvePlatformFeePercentFromProductTypeLabel(product.productTypeLabel || '')
        ),
        ...buildResellerFeeFieldsForBuyerCheckout({
          totalVnd: amount,
          buyerEmail: storefrontBuyerEmail,
          gianHangId: product.adminGianHangId,
          gianResellerPercent: resellerPercent,
          referrer: effectiveResellerReferrer,
          isBuyerAccountMode: isStorefrontBuyerAccountMode(storefrontAccountMode),
          requests: resellerRequests,
        }),
      };
      createdOrderForSuccess = newOrder;
      return [newOrder, ...prev];
    });
    if (
      createdOrderForSuccess?.deliveredItems?.length &&
      createdOrderForSuccess.adminMatHangId
    ) {
      appendSellerSoldWarehouseEntries(
        createdOrderForSuccess.adminMatHangId,
        createdOrderForSuccess.id,
        createdOrderForSuccess.deliveredItems,
        createdOrderForSuccess.buyerName
      );
    }
    setWalletBalanceVnd(w => w - amount);
    consumeAppliedDiscountIfAny();
    if (createdOrderForSuccess) {
      setPaymentSuccessOrder(createdOrderForSuccess);
      setPurchaseFlow('success');
    } else {
      setPurchaseFlow('idle');
    }
    if (newOrderIdForHistory) {
      onCheckoutPaid?.({
        orderId: newOrderIdForHistory,
        amountVnd: amount,
        purchaseDate,
        balanceBeforeVnd: walletBalanceVnd,
        balanceAfterVnd: walletBalanceVnd - amount,
        sellerName: product.seller,
      });
    }
  };

  return (
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm">
          <div className="flex flex-col lg:flex-row">
          {/* Left: Product Image */}
          <div className="lg:w-[420px] flex-shrink-0 relative bg-gray-50 p-4">
            <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
              {/* Badges on image */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                {product.hasKhongTrung && (
                  <span className="text-[10px] bg-cyan-500 text-white px-2.5 py-1 rounded font-bold uppercase tracking-wide">
                    Không Trùng
                  </span>
                )}
                <span className="text-[10px] bg-emerald-700 text-white px-2.5 py-1 rounded font-bold uppercase tracking-wide shadow-sm ring-1 ring-emerald-600/40">
                  Kho TapHoaMMO
                </span>
              </div>
              {/* Favorite button */}
              <StorefrontFavoriteHeartButton
                active={isFavorited}
                onToggle={(e) => {
                  e.stopPropagation();
                  onToggleFavorite?.();
                }}
                className="absolute top-3 right-3 z-10"
              />
              <img
                src={product.sellerAvatar}
                alt={product.name}
                className="w-full aspect-square object-cover"
              />
              {/* Out of stock overlay */}
              {product.isOutOfStock && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full">Hết hàng</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[70vh]">
            {/* Category tag + Name */}
            <div className="flex items-start gap-2 mb-3">
              <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded font-bold flex-shrink-0 mt-1">Sản phẩm</span>
              <h2 className="text-[18px] font-bold text-gray-900 leading-snug">{product.name}</h2>
            </div>

            {/* Rating stats */}
            <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-3 flex-wrap">
              <StarRating rating={product.rating} size={13} />
              <span className="font-semibold text-gray-700">{product.rating}</span>
              <span className="text-gray-300">|</span>
              <span>{product.reviews} Reviews</span>
              <span className="text-gray-300">|</span>
              <span>Đã bán: <b className="text-gray-700">{product.sold.toLocaleString()}</b></span>
              <span className="text-gray-300">|</span>
              <span>Khiếu nại: <b className="text-orange-500">{complaintRate}%</b></span>
            </div>

            {/* Description */}
            <p className="text-[13px] text-gray-600 leading-relaxed mb-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
              {product.description}
            </p>

            {/* Seller info */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <span className="text-[12px] text-gray-500">Người bán:</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                  {product.sellerInitial}
                </div>
                <button
                  type="button"
                  onClick={() => onOpenSellerProfile?.(product.seller)}
                  className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {product.seller}
                </button>
                <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded font-bold">Online</span>
                <span className="text-[10px] text-blue-500 font-medium flex items-center gap-0.5">
                  <CheckCircle size={10} /> Đã xác thực
                </span>
              </div>
            </div>

            {/* Category + Stock */}
            <div className="flex items-center gap-6 mb-4 text-[12px]">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Sản phẩm:</span>
                <span className="text-blue-600 font-medium cursor-pointer hover:underline">Tài khoản MXH</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Tồn kho:</span>
                <span
                  className={`font-bold tabular-nums ${
                    maxPurchasableStock <= 0
                      ? 'text-red-500'
                      : maxPurchasableStock < 100
                        ? 'text-orange-600'
                        : 'text-gray-800'
                  }`}
                >
                  {maxPurchasableStock.toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">₫</span>
              </div>
              <div>
                <span className="text-[22px] font-extrabold text-gray-900">
                  {formatVnd(getDetailUnitPriceVnd(product, selectedVariant)).replace('đ', '').trim()}{' '}
                  <span className="text-[14px] font-bold">VND</span>
                </span>
              </div>
            </div>

            {/* Product Variants */}
            <div className="mb-5">
              <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {isServiceProduct ? 'Gói dịch vụ' : 'Mặt hàng'}
              </p>
              {storefrontNoMatHang ? (
                <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 leading-relaxed">
                  Gian chưa có mặt hàng nào. Vui lòng quay lại sau hoặc chọn gian khác — hiện không thể chọn biến thể để mua.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {matHangVariantLabels.map((variant, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedVariant(i)}
                      className={`text-left px-3 py-2 rounded-lg text-[12px] font-medium border transition-all ${
                        selectedVariant === i
                          ? 'bg-[#22c55e] text-white border-[#22c55e] shadow-sm shadow-green-500/25'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#22c55e]/50 hover:bg-emerald-50/80'
                      }`}
                    >
                      {variant}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="mb-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Số lượng</p>
                {!isServiceProduct ? (
                  <p className="text-[11px] text-gray-500">
                    Tồn kho hiện có:{' '}
                    <span
                      className={`font-bold tabular-nums ${
                        maxPurchasableStock <= 0 ? 'text-red-600' : 'text-gray-800'
                      }`}
                    >
                      {maxPurchasableStock.toLocaleString('vi-VN')}
                    </span>
                    {product.allowPreOrder && maxPurchasableStock > 0 && (
                      <span className="block text-[10px] text-emerald-700 font-medium mt-0.5">
                        Đặt trước chỉ khi hết hàng
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-[11px] text-violet-700 font-medium">Thanh toán để tạo đơn dịch vụ</p>
                )}
              </div>
              <div className="inline-flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => applyQuantityDelta(-1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-lg font-bold"
                >
                  −
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={quantityInput}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === '') {
                      setQuantityInput('');
                      setCheckoutError(null);
                      return;
                    }
                    if (/^\d+$/.test(v)) {
                      setQuantityInput(v);
                      const n = parseInt(v, 10);
                      if (!isNaN(n) && n > 0 && !isServiceProduct) {
                        setCheckoutError(storefrontStockQuantityError(n, maxPurchasableStock));
                      }
                    }
                  }}
                  onBlur={clampQuantityInput}
                  className="w-16 h-10 text-center text-[14px] font-bold border-x-2 border-gray-200 outline-none focus:ring-2 focus:ring-emerald-400/40 focus:z-10"
                />
                <button
                  type="button"
                  onClick={() => applyQuantityDelta(1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-lg font-bold"
                  title={
                    maxPurchasableStock > 0 && parsedQuantity >= maxPurchasableStock
                      ? `Tối đa ${maxPurchasableStock.toLocaleString('vi-VN')} theo tồn kho`
                      : 'Tăng số lượng'
                  }
                >
                  +
                </button>
              </div>
              {checkoutError && !isCheckoutOpen && (
                <p className="mt-2 text-[12px] text-red-600 font-medium" role="alert">
                  {checkoutError}
                </p>
              )}
            </div>

            {(isServiceProduct || product.allowPreOrder) && (
              <div
                className={`mb-4 rounded-xl border px-4 py-3 ${
                  isServiceProduct
                    ? 'border-violet-100 bg-violet-50/40'
                    : 'border-emerald-100 bg-emerald-50/40'
                }`}
              >
                <label
                  htmlFor="delivery-deadline-days"
                  className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide block mb-1"
                >
                  Thời hạn hoàn thành (ngày)
                </label>
                <p className="text-[11px] text-gray-600 leading-relaxed mb-2">
                  {isServiceProduct ? (
                    <>
                      Shop phải <span className="font-semibold text-violet-800">xác nhận</span> và hoàn thành dịch vụ
                      trong số ngày bạn chọn. Quá hạn không xác nhận hoặc không giao kết quả → đơn tự{' '}
                      <span className="font-bold text-rose-700">Thất bại</span> và hoàn tiền.
                    </>
                  ) : (
                    <>
                      Người bán phải giao trong số ngày bạn chọn khi{' '}
                      <span className="font-semibold text-emerald-800">đặt trước</span>. Quá hạn không giao → đơn tự{' '}
                      <span className="font-bold text-rose-700">Thất bại</span> và hoàn tiền.
                    </>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    id="delivery-deadline-days"
                    type="number"
                    min={DELIVERY_DEADLINE_DAYS_MIN}
                    max={DELIVERY_DEADLINE_DAYS_MAX}
                    inputMode="numeric"
                    value={deliveryDeadlineDaysInput}
                    onChange={e => {
                      const v = e.target.value;
                      if (v === '' || /^\d+$/.test(v)) setDeliveryDeadlineDaysInput(v);
                    }}
                    onBlur={() =>
                      setDeliveryDeadlineDaysInput(
                        String(parseDeliveryDeadlineDaysInput(deliveryDeadlineDaysInput))
                      )
                    }
                    disabled={!isServiceProduct && maxPurchasableStock > 0}
                    className={`w-20 h-10 text-center text-[14px] font-bold border-2 border-gray-200 rounded-lg outline-none focus:ring-2 disabled:opacity-50 disabled:bg-gray-100 ${
                      isServiceProduct ? 'focus:ring-violet-400/40' : 'focus:ring-emerald-400/40'
                    }`}
                  />
                  <span className="text-[11px] text-gray-500">
                    Tối đa {DELIVERY_DEADLINE_DAYS_MAX} ngày
                  </span>
                </div>
                {!isServiceProduct && maxPurchasableStock > 0 && (
                  <p className="text-[10px] text-emerald-700 font-medium mt-2">
                    Còn tồn kho — chỉ áp dụng khi bạn đặt trước (hết hàng).
                  </p>
                )}
              </div>
            )}

            {/* Discount Code */}
            <div className="mb-5">
              <p className="text-[12px] font-semibold text-gray-700 mb-2">Mã giảm giá</p>
              <div className="flex flex-wrap items-start gap-2 max-w-[420px]">
                <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Nhập mã giảm giá"
                  value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value.toUpperCase());
                      if (appliedDiscount) {
                        setAppliedDiscount(null);
                        setDiscountCodeHint(null);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyDiscountCode();
                      }
                    }}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-[13px] outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/30 transition-all pr-10 font-mono tracking-wide"
                />
                <Search size={16} className="absolute right-3 top-3 text-gray-400" />
              </div>
                <button
                  type="button"
                  onClick={applyDiscountCode}
                  className="px-4 py-2.5 rounded-lg text-[13px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0"
                >
                  Áp dụng
                </button>
              </div>
              {discountCodeHint && (
                <p
                  className={`text-[11px] mt-2 max-w-[420px] leading-relaxed ${
                    appliedDiscount ? 'text-emerald-700 font-medium' : 'text-rose-600'
                  }`}
                >
                  {discountCodeHint}
                </p>
              )}
            </div>

            {!storefrontLoggedIn && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-900 leading-relaxed">
                Bạn đang xem ở chế độ khách.{' '}
                <button
                  type="button"
                  onClick={() => onRequireLogin?.()}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Đăng nhập hoặc đăng ký
                </button>{' '}
                để mua hàng, đặt trước và nhắn tin người bán.
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                disabled={
                  !storefrontLoggedIn
                    ? false
                    : isPurchaseBusy ||
                      storefrontNoMatHang ||
                      (!isServiceProduct &&
                        (product.isOutOfStock || maxPurchasableStock <= 0))
                }
                onClick={() => {
                  if (requireLoginForPurchase()) return;
                  if (
                    isPurchaseBusy ||
                    storefrontNoMatHang ||
                    (!isServiceProduct &&
                      (product.isOutOfStock || maxPurchasableStock <= 0))
                  )
                    return;
                  if (!isServiceProduct) {
                    const stockErr = storefrontStockQuantityError(quantity, maxPurchasableStock);
                    if (stockErr) {
                      setCheckoutError(stockErr);
                      return;
                    }
                  }
                  if (!ensureDiscountBeforeCheckout()) return;
                    setCheckoutError(null);
                    setIsCheckoutOpen(true);
                }}
                className={`px-8 py-3 rounded-lg text-[14px] font-bold transition-all shadow-md inline-flex items-center gap-2 ${
                  !storefrontLoggedIn
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/30 hover:scale-[1.02]'
                    : isPurchaseBusy ||
                        storefrontNoMatHang ||
                        (!isServiceProduct &&
                          (product.isOutOfStock || maxPurchasableStock <= 0))
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/30 hover:scale-[1.02]'
                }`}
              >
                {isPurchaseBusy ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang xử lý…
                  </>
                ) : !storefrontLoggedIn ? (
                  'Đăng nhập để mua'
                ) : isServiceProduct ? (
                  'Đặt dịch vụ'
                ) : (
                  'Mua hàng'
                )}
              </button>
              {product.allowPreOrder && !isServiceProduct && (
              <button
                type="button"
                  disabled={storefrontLoggedIn ? storefrontNoMatHang || isPurchaseBusy : false}
                  onClick={() => {
                    if (requireLoginForPurchase()) return;
                    if (maxPurchasableStock > 0) {
                      setIsPreOrderStockNoticeOpen(true);
                      return;
                    }
                    setPreOrderNote('');
                    setPreOrderSubmitted(false);
                    setPreOrderCreatedId(null);
                    setPreOrderError(null);
                    setIsPreOrderOpen(true);
                  }}
                className={`px-6 py-3 rounded-lg text-[14px] font-bold border-2 transition-all shadow-sm ${
                    storefrontNoMatHang || isPurchaseBusy
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-emerald-800 border-emerald-500 hover:bg-emerald-50 shadow-emerald-500/10'
                }`}
              >
                Đặt trước
              </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (requireLoginForPurchase()) return;
                  onOpenMessages?.();
                }}
                className="px-6 py-3 rounded-lg text-[14px] font-bold bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                Nhắn tin
              </button>
              {showResellerActions && (
                <button
                  type="button"
                  onClick={() => setIsResellerOpen(true)}
                  className="w-11 h-11 rounded-lg bg-green-50 border-2 border-green-200 flex items-center justify-center hover:bg-green-100 transition-colors"
                  title={`Reseller — chiết khấu ${effectiveResellerPercent ?? resellerPercent}%`}
                >
                <span className="text-lg">🤝</span>
              </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Tabs: Mô tả, Reviews, API */}
        <div className="border-t-2 border-gray-100">
          <div className="flex items-center justify-center gap-0 border-b border-gray-200">
            {[
              { key: 'description' as const, label: 'Mô tả' },
              { key: 'reviews' as const, label: 'Reviews' },
              { key: 'api' as const, label: 'API' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-8 py-3.5 text-[14px] font-semibold transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#22c55e] rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content — max-height + scroll để chứa mô tả rất dài */}
          <div className="p-6 min-h-[280px] max-h-[min(78vh,960px)] overflow-y-auto overscroll-y-contain">
            {activeTab === 'description' && (
              <div>
                <h3 className="text-[18px] font-bold text-gray-900 mb-4 break-words">
                  Thông tin sản phẩm:{' '}
                  <span className="text-green-600 underline decoration-2 underline-offset-4">{product.name}</span>
                </h3>
                <div className="prose prose-sm max-w-none text-[13px] text-gray-600 leading-relaxed space-y-3">
                  <p className="whitespace-pre-wrap break-words">{product.description}</p>
                  {product.longDescription && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="whitespace-pre-wrap break-words text-gray-700 leading-[1.7]">{product.longDescription}</p>
                    </div>
                  )}
                  {product.businessProducts && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="font-semibold text-gray-700 mb-2">📦 Danh sách sản phẩm trong gian hàng:</p>
                      <ul className="space-y-1.5">
                        {product.businessProducts.split(' | ').map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>{item.trim()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mt-4">
                    <p className="font-semibold text-yellow-800 mb-1">⚠ Lưu ý:</p>
                    <ul className="text-yellow-700 space-y-1">
                      <li>• Sản phẩm sau khi mua sẽ được giao ngay lập tức qua hệ thống tự động.</li>
                      <li>• Bảo hành 1 đổi 1 trong vòng 24h, vui lòng kiểm tra ngay khi nhận.</li>
                      <li>• Không hoàn tiền nếu bạn đã thay đổi thông tin tài khoản.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <ProductReviewsContent
                productName={product.name}
                catalogRating={gianHangCatalogRating.rating}
                catalogReviewCount={gianHangCatalogRating.count}
                orderCatalogReviews={gianHangCatalogReviews}
              />
            )}

            {activeTab === 'api' && (
              <div>
                <h3 className="text-[16px] font-bold text-gray-900 mb-4">API Tích hợp</h3>
                <p className="text-[13px] text-gray-500 mb-4">Sử dụng API để tự động mua hàng và quản lý đơn hàng của bạn.</p>
                <div className="bg-gray-900 rounded-xl p-5 text-green-400 font-mono text-[12px] leading-relaxed overflow-x-auto">
                  <p className="text-gray-500">// Endpoint mua hàng tự động</p>
                  <p><span className="text-blue-400">POST</span> /api/v1/orders</p>
                  <br />
                  <p className="text-gray-500">// Headers</p>
                  <p>{`{`}</p>
                  <p className="pl-4">"Authorization": "Bearer {'<YOUR_API_KEY>'}"</p>
                  <p className="pl-4">"Content-Type": "application/json"</p>
                  <p>{`}`}</p>
                  <br />
                  <p className="text-gray-500">// Body</p>
                  <p>{`{`}</p>
                  <p className="pl-4">"product_id": <span className="text-yellow-400">{product.id}</span>,</p>
                  <p className="pl-4">"quantity": <span className="text-yellow-400">1</span>,</p>
                  <p className="pl-4">"variant": <span className="text-yellow-400">0</span>,</p>
                  <p className="pl-4">"coupon": <span className="text-orange-400">""</span></p>
                  <p>{`}`}</p>
                </div>
                <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-[12px] text-blue-700 flex items-center gap-1.5">
                    <Shield size={14} /> Vui lòng bảo mật API Key của bạn. Không chia sẻ cho bất kỳ ai.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

      {isPreOrderStockNoticeOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="preorder-stock-notice-title"
          onClick={() => setIsPreOrderStockNoticeOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border-2 border-amber-200 shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-amber-100 bg-amber-50/80 flex items-start gap-3">
              <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={22} />
              <div>
                <h2 id="preorder-stock-notice-title" className="text-[16px] font-bold text-amber-900">
                  Chưa thể đặt trước
                </h2>
                <p className="text-[13px] text-amber-800/90 mt-1 leading-relaxed">
                  Sản phẩm còn{' '}
                  <span className="font-bold tabular-nums">
                    {maxPurchasableStock.toLocaleString('vi-VN')}
                  </span>{' '}
                  trong kho. Vui lòng dùng nút <span className="font-bold">Mua hàng</span> để nhận hàng ngay.
                  Đặt trước chỉ áp dụng khi hết hàng.
                </p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPreOrderStockNoticeOpen(false)}
                className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {isPreOrderOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preorder-title"
          onClick={() => closePreOrderFlow(false)}
        >
          <div
            className="bg-white rounded-2xl border-2 border-emerald-200 shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-100 bg-emerald-50/60">
              <h2 id="preorder-title" className="text-[16px] font-bold text-emerald-900">
                Đặt trước
              </h2>
              <button
                type="button"
                onClick={() => closePreOrderFlow(false)}
                className="p-2 rounded-lg text-gray-400 hover:bg-white hover:text-gray-700 transition-colors"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
            {preOrderSubmitted ? (
              <div className="px-5 py-8 text-center space-y-2">
                <p className="text-[15px] font-bold text-emerald-700">Đã thanh toán đặt trước</p>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  Mã đơn{' '}
                  <span className="font-mono font-bold text-gray-800">{preOrderCreatedId}</span> — tiền đang{' '}
                  <span className="font-bold text-[#2d6a61]">tạm giữ trên sàn</span>. Người bán sẽ giao khi có hàng;
                  theo dõi tại <span className="font-bold text-gray-700">Đơn hàng đã mua</span>.
                </p>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 space-y-3 text-[13px]">
                  <div>
                    <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wide mb-0.5">Sản phẩm</p>
                    <p className="font-semibold text-gray-900 leading-snug">{product.name}</p>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Mặt hàng</span>
                    <span className="font-bold text-gray-900 text-right">{checkoutSummary.tenMatHang}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Số lượng đặt trước</span>
                    <span className="font-bold text-gray-900 tabular-nums">{checkoutSummary.qty}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Hạn giao tối đa</span>
                    <span className="font-bold text-emerald-800 tabular-nums">{deliveryDeadlineDays} ngày</span>
                  </div>
                  <div className="flex justify-between gap-4 items-center">
                    <span className="text-gray-500">Tổng thanh toán</span>
                    <span className="font-extrabold text-emerald-600 tabular-nums">
                      {formatVnd(checkoutSummary.tongThanhToan)}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500">
                    Số dư ví:{' '}
                    <span className="font-bold text-gray-800 tabular-nums">{formatVnd(walletBalanceVnd)}</span>
                  </p>
                  {preOrderError && (
                    <p className="text-[12px] text-red-600 font-medium" role="alert">
                      {preOrderError}
                    </p>
                  )}
                  <div>
                    <label htmlFor="preorder-note" className="text-gray-500 text-[11px] font-semibold uppercase tracking-wide block mb-1.5">
                      Ghi chú (tùy chọn)
                    </label>
                    <textarea
                      id="preorder-note"
                      value={preOrderNote}
                      onChange={e => setPreOrderNote(e.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder="Ví dụ: cần giao trong tuần tới, UID Facebook…"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[13px] text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                    />
                  </div>
                  <p className="text-[12px] text-gray-500 leading-relaxed">
                    Thanh toán ngay từ ví — tiền được <span className="font-semibold">tạm giữ trên sàn</span>. Shop
                    phải giao trong <span className="font-bold text-gray-800">{deliveryDeadlineDays} ngày</span>; quá
                    hạn đơn tự <span className="font-bold text-rose-700">Thất bại</span> và hoàn tiền.
                  </p>
                </div>
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => closePreOrderFlow(false)}
                    className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 hover:bg-gray-200/80 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handlePreOrderSubmit}
                    className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                  >
                    Thanh toán đặt trước
                  </button>
                </div>
              </>
            )}
            {preOrderSubmitted && (
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => closePreOrderFlow(false)}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 hover:bg-gray-200/80 transition-colors"
                >
                  Ở lại
                </button>
                <button
                  type="button"
                  onClick={() => closePreOrderFlow(true)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  Xem đơn đã mua
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-title"
          onClick={() => {
            setCheckoutError(null);
            setIsCheckoutOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80">
              <h2 id="checkout-title" className="text-[16px] font-bold text-gray-900">
                {isServiceProduct ? 'Xác nhận đặt dịch vụ' : 'Xác nhận đơn hàng'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setCheckoutError(null);
                  setIsCheckoutOpen(false);
                }}
                className="p-2 rounded-lg text-gray-400 hover:bg-white hover:text-gray-700 transition-colors"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3 text-[13px]">
              <div>
                <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wide mb-0.5">Tên mặt hàng</p>
                <p className="font-semibold text-gray-900 leading-snug">{checkoutSummary.tenMatHang}</p>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Số lượng</span>
                <span className="font-bold text-gray-900 tabular-nums">{checkoutSummary.qty}</span>
              </div>
              {isServiceProduct && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Hạn hoàn thành</span>
                  <span className="font-bold text-violet-800 tabular-nums">{deliveryDeadlineDays} ngày</span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Tổng tiền</span>
                <span className="font-bold text-gray-900 tabular-nums">{formatVnd(checkoutSummary.tongTien)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Giảm giá</span>
                <span className="font-bold text-rose-600 tabular-nums">− {formatVnd(checkoutSummary.giamGia)}</span>
              </div>
              <div className="h-px bg-gray-200 my-1" />
              <div className="flex justify-between gap-4 items-center">
                <span className="font-bold text-gray-800">Tổng thanh toán</span>
                <span className="text-lg font-extrabold text-emerald-600 tabular-nums">
                  {formatVnd(checkoutSummary.tongThanhToan)}
                </span>
              </div>
              {(checkoutSummary.promoOff > 0 || checkoutSummary.codeOff > 0) && (
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {checkoutSummary.promoOff > 0 && 'Đã áp ưu đãi niêm yết. '}
                  {checkoutSummary.codeOff > 0 &&
                    appliedDiscount &&
                    `Áp dụng mã ${appliedDiscount.code}: −${formatVnd(checkoutSummary.codeOff)}.`}
                </p>
              )}
              <p className="text-[12px] text-gray-500">
                Số dư ví: <span className="font-bold text-gray-800 tabular-nums">{formatVnd(walletBalanceVnd)}</span>
              </p>
              {isServiceProduct && (
                <p className="text-[12px] text-gray-500 leading-relaxed">
                  Shop phải xác nhận và giao dịch vụ trong{' '}
                  <span className="font-bold text-gray-800">{deliveryDeadlineDays} ngày</span>; quá hạn →{' '}
                  <span className="font-bold text-rose-700">Thất bại</span> và hoàn tiền.
                </p>
              )}
              {isServiceProduct && (
                <div className="pt-2 border-t border-violet-100">
                  <label
                    htmlFor="service-request-note"
                    className="text-gray-500 text-[11px] font-semibold uppercase tracking-wide block mb-1.5"
                  >
                    Nội dung yêu cầu <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="service-request-note"
                    value={serviceRequestNote}
                    onChange={e => {
                      setServiceRequestNote(e.target.value);
                      if (checkoutError) setCheckoutError(null);
                    }}
                    rows={4}
                    maxLength={2000}
                    placeholder="VD: Link bài viết Facebook, UID cần tăng like, số lượng, ghi chú thêm cho shop…"
                    className="w-full rounded-xl border border-violet-200 bg-violet-50/40 px-3 py-2.5 text-[13px] text-gray-800 resize-y min-h-[96px] focus:outline-none focus:ring-2 focus:ring-violet-400/35 focus:border-violet-400"
                  />
                  <p className="text-[11px] text-gray-400 mt-1 tabular-nums">
                    {serviceRequestNote.trim().length}/2000 · tối thiểu 10 ký tự
                  </p>
                </div>
              )}
              {checkoutError && (
                <p className="text-[12px] text-red-600 font-medium" role="alert">
                  {checkoutError}
                </p>
              )}
            </div>
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCheckoutError(null);
                  setIsCheckoutOpen(false);
                }}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 hover:bg-gray-200/80 transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={storefrontNoMatHang || isPurchaseBusy}
                onClick={() => void handleCheckoutPay()}
                className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all inline-flex items-center gap-2 ${
                  storefrontNoMatHang || isPurchaseBusy
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-md'
                }`}
              >
                {isPurchaseBusy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang xử lý…
                  </>
                ) : isServiceProduct ? (
                  'Thanh toán & gửi yêu cầu'
                ) : (
                  'Thanh toán'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResellerActions && isResellerOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsResellerOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {(['reseller', 'quick-sell'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setResellerTab(tab)}
                  className={`flex-1 py-4 text-[13px] font-semibold transition-colors relative ${
                    resellerTab === tab ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab === 'reseller' ? 'Đăng kí Reseller' : 'Đăng kí bán hàng nhanh'}
                  {resellerTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {resellerTab === 'reseller' ? (
                <>
                  {/* Default discount card */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-4 shadow-lg shadow-green-300/40">
                    {/* decorative circles */}
                    <div className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
                    <div className="pointer-events-none absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />

                    <div className="relative flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-2">
                          {approvedResellerPercent != null ? 'Đang áp dụng' : 'Mặc định'}
                        </span>
                        <p className="text-white font-extrabold text-[15px] leading-tight">Chiết khấu Reseller</p>
                        <p className="text-green-100 text-[11px] mt-0.5">
                          {approvedResellerPercent != null
                            ? `Bạn đã được duyệt ${approvedResellerPercent}% — có thể xin cao hơn`
                            : `Mặc định gian ${resellerShopDefaultPercent ?? resellerPercent}% — xin cao hơn % này`}
                        </p>
                      </div>
                      <div className="shrink-0 w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex flex-col items-center justify-center shadow-inner">
                        <span className="text-white font-black text-[22px] leading-none">
                          {effectiveResellerPercent ?? resellerPercent}%
                        </span>
                        <span className="text-green-100 text-[9px] font-semibold uppercase tracking-wider">off</span>
                      </div>
                    </div>

                    <div className="relative mt-3 flex items-center gap-2 bg-white/15 border border-white/25 rounded-xl px-3 py-2">
                      <svg className="shrink-0 text-green-100 w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"/><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 015.656 0l4-4a4 4 0 01-5.656-5.656l-1.1 1.1"/></svg>
                      <span className="flex-1 text-[10.5px] text-green-50 font-mono truncate">https://shop.example.com/join/reseller-default</span>
                      <button
                        type="button"
                        onClick={() => {
                          const refUrl = (() => {
                            if (!gianHangId || !storefrontBuyerEmail.trim()) {
                              return 'https://shop.example.com/join/reseller-default';
                            }
                            const ctx: ResellerReferrerContext = {
                              email: storefrontBuyerEmail,
                              name: buyerName,
                              gianHangId,
                              viaLink: true,
                            };
                            writeResellerReferrerToStorage(ctx);
                            const q = new URLSearchParams({
                              ref: ctx.email,
                              refName: ctx.name,
                              gian: ctx.gianHangId,
                            });
                            return `${window.location.origin}${window.location.pathname}?${q.toString()}`;
                          })();
                          navigator.clipboard.writeText(refUrl);
                          setResellerLinkCopied(true);
                          setTimeout(() => setResellerLinkCopied(false), 2000);
                        }}
                        className={`shrink-0 px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          resellerLinkCopied
                            ? 'bg-white text-green-600'
                            : 'bg-white/25 hover:bg-white/40 text-white border border-white/30'
                        }`}
                      >
                        {resellerLinkCopied ? '✓ Copied' : 'COPY'}
                      </button>
                    </div>
                  </div>

                  {pendingResellerRequest && (
                    <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      Đang chờ duyệt: {pendingResellerRequest.requestedPercent}% (từ{' '}
                      {pendingResellerRequest.baselinePercent}%). Gửi lại chỉ khi % cao hơn.
                    </p>
                  )}

                  {/* Desired discount */}
                  <div>
                    <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wide mb-1.5">
                      Chiết khấu mong muốn
                    </p>
                    {resellerMinPercent != null && (
                      <p className="text-[10px] text-slate-500 mb-1.5">
                        Phải lớn hơn {resellerMinPercent}%
                        {approvedResellerPercent != null
                          ? ` (đang áp dụng ${effectiveResellerPercent}%)`
                          : ` (mặc định ${resellerShopDefaultPercent ?? resellerPercent}%)`}
                      </p>
                    )}
                    <div
                      className={`flex items-center bg-gray-50 border rounded-xl px-4 py-3 ${
                        resellerDiscountError ? 'border-rose-300 bg-rose-50/40' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="number"
                        min={resellerMinPercent != null ? resellerMinPercent + 1 : 1}
                        max={100}
                        value={resellerDiscount}
                        onChange={e => {
                          setResellerDiscount(e.target.value);
                          syncResellerDiscountError(e.target.value);
                        }}
                        onBlur={() => syncResellerDiscountError(resellerDiscount)}
                        placeholder={
                          resellerMinPercent != null
                            ? `Ví dụ: ${resellerMinPercent + 1}`
                            : 'Nhập con số...'
                        }
                        className="flex-1 bg-transparent text-[14px] text-gray-700 outline-none placeholder:text-gray-300"
                      />
                      <span className="text-gray-400 font-semibold text-[14px]">%</span>
                    </div>
                    {resellerDiscountError && (
                      <p className="text-[11px] font-semibold text-rose-600 mt-1.5">{resellerDiscountError}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wide mb-1.5">Lời nhắn gửi</p>
                    <textarea
                      value={resellerMessage}
                      onChange={e => setResellerMessage(e.target.value)}
                      placeholder="Lời nhắn gửi nhà cung cấp..."
                      rows={3}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-700 outline-none resize-none focus:border-green-400 transition-colors placeholder:text-gray-300"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitResellerRequest}
                    disabled={Boolean(resellerDiscountError) || !resellerDiscount.trim()}
                    className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none text-white font-bold rounded-xl text-[14px] transition-all shadow-md shadow-green-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {pendingResellerRequest ? 'Cập nhật yêu cầu' : 'Tạo yêu cầu'}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wide mb-1.5">Tỉ lệ tăng giá bán (%)</p>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                      <input
                        type="number"
                        value={quickSellRate}
                        onChange={e => setQuickSellRate(e.target.value)}
                        placeholder="Ví dụ: 10"
                        className="flex-1 bg-transparent text-[14px] text-gray-700 outline-none placeholder:text-gray-300"
                      />
                      <span className="text-gray-400 font-semibold text-[14px]">%</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const rate = parseFloat(quickSellRate);
                      if (!quickSellRate || isNaN(rate) || rate <= 0) return;
                      setQuickSellResult({
                        link: `https://shop.example.com/sell?markup=${rate}&ref=quick`,
                        rate,
                      });
                      setQuickSellLinkCopied(false);
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl text-[14px] transition-all shadow-md shadow-blue-200 active:scale-[0.98] disabled:opacity-50"
                    disabled={!quickSellRate || isNaN(parseFloat(quickSellRate)) || parseFloat(quickSellRate) <= 0}
                  >
                    Tạo link
                  </button>

                  {quickSellResult && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-blue-500">
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider">Link bán hàng nhanh</span>
                        <span className="px-2.5 py-0.5 bg-white/25 rounded-full text-white text-[12px] font-extrabold">
                          +{quickSellResult.rate}%
                        </span>
                      </div>
                      {/* Info row */}
                      <div className="px-4 py-2 border-b border-blue-100 flex items-center gap-4 text-[12px]">
                        <div className="flex items-center gap-1.5 text-blue-700">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                          <span>Tăng giá bán: <b>+{quickSellResult.rate}%</b></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/></svg>
                          <span>Tạo lúc {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      {/* Link row */}
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <svg className="shrink-0 w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.1-1.1"/><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 015.656 0l4-4a4 4 0 01-5.656-5.656l-1.1 1.1"/></svg>
                        <span className="flex-1 text-[11px] text-blue-800 font-mono truncate">{quickSellResult.link}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(quickSellResult.link);
                            setQuickSellLinkCopied(true);
                            setTimeout(() => setQuickSellLinkCopied(false), 2000);
                          }}
                          className={`shrink-0 px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            quickSellLinkCopied ? 'bg-green-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {quickSellLinkCopied ? '✓ Copied' : 'COPY'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {purchaseFlow === 'processing' && (
        <div
          className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="purchase-processing-title"
          aria-busy="true"
        >
          <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-2xl w-full max-w-md overflow-hidden text-center">
            <div className="px-6 py-5 border-b border-amber-100 bg-amber-50/90">
              <span className="inline-flex px-3 py-1 rounded text-[11px] font-bold bg-amber-500 text-white uppercase tracking-wide">
                Đang xử lý
              </span>
            </div>
            <div className="px-6 py-8">
              <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" aria-hidden />
              <h3 id="purchase-processing-title" className="text-[17px] font-bold text-gray-900 mb-2">
                {isServiceProduct ? 'Đang đặt dịch vụ' : 'Đang giao hàng từ kho'}
              </h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                {isServiceProduct
                  ? 'Đang tạo đơn dịch vụ và trừ tiền ví — shop sẽ xử lý yêu cầu của bạn. Vui lòng không đóng trang.'
                  : 'Hệ thống đang lấy sản phẩm, trừ tồn kho và tạo đơn cho bạn. Vui lòng không đóng trang.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {purchaseFlow === 'success' && paymentSuccessOrder && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-success-title"
          onClick={closePurchaseFlow}
        >
          <div
            className="bg-white rounded-2xl border-2 border-emerald-200 shadow-2xl w-full max-w-lg overflow-hidden max-h-[min(90vh,720px)] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 bg-emerald-50/80 flex-shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-emerald-600 flex-shrink-0" size={22} />
                <h2 id="payment-success-title" className="text-[16px] font-bold text-gray-900">
                  Thanh toán thành công
                </h2>
              </div>
            </div>
            <div className="px-5 py-4 space-y-4 text-[13px] overflow-y-auto">
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-3">
                <div>
                  <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wide mb-0.5">Mã đơn hàng</p>
                  <p className="font-mono font-bold text-blue-600 text-[15px]">{paymentSuccessOrder.id}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wide mb-0.5">Ngày mua</p>
                  <p className="font-semibold text-gray-900">{paymentSuccessOrder.purchaseDate}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wide mb-0.5">Tên mặt hàng</p>
                  <p className="font-semibold text-gray-900 leading-snug break-words">{paymentSuccessOrder.productName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wide mb-0.5">Số lượng mua</p>
                  <p className="font-semibold text-gray-900 tabular-nums">{paymentSuccessOrder.quantity}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wide mb-0.5">Tổng tiền</p>
                  <p className="text-lg font-extrabold text-emerald-600 tabular-nums">{paymentSuccessOrder.totalAmount}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wide mb-0.5">Trạng thái</p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[12px] font-bold bg-[#2d6a61] text-white">
                    {paymentSuccessOrder.status}
                  </span>
                </div>
              </div>
              {paymentSuccessOrder.order_type !== 'service' &&
                paymentSuccessOrder.deliveredItems &&
                paymentSuccessOrder.deliveredItems.length > 0 && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200/90 p-3.5 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Package size={20} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[13px] font-bold text-emerald-900">Sản phẩm đã vào kho đơn hàng</p>
                    <p className="text-[12px] text-emerald-800/90 mt-0.5 leading-relaxed">
                      Đã giao <b>{paymentSuccessOrder.deliveredItems.length}</b> dòng vào kho của bạn. Nhấn{' '}
                      <b>Đi tới kho hàng</b> để xem và sao chép ngay.
                    </p>
                  </div>
                </div>
              )}
              <div className="rounded-xl bg-amber-50 border border-amber-200/90 p-3.5 space-y-2">
                <p className="text-[12px] font-bold text-amber-900 flex items-center gap-1.5">
                  <Shield size={14} className="text-amber-700 flex-shrink-0" />
                  Lưu ý từ TapHoaMMO
                </p>
                <ul className="text-[11.5px] text-amber-950/90 leading-relaxed space-y-1.5 pl-0 list-none">
                  {paymentSuccessOrder.order_type === 'service' ? (
                    <>
                  <li className="flex gap-2">
                    <span className="text-amber-600 font-bold flex-shrink-0">•</span>
                        <span>
                          Đơn dịch vụ <b>Chờ xác nhận</b> — shop phải xác nhận và hoàn thành trong{' '}
                          <b>
                            {paymentSuccessOrder.deliveryDeadlineDays ?? DELIVERY_DEADLINE_DAYS_DEFAULT} ngày
                          </b>
                          ; quá hạn → Thất bại và hoàn tiền.
                        </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-600 font-bold flex-shrink-0">•</span>
                        <span>Theo dõi tiến độ tại mục Đơn hàng đã mua → mã đơn của bạn.</span>
                  </li>
                    </>
                  ) : (
                    <>
                  <li className="flex gap-2">
                    <span className="text-amber-600 font-bold flex-shrink-0">•</span>
                        <span>
                          Tiền đang <b>tạm giữ</b> trên sàn cho đến khi đơn được xử lý / giao đúng theo chính sách;
                          vui lòng theo dõi trạng thái tại mục Đơn hàng đã mua.
                        </span>
                  </li>
                      <li className="flex gap-2">
                        <span className="text-amber-600 font-bold flex-shrink-0">•</span>
                        <span>
                          Trong 24h đầu sau khi nhận tài khoản, hạn chế đổi email hoặc thông tin đăng nhập để đảm bảo
                          quyền lợi bảo hành và tránh tranh chấp.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-amber-600 font-bold flex-shrink-0">•</span>
                        <span>
                          Nếu có sự cố, vui lòng khiếu nại trong thời hạn quy định; sàn sẽ can thiệp theo bằng chứng và
                          quy trình hiện hành.
                        </span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <p className="text-[12px] text-gray-500">
                Đơn đã được thêm vào mục{' '}
                <span className="font-semibold text-gray-700">Đơn hàng đã mua</span>.
                {paymentSuccessOrder.order_type === 'service'
                  ? ' Mở chi tiết đơn để xem yêu cầu và kết quả từ shop.'
                  : paymentSuccessOrder.deliveredItems?.length
                    ? ' Mở kho đơn hàng để nhận tài khoản / sản phẩm.'
                    : ' Bạn có thể theo dõi trạng thái trong danh sách đơn.'}
              </p>
            </div>
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={closePurchaseFlow}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors order-2 sm:order-1"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => goToBuyerWarehouse(paymentSuccessOrder.id)}
                className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-md transition-all order-1 sm:order-2 inline-flex items-center justify-center gap-2"
              >
                {paymentSuccessOrder.order_type !== 'service' && <Package size={16} />}
                {paymentSuccessOrder.order_type === 'service'
                  ? 'Xem đơn dịch vụ'
                  : paymentSuccessOrder.deliveredItems?.length
                    ? 'Đi tới kho hàng'
                    : 'Xem đơn hàng đã mua'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
};

const USER_MENU_STORE_COUNT_FALLBACK = 2;

// ════════════════════════════════════════════════════════════════
// PAYMENT HISTORY: Types, Mock Data, Components
// ════════════════════════════════════════════════════════════════

export type { PaymentHistoryItem } from './storefront/paymentHistoryTypes';

type PaymentHistoryTransactionStatus = 'Completed';

interface PaymentHistoryTransaction {
  id: string;
  date: string;
  orderCode: string;
  amount: number;
  status: PaymentHistoryTransactionStatus;
  reason: string;
}

interface PaymentHistoryWithdrawItem {
  id: string;
  date: string;
  amount: number;
  status: 'Processing' | 'Success';
  description: string;
}

interface PaymentHistorySavedAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
}

const PAYMENT_HISTORY_MOCK_TRANSACTIONS: PaymentHistoryTransaction[] = Array.from({ length: 25 }, (_, i) => {
  const orderCode = `ORD-${12 + i}`;
  return {
    id: `${i + 1}`,
    date: `${String(1 + Math.floor(i / 5)).padStart(2, '0')}/04/2026 ${String(9 + (i % 8)).padStart(2, '0')}:${String(10 + (i % 50)).padStart(2, '0')}`,
    orderCode,
    amount: 250000 + (i * 50000),
    status: 'Completed',
    reason: `Thanh toán đơn hàng: ${orderCode} sau thời gian tạm giữ`,
  };
});

const PAYMENT_HISTORY_MOCK_HISTORY: PaymentHistoryItem[] = [
  { id: 'h1', date: '16-12-2023 08:06', type: 'Sponsorship', amount: 5000, reason: 'Được tài trợ bởi bridger_hkc03k', transactionCode: 'GD-00001' },
  { id: 'h2', date: '07-12-2023 11:12', type: 'Selling', amount: 190000, reason: 'Bán hàng cho shop: joziah_6ktv8c -> mã đơn hàng: KKWX1K7NPJ', transactionCode: 'GD-00002' },
  { id: 'h3', date: '28-11-2023 14:48', type: 'Buying', amount: -30000, reason: 'Thanh toán cho đơn hàng ZNVHCZ4WFF', transactionCode: 'GD-00003' },
  { id: 'h4', date: '28-11-2023 14:43', type: 'Buying', amount: -30000, reason: 'Thanh toán cho đơn hàng HW0EXHS7AH', transactionCode: 'GD-00004' },
  { id: 'h5', date: '13-11-2023 17:01', type: 'Top-up', amount: 10000, reason: 'Nạp tiền từ ngân hàng VCB', transactionCode: 'GD-00005' },
  { id: 'h6', date: '12-11-2023 10:21', type: 'Buying', amount: -250000, reason: 'Thanh toán cho đơn hàng NBN7USPGIN', transactionCode: 'GD-00006' },
  { id: 'h7', date: '11-11-2023 15:06', type: 'Buying', amount: -75000, reason: 'Thanh toán cho đơn hàng HA45UR8HNG', transactionCode: 'GD-00007' },
  { id: 'h8', date: '07-11-2023 11:31', type: 'Selling', amount: 225000, reason: 'Bán hàng cho shop: joziah_6ktv8c -> mã đơn hàng: I2M6J9TMKH', transactionCode: 'GD-00008' },
  { id: 'h9', date: '03-11-2023 04:36', type: 'Refund', amount: 340000, reason: 'Hoàn tiền cho đơn hàng không hoàn thành(GYV4DBNZBY).', transactionCode: 'GD-00009' },
  { id: 'h10', date: '02-11-2023 13:59', type: 'Buying', amount: -340000, reason: 'Thanh toán cho đơn hàng GYV4DBNZBY', transactionCode: 'GD-00010' },
  { id: 'h11', date: '02-11-2023 11:20', type: 'Top-up', amount: 500000, reason: 'Nạp tiền từ ngân hàng VCB', transactionCode: 'GD-00011' },
  { id: 'h12', date: '31-10-2023 08:15', type: 'Buying', amount: -77000, reason: 'Thanh toán cho đơn hàng W9BNYUKT8P', transactionCode: 'GD-00012' },
  { id: 'h13', date: '28-10-2023 15:11', type: 'Buying', amount: -69000, reason: 'Thanh toán cho đơn hàng 0VJY GZWOV3', transactionCode: 'GD-00013' },
];

const PAYMENT_HISTORY_MOCK_WITHDRAWALS: PaymentHistoryWithdrawItem[] = [
  { id: 'w1', date: '10-08-2024 11:35', amount: 1400000, status: 'Processing', description: 'Thực hiện rút tiền vào tài khoản: STB' },
  { id: 'w2', date: '03-08-2024 19:16', amount: 500000, status: 'Success', description: 'Thực hiện rút tiền vào tài khoản: STB' },
  { id: 'w3', date: '31-07-2024 00:19', amount: 1200000, status: 'Success', description: 'Thực hiện rút tiền vào tài khoản: STB' },
  { id: 'w4', date: '29-07-2024 00:46', amount: 1000000, status: 'Success', description: 'Thực hiện rút tiền vào tài khoản: STB' },
];

const VIETNAM_BANKS = [
  { group: 'Ngân hàng phổ biến', banks: [
    'Vietcombank (VCB)', 'BIDV', 'VietinBank', 'Agribank', 'MB Bank (MB)',
    'Techcombank (TCB)', 'ACB', 'VPBank (VPB)', 'Sacombank (STB)', 'TPBank (TPB)'
  ]},
  { group: 'Ngân hàng khác', banks: [
    'HDBank', 'VIB', 'SeABank', 'MSB', 'SHB', 'LienVietPostBank (LPB)',
    'Eximbank (EIB)', 'OCB', 'Nam A Bank', 'Kienlongbank', 'Viet Capital Bank',
    'VietBank', 'Bac A Bank', 'BaoViet Bank', 'GPBank', 'OceanBank', 'CBBank',
    'PVcomBank', 'VRB', 'IVB', 'Shinhan Bank', 'HSBC', 'Standard Chartered',
    'Public Bank', 'Woori Bank', 'CIMB', 'HL Bank', 'UOB'
  ]}
];

const PAYMENT_HISTORY_MOCK_SAVED_ACCOUNTS: PaymentHistorySavedAccount[] = [
  { id: '1', bankName: 'Vietcombank (VCB)', accountHolder: 'NGUYEN VAN A', accountNumber: '1234567890' },
  { id: '2', bankName: 'Techcombank (TCB)', accountHolder: 'TRAN THI B', accountNumber: '0987654321' },
];

// Payment History Components
const PaymentHistoryPagination = ({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void
}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Trước
      </button>

      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
            currentPage === page
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
              : 'text-slate-600 hover:bg-slate-100 border border-transparent'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Sau
      </button>
    </div>
  );
};

const PaymentHistoryTypeBadge = ({ type }: { type: PaymentHistoryType }) => {
  const configs = {
    Sponsorship: { label: 'Tài trợ', color: 'bg-emerald-500' },
    Selling: { label: 'Bán hàng', color: 'bg-emerald-500' },
    Buying: { label: 'Mua hàng', color: 'bg-amber-500' },
    'Top-up': { label: 'Nạp tiền', color: 'bg-emerald-500' },
    Refund: { label: 'Hoàn tiền', color: 'bg-emerald-500' },
    Reseller: { label: 'Reseller', color: 'bg-violet-600' },
    Withdraw: { label: 'Rút tiền', color: 'bg-slate-600' },
  };

  const config = configs[type];

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${config.color}`}>
      {config.label}
    </span>
  );
};

const SellerPayoutEscrowBadge = ({ status }: { status: SellerPayoutRow['escrowStatus'] }) => {
  if (status === 'completed') {
    return (
      <span className="inline-flex whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100">
        Hoàn thành
      </span>
    );
  }
  if (status === 'partial_refund') {
    return (
      <span className="inline-flex whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-violet-100 text-violet-800 border border-violet-200">
        Hoàn 1 phần
      </span>
    );
  }
  return (
    <span className="inline-flex whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-100">
      Đang tạm giữ
    </span>
  );
};

const PaymentHistoryStatusBadge = ({ status }: { status: PaymentHistoryTransactionStatus }) => {
  if (status !== 'Completed') return null;
  return (
    <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold border whitespace-nowrap border-transparent bg-[#4caf50] text-white">
      Hoàn thành
    </span>
  );
};

const PaymentHistoryWithdrawStatusBadge = ({ status }: { status: 'Processing' | 'Success' }) => {
  if (status === 'Processing') {
    return (
      <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500 text-white uppercase">
        Đang xử lý
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold border whitespace-nowrap border-transparent bg-[#4caf50] text-white uppercase">
      Thành công
    </span>
  );
};

const PaymentHistorySummaryCard = ({
  label,
  amount,
  icon: Icon,
  colorClass
}: {
  label: string;
  amount: string;
  icon: any;
  colorClass: string;
}) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 flex-1 min-w-[280px]">
    <div className={`p-3 rounded-xl ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-800 tracking-tight">{amount}đ</p>
    </div>
  </div>
);

const PaymentHistoryWithdrawModal = ({
  isOpen,
  onClose,
  isWithdrawModalOpen,
  setIsWithdrawModalOpen
}: {
  isOpen: boolean;
  onClose: () => void;
  isWithdrawModalOpen?: boolean;
  setIsWithdrawModalOpen?: (val: boolean) => void;
}) => {
  const [selectedBank, setSelectedBank] = React.useState('');
  const [accountHolder, setAccountHolder] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [saveAccount, setSaveAccount] = React.useState(false);

  if (!isOpen) return null;

  const handleSelectSavedAccount = (accountId: string) => {
    const account = PAYMENT_HISTORY_MOCK_SAVED_ACCOUNTS.find(a => a.id === accountId);
    if (account) {
      setSelectedBank(account.bankName);
      setAccountHolder(account.accountHolder);
      setAccountNumber(account.accountNumber);
    } else {
      setSelectedBank('');
      setAccountHolder('');
      setAccountNumber('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">Yêu cầu rút tiền</h3>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
            <p className="text-sm text-emerald-700 italic leading-relaxed">
              Hệ thống chỉ lưu số tài khoản cho đến khi giao dịch thành công.
              Số tiền GD tối thiểu là 500.000 và phải là bội số của 100.000.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock size={14} className="text-blue-500" />
                Tài khoản đã lưu
              </label>
              <div className="relative">
                <select
                  onChange={(e) => handleSelectSavedAccount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-lg text-sm appearance-none focus:border-blue-500 outline-none transition-all pr-10 text-blue-700 font-medium"
                >
                  <option value="">-- Chọn tài khoản đã lưu --</option>
                  {PAYMENT_HISTORY_MOCK_SAVED_ACCOUNTS.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} - {acc.accountNumber} ({acc.accountHolder})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={16} />
              </div>
            </div>

            <div className="h-px bg-slate-100 my-2" />

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Số tiền</label>
              <input
                type="number"
                defaultValue={500000}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tên ngân hàng</label>
              <div className="relative">
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm appearance-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all pr-10"
                >
                  <option value="">Chọn...</option>
                  {VIETNAM_BANKS.map((group) => (
                    <optgroup key={group.group} label={group.group}>
                      {group.banks.map((bank) => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Người thụ hưởng</label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Nhập tên người thụ hưởng"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Số tài khoản</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Nhập số tài khoản"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="saveAccount"
                checked={saveAccount}
                onChange={(e) => setSaveAccount(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="saveAccount" className="text-sm text-slate-600 cursor-pointer select-none">
                Lưu tài khoản này cho lần sau
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-300 transition-colors"
          >
            Đóng
          </button>
          <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm">
            Rút tiền
          </button>
        </div>
      </div>
    </div>
  );
};

export type HomeViewProps = {
  onNavigateToAdmin: () => void;
  /** Số đơn đặt trước chờ seller giao — hiện badge menu Quản lý cửa hàng. */
  sellerPendingPreOrderCount?: number;
  allOrders: Order[];
  setAllOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  storefrontBuyerName?: string;
  storefrontBuyerEmail?: string;
  storefrontLoggedIn?: boolean;
  onStorefrontLoginSuccess?: (p: StorefrontLoginPayload) => void;
  onStorefrontLogout?: () => void;
  onStorefrontBuyerEmailPersist?: (email: string) => void;
  walletBalanceVnd: number;
  setWalletBalanceVnd: React.Dispatch<React.SetStateAction<number>>;
  /** Thứ tự tên danh mục đồng bộ Quản lý danh mục (tab Bán sản phẩm / Dịch vụ) */
  storefrontDanhMucBanSanPham?: string[];
  storefrontDanhMucDichVu?: string[];
  /** Danh sách loại sản phẩm theo category (string[]) lấy từ Admin "Quản lý loại sản phẩm". */
  storefrontProductTypesByCategory?: Record<string, string[]>;
  storefrontServiceTypesByCategory?: Record<string, string[]>;
  /** Sau khi cố truy cập /admin khi không đủ quyền */
  accessDeniedFlash?: string | null;
  onDismissAccessDeniedFlash?: () => void;
  /** Đẩy dòng lịch sử vào Admin → Lịch sử giao dịch khi thanh toán (thanh-toan). */
  onSyncAdminPaymentHistory?: (row: PaymentHistory) => void;
  /** Giữ lịch sử giao dịch storefront khi chuyển sang Admin (state nằm App, không mất khi unmount HomeView). */
  paymentHistoryCheckoutItems: PaymentHistoryItem[];
  setPaymentHistoryCheckoutItems: React.Dispatch<React.SetStateAction<PaymentHistoryItem[]>>;
  /** Gian hàng con từ Quản lý gian hàng — hiển thị trong lưới catalog storefront (đồng bộ `docs/gian_hang.md`). */
  storefrontAdminGianHangCategories?: StorefrontAdminGianHangTree[];
  /** Lượt đẩy Top 1 từ Admin — đồng bộ tag Tài trợ & thứ tự storefront. */
  gianHangTop1State?: GianHangTop1State;
  onFulfillPurchase?: (
    adminGianHangId: string,
    variantIndex: number,
    quantity: number
  ) => FulfillPurchaseResult;
  resellerRequests?: ResellerRequest[];
  onResellerRequestsChange?: React.Dispatch<React.SetStateAction<ResellerRequest[]>>;
  /** Cập nhật cây gian hàng admin (vd. tạm dừng gian khi vượt hạn khiếu nại). */
  onAdminCategoriesSync?: (next: import('./gianHang/types').Category[]) => void;
};

export const HomeView = ({
  onNavigateToAdmin,
  sellerPendingPreOrderCount = 0,
  allOrders,
  setAllOrders,
  storefrontBuyerName = 'benson_lcdt5e',
  storefrontBuyerEmail = 'batdongsan361@gmail.com',
  storefrontLoggedIn = true,
  onStorefrontLoginSuccess = () => {},
  onStorefrontLogout = () => {},
  onStorefrontBuyerEmailPersist,
  walletBalanceVnd,
  setWalletBalanceVnd,
  storefrontDanhMucBanSanPham = [],
  storefrontDanhMucDichVu = [],
  storefrontProductTypesByCategory = {},
  storefrontServiceTypesByCategory = {},
  accessDeniedFlash = null,
  onDismissAccessDeniedFlash,
  onSyncAdminPaymentHistory,
  paymentHistoryCheckoutItems,
  setPaymentHistoryCheckoutItems,
  storefrontAdminGianHangCategories = [],
  gianHangTop1State,
  onFulfillPurchase,
  resellerRequests = [],
  onResellerRequestsChange,
  onAdminCategoriesSync,
}: HomeViewProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { header: headerT } = useStorefrontLocale();
  const { formatMoney: formatStorefrontMoney } = useStorefrontCurrency();

  useEffect(() => {
    setSessionLoginUsername(storefrontBuyerName);
  }, [storefrontBuyerName]);

  const refreshNotificationSettings = useCallback(() => {
    setNotificationSettings(readStorefrontNotificationSettings());
    setPopupNotificationsRevision(r => r + 1);
    setTopUpNoticesRevision(r => r + 1);
  }, []);

  useEffect(() => {
    const onFocus = () => refreshNotificationSettings();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshNotificationSettings]);

  type StorefrontLine = 'Bán sản phẩm' | 'Dịch vụ';
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [draftCatalogProductTypes, setDraftCatalogProductTypes] = useState<string[]>([]);
  const [appliedCatalogProductTypes, setAppliedCatalogProductTypes] = useState<string[]>([]);
  const [draftCatalogPriceMin, setDraftCatalogPriceMin] = useState('');
  const [draftCatalogPriceMax, setDraftCatalogPriceMax] = useState('');
  const [appliedCatalogPriceMin, setAppliedCatalogPriceMin] = useState<number | null>(null);
  const [appliedCatalogPriceMax, setAppliedCatalogPriceMax] = useState<number | null>(null);
  const [activeStorefrontLine, setActiveStorefrontLine] = useState<StorefrontLine>('Bán sản phẩm');
  const [activeSort, setActiveSort] = useState('popular');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogSellerFilter, setCatalogSellerFilter] = useState<{
    username: string;
    displayName: string;
    email?: string;
  } | null>(null);
  const [catalogFavoritesOnly, setCatalogFavoritesOnly] = useState(false);
  const [favoritesRevision, setFavoritesRevision] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [storefrontPage, setStorefrontPage] = useState<
    | 'shop'
    | 'shop-catalog'
    | 'my-orders'
    | 'account'
    | 'public-profile'
    | 'payment-history'
    | 'reseller-hub'
    | 'top-up'
    | 'messages'
    | 'info'
    | 'support'
    | 'share'
    | StorefrontToolPageId
  >('shop');
  const [storefrontInfoTab, setStorefrontInfoTab] = useState<StorefrontInfoTabId>('about');
  const [guestInfoTab, setGuestInfoTab] = useState<StorefrontInfoTabId | null>(null);
  const [accountTab, setAccountTab] = useState<'settings' | 'basic'>('settings');
  const [publicProfileSeller, setPublicProfileSeller] = useState<string | null>(null);
  const [loginSessionsRevision, setLoginSessionsRevision] = useState(0);
  const [openLoginSessionMenuId, setOpenLoginSessionMenuId] = useState<string | null>(null);
  const [messagesInitialThreadId, setMessagesInitialThreadId] = useState<string | null>(null);
  const [messagesReadRevision, setMessagesReadRevision] = useState(0);
  const [userNotifRevision, setUserNotifRevision] = useState(0);
  const [userNotifPanelOpen, setUserNotifPanelOpen] = useState(false);
  const [userNotifToast, setUserNotifToast] = useState<{ title: string; content: string } | null>(null);
  const userNotifPanelRef = useRef<HTMLDivElement>(null);
  const [messagesProductSeed, setMessagesProductSeed] = useState<{
    sellerName: string;
    storeName?: string;
    avatarUrl?: string;
    platform?: string;
  } | null>(null);
  const [storefrontOrderDetailId, setStorefrontOrderDetailId] = useState<string | null>(null);
  const [purchasedOrdersStatusFilter, setPurchasedOrdersStatusFilter] = useState('Tất cả');
  const [resellerReferrer, setResellerReferrer] = useState<ResellerReferrerContext | null>(() =>
    readResellerReferrerFromStorage()
  );
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(() =>
    readStorefrontNotificationSettings()
  );
  const [storefrontPopupOpen, setStorefrontPopupOpen] = useState(false);
  const [activeStorefrontPopup, setActiveStorefrontPopup] = useState<StorefrontPopupNotification | null>(
    null
  );
  const [popupNotificationsRevision, setPopupNotificationsRevision] = useState(0);
  const [topUpNoticesRevision, setTopUpNoticesRevision] = useState(0);
  const activeTopUpNotices = useMemo(
    () => listActiveStorefrontTopUpNotices(),
    [topUpNoticesRevision, popupNotificationsRevision]
  );

  useEffect(() => {
    if (!storefrontLoggedIn) {
      setStorefrontPopupOpen(false);
      setActiveStorefrontPopup(null);
      return;
    }
    setNotificationSettings(readStorefrontNotificationSettings());
    const isHomePage =
      storefrontPage === 'shop' &&
      selectedProduct === null &&
      storefrontOrderDetailId === null;
    const popup = resolveActiveStorefrontPopup({
      loggedIn: true,
      isHomePage,
    });
    setActiveStorefrontPopup(popup);
    setStorefrontPopupOpen(Boolean(popup));
  }, [
    storefrontLoggedIn,
    storefrontPage,
    selectedProduct,
    storefrontOrderDetailId,
    popupNotificationsRevision,
  ]);

  useEffect(() => {
    if (!storefrontPopupOpen || !activeStorefrontPopup?.autoCloseEnabled) return;
    const ms = Math.max(1, activeStorefrontPopup.autoCloseHours) * 3_600_000;
    const t = window.setTimeout(() => {
      if (activeStorefrontPopup.oncePerSession) {
        markStorefrontPopupDismissed(activeStorefrontPopup.id);
      }
      setStorefrontPopupOpen(false);
      setActiveStorefrontPopup(null);
    }, ms);
    return () => window.clearTimeout(t);
  }, [storefrontPopupOpen, activeStorefrontPopup]);

  const [storefrontAccountMode, setStorefrontAccountModeState] = useState<StorefrontAccountMode>(() =>
    getStorefrontAccountMode()
  );
  const isStorefrontResellerMode = isStorefrontResellerAccountMode(storefrontAccountMode);
  const isStorefrontBuyerMode = isStorefrontBuyerAccountMode(storefrontAccountMode);
  const isStorefrontSellerMode = isStorefrontSellerAccountMode(storefrontAccountMode);
  const isStorefrontCustomerMode = isStorefrontCustomerAccountMode(storefrontAccountMode);

  /** Ví tách theo vai trò — Người mua dùng `walletBalanceVnd` (App); bán / Reseller bắt đầu 0đ. */
  const [sellerWalletVnd, setSellerWalletVnd] = useState(() =>
    getStorefrontRoleWalletVnd(storefrontBuyerEmail, 'seller')
  );
  const [resellerWalletVnd, setResellerWalletVnd] = useState(() =>
    getStorefrontRoleWalletVnd(storefrontBuyerEmail, 'reseller')
  );
  const [sellerWithdrawRevision, setSellerWithdrawRevision] = useState(0);

  useEffect(() => {
    setSellerWalletVnd(getStorefrontRoleWalletVnd(storefrontBuyerEmail, 'seller'));
    setResellerWalletVnd(getStorefrontRoleWalletVnd(storefrontBuyerEmail, 'reseller'));
  }, [storefrontBuyerEmail]);

  useEffect(() => {
    setStorefrontRoleWalletVnd(storefrontBuyerEmail, 'seller', sellerWalletVnd);
  }, [storefrontBuyerEmail, sellerWalletVnd]);

  useEffect(() => {
    setStorefrontRoleWalletVnd(storefrontBuyerEmail, 'reseller', resellerWalletVnd);
  }, [storefrontBuyerEmail, resellerWalletVnd]);

  const activeWalletVnd = useMemo(() => {
    if (isStorefrontBuyerMode) return walletBalanceVnd;
    if (isStorefrontSellerMode) return sellerWalletVnd;
    return resellerWalletVnd;
  }, [
    isStorefrontBuyerMode,
    isStorefrontSellerMode,
    walletBalanceVnd,
    sellerWalletVnd,
    resellerWalletVnd,
  ]);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFAModal, setTwoFAModal] = useState<null | 'enable' | 'disable'>(null);
  const [twoFAEnableStep, setTwoFAEnableStep] = useState<'setup' | 'verify'>('setup');
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFASubmitting, setTwoFASubmitting] = useState(false);
  const [twoFACopyHint, setTwoFACopyHint] = useState('');
  const twoFACodeInputRef = useRef<HTMLInputElement>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showTelegramConnectSuccess, setShowTelegramConnectSuccess] = useState(false);
  const [showTelegramDisconnectConfirm, setShowTelegramDisconnectConfirm] = useState(false);
  const [telegramNotifPrefsTick, setTelegramNotifPrefsTick] = useState(0);
  const [showSellerRegistrationModal, setShowSellerRegistrationModal] = useState(false);
  const [sellerRegRevision, setSellerRegRevision] = useState(0);
  const [registerPanelSignal, setRegisterPanelSignal] = useState(0);
  const [telegramLinkTick, setTelegramLinkTick] = useState(0);
  // Edit profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: getStorefrontHoVaTenForEmail(storefrontBuyerEmail),
    phone: '0987654321',
    email: storefrontBuyerEmail,
    facebook: 'https://facebook.com/benson',
  });

  /** Họ và tên đã lưu theo email (chỉ từ «Chỉnh sửa hồ sơ»); tiêu đề header fallback `getSessionDisplayName()` (đăng nhập). */
  const profileHoVaTenStored = getStorefrontHoVaTenForEmail(storefrontBuyerEmail);
  const storefrontHeaderDisplayName = profileHoVaTenStored || getSessionDisplayName();
  const storefrontLoginUsername =
    getSessionLoginUsername() || capStorefrontUsername(storefrontBuyerName);

  const basicProfile = useMemo(
    () =>
      buildStorefrontBasicProfile({
        username: storefrontLoginUsername,
        displayName: storefrontHeaderDisplayName,
        email: storefrontBuyerEmail,
        allOrders,
        gianHangCategories: storefrontAdminGianHangCategories,
      }),
    [
      storefrontLoginUsername,
      storefrontHeaderDisplayName,
      storefrontBuyerEmail,
      allOrders,
      storefrontAdminGianHangCategories,
      telegramLinkTick,
    ]
  );

  const publicSellerProfile = useMemo(() => {
    if (!publicProfileSeller) return null;
    return buildStorefrontBasicProfile({
      username: publicProfileSeller,
      displayName: publicProfileSeller,
      email: '',
      allOrders,
      gianHangCategories: storefrontAdminGianHangCategories,
    });
  }, [publicProfileSeller, allOrders, storefrontAdminGianHangCategories]);

  /** Đồng bộ form hồ sơ khi email session đổi (đăng nhập tài khoản khác). */
  useEffect(() => {
    setProfileForm((f) => ({
      ...f,
      fullName: getStorefrontHoVaTenForEmail(storefrontBuyerEmail),
      email: storefrontBuyerEmail,
    }));
  }, [storefrontBuyerEmail]);

  const loginSessions = useMemo(() => {
    if (!storefrontLoggedIn || !storefrontBuyerEmail.trim()) return [];
    return getStorefrontLoginSessions(storefrontBuyerEmail);
  }, [storefrontLoggedIn, storefrontBuyerEmail, loginSessionsRevision]);

  const currentLoginSessionId = useMemo(() => getCurrentStorefrontSessionId(), []);

  useEffect(() => {
    if (!storefrontLoggedIn || !storefrontBuyerEmail.trim()) return;
    if (storefrontPage !== 'account' || accountTab !== 'settings') return;
    recordStorefrontLoginSession(storefrontBuyerEmail);
    setLoginSessionsRevision(r => r + 1);
  }, [storefrontLoggedIn, storefrontBuyerEmail, storefrontPage, accountTab]);

  useEffect(() => {
    setIs2FAEnabled(isStorefront2FAEnabled(storefrontBuyerEmail));
  }, [storefrontBuyerEmail]);

  useEffect(() => {
    if (twoFAModal === 'disable' || (twoFAModal === 'enable' && twoFAEnableStep === 'verify')) {
      queueMicrotask(() => twoFACodeInputRef.current?.focus());
    }
  }, [twoFAModal, twoFAEnableStep]);

  const closeTwoFAModal = useCallback(() => {
    setTwoFAModal(null);
    setTwoFAEnableStep('setup');
    setTwoFACode('');
    setTwoFAError('');
    setTwoFASubmitting(false);
    setTwoFACopyHint('');
  }, []);

  const openTwoFAModalFromToggle = useCallback(() => {
    if (is2FAEnabled) {
      setTwoFAModal('disable');
      setTwoFACode('');
      setTwoFAError('');
      queueMicrotask(() => twoFACodeInputRef.current?.focus());
      return;
    }
    setTwoFAModal('enable');
    setTwoFAEnableStep('setup');
    setTwoFACode('');
    setTwoFAError('');
  }, [is2FAEnabled]);

  const handleTwoFACodeChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    setTwoFACode(digits);
    if (twoFAError) setTwoFAError('');
  };

  const confirmEnable2FA = () => {
    if (!verifyStorefront2FACode(twoFACode)) {
      setTwoFAError('Mã không đúng. Kiểm tra app xác thực và thử lại.');
      return;
    }
    setTwoFASubmitting(true);
    setStorefront2FAEnabled(storefrontBuyerEmail, true);
    setIs2FAEnabled(true);
    setTwoFASubmitting(false);
    closeTwoFAModal();
  };

  const confirmDisable2FA = () => {
    if (!verifyStorefront2FACode(twoFACode)) {
      setTwoFAError('Mã 2FA không đúng. Không thể tắt bảo mật 2 lớp.');
      return;
    }
    setTwoFASubmitting(true);
    setStorefront2FAEnabled(storefrontBuyerEmail, false);
    setIs2FAEnabled(false);
    setTwoFASubmitting(false);
    closeTwoFAModal();
  };

  const copyTwoFASecret = async () => {
    try {
      await navigator.clipboard.writeText(STOREFRONT_2FA_DEMO_SECRET);
      setTwoFACopyHint('Đã sao chép khóa');
      window.setTimeout(() => setTwoFACopyHint(''), 2000);
    } catch {
      setTwoFACopyHint('Không sao chép được');
    }
  };

  // Password form state
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [headerDropdown, setHeaderDropdown] = useState<null | 'product' | 'service' | 'tools'>(null);
  /** Mở trang gian hàng riêng (không cuộn trong trang hub). Thoát chi tiết đơn / sản phẩm để header luôn điều hướng được. */
  const openCatalogPage = useCallback(() => {
    setStorefrontOrderDetailId(null);
    setSelectedProduct(null);
    setPublicProfileSeller(null);
    setCatalogSellerFilter(null);
    setCatalogFavoritesOnly(false);
    setStorefrontPage('shop-catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openFavoriteShopsPage = useCallback(() => {
    setStorefrontOrderDetailId(null);
    setSelectedProduct(null);
    setPublicProfileSeller(null);
    setCatalogSellerFilter(null);
    setCatalogFavoritesOnly(true);
    setStorefrontPage('shop-catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openSellerShopCatalog = useCallback(
    (params: { username: string; displayName?: string; email?: string }) => {
      const username = params.username.trim();
      if (!username) return;
      setStorefrontOrderDetailId(null);
      setSelectedProduct(null);
      setCatalogSellerFilter({
        username,
        displayName: (params.displayName || username).trim() || username,
        email: params.email?.trim() || undefined,
      });
      setCatalogFavoritesOnly(false);
      setStorefrontPage('shop-catalog');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const openSellerPublicProfile = useCallback((sellerName: string) => {
    const name = sellerName.trim();
    if (!name) return;
    setSelectedProduct(null);
    setStorefrontOrderDetailId(null);
    setCatalogSellerFilter(null);
    setPublicProfileSeller(name);
    setStorefrontPage('public-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openResellerHub = useCallback(() => {
    setSelectedProduct(null);
    setStorefrontOrderDetailId(null);
    setStorefrontPage('reseller-hub');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openMessagesPage = useCallback((threadId?: string | null) => {
    setStorefrontOrderDetailId(null);
    setSelectedProduct(null);
    setMessagesInitialThreadId(threadId ?? null);
    setStorefrontPage('messages');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openStorefrontSupportChat = useCallback(() => {
    setUserMenuOpen(false);
    const threadId = buildSupportThreadIdForBuyerEmail(
      storefrontBuyerEmail,
      storefrontHeaderDisplayName
    );
    openMessagesPage(threadId);
  }, [storefrontBuyerEmail, storefrontHeaderDisplayName, openMessagesPage]);

  const openStorefrontSupportPage = useCallback(() => {
    setSelectedProduct(null);
    setStorefrontOrderDetailId(null);
    setPublicProfileSeller(null);
    setHeaderDropdown(null);
    setUserMenuOpen(false);
    setStorefrontPage('support');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openStorefrontSharePage = useCallback(() => {
    setGuestInfoTab(null);
    setSelectedProduct(null);
    setStorefrontOrderDetailId(null);
    setPublicProfileSeller(null);
    setHeaderDropdown(null);
    setUserMenuOpen(false);
    setStorefrontPage('share');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openStorefrontToolsPage = useCallback((toolId: StorefrontToolId = 'check-live-fb') => {
    setGuestInfoTab(null);
    setSelectedProduct(null);
    setStorefrontOrderDetailId(null);
    setPublicProfileSeller(null);
    setHeaderDropdown(null);
    setUserMenuOpen(false);
    setStorefrontPage(toolIdToStorefrontPage(toolId));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openStorefrontInfo = useCallback(
    (tab: StorefrontInfoTabId) => {
      if (storefrontLoggedIn) {
        setStorefrontInfoTab(tab);
        setSelectedProduct(null);
        setStorefrontOrderDetailId(null);
        setPublicProfileSeller(null);
        setStorefrontPage('info');
      } else {
        setGuestInfoTab(tab);
        setSelectedProduct(null);
        setStorefrontOrderDetailId(null);
        setStorefrontPage('shop');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [storefrontLoggedIn]
  );

  const openGuestCatalog = useCallback((line: StorefrontLine) => {
    setGuestInfoTab(null);
    setSelectedProduct(null);
    setStorefrontOrderDetailId(null);
    setCatalogSellerFilter(null);
    setCatalogFavoritesOnly(false);
    setActiveStorefrontLine(line);
    setStorefrontPage('shop-catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const favoriteProductKeys = useMemo(
    () => new Set(listStorefrontFavoriteKeys(storefrontBuyerEmail)),
    [storefrontBuyerEmail, favoritesRevision]
  );

  const isProductFavorited = useCallback(
    (product: Product) => favoriteProductKeys.has(productToFavoriteKey(product)),
    [favoriteProductKeys]
  );

  const toggleFavoriteProduct = useCallback(
    (product: Product) => {
      toggleStorefrontFavorite(storefrontBuyerEmail, productToFavoriteKey(product));
      setFavoritesRevision((r) => r + 1);
    },
    [storefrontBuyerEmail]
  );

  const openGuestCatalogWithCategory = useCallback(
    (categoryName: string, line: StorefrontLine) => {
      setSelectedCategories([categoryName]);
      openGuestCatalog(line);
    },
    [openGuestCatalog]
  );

  const applyGuestHubSearch = useCallback(
    ({
      category,
      productTypes,
      sortLabel,
      query,
    }: {
      category: string | null;
      productTypes: string[];
      sortLabel: string;
      query: string;
    }) => {
      const sortMap: Record<string, string> = {
        'Mới nhất': 'newest',
        'Phổ biến': 'popular',
        'Giá tăng dần': 'price-asc',
        'Giá giảm dần': 'price-desc',
      };
      setActiveSort(sortMap[sortLabel] ?? 'popular');
      setCatalogSearchQuery(query);
      let line: StorefrontLine = 'Bán sản phẩm';
      if (category) {
        setSelectedCategories([category]);
        const isService = storefrontServiceTypesByCategory[category] !== undefined;
        const isProduct = storefrontProductTypesByCategory[category] !== undefined;
        if (isService && !isProduct) line = 'Dịch vụ';
        else if (isProduct) line = 'Bán sản phẩm';
      } else {
        setSelectedCategories([]);
      }
      setDraftCatalogProductTypes(productTypes);
      setAppliedCatalogProductTypes(productTypes);
      setDraftCatalogPriceMin('');
      setDraftCatalogPriceMax('');
      setAppliedCatalogPriceMin(null);
      setAppliedCatalogPriceMax(null);
      openGuestCatalog(line);
    },
    [openGuestCatalog, storefrontProductTypesByCategory, storefrontServiceTypesByCategory]
  );

  const handleGuestLogoClick = useCallback(() => {
    setGuestInfoTab(null);
    setSelectedProduct(null);
    setStorefrontOrderDetailId(null);
    setStorefrontPage('shop');
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigate]);

  const guestBrowseMode =
    !storefrontLoggedIn &&
    guestInfoTab === null &&
    (storefrontPage === 'shop-catalog' || selectedProduct !== null);

  useEffect(() => {
    if (storefrontPage !== 'messages') {
      setMessagesInitialThreadId(null);
      setMessagesProductSeed(null);
    }
  }, [storefrontPage]);

  // Payment history states
  const [paymentHistoryActiveTab, setPaymentHistoryActiveTab] = useState(() =>
    isStorefrontCustomerAccountMode(getStorefrontAccountMode()) ? 'transaction' : 'payment'
  );
  const [paymentHistoryCurrentPage, setPaymentHistoryCurrentPage] = useState(1);
  const [paymentHistoryIsFilterOpen, setPaymentHistoryIsFilterOpen] = useState(false);
  const [paymentHistoryIsWithdrawModalOpen, setPaymentHistoryIsWithdrawModalOpen] = useState(false);
  const [paymentHistorySelectedFilter, setPaymentHistorySelectedFilter] = useState('Tất cả');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const headerDropdownRef = useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const storefrontLoadThrottleRef = useRef(0);

  const applyStorefrontAccountMode = useCallback((mode: StorefrontAccountMode) => {
    setStorefrontAccountModeState(mode);
    setStorefrontAccountMode(mode);
    setSelectedProduct(null);
    setStorefrontOrderDetailId(null);
    setUserMenuOpen(false);
    setStorefrontPage(current => {
      if (mode === 'reseller') {
        if (current === 'messages' || current === 'account') return current;
        return 'reseller-hub';
      }
      if (mode === 'buyer') {
        if (current === 'reseller-hub') return 'shop';
        return current;
      }
      if (mode === 'seller') {
        if (
          current === 'my-orders' ||
          current === 'top-up' ||
          current === 'reseller-hub'
        ) {
          return 'shop-catalog';
        }
        return current;
      }
      return current;
    });
    if (mode === 'reseller') {
      setPaymentHistoryActiveTab('transaction');
      setPaymentHistorySelectedFilter('Tất cả');
    }
    if (isStorefrontCustomerAccountMode(mode)) {
      setPaymentHistoryActiveTab(tab =>
        tab === 'payment' || tab === 'withdraw' ? 'transaction' : tab
      );
      setPaymentHistorySelectedFilter(f =>
        f === 'Bán hàng' || f === 'Reseller' ? 'Tất cả' : f
      );
    } else {
      setPaymentHistoryActiveTab(tab => (tab === 'transaction' ? 'payment' : tab));
      setPaymentHistorySelectedFilter('Tất cả');
    }
  }, []);

  useEffect(() => {
    const nav = location.state as StorefrontMessagesNavState | null;
    if (!nav?.openStorefrontMessages && !nav?.messagesThreadId) return;
    if (nav.forceSellerAccountMode) {
      applyStorefrontAccountMode('seller');
    }
    setMessagesProductSeed(null);
    openMessagesPage(nav.messagesThreadId ?? null);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate, openMessagesPage, applyStorefrontAccountMode]);

  useEffect(() => {
    const fromUrl = parseResellerRefFromSearch(window.location.search);
    if (fromUrl) {
      writeResellerReferrerToStorage(fromUrl);
      setResellerReferrer(fromUrl);
      return;
    }
    const stored = readResellerReferrerFromStorage();
    if (stored) setResellerReferrer(stored);
  }, []);

  useEffect(() => {
    if (!isStorefrontBuyerMode) return;
    const gianId = selectedProduct?.adminGianHangId?.trim();
    if (!gianId) {
      const stored = readResellerReferrerFromStorage();
      if (stored?.viaLink) setResellerReferrer(stored);
      return;
    }
    const fromUrl = parseResellerRefFromSearch(window.location.search);
    const stored = readResellerReferrerFromStorage();
    const candidate = fromUrl ?? stored;
    const active =
      candidate &&
      resolveResellerReferrerForBuyerCheckout({
        storedReferrer: candidate,
        gianHangId: gianId,
        buyerEmail: storefrontBuyerEmail,
        isBuyerAccountMode: true,
      });
    const ref = active ?? buildDemoResellerReferrerForGian(gianId);
    writeResellerReferrerToStorage(ref);
    setResellerReferrer(ref);
  }, [isStorefrontBuyerMode, selectedProduct?.adminGianHangId, storefrontBuyerEmail]);

  const paymentHistoryFilterOptions = useMemo((): readonly string[] => {
    if (isStorefrontResellerMode) {
      return ['Tất cả', 'Reseller', 'Hoàn 1 phần'];
    }
    if (isStorefrontBuyerMode) {
      return ['Tất cả', 'Mua hàng', 'Reseller', 'Rút tiền', 'Nạp tiền', 'Hoàn 1 phần', 'Khác'];
    }
    if (isStorefrontCustomerMode) return ['Tất cả', 'Mua hàng', 'Nạp tiền', 'Khác'];
    if (paymentHistoryActiveTab === 'transaction') {
      return ['Tất cả', 'Bán hàng', 'Nạp tiền', 'Hoàn tiền', 'Hoàn 1 phần', 'Khác'];
    }
    if (paymentHistoryActiveTab === 'withdraw') return ['Tất cả'];
    return ['Tất cả', 'Hoàn thành', 'Hoàn 1 phần', 'Đang tạm giữ', 'Sản phẩm', 'Dịch vụ'];
  }, [isStorefrontCustomerMode, isStorefrontBuyerMode, isStorefrontResellerMode, paymentHistoryActiveTab]);

  const paymentHistoryTabs = isStorefrontCustomerMode
    ? [{ id: 'transaction' as const, label: 'Lịch sử giao dịch' }]
    : [
        { id: 'payment' as const, label: 'Lịch sử thanh toán' },
        { id: 'transaction' as const, label: 'Lịch sử giao dịch' },
        { id: 'withdraw' as const, label: 'Rút tiền' },
      ];

  useEffect(() => {
    if (isStorefrontCustomerMode && (paymentHistoryActiveTab === 'payment' || paymentHistoryActiveTab === 'withdraw')) {
      setPaymentHistoryActiveTab('transaction');
    }
  }, [isStorefrontCustomerMode, paymentHistoryActiveTab]);

  const sellerIdentityKeys = useMemo(() => {
    const keys = new Set<string>();
    const add = (s: string | undefined) => {
      const t = s?.trim();
      if (t) keys.add(t);
    };
    add(storefrontBuyerName);
    add(storefrontHeaderDisplayName);
    add(getSessionDisplayName());
    add(getSessionLoginUsername());
    for (const cat of flattenStorefrontAdminGianHang(storefrontAdminGianHangCategories)) {
      add(cat.sellerDisplayName);
      add(cat.createdByName);
      cat.products?.forEach(p => add(typeof p.sellerName === 'string' ? p.sellerName : undefined));
    }
    return keys;
  }, [storefrontBuyerName, storefrontHeaderDisplayName, storefrontAdminGianHangCategories]);

  const resellerIdentityExtras = useMemo(() => {
    const extras: string[] = [];
    const login = getSessionLoginUsername();
    if (login.trim()) extras.push(login.trim());
    const emailNorm = storefrontBuyerEmail.trim().toLowerCase();
    for (const r of resellerRequests) {
      if (r.requesterEmail.trim().toLowerCase() !== emailNorm) continue;
      if (r.requesterName?.trim()) extras.push(r.requesterName.trim());
    }
    return extras;
  }, [resellerRequests, storefrontBuyerEmail]);

  const flattenedAdminGianHang = useMemo(
    () => flattenStorefrontAdminGianHang(storefrontAdminGianHangCategories),
    [storefrontAdminGianHangCategories]
  );

  const messageThreads = useMemo(
    () =>
      buildStorefrontMessageThreads({
        accountMode: storefrontAccountMode,
        currentLogin: getSessionLoginUsername() || storefrontBuyerName,
        currentDisplayName: storefrontHeaderDisplayName,
        currentEmail: storefrontBuyerEmail,
        sellerIdentityKeys,
        resellerIdentityExtras,
        orders: allOrders,
        adminGianHangCategories: flattenedAdminGianHang,
        seedSellerName: messagesProductSeed?.sellerName,
        seedStoreName: messagesProductSeed?.storeName,
        seedAvatarUrl: messagesProductSeed?.avatarUrl,
        seedPlatform: messagesProductSeed?.platform,
      }),
    [
      storefrontAccountMode,
      storefrontBuyerName,
      storefrontHeaderDisplayName,
      storefrontBuyerEmail,
      sellerIdentityKeys,
      resellerIdentityExtras,
      allOrders,
      flattenedAdminGianHang,
      messagesProductSeed,
      messagesReadRevision,
    ]
  );

  const unreadMessageCount = useMemo(
    () => messageThreads.reduce((sum, t) => sum + t.unreadCount, 0),
    [messageThreads]
  );

  const userNotifications = useMemo(
    () => listStorefrontUserNotifications(storefrontBuyerEmail),
    [storefrontBuyerEmail, userNotifRevision]
  );

  const unreadUserNotifCount = useMemo(
    () => countUnreadStorefrontUserNotifications(storefrontBuyerEmail),
    [storefrontBuyerEmail, userNotifRevision]
  );

  const bumpMessagesReadRevision = useCallback(() => {
    setMessagesReadRevision(n => n + 1);
  }, []);

  const bumpUserNotifRevision = useCallback(() => {
    setUserNotifRevision(n => n + 1);
  }, []);

  const openStorefrontRegister = useCallback(() => {
    setRegisterPanelSignal(n => n + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleMarkTelegramLinked = useCallback(() => {
    setStorefrontTelegramLinked(storefrontBuyerEmail, true);
    setTelegramLinkTick(t => t + 1);
    setShowTelegramModal(false);
    setShowTelegramConnectSuccess(true);
  }, [storefrontBuyerEmail]);

  const isStorefrontSellerForTelegram =
    isStorefrontSellerMode ||
    basicProfile.gianHangCount > 0 ||
    isSellerRegistrationApproved(storefrontBuyerEmail);

  const sellerRegHubButtonLabel = useMemo(() => {
    if (!storefrontLoggedIn) return 'Đăng ký bán hàng';
    if (hasPendingSellerRegistration(storefrontBuyerEmail)) return 'Xem đơn đăng ký';
    return 'Đăng ký bán hàng';
  }, [storefrontLoggedIn, storefrontBuyerEmail, sellerRegRevision]);

  const telegramOrderNotifEnabled = useMemo(
    () => isStorefrontTelegramOrderNotifEnabled(storefrontBuyerEmail),
    [storefrontBuyerEmail, telegramNotifPrefsTick]
  );

  const toggleTelegramOrderNotif = useCallback(() => {
    setStorefrontTelegramOrderNotifEnabled(
      storefrontBuyerEmail,
      !isStorefrontTelegramOrderNotifEnabled(storefrontBuyerEmail)
    );
    setTelegramNotifPrefsTick(t => t + 1);
  }, [storefrontBuyerEmail]);

  const handleLogoutLoginSession = useCallback(
    (session: StorefrontLoginSession) => {
      revokeStorefrontLoginSession(storefrontBuyerEmail, session.id);
      setLoginSessionsRevision(r => r + 1);
      setOpenLoginSessionMenuId(null);
      if (session.id === currentLoginSessionId) {
        onStorefrontLogout();
      }
    },
    [storefrontBuyerEmail, currentLoginSessionId, onStorefrontLogout]
  );

  const handleDisconnectTelegram = useCallback(() => {
    setShowTelegramDisconnectConfirm(true);
  }, []);

  const confirmDisconnectTelegram = useCallback(() => {
    setStorefrontTelegramLinked(storefrontBuyerEmail, false);
    setTelegramLinkTick(t => t + 1);
    setShowTelegramDisconnectConfirm(false);
    setShowTelegramModal(false);
  }, [storefrontBuyerEmail]);

  useEffect(() => {
    if (!storefrontLoggedIn || !storefrontBuyerEmail.trim()) return;
    const emailNorm = storefrontBuyerEmail.trim().toLowerCase();
    const onUserNotify = (event: Event) => {
      const detail = (event as CustomEvent<{ email?: string }>).detail;
      if (detail?.email?.toLowerCase() !== emailNorm) return;
      bumpUserNotifRevision();
      const latest = listStorefrontUserNotifications(storefrontBuyerEmail).find(n => !n.read);
      if (latest) {
        setUserNotifToast({ title: latest.title, content: latest.content });
      }
    };
    const onMessagesChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ email?: string }>).detail;
      if (detail?.email?.toLowerCase() !== emailNorm) return;
      bumpMessagesReadRevision();
    };
    window.addEventListener('taphoammo-storefront-user-notify', onUserNotify);
    window.addEventListener('taphoammo-storefront-messages-changed', onMessagesChanged);
    return () => {
      window.removeEventListener('taphoammo-storefront-user-notify', onUserNotify);
      window.removeEventListener('taphoammo-storefront-messages-changed', onMessagesChanged);
    };
  }, [
    storefrontLoggedIn,
    storefrontBuyerEmail,
    bumpUserNotifRevision,
    bumpMessagesReadRevision,
  ]);

  useEffect(() => {
    if (!userNotifPanelOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!userNotifPanelRef.current?.contains(e.target as Node)) {
        setUserNotifPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [userNotifPanelOpen]);

  useEffect(() => {
    if (!userNotifToast) return;
    const t = window.setTimeout(() => setUserNotifToast(null), 8000);
    return () => window.clearTimeout(t);
  }, [userNotifToast]);

  const sellerPayoutRows = useMemo(
    () => (isStorefrontCustomerMode ? [] : buildSellerPayoutRows(allOrders, sellerIdentityKeys)),
    [allOrders, sellerIdentityKeys, isStorefrontCustomerMode]
  );

  const sellerWithdrawnTotalVnd = useMemo(() => {
    if (!isStorefrontSellerMode || !storefrontBuyerEmail.trim()) return 0;
    return getSellerWithdrawnVnd(storefrontBuyerEmail);
  }, [isStorefrontSellerMode, storefrontBuyerEmail, sellerWithdrawRevision]);

  /** Khả dụng rút = tiền đã bán được (đã vào ví) − đã rút. */
  const sellerAvailableWithdrawVnd = isStorefrontSellerMode ? sellerWalletVnd : 0;

  const sellerWithdrawTableRows = useMemo(() => {
    if (!isStorefrontSellerMode) {
      return PAYMENT_HISTORY_MOCK_WITHDRAWALS;
    }
    return getSellerWithdrawHistory(storefrontBuyerEmail).map(r => ({
      id: r.id,
      date: formatSellerWithdrawDate(r.createdAtMs),
      amount: r.amountVnd,
      status: r.status === 'Success' ? ('Success' as const) : ('Processing' as const),
      description: `Thực hiện rút tiền vào tài khoản: ${r.bankName} — ${r.accountNumber} (${r.accountHolder})`,
    }));
  }, [isStorefrontSellerMode, storefrontBuyerEmail, sellerWithdrawRevision]);

  const handleSellerWithdrawSuccess = useCallback(
    (record: SellerWithdrawRecord) => {
      setSellerWalletVnd(w => Math.max(0, w - record.amountVnd));
      const dateStr = formatSellerWithdrawDate(record.createdAtMs);
      setPaymentHistoryCheckoutItems(prev => {
        const ledgerId = `sell-wd-${record.id}`;
        if (prev.some(p => p.id === ledgerId)) return prev;
        return [
          {
            id: ledgerId,
            date: dateStr,
            type: 'Withdraw',
            amount: -record.amountVnd,
            reason: `Rút tiền vào ${record.bankName} — ${record.accountNumber}`,
            transactionCode: record.id,
          },
          ...prev,
        ];
      });
      setSellerWithdrawRevision(r => r + 1);
    },
    [setPaymentHistoryCheckoutItems]
  );

  const filteredSellerPayoutRows = useMemo(() => {
    return sellerPayoutRows.filter(row => {
      if (paymentHistorySelectedFilter === 'Tất cả') return true;
      if (paymentHistorySelectedFilter === 'Hoàn thành') return row.escrowStatus === 'completed';
      if (paymentHistorySelectedFilter === 'Hoàn 1 phần') return row.escrowStatus === 'partial_refund';
      if (paymentHistorySelectedFilter === 'Đang tạm giữ') return row.escrowStatus === 'holding';
      if (paymentHistorySelectedFilter === 'Sản phẩm') return row.orderType === 'product';
      if (paymentHistorySelectedFilter === 'Dịch vụ') return row.orderType === 'service';
      return true;
    });
  }, [sellerPayoutRows, paymentHistorySelectedFilter]);

  const paymentHistoryTransactionRows = useMemo(() => {
    /** Reseller: chỉ hoa hồng giới thiệu — không lẫn mua hàng / mock người mua. */
    if (isStorefrontResellerMode) {
      return paymentHistoryCheckoutItems.filter(item => item.type === 'Reseller');
    }
    if (isStorefrontBuyerMode) {
      return [...paymentHistoryCheckoutItems, ...PAYMENT_HISTORY_MOCK_HISTORY].filter(item => {
        if (item.type === 'Selling') return false;
        return true;
      });
    }
    if (isStorefrontSellerMode) {
      return paymentHistoryCheckoutItems.filter(
        item => item.type === 'Selling' || item.type === 'Withdraw'
      );
    }
    return paymentHistoryCheckoutItems.filter(item => {
      if (item.type === 'Buying') return false;
      return true;
    });
  }, [
    paymentHistoryCheckoutItems,
    isStorefrontCustomerMode,
    isStorefrontSellerMode,
    isStorefrontBuyerMode,
    isStorefrontResellerMode,
  ]);

  const filteredPaymentHistoryTransactionRows = useMemo(() => {
    return paymentHistoryTransactionRows.filter(item => {
      if (paymentHistorySelectedFilter === 'Tất cả') return true;
      if (paymentHistorySelectedFilter === 'Reseller') {
        return item.type === 'Reseller';
      }
      if (paymentHistorySelectedFilter === 'Rút tiền') {
        return item.type === 'Withdraw';
      }
      if (paymentHistorySelectedFilter === 'Mua hàng' || paymentHistorySelectedFilter === 'Bán hàng') {
        return item.type === 'Buying' || item.type === 'Selling';
      }
      if (paymentHistorySelectedFilter === 'Nạp tiền') return item.type === 'Top-up';
      if (paymentHistorySelectedFilter === 'Hoàn tiền' || paymentHistorySelectedFilter === 'Refund') {
        return item.type === 'Refund' && !(item.reason ?? '').includes('một phần');
      }
      if (paymentHistorySelectedFilter === 'Hoàn 1 phần') {
        const reason = item.reason ?? '';
        return (
          (item.type === 'Refund' && reason.includes('một phần')) ||
          (item.type === 'Selling' && reason.includes('hoàn 1 phần')) ||
          (item.type === 'Reseller' && reason.includes('phần còn lại'))
        );
      }
      return true;
    });
  }, [paymentHistoryTransactionRows, paymentHistorySelectedFilter]);

  /** Lịch sử giao dịch: mỗi dòng = số dư trước GD ± số tiền GD = số dư sau (chuỗi từ mới → cũ, neo vào số dư ví hiện tại). */
  const transactionHistoryWithRunningBalance = useMemo(() => {
    let balanceAfter = activeWalletVnd;
    return filteredPaymentHistoryTransactionRows.map((item) => {
      const balanceBefore = balanceAfter - item.amount;
      const row = { item, balanceBefore, balanceAfter };
      balanceAfter = balanceBefore;
      return row;
    });
  }, [activeWalletVnd, filteredPaymentHistoryTransactionRows]);

  const paymentHistoryListLength = useMemo(() => {
    if (paymentHistoryActiveTab === 'payment') {
      return isStorefrontCustomerMode
        ? PAYMENT_HISTORY_MOCK_TRANSACTIONS.length
        : filteredSellerPayoutRows.length;
    }
    if (paymentHistoryActiveTab === 'transaction') {
      return filteredPaymentHistoryTransactionRows.length;
    }
    return sellerWithdrawTableRows.length;
  }, [
    paymentHistoryActiveTab,
    isStorefrontCustomerMode,
    filteredSellerPayoutRows.length,
    filteredPaymentHistoryTransactionRows.length,
    sellerWithdrawTableRows.length,
  ]);

  const storefrontCategoryOptions = useMemo(
    () => storefrontDanhMucBanSanPham.map(name => ({ name })),
    [storefrontDanhMucBanSanPham]
  );

  const storefrontServiceCategoryOptions = useMemo(
    () => storefrontDanhMucDichVu.map(name => ({ name })),
    [storefrontDanhMucDichVu]
  );

  const normalizeTypeLabel = useCallback((label: string) => {
    // Ví dụ: "Tài khoản FB (4%)" -> "Tài khoản FB"
    // Ví dụ: "Dịch vụ code tool (6%)" -> "Dịch vụ code tool"
    return label.replace(/\s*\(\s*[\d.,]+\s*%?\s*\)\s*$/, '').trim();
  }, []);

  const sidebarLine = useMemo<StorefrontLine>(() => {
    if (selectedCategories.length === 0) return 'Bán sản phẩm';
    const hasProduct = selectedCategories.some(k => storefrontProductTypesByCategory[k] !== undefined);
    const hasService = selectedCategories.some(k => storefrontServiceTypesByCategory[k] !== undefined);
    if (hasService && !hasProduct) return 'Dịch vụ';
    if (hasProduct && !hasService) return 'Bán sản phẩm';
    // Nếu chọn trộn cả 2 line (hiếm), ưu tiên line đang ở main menu
    return activeStorefrontLine;
  }, [selectedCategories, storefrontProductTypesByCategory, storefrontServiceTypesByCategory, activeStorefrontLine]);

  const sidebarCategoryOptions = useMemo(() => {
    return sidebarLine === 'Bán sản phẩm' ? storefrontCategoryOptions : storefrontServiceCategoryOptions;
  }, [sidebarLine, storefrontCategoryOptions, storefrontServiceCategoryOptions]);

  const sidebarTypeOptions = useMemo(() => {
    if (selectedCategories.length === 0) return [];
    const out: string[] = [];
    for (const catKey of selectedCategories) {
      const productTypes = storefrontProductTypesByCategory[catKey] ?? [];
      const serviceTypes = storefrontServiceTypesByCategory[catKey] ?? [];
      // Một category key thường chỉ thuộc 1 line, nhưng keep safe để sync đúng.
      out.push(...productTypes, ...serviceTypes);
    }
    return out;
  }, [selectedCategories, storefrontProductTypesByCategory, storefrontServiceTypesByCategory]);

  useEffect(() => {
    // Khi Admin thêm/xóa/sửa loại sản phẩm, hoặc người dùng đổi category,
    // lọc các type đã tick để tránh checkbox "kẹt" ở giá trị không còn tồn tại.
    const prune = (prev: string[]) => prev.filter((t) => sidebarTypeOptions.includes(t));
    setDraftCatalogProductTypes(prune);
    setAppliedCatalogProductTypes(prune);
  }, [sidebarTypeOptions]);

  const applyCatalogSidebarFilters = useCallback(() => {
    setAppliedCatalogProductTypes([...draftCatalogProductTypes]);
    let min = parseCatalogFilterPriceInput(draftCatalogPriceMin);
    let max = parseCatalogFilterPriceInput(draftCatalogPriceMax);
    if (min != null && max != null && min > max) {
      [min, max] = [max, min];
    }
    setAppliedCatalogPriceMin(min);
    setAppliedCatalogPriceMax(max);
  }, [draftCatalogProductTypes, draftCatalogPriceMin, draftCatalogPriceMax]);

  const mainLineTypeSet = useMemo(() => {
    const typeMap = activeStorefrontLine === 'Bán sản phẩm' ? storefrontProductTypesByCategory : storefrontServiceTypesByCategory;
    const order = activeStorefrontLine === 'Bán sản phẩm' ? storefrontDanhMucBanSanPham : storefrontDanhMucDichVu;
    const out: string[] = [];
    for (const catKey of order) out.push(...(typeMap[catKey] ?? []));
    // Phần dư (nếu có) xếp cuối theo A-Z tiếng Việt (để không mất dữ liệu)
    for (const catKey of Object.keys(typeMap)) {
      if (!order.includes(catKey)) out.push(...(typeMap[catKey] ?? []));
    }
    return new Set(out.map(normalizeTypeLabel));
  }, [
    activeStorefrontLine,
    storefrontProductTypesByCategory,
    storefrontServiceTypesByCategory,
    storefrontDanhMucBanSanPham,
    storefrontDanhMucDichVu,
    normalizeTypeLabel,
  ]);

  const mainCategoryTypeSet = useMemo(() => {
    if (selectedCategories.length === 0) return new Set<string>();
    const out: string[] = [];
    for (const catKey of selectedCategories) {
      out.push(...(storefrontProductTypesByCategory[catKey] ?? []));
      out.push(...(storefrontServiceTypesByCategory[catKey] ?? []));
    }
    return new Set(out.map(normalizeTypeLabel));
  }, [selectedCategories, storefrontProductTypesByCategory, storefrontServiceTypesByCategory, normalizeTypeLabel]);

  const selectedMainLineTypeSet = useMemo(() => {
    // Nếu user đã tick type thuộc line hiện tại -> áp dụng lọc theo type.
    // Nếu tick nhầm line (do trước đó user chọn category khác), bỏ qua type để không làm rỗng danh sách.
    const normalized = appliedCatalogProductTypes.map(normalizeTypeLabel);
    const matched = normalized.filter(l => mainLineTypeSet.has(l));
    return new Set(matched);
  }, [appliedCatalogProductTypes, normalizeTypeLabel, mainLineTypeSet]);

  const catalogSidebarFiltersActive =
    appliedCatalogProductTypes.length > 0 ||
    appliedCatalogPriceMin != null ||
    appliedCatalogPriceMax != null;

  useEffect(() => {
    const allowed = new Set([...storefrontDanhMucBanSanPham, ...storefrontDanhMucDichVu]);
    setSelectedCategories(prev => prev.filter(x => allowed.has(x)));
  }, [storefrontDanhMucBanSanPham, storefrontDanhMucDichVu]);

  useEffect(() => {
    if (!headerDropdown) return;
    const onDown = (e: MouseEvent) => {
      const el = headerDropdownRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setHeaderDropdown(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [headerDropdown]);

  const storefrontTop1Context = useMemo(
    () =>
      resolveStorefrontTop1Context(
        storefrontAdminGianHangCategories as Category[],
        gianHangTop1State ?? { records: {} }
      ),
    [storefrontAdminGianHangCategories, gianHangTop1State]
  );

  const storefrontAdminCatalogProducts = useMemo(() => {
    const leaves = flattenStorefrontAdminGianHang(storefrontAdminGianHangCategories);
    const out: Product[] = [];
    for (const c of leaves) {
      const p = storefrontAdminGianHangToProduct(c);
      if (p) {
        out.push(applyTop1FlagsToStorefrontProduct(p, storefrontTop1Context));
      }
    }
    return out;
  }, [storefrontAdminGianHangCategories, storefrontTop1Context]);

  const storefrontSponsoredHubItems = useMemo((): ShopHubSponsoredItem[] => {
    const fromAdmin = sortSponsoredProductsByCategorySelection(
      storefrontAdminCatalogProducts.filter(
        (p) =>
          p.adminGianHangId &&
          storefrontTop1Context.sponsoredIds.has(p.adminGianHangId)
      ),
      selectedCategories,
      storefrontTop1Context
    )
      .slice(0, SPONSORED_ADS_DISPLAY_MAX)
      .map(adminProductToSponsoredHubItem);
    if (fromAdmin.length > 0) return fromAdmin;
    return sponsoredAds.slice(0, SPONSORED_ADS_DISPLAY_MAX).map((ad) => ({
      id: ad.id,
      title: ad.title,
      seller: ad.seller,
      sellerInitial: ad.sellerInitial,
      rating: ad.rating,
      reviews: ad.reviews,
      sold: ad.sold,
      stock: 999,
      description: ad.description,
      businessLine: ad.businessLine,
      price: ad.price,
      image: ad.image,
      promoBadges: ad.promoBadges,
    }));
  }, [
    storefrontAdminCatalogProducts,
    storefrontTop1Context,
    selectedCategories,
  ]);

  const storefrontFullCatalogMerged = useMemo(
    () => [...storefrontAdminCatalogProducts, ...STOREFRONT_FULL_CATALOG],
    [storefrontAdminCatalogProducts]
  );

  const filteredStorefrontProducts = useMemo(() => {
    return storefrontFullCatalogMerged.filter(p => {
      const label = p.productTypeLabel;
      if (!label) return false;
      const normalized = normalizeTypeLabel(label);
      if (!mainLineTypeSet.has(normalized)) return false;
      if (selectedCategories.length > 0 && !mainCategoryTypeSet.has(normalized)) return false;
      if (selectedMainLineTypeSet.size > 0 && !selectedMainLineTypeSet.has(normalized)) return false;
      if (appliedCatalogPriceMin != null || appliedCatalogPriceMax != null) {
        const { min, max } = getStorefrontProductPriceBounds(p);
        if (min <= 0 && max <= 0) return false;
        if (appliedCatalogPriceMin != null && max < appliedCatalogPriceMin) return false;
        if (appliedCatalogPriceMax != null && min > appliedCatalogPriceMax) return false;
      }
      return true;
    });
  }, [
    storefrontFullCatalogMerged,
    mainLineTypeSet,
    normalizeTypeLabel,
    selectedMainLineTypeSet,
    selectedCategories.length,
    mainCategoryTypeSet,
    appliedCatalogPriceMin,
    appliedCatalogPriceMax,
  ]);

  const sortedStorefrontProducts = useMemo(() => {
    const sortAdminGianHangNewestFirst = (a: Product, b: Product) => {
      const ta = a.storefrontCreatedAt ?? 0;
      const tb = b.storefrontCreatedAt ?? 0;
      if (tb !== ta) return tb - ta;
      return b.id - a.id;
    };

    const pinTop1 = (list: Product[]) =>
      sortStorefrontProductsWithTop1First(list, storefrontTop1Context);

    const admin = filteredStorefrontProducts.filter(p => p.adminGianHangId);
    const rest = filteredStorefrontProducts.filter(p => !p.adminGianHangId);

    if (activeSort === 'popular') {
      admin.sort(sortAdminGianHangNewestFirst);
      rest.sort((a, b) => b.sold - a.sold);
      return pinTop1([...admin, ...rest]);
    }
    if (activeSort === 'newest') {
      const arr = [...filteredStorefrontProducts];
      arr.sort(sortAdminGianHangNewestFirst);
      return pinTop1(arr);
    }
    if (activeSort === 'price-asc' || activeSort === 'price-desc') {
      const byPrice = (a: Product, b: Product) => {
        const pa = parsePriceToVndNumber(a.price);
        const pb = parsePriceToVndNumber(b.price);
        return activeSort === 'price-desc' ? pb - pa : pa - pb;
      };
      admin.sort(sortAdminGianHangNewestFirst);
      rest.sort(byPrice);
      return pinTop1([...admin, ...rest]);
    }
    return pinTop1([...filteredStorefrontProducts]);
  }, [activeSort, filteredStorefrontProducts, storefrontTop1Context]);

  const [storefrontVisibleCount, setStorefrontVisibleCount] = useState(8);

  const catalogSearchTrim = catalogSearchQuery.trim().toLowerCase();

  const catalogSellerMatchContext = useMemo(() => {
    if (!catalogSellerFilter) return null;
    const keys = buildStorefrontSellerMatchKeys(
      catalogSellerFilter.username,
      catalogSellerFilter.displayName,
      catalogSellerFilter.email
    );
    const gianHangIds = collectGianHangIdsForSellerKeys(storefrontAdminGianHangCategories, keys);
    return {
      keys,
      gianHangIds,
      label: catalogSellerFilter.displayName || catalogSellerFilter.username,
      username: catalogSellerFilter.username,
    };
  }, [catalogSellerFilter, storefrontAdminGianHangCategories]);

  const sellerScopedStorefrontProducts = useMemo(() => {
    let list = sortedStorefrontProducts;
    if (catalogSellerMatchContext) {
      list = list.filter((p) =>
        storefrontProductMatchesSeller(
          p,
          catalogSellerMatchContext.keys,
          catalogSellerMatchContext.gianHangIds
        )
      );
    }
    if (catalogFavoritesOnly) {
      list = list.filter((p) => favoriteProductKeys.has(productToFavoriteKey(p)));
    }
    return list;
  }, [
    sortedStorefrontProducts,
    catalogSellerMatchContext,
    catalogFavoritesOnly,
    favoriteProductKeys,
  ]);

  const searchedStorefrontProducts = useMemo(() => {
    if (!catalogSearchTrim) return sellerScopedStorefrontProducts;
    return sellerScopedStorefrontProducts.filter((p) => {
      const haystack = [
        p.name,
        p.seller,
        p.description,
        p.businessProducts ?? '',
        p.productTypeLabel ?? '',
        ...(p.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(catalogSearchTrim);
    });
  }, [sellerScopedStorefrontProducts, catalogSearchTrim]);

  useEffect(() => {
    setStorefrontVisibleCount(8);
  }, [activeSort, catalogSearchTrim, catalogSellerFilter, catalogFavoritesOnly, catalogSidebarFiltersActive]);

  const displayedStorefrontProducts = useMemo(
    () => searchedStorefrontProducts.slice(0, storefrontVisibleCount),
    [searchedStorefrontProducts, storefrontVisibleCount]
  );

  const storefrontRemaining = Math.max(0, searchedStorefrontProducts.length - storefrontVisibleCount);

  const loadMoreStorefront = useCallback(() => {
    setStorefrontVisibleCount((c) => Math.min(c + 8, searchedStorefrontProducts.length));
  }, [searchedStorefrontProducts.length]);

  useEffect(() => {
    if (selectedProduct || storefrontPage !== 'shop-catalog') return;
    const el = loadMoreSentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        const now = Date.now();
        if (now - storefrontLoadThrottleRef.current < 550) return;
        storefrontLoadThrottleRef.current = now;
        setStorefrontVisibleCount(c => {
          if (c >= searchedStorefrontProducts.length) return c;
          return Math.min(c + 8, searchedStorefrontProducts.length);
        });
      },
      { root: null, rootMargin: '300px 0px', threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [selectedProduct, storefrontPage, searchedStorefrontProducts.length, storefrontVisibleCount]);

  const myPurchasedOrders = useMemo(() => {
    return allOrders
      .filter(o => o.buyerName === storefrontBuyerName)
      .sort((a, b) => orderNewestSortKey(b) - orderNewestSortKey(a));
  }, [allOrders, storefrontBuyerName]);

  const setMyPurchasedOrders = useCallback<React.Dispatch<React.SetStateAction<Order[]>>>(
    updater => {
      setAllOrders(prev => {
        const others = prev.filter(o => o.buyerName !== storefrontBuyerName);
        const mine = prev.filter(o => o.buyerName === storefrontBuyerName);
        const next = typeof updater === 'function' ? (updater as (m: Order[]) => Order[])(mine) : updater;
        return [...others, ...next];
      });
    },
    [setAllOrders, storefrontBuyerName]
  );

  /** Đơn Thất bại sau khi đã trừ ví (checkout): hoàn tiền vào ví + dòng Refund trong Lịch sử giao dịch (mã đơn = GD-…). */
  useEffect(() => {
    for (const p of paymentHistoryCheckoutItems) {
      if (p.id.startsWith('refund-')) {
        storefrontRefundRecordedOrderIds.add(p.id.slice('refund-'.length));
      }
    }
    for (const o of myPurchasedOrders) {
      if (o.status !== 'Thất bại' || !o.checkoutPaid) continue;
      const amt = getResolvedRefundVnd(o);
      if (amt <= 0) continue;
      if (storefrontRefundRecordedOrderIds.has(o.id)) continue;
      storefrontRefundRecordedOrderIds.add(o.id);
      const rid = `refund-${o.id}`;
      const partial = isPartialRefundOrder(o);
      const partialQty =
        partial && o.partialRefundQuantity != null && o.quantity > 0
          ? ` (${o.partialRefundQuantity}/${o.quantity} SP)`
          : '';
      setPaymentHistoryCheckoutItems(prev => {
        if (prev.some(p => p.id === rid)) return prev;
        return [
          {
            id: rid,
            date: formatPurchaseDateNow(),
            type: 'Refund',
            amount: amt,
            reason: partial
              ? `Hoàn tiền một phần đơn ${o.id}${partialQty}.`
              : `Hoàn tiền đơn hàng thất bại (${o.id}).`,
            transactionCode: o.id,
          },
          ...prev,
        ];
      });
      setWalletBalanceVnd(w => w + amt);
    }
  }, [myPurchasedOrders, paymentHistoryCheckoutItems, setPaymentHistoryCheckoutItems, setWalletBalanceVnd]);

  /** Người bán: đơn Hoàn thành → cộng doanh thu vào ví người bán + dòng Selling. */
  useEffect(() => {
    const pendingLedgers: PaymentHistoryItem[] = [];
    let walletCredit = 0;
    for (const o of allOrders) {
      if (!isOrderForSeller(o, sellerIdentityKeys)) continue;
      if (o.status !== 'Hoàn thành' || !o.checkoutPaid) continue;
      if (storefrontSellerPayoutRecordedOrderIds.has(o.id)) continue;
      const ledger = buildSellerEscrowReleaseLedgerItem(o);
      if (ledger.amount <= 0) continue;
      storefrontSellerPayoutRecordedOrderIds.add(o.id);
      pendingLedgers.push(ledger);
      walletCredit += ledger.amount;
    }
    if (pendingLedgers.length === 0) return;
    setPaymentHistoryCheckoutItems(prev => {
      const toAdd = pendingLedgers.filter(l => !prev.some(p => p.id === l.id));
      if (toAdd.length === 0) return prev;
      return [...toAdd, ...prev];
    });
    if (walletCredit > 0) {
      setSellerWalletVnd(w => w + walletCredit);
    }
  }, [allOrders, sellerIdentityKeys, setPaymentHistoryCheckoutItems]);

  /** Người bán: đơn hoàn 1 phần (khách chấp nhận) → cộng doanh thu phần còn lại vào ví người bán. */
  useEffect(() => {
    for (const p of paymentHistoryCheckoutItems) {
      if (p.id.startsWith('sell-partial-')) {
        storefrontSellerPartialPayoutRecordedOrderIds.add(p.id.slice('sell-partial-'.length));
      }
    }
    const pendingLedgers: PaymentHistoryItem[] = [];
    let walletCredit = 0;
    for (const o of allOrders) {
      if (!isOrderForSeller(o, sellerIdentityKeys)) continue;
      if (!isPartialRefundOrder(o) || o.refundOfferStatus !== 'accepted' || !o.checkoutPaid) continue;
      if (storefrontSellerPartialPayoutRecordedOrderIds.has(o.id)) continue;
      const ledger = buildSellerPartialRefundPayoutLedgerItem(o);
      if (ledger.amount <= 0) continue;
      storefrontSellerPartialPayoutRecordedOrderIds.add(o.id);
      pendingLedgers.push(ledger);
      walletCredit += ledger.amount;
    }
    if (pendingLedgers.length === 0) return;
    setPaymentHistoryCheckoutItems(prev => {
      const toAdd = pendingLedgers.filter(l => !prev.some(p => p.id === l.id));
      if (toAdd.length === 0) return prev;
      return [...toAdd, ...prev];
    });
    if (walletCredit > 0) {
      setSellerWalletVnd(w => w + walletCredit);
    }
  }, [allOrders, paymentHistoryCheckoutItems, sellerIdentityKeys, setPaymentHistoryCheckoutItems]);

  /** Reseller: đơn hoàn 1 phần → hoa hồng trên phần doanh thu còn lại. */
  useEffect(() => {
    for (const p of paymentHistoryCheckoutItems) {
      if (p.id.startsWith('reseller-partial-')) {
        storefrontResellerPartialPayoutRecordedOrderIds.add(p.id.slice('reseller-partial-'.length));
      }
    }
    const pendingPartial: PaymentHistoryItem[] = [];
    let walletPartial = 0;
    for (const o of allOrders) {
      if (
        !isOrderForResellerReferrer(
          o,
          storefrontBuyerEmail,
          storefrontBuyerName,
          getSessionLoginUsername(),
          resellerIdentityExtras
        )
      ) {
        continue;
      }
      if (!isPartialRefundOrder(o) || o.refundOfferStatus !== 'accepted' || !o.checkoutPaid) continue;
      if (storefrontResellerPartialPayoutRecordedOrderIds.has(o.id)) continue;
      const ledger = buildResellerCommissionLedgerItem(o);
      if (!ledger || ledger.amount <= 0) continue;
      storefrontResellerPartialPayoutRecordedOrderIds.add(o.id);
      pendingPartial.push(ledger);
      walletPartial += ledger.amount;
    }
    if (pendingPartial.length > 0) {
      setPaymentHistoryCheckoutItems(prev => {
        const toAdd = pendingPartial.filter(l => !prev.some(p => p.id === l.id));
        if (toAdd.length === 0) return prev;
        return [...toAdd, ...prev];
      });
      if (walletPartial > 0) setResellerWalletVnd(w => w + walletPartial);
    }
  }, [
    allOrders,
    paymentHistoryCheckoutItems,
    storefrontBuyerEmail,
    storefrontBuyerName,
    resellerIdentityExtras,
    setPaymentHistoryCheckoutItems,
  ]);

  /** Reseller: đơn Hoàn thành có hoa hồng → cộng ví Reseller + dòng lịch sử. */
  useEffect(() => {
    for (const p of paymentHistoryCheckoutItems) {
      if (p.id.startsWith('reseller-') && !p.id.startsWith('reseller-partial-')) {
        storefrontResellerPayoutRecordedOrderIds.add(p.id.slice('reseller-'.length));
      }
    }
    const pendingLedgers: PaymentHistoryItem[] = [];
    let walletCredit = 0;
    for (const o of allOrders) {
      if (
        !isOrderForResellerReferrer(
          o,
          storefrontBuyerEmail,
          storefrontBuyerName,
          getSessionLoginUsername(),
          resellerIdentityExtras
        )
      ) {
        continue;
      }
      if (o.status !== 'Hoàn thành' || !o.checkoutPaid) continue;
      if (storefrontResellerPayoutRecordedOrderIds.has(o.id)) continue;
      const ledger = buildResellerCommissionLedgerItem(o);
      if (!ledger || ledger.amount <= 0) continue;
      storefrontResellerPayoutRecordedOrderIds.add(o.id);
      pendingLedgers.push(ledger);
      walletCredit += ledger.amount;
    }
    if (pendingLedgers.length === 0) return;
    setPaymentHistoryCheckoutItems(prev => {
      const toAdd = pendingLedgers.filter(l => !prev.some(p => p.id === l.id));
      if (toAdd.length === 0) return prev;
      return [...toAdd, ...prev];
    });
    if (walletCredit > 0) {
      setResellerWalletVnd(w => w + walletCredit);
    }
  }, [
    allOrders,
    paymentHistoryCheckoutItems,
    storefrontBuyerEmail,
    storefrontBuyerName,
    resellerIdentityExtras,
    setPaymentHistoryCheckoutItems,
  ]);

  const detailOrder = storefrontOrderDetailId
    ? allOrders.find(o => o.id === storefrontOrderDetailId)
    : undefined;

  const handleReportDefectiveItems = useCallback(
    (orderId: string, itemIds: string[]) => {
      setAllOrders(prev =>
        prev.map(o => (o.id === orderId ? reportDefectiveItemsOnOrder(o, itemIds) : o))
      );
    },
    [setAllOrders]
  );

  const handleUploadDefectiveItems = useCallback(
    (orderId: string, payload: { text: string }) => {
      const totalLines = payload.text.split(/\r?\n/).filter(l => l.trim()).length;
      let matched = 0;
      setAllOrders(prev =>
        prev.map(o => {
          if (o.id !== orderId) return o;
          const uids = new Set((o.deliveredItems ?? []).map(i => i.id));
          const lines = parseDefectiveUploadText(payload.text, uids);
          matched = lines.length;
          return applyDefectiveUploadToOrder(o, lines);
        })
      );
      return { matched, skipped: Math.max(0, totalLines - matched) };
    },
    [setAllOrders]
  );

  const openPurchasedOrderDetail = useCallback(
    (orderId: string) => {
      const order = allOrders.find(o => o.id === orderId);
      if (order && isPreOrderAwaitingFulfillment(order)) {
        setPurchasedOrdersStatusFilter('Đặt trước');
      }
      setStorefrontOrderDetailId(orderId);
    },
    [allOrders]
  );

  const backFromPurchasedOrderDetail = useCallback(() => {
    if (storefrontOrderDetailId) {
      const order = allOrders.find(o => o.id === storefrontOrderDetailId);
      if (order && isPreOrderAwaitingFulfillment(order)) {
        setPurchasedOrdersStatusFilter('Đặt trước');
      }
    }
    setStorefrontOrderDetailId(null);
  }, [allOrders, storefrontOrderDetailId]);

  const navigateToMyPurchasedOrders = useCallback(
    (orderId?: string) => {
      setStorefrontAccountModeState('buyer');
      setStorefrontAccountMode('buyer');
      setSelectedProduct(null);
      setStorefrontPage('my-orders');
      setUserMenuOpen(false);
      const order = orderId ? allOrders.find(o => o.id === orderId) : undefined;
      if (order && isPreOrderAwaitingFulfillment(order)) {
        setStorefrontOrderDetailId(null);
      } else if (orderId) {
        setStorefrontOrderDetailId(orderId);
      } else {
        setStorefrontOrderDetailId(null);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [allOrders]
  );

  /** Sau đặt trước — danh sách lọc «Tất cả», không mở chi tiết kho trống. */
  const navigateAfterPreOrderSuccess = useCallback(() => {
    setStorefrontAccountModeState('buyer');
    setStorefrontAccountMode('buyer');
    setSelectedProduct(null);
    setStorefrontPage('my-orders');
    setPurchasedOrdersStatusFilter('Tất cả');
    setStorefrontOrderDetailId(null);
    setUserMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /** Đơn đã mua chỉ dùng chế độ Người mua — chuyển trang thay vì ép lại buyer (tránh xung đột Reseller). */
  useEffect(() => {
    if (storefrontPage !== 'my-orders') return;
    if (isStorefrontBuyerAccountMode(storefrontAccountMode)) return;
    setStorefrontOrderDetailId(null);
    setSelectedProduct(null);
    if (isStorefrontResellerAccountMode(storefrontAccountMode)) {
      setStorefrontPage('reseller-hub');
    } else {
      setStorefrontPage('shop-catalog');
    }
  }, [storefrontPage, storefrontAccountMode]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [userMenuOpen]);

  return (
    <div className="min-h-screen bg-slate-100/90 font-sans">
      <AnimationStyles />
      {accessDeniedFlash && (
        <div
          className="bg-amber-50 border-b border-amber-200 text-amber-950 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          role="alert"
        >
          <p className="text-sm font-medium pr-4">{accessDeniedFlash}</p>
          {onDismissAccessDeniedFlash && (
            <button
              type="button"
              onClick={onDismissAccessDeniedFlash}
              className="shrink-0 text-sm font-bold text-amber-900 underline hover:no-underline"
            >
              Đóng
            </button>
          )}
        </div>
      )}

      {storefrontLoggedIn || guestBrowseMode ? (
      <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header — top bar (ngôn ngữ) + thanh emerald chính */}
      {storefrontLoggedIn ? (
      <div className="sticky top-0 z-50">
      <StorefrontTopBar />
      {isAdminImpersonatingStorefront() && (
        <div className="bg-amber-500 border-b border-amber-600 text-white text-[12px] font-semibold py-2 px-4 flex flex-wrap items-center justify-center gap-3">
          <span>
            Admin đang xem với tư cách:{' '}
            <b className="font-bold">{getAdminImpersonateTargetEmail() || storefrontBuyerEmail}</b>
          </span>
          <button
            type="button"
            onClick={() => {
              clearAdminImpersonateFlag();
              window.location.href = '/admin/panel';
            }}
            className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-[11px] font-bold"
          >
            Thoát chế độ admin
          </button>
        </div>
      )}
      <header className="bg-emerald-500 shadow-md border-b border-emerald-600/25">
        <div className="max-w-[2000px] mx-auto px-8 min-h-16 flex items-center justify-between gap-8">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-9 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                navigate('/');
                setSelectedProduct(null);
                setStorefrontOrderDetailId(null);
                setStorefrontPage('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label="Về trang bán hàng"
            >
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 font-bold text-xl shadow-lg">
                T
              </div>
              <span className="text-xl font-black text-white tracking-tight font-display">TapHoaMMO</span>
            </button>

            <nav className="hidden lg:flex items-center gap-0.5 text-sm font-medium text-white" ref={headerDropdownRef}>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setStorefrontOrderDetailId(null);
                    setSelectedProduct(null);
                    setActiveStorefrontLine('Bán sản phẩm');
                    setHeaderDropdown(v => (v === 'product' ? null : 'product'));
                  }}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1 ${
                    headerDropdown === 'product'
                      ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/25'
                      : 'hover:bg-white/15 hover:text-emerald-100'
                  }`}
                  aria-expanded={headerDropdown === 'product'}
                  aria-haspopup="menu"
                >
                  {headerT.products}{' '}
                  <ChevronDown
                    size={14}
                    className={`opacity-90 transition-transform duration-200 ${headerDropdown === 'product' ? 'rotate-180' : ''}`}
                  />
                </button>
                {headerDropdown === 'product' && (
                  <StorefrontHeaderNavCategoryDropdown
                    variant="product"
                    menuTitle={headerT.products}
                    categories={storefrontCategoryOptions}
                    selectedCategories={selectedCategories}
                    emptyLabel={headerT.noCategories}
                    onSelectCategory={(name) => {
                      setSelectedCategories([name]);
                            setHeaderDropdown(null);
                            openCatalogPage();
                          }}
                  />
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setStorefrontOrderDetailId(null);
                    setSelectedProduct(null);
                    setActiveStorefrontLine('Dịch vụ');
                    setHeaderDropdown(v => (v === 'service' ? null : 'service'));
                  }}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1 ${
                    headerDropdown === 'service'
                      ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/25'
                      : 'hover:bg-white/15 hover:text-emerald-100'
                  }`}
                  aria-expanded={headerDropdown === 'service'}
                  aria-haspopup="menu"
                >
                  {headerT.services}{' '}
                  <ChevronDown
                    size={14}
                    className={`opacity-90 transition-transform duration-200 ${headerDropdown === 'service' ? 'rotate-180' : ''}`}
                  />
                </button>
                {headerDropdown === 'service' && (
                  <StorefrontHeaderNavCategoryDropdown
                    variant="service"
                    menuTitle={headerT.services}
                    categories={storefrontServiceCategoryOptions}
                    selectedCategories={selectedCategories}
                    emptyLabel={headerT.noCategories}
                    onSelectCategory={(name) => {
                      setSelectedCategories([name]);
                      setHeaderDropdown(null);
                      openCatalogPage();
                    }}
                  />
                )}
              </div>
                        <button
                type="button"
                onClick={openStorefrontSupportPage}
                className={`px-3.5 py-2 rounded-lg transition-colors ${
                  storefrontPage === 'support'
                    ? 'bg-white/20 text-white font-semibold'
                    : 'hover:bg-white/15 hover:text-emerald-100'
                }`}
              >
                {headerT.support}
              </button>
              <button
                type="button"
                onClick={openStorefrontSharePage}
                className={`px-3.5 py-2 rounded-lg transition-colors ${
                  storefrontPage === 'share'
                    ? 'bg-white/20 text-white font-semibold'
                    : 'hover:bg-white/15 hover:text-emerald-100'
                }`}
              >
                {headerT.share}
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setStorefrontOrderDetailId(null);
                    setSelectedProduct(null);
                    setHeaderDropdown(v => (v === 'tools' ? null : 'tools'));
                  }}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1 ${
                    headerDropdown === 'tools' || isStorefrontToolPage(storefrontPage)
                      ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/25'
                      : 'hover:bg-white/15 hover:text-emerald-100'
                  }`}
                  aria-expanded={headerDropdown === 'tools'}
                  aria-haspopup="menu"
                >
                  {headerT.tools}{' '}
                  <ChevronDown
                    size={14}
                    className={`opacity-90 transition-transform duration-200 ${headerDropdown === 'tools' ? 'rotate-180' : ''}`}
                  />
                </button>
                {headerDropdown === 'tools' && (
                  <StorefrontHeaderNavToolsDropdown
                    menuTitle={headerT.tools}
                    activeToolId={storefrontPageToToolId(storefrontPage)}
                    onSelectTool={toolId => openStorefrontToolsPage(toolId)}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setHeaderDropdown(null);
                  openStorefrontInfo('faq');
                }}
                className={`px-3.5 py-2 rounded-lg transition-colors ${
                  storefrontPage === 'info' && storefrontInfoTab === 'faq'
                    ? 'bg-white/20 text-white font-semibold'
                    : 'hover:bg-white/15 hover:text-emerald-100'
                }`}
              >
                {headerT.faqs}
              </button>
              <button
                          type="button"
                          onClick={() => {
                  setSelectedProduct(null);
                  setStorefrontOrderDetailId(null);
                  setStorefrontPage('top-up');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3.5 py-2 rounded-lg transition-colors ${
                  storefrontPage === 'top-up'
                    ? 'bg-amber-400/25 text-amber-50 font-semibold'
                    : 'hover:bg-amber-400/20 hover:text-amber-100 text-amber-200 font-semibold'
                }`}
              >
                {headerT.topUp}
                        </button>
            </nav>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3.5 flex-shrink-0">
            {isStorefrontResellerMode && (
              <button
                type="button"
                onClick={() => {
                  openResellerHub();
                  setUserMenuOpen(false);
                }}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold transition-colors border ${
                  storefrontPage === 'reseller-hub'
                    ? 'bg-white text-violet-700 border-white shadow-sm'
                    : 'bg-violet-500/25 text-white border-violet-300/40 hover:bg-violet-500/40'
                }`}
              >
                <Handshake size={15} />
                Reseller
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1 text-sm">
              <span className="text-white">{headerT.balance}:</span>
              <span className="font-bold text-amber-200 tabular-nums">{formatStorefrontMoney(activeWalletVnd)}</span>
            </div>
            <div className="relative" ref={userNotifPanelRef}>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  setUserNotifPanelOpen(o => !o);
                }}
                className={`relative text-white p-1.5 rounded-lg transition-colors ${
                  userNotifPanelOpen ? 'bg-white/25' : 'hover:text-emerald-100 hover:bg-white/15'
                }`}
                aria-label="Thông báo"
              >
              <Bell size={19} />
                {unreadUserNotifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold border-2 border-white/30 tabular-nums">
                    {unreadUserNotifCount > 9 ? '9+' : unreadUserNotifCount}
                  </span>
                )}
            </button>
              {userNotifPanelOpen && (
                <div className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 bg-white shadow-2xl z-[120] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-sm font-bold text-slate-800">Thông báo</p>
                    {unreadUserNotifCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          markAllStorefrontUserNotificationsRead(storefrontBuyerEmail);
                          bumpUserNotifRevision();
                        }}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {userNotifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-slate-500">Chưa có thông báo.</p>
                    ) : (
                      userNotifications.map(item => {
                        const notifiedAt = new Date(item.createdAtIso);
                        const notifiedAtLabel = `${notifiedAt.toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} ${notifiedAt.toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}`;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (!item.read) {
                                markStorefrontUserNotificationRead(storefrontBuyerEmail, item.id);
                                bumpUserNotifRevision();
                              }
                              if (
                                item.kind === 'seller_registration_approved' ||
                                item.kind === 'seller_registration_rejected'
                              ) {
                                setUserNotifPanelOpen(false);
                                openStorefrontSupportChat();
                              }
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                              item.read ? 'opacity-75' : 'bg-emerald-50/40'
                            }`}
                          >
                            <p className="text-sm font-bold text-slate-800">{item.title}</p>
                            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{item.content}</p>
                            <p className="text-[10px] text-slate-400 mt-2 text-right tabular-nums">
                              {notifiedAtLabel}
                            </p>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(false);
                setMessagesProductSeed(null);
                openMessagesPage(null);
              }}
              className={`relative flex items-center gap-1.5 text-white border px-3 py-1.5 rounded-full transition-all shadow-sm ${
                storefrontPage === 'messages'
                  ? 'bg-white/25 border-white/40'
                  : 'bg-white/10 hover:bg-white/20 border-white/20'
              }`}
              title={headerT.messages}
            >
              <MessageCircle size={15} strokeWidth={2} />
              <span className="text-xs font-semibold hidden lg:inline">{headerT.messages}</span>
              {unreadMessageCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold tabular-nums border-2 border-emerald-600 shadow-sm"
                  aria-label={`${unreadMessageCount} tin nhắn mới`}
                >
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </span>
              )}
            </button>
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(o => !o)}
                className="w-9 h-9 rounded-full bg-white/20 border border-white/35 flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label="Menu tài khoản"
              >
                <User size={17} />
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-[min(calc(100vw-32px),280px)] rounded-xl border border-gray-200 bg-white shadow-xl z-[60] overflow-hidden py-0"
                  role="menu"
                >
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 flex-shrink-0 ring-2 ring-white shadow-sm">
                      <User size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                      <p className="text-[13px] font-bold text-gray-900 truncate">{storefrontBuyerName}</p>
                        <span
                          className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                            isStorefrontResellerMode
                              ? 'bg-violet-50 text-violet-700 border border-violet-200'
                              : isStorefrontBuyerMode
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isStorefrontResellerMode
                            ? 'Reseller'
                            : isStorefrontBuyerMode
                              ? 'Người mua'
                              : 'Người bán'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">{storefrontBuyerEmail}</p>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-b border-gray-100 bg-slate-50/80">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Chế độ tài khoản
                    </p>
                    <div
                      className="grid grid-cols-3 p-0.5 rounded-lg bg-gray-200/80 gap-0.5"
                      role="group"
                      aria-label="Chế độ tài khoản"
                    >
                      <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={storefrontAccountMode === 'seller'}
                        onClick={() => applyStorefrontAccountMode('seller')}
                        className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-md text-[10px] font-bold transition-all ${
                          storefrontAccountMode === 'seller'
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <Store size={13} className="shrink-0" />
                        Người bán
                      </button>
                      <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={storefrontAccountMode === 'reseller'}
                        onClick={() => applyStorefrontAccountMode('reseller')}
                        className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-md text-[10px] font-bold transition-all ${
                          storefrontAccountMode === 'reseller'
                            ? 'bg-white text-violet-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <Handshake size={13} className="shrink-0" />
                        Reseller
                      </button>
                      <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={storefrontAccountMode === 'buyer'}
                        onClick={() => applyStorefrontAccountMode('buyer')}
                        className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-md text-[10px] font-bold transition-all ${
                          storefrontAccountMode === 'buyer'
                            ? 'bg-white text-sky-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <ShoppingBag size={13} className="shrink-0" />
                        Người mua
                      </button>
                    </div>
                    {isStorefrontResellerMode && (
                      <p className="text-[10px] text-violet-700/90 mt-2 leading-snug">
                        Bạn là người giới thiệu: chia sẻ link SP — khi khách ở chế độ Người mua đặt hàng qua link, bạn
                        nhận hoa hồng Reseller.
                      </p>
                    )}
                    {isStorefrontBuyerMode && (
                      <p className="text-[10px] text-sky-700/90 mt-2 leading-snug">
                        Người mua (demo): hoa hồng Reseller (
                        {resellerReferrer?.name ?? STOREFRONT_VIRTUAL_ACCOUNT.username}) tự áp dụng khi thanh toán
                        gian có Reseller — không cần mở link COPY.
                      </p>
                    )}
                  </div>

                  <div className="py-1">
                    {(
                      [
                        {
                          label: 'Thông tin tài khoản',
                          onSelect: () => {
                            setSelectedProduct(null);
                            setStorefrontOrderDetailId(null);
                            setAccountTab('settings');
                            setStorefrontPage('account');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          },
                        },
                        ...(isStorefrontResellerMode
                          ? ([
                              {
                                label: 'Quản lý Reseller',
                                onSelect: () => {
                                  openResellerHub();
                                },
                              },
                            ] as const)
                          : []),
                        ...(isStorefrontBuyerMode
                          ? ([
                        {
                          label: 'Đơn hàng đã mua',
                          onSelect: () => {
                            setSelectedProduct(null);
                            setStorefrontOrderDetailId(null);
                            setStorefrontPage('my-orders');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          },
                        },
                            ] as const)
                          : []),
                        {
                          label: 'Gian hàng yêu thích',
                          onSelect: () => {
                            setSelectedProduct(null);
                            setStorefrontOrderDetailId(null);
                            openFavoriteShopsPage();
                          },
                        },
                        ...(isStorefrontBuyerMode
                          ? ([
                              {
                                label: 'Nạp tiền',
                                onSelect: () => {
                                  setSelectedProduct(null);
                                  setStorefrontOrderDetailId(null);
                                  setStorefrontPage('top-up');
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                },
                              },
                            ] as const)
                          : []),
                        {
                          label: isStorefrontCustomerMode ? 'Lịch sử giao dịch' : 'Lịch sử thanh toán',
                          onSelect: () => {
                            setSelectedProduct(null);
                            setStorefrontOrderDetailId(null);
                            setStorefrontPage('payment-history');
                            setPaymentHistoryActiveTab(isStorefrontCustomerMode ? 'transaction' : 'payment');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          },
                        },
                        ...(!isStorefrontCustomerMode
                          ? ([
                        { label: 'Reseller' },
                        { label: 'Quản lý nội dung' },
                            ] as const)
                          : []),
                        { label: 'Đổi mật khẩu' },
                      ] satisfies { label: string; onSelect?: () => void }[]
                    ).map(item => (
                      <button
                        key={item.label}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false);
                          item.onSelect?.();
                        }}
                        className="w-full px-4 py-2.5 text-left text-[13px] text-gray-800 hover:bg-gray-100 transition-colors rounded-lg sm:rounded-xl"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {!isStorefrontCustomerMode && (
                    <>
                  <div className="h-px bg-gray-100" />

                  <div className="py-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigateToAdmin();
                      }}
                      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-[13px] text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                      <span>Quản lý cửa hàng</span>
                          <span className="text-gray-500 tabular-nums">
                            (
                            {sellerPendingPreOrderCount > 0
                              ? `${sellerPendingPreOrderCount} đặt trước`
                              : USER_MENU_STORE_COUNT_FALLBACK}
                            )
                          </span>
                    </button>
                  </div>
                    </>
                  )}

                  <div className="h-px bg-gray-100" />

                  <div className="py-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onStorefrontLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-[13px] font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut size={16} className="text-gray-500 flex-shrink-0" />
                      Thoát
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      </div>
      ) : (
        <StorefrontGuestHeader
          onLogoClick={handleGuestLogoClick}
          productCategories={storefrontCategoryOptions}
          serviceCategories={storefrontServiceCategoryOptions}
          selectedCategories={selectedCategories}
          noCategoriesLabel={headerT.noCategories}
          onSelectProductCategory={name => openGuestCatalogWithCategory(name, 'Bán sản phẩm')}
          onSelectServiceCategory={name => openGuestCatalogWithCategory(name, 'Dịch vụ')}
          onOpenFaqs={() => openStorefrontInfo('faq')}
          onOpenSupport={openStorefrontSupportPage}
          onOpenShare={openStorefrontSharePage}
          onOpenTool={openStorefrontToolsPage}
          activeToolId={storefrontPageToToolId(storefrontPage)}
          sharePageActive={storefrontPage === 'share'}
          authSlot={() => (
            <StorefrontAuthDropdown
              onLoginSuccess={onStorefrontLoginSuccess}
              openRegisterSignal={registerPanelSignal}
            />
          )}
        />
      )}

      <div className={!storefrontLoggedIn ? 'pt-[6.75rem]' : ''}>
      {storefrontLoggedIn && notificationSettings.marqueeEnabled && notificationSettings.marqueeText.trim() ? (
        <div
          className="overflow-hidden py-1.5 bg-slate-50/95 border-b border-red-100/60"
        role="status"
        aria-label="Thông báo chạy"
      >
        <div className="storefront-marquee-track">
          {[0, 1].map(i => (
            <span
              key={i}
              className="inline-flex shrink-0 items-center px-12 text-[13px] font-medium text-red-600"
            >
                {notificationSettings.marqueeText}
            </span>
          ))}
        </div>
      </div>
      ) : null}

      {storefrontLoggedIn &&
      detailOrder &&
      storefrontPage !== 'my-orders' &&
      storefrontPage !== 'reseller-hub' &&
      storefrontPage !== 'top-up' &&
      storefrontPage !== 'messages' &&
      storefrontPage !== 'support' &&
      storefrontPage !== 'share' &&
      !isStorefrontToolPage(storefrontPage) ? (
        detailOrder.order_type === 'service' ? (
          <ServiceOrderDetailView
            order={detailOrder}
            variant="buyer"
            onBack={() => setStorefrontOrderDetailId(null)}
          />
        ) : (
          <OrderDetailView
            order={detailOrder}
            onBack={() => setStorefrontOrderDetailId(null)}
            onReportDefectiveItems={handleReportDefectiveItems}
            onUploadDefectiveItems={handleUploadDefectiveItems}
          />
        )
      ) : selectedProduct ? (
        <ProductDetailView
          product={selectedProduct}
          buyerName={storefrontBuyerName}
          walletBalanceVnd={walletBalanceVnd}
          setWalletBalanceVnd={setWalletBalanceVnd}
          setAllOrders={setAllOrders}
          allOrders={allOrders}
          storefrontMenuLine={activeStorefrontLine}
          storefrontAdminGianHangCategories={storefrontAdminGianHangCategories}
          onFulfillPurchase={onFulfillPurchase}
          onCheckoutPaid={({
            orderId,
            amountVnd,
            purchaseDate,
            balanceBeforeVnd,
            balanceAfterVnd,
            sellerName,
          }) => {
            if (isStorefrontBuyerMode) {
            setPaymentHistoryCheckoutItems((prev) => [
              {
                id: `chk-${orderId}`,
                date: purchaseDate,
                type: 'Buying',
                amount: -amountVnd,
                reason: `Thanh toán cho đơn hàng ${orderId}`,
                transactionCode: orderId,
              },
              ...prev,
            ]);
            }
            onSyncAdminPaymentHistory?.(
              buildAdminPaymentHistoryFromCheckout({
                orderId,
                amountVnd,
                purchaseDate,
                balanceBeforeVnd,
                balanceAfterVnd,
                sellerName,
                buyerLogin: storefrontBuyerName,
                buyerDisplayName: storefrontHeaderDisplayName,
              })
            );
          }}
          onAfterPaymentSuccess={orderId => navigateToMyPurchasedOrders(orderId)}
          onAfterPreOrderSuccess={() => navigateAfterPreOrderSuccess()}
          resellerRequests={resellerRequests}
          onResellerRequestsChange={onResellerRequestsChange}
          storefrontLoggedIn={storefrontLoggedIn}
          storefrontBuyerEmail={storefrontBuyerEmail}
          resellerReferrer={resellerReferrer}
          storefrontAccountMode={storefrontAccountMode}
          onRequireLogin={openStorefrontRegister}
          onOpenSellerProfile={openSellerPublicProfile}
          onOpenMessages={() => {
            const cat = selectedProduct.adminGianHangId
              ? findStorefrontAdminGianHangById(
                  storefrontAdminGianHangCategories,
                  selectedProduct.adminGianHangId
                )
              : undefined;
            setMessagesProductSeed({
              sellerName: selectedProduct.seller,
              storeName: cat?.name,
              avatarUrl: selectedProduct.sellerAvatar,
              platform: cat?.platform,
            });
            openMessagesPage(
              buildBuyerSellerThreadId(
                resolveBuyerPersona({
                  login: getSessionLoginUsername() || storefrontBuyerName,
                  displayName: storefrontHeaderDisplayName,
                  email: storefrontBuyerEmail,
                }).login,
                selectedProduct.seller
              )
            );
          }}
          isFavorited={isProductFavorited(selectedProduct)}
          onToggleFavorite={() => toggleFavoriteProduct(selectedProduct)}
        />
      ) : storefrontPage === 'info' ? (
        <>
          <StorefrontInfoPage
            key={storefrontInfoTab}
            initialTab={storefrontInfoTab}
            onTabChange={setStorefrontInfoTab}
          />
          <StorefrontLandingFooter
            onChatSupport={openStorefrontSupportChat}
            onJoinSeller={() => setShowSellerRegistrationModal(true)}
            onOpenInfo={openStorefrontInfo}
          />
        </>
      ) : storefrontPage === 'support' ? (
        <>
          <StorefrontSupportPage
            isLoggedIn={storefrontLoggedIn}
            onOpenSupportChat={openStorefrontSupportChat}
            onRequireLogin={openStorefrontRegister}
            onOpenFaqs={() => openStorefrontInfo('faq')}
          />
          <StorefrontLandingFooter
            onChatSupport={storefrontLoggedIn ? openStorefrontSupportChat : openStorefrontRegister}
            onJoinSeller={
              storefrontLoggedIn
                ? () => setShowSellerRegistrationModal(true)
                : openStorefrontRegister
            }
            onOpenInfo={openStorefrontInfo}
          />
        </>
      ) : storefrontPage === 'share' ? (
        <>
          <StorefrontSharePage
            isLoggedIn={storefrontLoggedIn}
            userEmail={storefrontBuyerEmail}
            userLogin={getSessionLoginUsername() || storefrontBuyerName}
            userDisplayName={storefrontHeaderDisplayName}
            userRole={
              isStorefrontSellerMode ? 'seller' : isStorefrontResellerMode ? 'reseller' : 'buyer'
            }
            onRequireLogin={openStorefrontRegister}
          />
          <StorefrontLandingFooter
            onChatSupport={storefrontLoggedIn ? openStorefrontSupportChat : openStorefrontRegister}
            onJoinSeller={
              storefrontLoggedIn
                ? () => setShowSellerRegistrationModal(true)
                : openStorefrontRegister
            }
            onOpenInfo={openStorefrontInfo}
          />
        </>
      ) : isStorefrontToolPage(storefrontPage) ? (
        <>
          <StorefrontToolPage pageId={storefrontPage} />
          <StorefrontLandingFooter
            onChatSupport={storefrontLoggedIn ? openStorefrontSupportChat : openStorefrontRegister}
            onJoinSeller={
              storefrontLoggedIn
                ? () => setShowSellerRegistrationModal(true)
                : openStorefrontRegister
            }
            onOpenInfo={openStorefrontInfo}
          />
        </>
      ) : storefrontPage === 'messages' ? (
        <StorefrontMessagesView
          accountMode={storefrontAccountMode}
          ownerEmail={storefrontBuyerEmail}
          selfLogin={getSessionLoginUsername() || storefrontBuyerName}
          selfDisplayName={storefrontHeaderDisplayName}
          threads={messageThreads}
          initialThreadId={messagesInitialThreadId}
          orders={allOrders}
          patchOrderById={(orderId, patch) => {
            setAllOrders(prev =>
              prev.map(o => (o.id === orderId ? { ...o, ...patch } : o))
            );
          }}
          setOrders={setAllOrders}
          onUnreadChange={bumpMessagesReadRevision}
        />
      ) : storefrontPage === 'my-orders' && isStorefrontResellerMode ? (
        <ResellerStorefrontHub
          referrerEmail={storefrontBuyerEmail}
          referrerName={storefrontBuyerName}
          referrerLoginName={getSessionLoginUsername()}
          orders={allOrders}
          requests={resellerRequests}
          onBack={() => {
            setStorefrontPage('shop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onResellerWithdrawSuccess={(record) => {
            setResellerWalletVnd((w) => Math.max(0, w - record.amountVnd));
            setPaymentHistoryCheckoutItems((prev) => {
              const id = `reseller-wd-${record.id}`;
              if (prev.some((p) => p.id === id)) return prev;
              return [
                {
                  id,
                  date: formatPurchaseDateNow(),
                  type: 'Withdraw',
                  amount: -record.amountVnd,
                  reason: `Rút tiền Reseller — ${record.bankName}`,
                  transactionCode: record.id,
                },
                ...prev,
              ];
            });
          }}
        />
      ) : storefrontPage === 'my-orders' && isStorefrontSellerMode ? (
        <div className="max-w-[2000px] mx-auto px-6 py-16 pb-16 text-center">
          <p className="text-slate-600 text-sm mb-4">
            Đơn hàng đã mua chỉ dùng ở chế độ <span className="font-bold">Người mua</span>.
          </p>
          <button
            type="button"
            onClick={() => applyStorefrontAccountMode('buyer')}
            className="px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-bold hover:bg-sky-700"
          >
            Chuyển sang Người mua
          </button>
        </div>
      ) : storefrontPage === 'my-orders' && isStorefrontBuyerMode ? (
        detailOrder ? (
          detailOrder.order_type === 'service' ? (
            <ServiceOrderDetailView
              order={detailOrder}
              variant="buyer"
              onBack={backFromPurchasedOrderDetail}
            />
          ) : (
            <OrderDetailView
              order={detailOrder}
              onBack={backFromPurchasedOrderDetail}
              onReportDefectiveItems={handleReportDefectiveItems}
              onUploadDefectiveItems={handleUploadDefectiveItems}
            />
          )
        ) : (
        <div className="max-w-[2000px] mx-auto px-6 py-6 pb-16">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              type="button"
              onClick={() => {
                setStorefrontOrderDetailId(null);
                setStorefrontPage('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <ChevronLeft size={18} /> Về trang mua hàng
            </button>
            <h1 className="text-[20px] font-bold text-gray-900">Đơn hàng đã mua</h1>
            <p className="text-[13px] text-gray-500 w-full sm:w-auto basis-full sm:basis-auto"></p>
          </div>
          <PurchasedOrdersView
            orders={myPurchasedOrders}
            setOrders={setMyPurchasedOrders}
              buyerDisplayName={storefrontBuyerName}
              policyCategories={storefrontAdminGianHangCategories as import('./gianHang/types').Category[]}
              policyAllOrders={allOrders}
              onPolicyCategoriesChange={onAdminCategoriesSync}
              patchOrderById={(orderId, patch) => {
                setAllOrders(prev =>
                  prev.map(o => (o.id === orderId ? { ...o, ...patch } : o))
                );
              }}
              onOrderClick={openPurchasedOrderDetail}
              statusFilter={purchasedOrdersStatusFilter}
              onStatusFilterChange={setPurchasedOrdersStatusFilter}
              onGianHangClick={(order) => {
                const gid = order.adminGianHangId?.trim();
                if (!gid) return;
                const cat = findStorefrontAdminGianHangById(storefrontAdminGianHangCategories, gid);
                if (!cat) return;
                const product = storefrontAdminGianHangToProduct(cat);
                if (!product) return;
                setStorefrontOrderDetailId(null);
                setStorefrontPage('shop');
                setSelectedProduct(product);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onMessageSeller={(order) => {
                const threadId = resolveBuyerSellerThreadIdFromOrder(order);
                if (!threadId) return;
                setMessagesProductSeed({
                  sellerName: order.sellerName,
                  storeName: order.categoryName,
                });
                openMessagesPage(threadId);
              }}
              messagingOwnerEmail={storefrontBuyerEmail}
              messagingLogin={getSessionLoginUsername() || storefrontBuyerName}
              messagingDisplayName={storefrontHeaderDisplayName}
            />
          </div>
        )
      ) : storefrontPage === 'reseller-hub' ? (
        <ResellerStorefrontHub
          referrerEmail={storefrontBuyerEmail}
          referrerName={storefrontBuyerName}
          referrerLoginName={getSessionLoginUsername()}
          orders={allOrders}
          requests={resellerRequests}
          onBack={() => {
            setStorefrontPage('shop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onResellerWithdrawSuccess={(record) => {
            setResellerWalletVnd((w) => Math.max(0, w - record.amountVnd));
            setPaymentHistoryCheckoutItems((prev) => {
              const id = `reseller-wd-${record.id}`;
              if (prev.some((p) => p.id === id)) return prev;
              return [
                {
                  id,
                  date: formatPurchaseDateNow(),
                  type: 'Withdraw',
                  amount: -record.amountVnd,
                  reason: `Rút tiền Reseller — ${record.bankName}`,
                  transactionCode: record.id,
                },
                ...prev,
              ];
            });
          }}
        />
      ) : storefrontPage === 'top-up' ? (
        isStorefrontBuyerMode ? (
          <StorefrontTopUpView
            walletBalanceVnd={walletBalanceVnd}
            transferUserCode={getSessionLoginUsername() || storefrontBuyerName}
            paymentHistoryCheckoutItems={paymentHistoryCheckoutItems}
            topUpNotices={activeTopUpNotices}
          />
        ) : (
          <div className="min-h-screen bg-[#F8FAFC] p-8">
            <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
              <p className="text-slate-700 text-sm leading-relaxed mb-6">
                Nạp tiền chỉ áp dụng cho ví <span className="font-bold">Người mua</span>. Vui lòng chuyển chế độ tài
                khoản sang Người mua trong menu tài khoản.
              </p>
              <button
                type="button"
                onClick={() => applyStorefrontAccountMode('buyer')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
              >
                Chuyển sang Người mua
              </button>
            </div>
          </div>
        )
      ) : storefrontPage === 'public-profile' && publicProfileSeller && publicSellerProfile ? (
        <div className="bg-white border-t border-slate-100 min-h-screen">
          <StorefrontBasicInfoPage
            profile={publicSellerProfile}
            isOwnProfile={false}
            onOpenStores={() =>
              openSellerShopCatalog({
                username: publicProfileSeller,
                displayName: publicSellerProfile.displayName,
              })
            }
            onOpenMessages={() => {
              setMessagesProductSeed({ sellerName: publicProfileSeller });
              openMessagesPage();
            }}
          />
        </div>
      ) : storefrontPage === 'account' ? (
        /* ═══════════════════════════════════════════
           TRANG THÔNG TIN TÀI KHOẢN — Full Page
           ═══════════════════════════════════════════ */
        <div className="min-h-screen bg-slate-100">
          {accountTab === 'basic' ? (
            <div className="bg-white border-t border-slate-100 min-h-screen">
              <div className="max-w-5xl mx-auto px-6 pt-4 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setAccountTab('settings');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors"
                >
                  <ChevronLeft size={16} />
                  Quay lại thông tin tài khoản
                </button>
              </div>
              <StorefrontBasicInfoPage
                profile={basicProfile}
                isOwnProfile
                onOpenStores={() =>
                  openSellerShopCatalog({
                    username: basicProfile.username,
                    displayName: basicProfile.displayName,
                    email: basicProfile.email,
                  })
                }
                onOpenMessages={() => openMessagesPage()}
              />
            </div>
          ) : (
          <>
          {/* Cover + Avatar hero */}
          <div className="relative">
            {/* Cover banner */}
            <div className="h-48 sm:h-56 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
              {/* Nút quay lại */}
              <button
                type="button"
                onClick={() => {
                  setStorefrontOrderDetailId(null);
                  setStorefrontPage('shop');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold text-white bg-black/20 hover:bg-black/35 backdrop-blur-sm border border-white/20 transition-all"
              >
                <ChevronLeft size={16} /> Quay lại
              </button>
            </div>

            {/* Avatar + info row */}
            <div className="max-w-4xl mx-auto px-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 pb-5 relative z-10">
                {/* Avatar circle */}
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shrink-0">
                  <span className="text-white font-black text-4xl select-none">
                    {(storefrontHeaderDisplayName.trim().charAt(0) || storefrontBuyerName.trim().charAt(0) || '?').toUpperCase()}
                  </span>
                </div>
                {/* Name + meta — tên hiển thị = session sau đăng nhập (displayName từ username đăng ký, có thể sửa ở Chỉnh sửa hồ sơ). */}
                <div className="flex-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-[22px] font-black text-slate-900 leading-tight">{storefrontHeaderDisplayName}</h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200">✓ Đã xác minh</span>
                  </div>
                  <p className="text-[13px] text-slate-500 font-medium mt-0.5">{storefrontBuyerEmail}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[12px] text-emerald-600 font-semibold">Đang online · 2 giờ 34 phút</span>
                  </div>
                </div>
                {/* Edit button */}
                <button onClick={() => setShowEditProfile(true)} className="sm:self-end mb-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors shrink-0">
                  <Edit2 size={14} /> Chỉnh sửa hồ sơ
                </button>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="border-t border-slate-200 bg-white shadow-sm">
            <div className="max-w-4xl mx-auto px-6 py-0">
              <div className="grid grid-cols-3 divide-x divide-slate-100">
                {[
                  { value: '1,248', label: 'SP đã bán', color: 'text-emerald-600' },
                  { value: '3',     label: 'Gian hàng', color: 'text-blue-600' },
                  { value: '24',    label: 'Bài viết',  color: 'text-violet-600' },
                ].map(({ value, label, color }) => (
                  <div key={label} className="flex flex-col items-center py-4 gap-0.5">
                    <span className={`text-[20px] font-black ${color}`}>{value}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Card: Thông tin cá nhân */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <User size={14} className="text-emerald-600" />
                </div>
                <span className="text-[13px] font-bold text-slate-800">Thông tin cá nhân</span>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { icon: User,        label: 'Họ và tên',        value: profileHoVaTenStored },
                  { icon: Wallet,      label: 'Số dư',            value: activeWalletVnd.toLocaleString('vi-VN') + 'đ', accent: 'text-emerald-600' },
                  { icon: Calendar,    label: 'Ngày đăng ký',     value: '12/01/2024' },
                  { icon: Clock,       label: 'Lần đăng nhập cuối', value: 'Hôm nay 14:32' },
                  { icon: ShoppingBag, label: 'Tổng gian hàng',   value: '3 gian hàng' },
                  { icon: Package,     label: 'SP đã bán',        value: '1,248 sản phẩm' },
                  { icon: FileText,    label: 'Số bài viết',      value: '24 bài viết' },
                ].map(({ icon: Icon, label, value, accent }) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon size={13} className="text-slate-400 shrink-0" />
                      <span className="text-[12.5px] text-slate-500 truncate">{label}</span>
                    </div>
                    <span className={`text-[12.5px] font-semibold shrink-0 ${accent ?? 'text-slate-800'}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card: Bảo mật & Cài đặt */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Shield size={14} className="text-blue-600" />
                </div>
                <span className="text-[13px] font-bold text-slate-800">Bảo mật & Cài đặt</span>
              </div>
              <div className="p-5 space-y-2">

                {/* 2FA Toggle */}
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      <Shield size={16} className="text-emerald-600" />
                    </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800">Bảo mật 2 lớp (2FA)</p>
                        <p className="text-[11px] text-slate-500">
                          {is2FAEnabled
                            ? 'Đã bật — mỗi lần đăng nhập cần mã 6 số từ app xác thực'
                            : 'Tắt — chỉ cần mật khẩu khi đăng nhập'}
                        </p>
                    </div>
                  </div>
                  <button
                      type="button"
                      role="switch"
                      aria-checked={is2FAEnabled}
                      aria-label="Bật hoặc tắt bảo mật 2 lớp"
                      onClick={openTwoFAModalFromToggle}
                      className={`relative h-7 w-12 shrink-0 rounded-full border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 ${
                        is2FAEnabled
                          ? 'border-emerald-600 bg-emerald-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]'
                          : 'border-slate-300 bg-slate-200'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                          is2FAEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                  </button>
                  </div>
                  {is2FAEnabled && (
                    <div className="px-4 py-3 bg-emerald-50/60 border-t border-emerald-100/80">
                      <p className="text-[11px] text-emerald-900 leading-relaxed flex items-start gap-2">
                        <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-600" aria-hidden />
                        <span>
                          Đăng nhập, rút tiền và thao tác nhạy cảm sẽ yêu cầu mã 6 số từ app xác thực.
                          Muốn tắt: bấm công tắc và nhập lại mã 2FA để xác nhận.
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Kết nối Telegram */}
                <div className="rounded-xl bg-slate-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowTelegramModal(true)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#229ED9]/10 transition-colors group"
                  >
                  <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                          basicProfile.telegramLinked
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-[#229ED9]/10 border-[#229ED9]/20'
                        }`}
                      >
                        {basicProfile.telegramLinked ? (
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        ) : (
                      <ExternalLink size={16} className="text-[#229ED9]" />
                        )}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-semibold text-slate-800">Kết nối Telegram</p>
                        <p className="text-[11px] text-slate-400">
                          {basicProfile.telegramLinked
                            ? 'Đã liên kết @TaphoaMMO_bot'
                            : 'Nhận thông báo qua Telegram'}
                        </p>
                    </div>
                  </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        basicProfile.telegramLinked
                          ? 'text-emerald-700 bg-emerald-100'
                          : 'text-[#229ED9] bg-[#229ED9]/10'
                      }`}
                    >
                      {basicProfile.telegramLinked ? 'Đã kết nối' : 'Kết nối'}
                    </span>
                </button>
                  {basicProfile.telegramLinked && (
                    <div className="border-t border-slate-200/80">
                      <div className="px-4 py-3 bg-sky-50/50">
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          <span className="font-bold text-slate-700">Luôn bật:</span> tin nhắn mới và thông báo từ admin.
                        </p>
                      </div>
                      {isStorefrontSellerForTelegram && (
                        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200/60">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-800">Thông báo đơn hàng mới</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Telegram khi có đơn mới tại gian hàng
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={telegramOrderNotifEnabled}
                            aria-label="Bật hoặc tắt thông báo đơn hàng mới qua Telegram"
                            onClick={toggleTelegramOrderNotif}
                            className={`relative h-7 w-12 shrink-0 rounded-full border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#229ED9]/50 focus-visible:ring-offset-2 ${
                              telegramOrderNotifEnabled
                                ? 'border-[#229ED9] bg-[#2AABEE] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]'
                                : 'border-slate-300 bg-slate-200'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                                telegramOrderNotifEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      )}
                      <div className="px-4 pb-3">
                        <button
                          type="button"
                          onClick={handleDisconnectTelegram}
                          className="w-full py-2 rounded-lg border border-rose-200 bg-white text-rose-700 text-[12px] font-bold hover:bg-rose-50 transition-colors"
                        >
                          Ngắt kết nối Telegram
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Đổi mật khẩu */}
                <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                      <Settings size={16} className="text-slate-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-semibold text-slate-800">Đổi mật khẩu</p>
                      <p className="text-[11px] text-slate-400">Cập nhật mật khẩu đăng nhập</p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </button>

                {/* Chỉnh sửa thông tin */}
                <button onClick={() => setShowEditProfile(true)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                      <Edit2 size={16} className="text-slate-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-semibold text-slate-800">Chỉnh sửa thông tin</p>
                      <p className="text-[11px] text-slate-400">Họ tên, avatar, mô tả</p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </button>

              </div>
            </div>

            {/* Card: Trình duyệt & thiết bị đã đăng nhập */}
            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Monitor size={14} className="text-violet-600" />
                  </div>
                  <div>
                    <span className="text-[13px] font-bold text-slate-800 block">Thiết bị đã đăng nhập</span>
                    <span className="text-[11px] text-slate-500">Kiểm tra trình duyệt từng truy cập tài khoản</span>
                </div>
              </div>
                <span className="text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full">
                  {loginSessions.length} phiên
                        </span>
                      </div>
              <div className="p-5 space-y-2.5">
                {loginSessions.map((session: StorefrontLoginSession) => {
                  const isCurrent = session.id === currentLoginSessionId;
                  const DeviceIcon =
                    session.device === 'mobile'
                      ? Smartphone
                      : session.device === 'tablet'
                        ? Tablet
                        : Monitor;
                  return (
                    <div
                      key={session.id}
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors ${
                        isCurrent
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-slate-100 bg-slate-50/80 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isCurrent
                              ? 'bg-white border-emerald-200 text-emerald-600'
                              : 'bg-white border-slate-200 text-slate-500'
                          }`}
                        >
                          <DeviceIcon size={18} />
                    </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[13px] font-bold text-slate-800">
                              {session.browser}
                              <span className="text-slate-400 font-semibold"> · </span>
                              {session.os}
                            </p>
                            {isCurrent ? (
                              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                                Phiên hiện tại
                              </span>
                            ) : null}
                      </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            IP {session.ip} · {session.location}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Hoạt động: {formatStorefrontSessionTime(session.lastActiveAt)}
                            <span className="mx-1.5 text-slate-300">|</span>
                            Đăng nhập: {formatStorefrontSessionTime(session.loginAt)}
                          </p>
                      </div>
                      </div>
                      <div className="relative self-start sm:self-center shrink-0">
                        <button
                          type="button"
                          aria-label="Tùy chọn phiên đăng nhập"
                          aria-expanded={openLoginSessionMenuId === session.id}
                          aria-haspopup="menu"
                          onClick={() =>
                            setOpenLoginSessionMenuId(prev =>
                              prev === session.id ? null : session.id
                            )
                          }
                          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                            openLoginSessionMenuId === session.id
                              ? 'bg-slate-200 border-slate-300 text-slate-700'
                              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openLoginSessionMenuId === session.id && (
                          <>
                            <button
                              type="button"
                              className="fixed inset-0 z-[80] cursor-default"
                              aria-label="Đóng menu"
                              onClick={() => setOpenLoginSessionMenuId(null)}
                            />
                            <div
                              role="menu"
                              className="absolute right-0 top-full mt-1.5 z-[90] min-w-[168px] rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => handleLogoutLoginSession(session)}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[12px] font-bold text-rose-700 hover:bg-rose-50 transition-colors"
                              >
                                <LogOut size={14} className="shrink-0" aria-hidden />
                                Đăng xuất phiên
                      </button>
                    </div>
                          </>
                        )}
                  </div>
              </div>
                  );
                })}
            </div>
          </div>

          </div>

          {/* Hồ sơ công khai — mở trang riêng */}
          <div className="max-w-4xl mx-auto px-6 pb-10">
            <button
              type="button"
              onClick={() => {
                setAccountTab('basic');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50/80 hover:to-teal-50/50 transition-all group"
            >
              <div className="flex items-center gap-3.5 min-w-0 text-left">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200/80 flex items-center justify-center shrink-0">
                  <Eye size={20} className="text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-slate-800">Thông tin cơ bản</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    Hồ sơ công khai — ai cũng có thể xem khi giao dịch
                  </p>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="text-slate-300 shrink-0 group-hover:text-emerald-600 transition-colors"
              />
            </button>
          </div>
          </>
          )}

        </div>
      ) : storefrontPage === 'payment-history' ? (
        /* ═════════════════════════════════════════════════════════════════
           TRANG LỊCH SỬ THANH TOÁN & SỐ DƯ (Payment History & Balance)
           ═════════════════════════════════════════════════════════════════ */
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">

            {/* Back Button */}
            <button
              type="button"
              onClick={() => {
                setStorefrontOrderDetailId(null);
                setStorefrontPage('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm mb-12"
            >
              <ArrowLeft size={16} />
              Về trang mua hàng
            </button>

            {/* Header Section */}
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                {isStorefrontResellerMode
                  ? 'Hoa hồng Reseller & Số dư'
                  : isStorefrontCustomerMode
                    ? 'Lịch sử giao dịch & Số dư'
                    : 'Lịch sử thanh toán & Số dư'}
              </h1>
              <p className="text-slate-500 text-sm">
                {isStorefrontCustomerMode
                  ? 'Theo dõi nạp tiền, thanh toán đơn hàng và biến động số dư ví'
                  : 'Theo dõi doanh thu đơn sau tạm giữ, biến động ví (cộng tiền khi hoàn thành) và yêu cầu rút tiền'}
              </p>
            </div>

            {/* Navigation Tabs — người mua chỉ có giao dịch, ẩn thanh tab */}
            {paymentHistoryTabs.length > 1 && (
            <div className="flex gap-8 border-b border-slate-200 mb-8 overflow-x-auto">
                {paymentHistoryTabs.map((tab) => (
                <button
                  key={tab.id}
                    type="button"
                  onClick={() => {
                    setPaymentHistoryActiveTab(tab.id);
                    setPaymentHistoryCurrentPage(1);
                      setPaymentHistorySelectedFilter('Tất cả');
                  }}
                  className={`pb-4 text-sm font-semibold transition-all relative whitespace-nowrap ${
                    paymentHistoryActiveTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                  {paymentHistoryActiveTab === tab.id && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>
            )}

            {/* Summary Cards — ẩn ở chế độ Reseller (không dùng tạm giữ / hoàn thành shop) */}
            {!isStorefrontResellerMode && (
            <div className="flex flex-wrap gap-4 mb-8">
                {isStorefrontSellerMode && (
                  <>
                    <PaymentHistorySummaryCard
                      label="KHẢ DỤNG RÚT"
                      amount={sellerAvailableWithdrawVnd.toLocaleString('vi-VN')}
                      icon={Wallet}
                      colorClass="bg-emerald-50 text-emerald-600"
                    />
              <PaymentHistorySummaryCard
                label="ĐÃ RÚT"
                      amount={sellerWithdrawnTotalVnd.toLocaleString('vi-VN')}
                icon={TrendingUp}
                colorClass="bg-orange-50 text-orange-500"
              />
                  </>
                )}
              <PaymentHistorySummaryCard
                label="TỔNG TIỀN TẠM GIỮ"
                  amount={
                    isStorefrontBuyerMode
                      ? '1,500,000'
                      : sumSellerPayoutByStatus(sellerPayoutRows, 'holding').toLocaleString('vi-VN')
                  }
                icon={Clock}
                colorClass="bg-blue-50 text-blue-500"
              />
              <PaymentHistorySummaryCard
                label="ĐÃ HOÀN THÀNH"
                  amount={
                    isStorefrontBuyerMode
                      ? '34,250,000'
                      : sumSellerPayoutByStatus(sellerPayoutRows, 'completed').toLocaleString('vi-VN')
                  }
                icon={CheckCircle2}
                colorClass="bg-emerald-50 text-emerald-500"
              />
            </div>
            )}

            {/* Table Section */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

              {/* Filters / Header */}
              {paymentHistoryActiveTab === 'withdraw' ? (
                <div className="p-6 flex justify-between items-center border-b border-slate-50">
                  <h2 className="text-xl font-bold text-slate-800">Lịch sử rút tiền</h2>
                  <button
                    type="button"
                    disabled={!isStorefrontSellerMode || sellerAvailableWithdrawVnd <= 0}
                    title={
                      !isStorefrontSellerMode
                        ? 'Chỉ người bán mới rút được doanh thu đã giải phóng'
                        : sellerAvailableWithdrawVnd <= 0
                          ? 'Chưa có số dư khả dụng rút'
                          : undefined
                    }
                    onClick={() => setPaymentHistoryIsWithdrawModalOpen(true)}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-full text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tạo yêu cầu rút tiền
                  </button>
                </div>
              ) : (
                <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-50">
                  <div className="relative w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => setPaymentHistoryIsFilterOpen(!paymentHistoryIsFilterOpen)}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 w-full md:w-48 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Filter size={16} className="text-slate-400" />
                        {paymentHistorySelectedFilter}
                      </div>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${paymentHistoryIsFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {paymentHistoryIsFilterOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setPaymentHistoryIsFilterOpen(false)}
                        />
                        <div className="absolute top-full left-0 mt-2 w-full md:w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                          {paymentHistoryFilterOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setPaymentHistorySelectedFilter(option);
                                setPaymentHistoryIsFilterOpen(false);
                                setPaymentHistoryCurrentPage(1);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                paymentHistorySelectedFilter === option
                                  ? 'bg-blue-50 text-blue-600 font-semibold'
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 md:text-right max-w-md leading-relaxed">
                    {paymentHistoryActiveTab === 'payment' && !isStorefrontCustomerMode
                      ? 'Doanh thu từng đơn — tiền vào ví khi đơn chuyển Hoàn thành sau thời gian tạm giữ'
                      : paymentHistoryActiveTab === 'transaction' && isStorefrontResellerMode
                        ? 'Chỉ hoa hồng Reseller khi đơn qua link giới thiệu của bạn đã hoàn thành (hoặc hoàn 1 phần).'
                        : paymentHistoryActiveTab === 'transaction' && isStorefrontSellerMode
                          ? 'Sổ ví người bán: chỉ «Bán hàng» (đã trừ phí sàn & Reseller). Hoa hồng Reseller xem ở chế độ Reseller.'
                          : paymentHistoryActiveTab === 'transaction' && isStorefrontBuyerMode
                            ? 'Sổ ví người mua: thanh toán đơn, hoàn tiền, nạp/rút.'
                            : paymentHistoryActiveTab === 'transaction' && !isStorefrontCustomerMode
                              ? 'Sổ ví: dòng «Bán hàng» cộng tiền khi đơn hoàn thành; có thể rút sau đó'
                              : 'Tìm kiếm mã đơn hoặc khách hàng'}
                  </p>
                </div>
              )}

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left border-collapse">
                  {paymentHistoryActiveTab === 'payment' ? (
                    <>
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">NGÀY/GIỜ</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">MÃ ĐƠN</th>
                          {!isStorefrontCustomerMode && (
                            <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">KHÁCH MUA</th>
                          )}
                          {!isStorefrontCustomerMode && (
                            <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">MẶT HÀNG</th>
                          )}
                          <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">THỰC NHẬN</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">GHI CHÚ</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center whitespace-nowrap w-px">TRẠNG THÁI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {isStorefrontCustomerMode
                          ? PAYMENT_HISTORY_MOCK_TRANSACTIONS.slice(
                              (paymentHistoryCurrentPage - 1) * 10,
                              paymentHistoryCurrentPage * 10
                            ).map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-5 py-5 text-sm text-slate-600 font-medium whitespace-nowrap">{tx.date}</td>
                                <td className="px-5 py-5 text-sm font-semibold text-blue-600 font-mono whitespace-nowrap">{tx.orderCode}</td>
                                <td className="px-5 py-5 text-sm font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                                  +{tx.amount.toLocaleString('vi-VN')}đ
                                </td>
                                <td className="px-5 py-5 text-sm text-slate-700">{tx.reason}</td>
                                <td className="px-5 py-5 text-center whitespace-nowrap">
                              <PaymentHistoryStatusBadge status={tx.status} />
                                </td>
                              </tr>
                            ))
                          : filteredSellerPayoutRows
                              .slice((paymentHistoryCurrentPage - 1) * 10, paymentHistoryCurrentPage * 10)
                              .map(row => (
                                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                  <td className="px-5 py-5 text-sm text-slate-600 font-medium whitespace-nowrap">
                                    {row.date}
                                  </td>
                                  <td className="px-5 py-5 text-sm font-semibold text-blue-600 font-mono whitespace-nowrap">
                                    {row.orderId}
                                  </td>
                                  <td className="px-5 py-5 text-sm text-slate-800 whitespace-nowrap">{row.buyerName}</td>
                                  <td className="px-5 py-5 text-sm text-slate-700 max-w-[220px] truncate" title={row.productName}>
                                    {row.productName}
                                    <span className="block text-[10px] text-slate-400 font-medium mt-0.5 whitespace-nowrap">
                                      {row.orderType === 'service' ? 'Dịch vụ' : 'Sản phẩm'}
                                    </span>
                                  </td>
                                  <td className="px-5 py-5 text-sm font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                                    +{row.amountVnd.toLocaleString('vi-VN')}đ
                                  </td>
                                  <td className="px-5 py-5 text-sm text-slate-600 leading-snug max-w-md">{row.reason}</td>
                                  <td className="px-5 py-5 text-center whitespace-nowrap">
                                    <SellerPayoutEscrowBadge status={row.escrowStatus} />
                            </td>
                          </tr>
                        ))}
                        {!isStorefrontCustomerMode && filteredSellerPayoutRows.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                              Chưa có đơn thanh toán / tạm giữ. Doanh thu hiển thị khi có đơn đã thanh toán trên gian
                              của bạn.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </>
                  ) : paymentHistoryActiveTab === 'transaction' ? (
                    <>
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 tracking-wider">Mã đơn / Thời gian</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loại</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số tiền</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lý do</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {transactionHistoryWithRunningBalance
                          .slice((paymentHistoryCurrentPage - 1) * 10, paymentHistoryCurrentPage * 10)
                          .map(({ item, balanceBefore, balanceAfter }) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer">{item.transactionCode}</span>
                                <span className="text-sm text-slate-600 font-medium">{item.date}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <PaymentHistoryTypeBadge type={item.type} />
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-1 items-start">
                                <span
                                  className={`text-sm font-bold tabular-nums ${item.amount >= 0 ? 'text-slate-900' : 'text-rose-600'}`}
                                >
                                  {item.amount >= 0 ? '+' : '−'}
                                  {Math.abs(item.amount).toLocaleString('vi-VN')}
                                </span>
                                <span className="text-[10px] font-medium text-slate-500 leading-snug tabular-nums max-w-[260px]">
                                  Số dư trước {formatVnd(balanceBefore)}{' '}
                                  {item.amount >= 0 ? '+' : '−'} {formatVnd(Math.abs(item.amount))} = {formatVnd(balanceAfter)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-sm text-slate-700">{item.reason}</td>
                          </tr>
                        ))}
                        {transactionHistoryWithRunningBalance.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                              {isStorefrontResellerMode
                                ? 'Chưa có hoa hồng Reseller. Tiền cộng vào ví khi đơn qua link giới thiệu của bạn hoàn thành.'
                                : 'Chưa có giao dịch trong bộ lọc này.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </>
                  ) : (
                    <>
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngày yêu cầu</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yêu cầu</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số tiền</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mô tả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {sellerWithdrawTableRows
                          .slice((paymentHistoryCurrentPage - 1) * 10, paymentHistoryCurrentPage * 10)
                          .map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-5 text-sm text-slate-600 font-medium">{item.date}</td>
                            <td className="px-6 py-5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase bg-emerald-600">
                                Rút tiền
                              </span>
                            </td>
                            <td className="px-6 py-5 text-sm font-bold text-slate-900 tabular-nums">
                              {item.amount.toLocaleString('vi-VN')}đ
                            </td>
                            <td className="px-6 py-5">
                              <PaymentHistoryWithdrawStatusBadge status={item.status} />
                            </td>
                            <td className="px-6 py-5 text-sm text-slate-700">{item.description}</td>
                          </tr>
                        ))}
                        {sellerWithdrawTableRows.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                              {isStorefrontSellerMode
                                ? 'Chưa có lần rút tiền. Doanh thu đơ Hoàn thành sẽ cộng vào khả dụng rút.'
                                : 'Chưa có yêu cầu rút tiền.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </>
                  )}
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="p-6 bg-slate-50/30 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-slate-400 font-medium italic">
                  Hiển thị {paymentHistoryListLength === 0 ? 0 : (paymentHistoryCurrentPage - 1) * 10 + 1} -{' '}
                  {Math.min(paymentHistoryCurrentPage * 10, paymentHistoryListLength)} trên {paymentHistoryListLength}{' '}
                  {paymentHistoryActiveTab === 'payment' && !isStorefrontCustomerMode ? 'đơn' : 'giao dịch'}
                </p>
                <PaymentHistoryPagination
                  currentPage={paymentHistoryCurrentPage}
                  totalPages={Math.max(1, Math.ceil(paymentHistoryListLength / 10))}
                  onPageChange={setPaymentHistoryCurrentPage}
                />
              </div>
            </div>
          </div>

          {isStorefrontSellerMode && (
            <SellerWithdrawModal
              open={paymentHistoryIsWithdrawModalOpen}
            onClose={() => setPaymentHistoryIsWithdrawModalOpen(false)}
              sellerEmail={storefrontBuyerEmail}
              withdrawableVnd={sellerAvailableWithdrawVnd}
              onSuccess={handleSellerWithdrawSuccess}
          />
          )}
        </div>
      ) : storefrontPage === 'shop-catalog' ? (
      <>
      <div className="max-w-[2000px] mx-auto px-6 py-6 pb-16">
      {catalogFavoritesOnly ? (
        <div className="max-w-[1700px] mx-auto mb-5 rounded-2xl border border-rose-100 bg-gradient-to-r from-white via-rose-50/40 to-pink-50/30 px-5 py-4 shadow-sm shadow-rose-500/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => {
                  setCatalogFavoritesOnly(false);
                  openCatalogPage();
                }}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-600 hover:text-rose-700 transition-colors mb-2"
              >
                <ChevronLeft size={16} />
                Xem tất cả gian hàng
              </button>
              <h2 className="text-lg font-black text-slate-900">Gian hàng yêu thích</h2>
              <p className="text-[13px] text-slate-600 mt-0.5">
                {searchedStorefrontProducts.length > 0 ? (
                  <>
                    <span className="font-bold tabular-nums text-rose-600">
                      {searchedStorefrontProducts.length.toLocaleString('vi-VN')}
                    </span>{' '}
                    gian hàng đã lưu
                  </>
                ) : (
                  'Chưa có gian hàng yêu thích — bấm tim trên thẻ sản phẩm để lưu.'
                )}
              </p>
            </div>
          </div>
        </div>
      ) : catalogSellerMatchContext ? (
        <div className="max-w-[1700px] mx-auto mb-5 rounded-2xl border border-emerald-100 bg-gradient-to-r from-white via-emerald-50/50 to-teal-50/40 px-5 py-4 shadow-sm shadow-emerald-500/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-black text-slate-900 truncate">
                Gian hàng của @{catalogSellerMatchContext.username}
              </h2>
              <p className="text-[13px] text-slate-600 mt-0.5">
                <span className="font-bold tabular-nums text-emerald-600">
                  {searchedStorefrontProducts.length.toLocaleString('vi-VN')}
                </span>{' '}
                gian hàng đang hiển thị
              </p>
            </div>
            <button
              type="button"
              onClick={() => openSellerPublicProfile(catalogSellerMatchContext.username)}
              className="inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2.5 rounded-xl bg-white border-2 border-emerald-200 text-emerald-800 text-[13px] font-bold hover:bg-emerald-50 transition-colors"
            >
              <User size={16} />
              Xem hồ sơ shop
            </button>
          </div>
        </div>
      ) : null}
      <div id="storefront-catalog-root" className="max-w-[1700px] mx-auto px-0 pb-12 flex gap-6 scroll-mt-6">

        {/* Left Sidebar */}
        <aside className="w-[280px] flex-shrink-0 hidden lg:flex flex-col gap-5">
          {/* Filter Section — chỉ hiện khi đã chọn danh mục */}
          {selectedCategories.length > 0 && (
          <div className="bg-white rounded-xl border-2 border-gray-300 p-5">

            {/* Product type checkboxes (sync với Admin "Quản lý loại sản phẩm") */}
            <div className="mb-5">
              <div className="mb-3">
                <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Loại sản phẩm</p>
                <p className="text-[11px] text-gray-600 mt-1.5 leading-snug">
                  Tổng{' '}
                  <span className="font-bold tabular-nums text-[#22c55e]">
                    {searchedStorefrontProducts.length.toLocaleString('vi-VN')}
                  </span>{' '}
                  gian hàng
                  {(catalogSidebarFiltersActive || catalogSearchTrim) && (
                    <span className="text-gray-400"> · đã lọc</span>
                  )}
                </p>
              </div>
              {selectedCategories.length === 0 ? (
                <div className="text-[13px] text-gray-500">Chọn danh mục để xem loại sản phẩm</div>
              ) : (
                <div className="space-y-2.5">
                  {sidebarTypeOptions.length === 0 ? (
                    <div className="text-[13px] text-gray-500">Chưa có loại sản phẩm nào</div>
                  ) : (
                    sidebarTypeOptions.map(type => (
                      <label key={type} className="flex items-center cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={draftCatalogProductTypes.includes(type)}
                            onChange={() => setDraftCatalogProductTypes(prev =>
                              prev.includes(type)
                                ? prev.filter(t => t !== type)
                                : [...prev, type]
                            )}
                            className="w-[15px] h-[15px] rounded text-[#22c55e] focus:ring-[#22c55e] border-gray-300 cursor-pointer accent-[#22c55e]"
                          />
                          <span className={`text-[13px] ${draftCatalogProductTypes.includes(type) ? 'text-[#22c55e] font-semibold' : 'text-gray-600 group-hover:text-gray-800'}`}>
                            {type}
                          </span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Price Filter */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-[12px] font-semibold text-gray-500 mb-3">Khoảng giá</p>
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Tối thiểu"
                    value={draftCatalogPriceMin}
                    onChange={(e) => setDraftCatalogPriceMin(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[12px] outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/30 transition-all"
                  />
                  <span className="absolute right-2.5 top-2 text-[11px] text-gray-400 font-medium">đ</span>
                </div>
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Tối đa"
                    value={draftCatalogPriceMax}
                    onChange={(e) => setDraftCatalogPriceMax(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[12px] outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/30 transition-all"
                  />
                  <span className="absolute right-2.5 top-2 text-[11px] text-gray-400 font-medium">đ</span>
                </div>
              </div>
              <button
                type="button"
                onClick={applyCatalogSidebarFilters}
                className="w-full btn-buy bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold py-2.5 rounded-lg text-[13px] shadow-sm shadow-green-500/20"
              >
                Áp dụng bộ lọc
              </button>
            </div>
          </div>
          )}

          {/* Sponsored Ads */}
          {storefrontSponsoredHubItems.map(ad => (
            <div key={ad.id} className="bg-white rounded-xl border-2 border-gray-300 overflow-hidden group cursor-pointer card-hover">
              <div className="h-48 relative overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
                {isLikelyImageUrl(ad.image) ? (
                  <img
                    src={ad.image}
                    alt={ad.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-5xl select-none" aria-hidden>
                {ad.image}
                  </span>
                )}
                <div className="absolute top-2 right-2 z-10 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                  TÀI TRỢ <span className="text-yellow-700">✦</span>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-[13px] text-gray-800 leading-snug mb-2 group-hover:text-[#22c55e] transition-colors">{ad.title}</h4>
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] text-gray-500 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <StarRating rating={ad.rating} size={11} />
                    <span className="font-semibold text-gray-700 tabular-nums shrink-0">{ad.rating}</span>
                    <span className="text-gray-400 truncate">({ad.reviews.toLocaleString('vi-VN')})</span>
                  </div>
                  <span className="text-orange-500 font-semibold shrink-0 tabular-nums">
                    Đã bán {ad.sold.toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="mb-2">
                  <HubStockLabel
                    stock={ad.stock}
                    isOutOfStock={ad.isOutOfStock}
                    isService={ad.isService}
                    compact
                  />
                </div>
                <div className="flex items-center gap-2 mb-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0 overflow-hidden">
                    {isLikelyImageUrl(ad.image) ? (
                      <img src={ad.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      ad.sellerInitial
                    )}
                  </div>
                  <span className="text-[11px] text-gray-700 font-medium truncate flex items-center gap-1 min-w-0" title={ad.seller}>
                    {ad.seller}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#3b82f6" className="shrink-0" aria-hidden>
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed mb-2 font-medium">{ad.description}</p>
                {ad.businessLine && (
                  <p
                    className="text-[10px] text-gray-500 leading-snug mb-2 line-clamp-5 [overflow-wrap:anywhere]"
                    title={ad.businessLine}
                  >
                    <span className="font-bold text-gray-700">Kinh doanh:</span>{' '}
                    {ad.businessLine}
                  </p>
                )}
                {ad.promoBadges && ad.promoBadges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5" aria-label="Ưu đãi quảng cáo">
                    {ad.promoBadges.map((b) => {
                      const accent = b.variant === 'accent';
                      return (
                        <span
                          key={b.label}
                          className={
                            accent
                              ? 'text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-sky-50 text-sky-700 border-sky-200/80'
                              : 'text-[10px] font-medium px-2 py-0.5 rounded-md border bg-gray-50 text-gray-600 border-gray-200'
                          }
                        >
                          {b.label}
                        </span>
                      );
                    })}
                  </div>
                )}
                <p className="text-[14px] font-bold text-[#22c55e]">{ad.price}</p>
              </div>
            </div>
          ))}
        </aside>

        {/* Right: Product Grid */}
        <section className="flex-1 min-w-0">
          {/* Tìm kiếm + sắp xếp */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="relative flex-1 min-w-0 max-w-2xl">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <input
                type="search"
                value={catalogSearchQuery}
                onChange={(e) => setCatalogSearchQuery(e.target.value)}
                placeholder="Tìm gian hàng, người bán, loại sản phẩm…"
                aria-label="Tìm trong danh sách gian hàng"
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-2.5 pl-9 pr-9 text-[13px] text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/15"
              />
              {catalogSearchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCatalogSearchQuery('')}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[13px] shrink-0">
              <span className="text-gray-500 mr-0.5 hidden sm:inline">Sắp xếp:</span>
              {[
                { id: 'popular', label: 'Phổ biến' },
                { id: 'newest', label: 'Mới nhất' },
              ].map((sort) => (
                <button
                  key={sort.id}
                  type="button"
                  onClick={() => setActiveSort(sort.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeSort === sort.id ? 'bg-[#22c55e] text-white shadow-sm shadow-green-500/20' : 'text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200'}`}
                >
                  {sort.label}
                </button>
              ))}
              <span className="mx-0.5 h-5 w-px bg-gray-200 hidden sm:block" aria-hidden />
              {[
                { id: 'price-asc', label: 'Thấp', title: 'Giá thấp nhất' },
                { id: 'price-desc', label: 'Cao', title: 'Giá cao nhất' },
              ].map((sort) => (
                <button
                  key={sort.id}
                  type="button"
                  title={sort.title}
                  aria-label={sort.title}
                  onClick={() => setActiveSort(sort.id)}
                  className={`min-w-[2.5rem] px-2.5 py-1.5 rounded-lg font-semibold transition-all ${activeSort === sort.id ? 'bg-[#22c55e] text-white shadow-sm shadow-green-500/20' : 'text-gray-600 hover:bg-gray-100 border border-gray-200 bg-white'}`}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {displayedStorefrontProducts.map((product, idx) => (
              <div
                key={product.adminGianHangId ? `gh-${product.adminGianHangId}` : `p-${product.id}`}
                onClick={() => setSelectedProduct(product)}
                className={`card-hover bg-white rounded-xl border-2 overflow-hidden flex flex-col group cursor-pointer animate-slide-in relative ${
                  product.isOutOfStock
                    ? 'border-gray-300 opacity-75'
                    : product.isSponsored
                    ? 'border-[#22c55e]/40 shadow-sm shadow-green-500/5'
                    : 'border-gray-300'
                }`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {/* TÀI TRỢ Badge - Top Right Corner */}
                {product.isSponsored && (
                  <div className="absolute top-0 right-0 z-20">
                    <div className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-0.5 shadow-sm">
                      TÀI TRỢ <span className="text-yellow-700">✦</span>
                    </div>
                  </div>
                )}


                {/* Seller Avatar - Full Width */}
                <div className="relative">
                  <div className="w-full aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={product.sellerAvatar}
                      alt={product.seller}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.classList.add('flex', 'items-center', 'justify-center', 'bg-gradient-to-br', 'from-gray-100', 'to-gray-200');
                        const fallback = document.createElement('span');
                        fallback.className = 'text-4xl font-bold text-gray-400';
                        fallback.textContent = product.sellerInitial;
                        target.parentElement!.appendChild(fallback);
                      }}
                    />
                  </div>
                  {/* Badges overlay on image */}
                  <div className="absolute top-2 left-2 right-2 flex items-start justify-between z-10">
                    <div className="flex items-center gap-1.5">
                      {product.hasKhongTrung && (
                        <span className="text-[10px] bg-white/90 backdrop-blur-sm text-cyan-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 border border-cyan-100 shadow-sm">
                          <Shield size={10} /> Không trùng
                        </span>
                      )}
                    </div>
                    <StorefrontFavoriteHeartButton
                      active={isProductFavorited(product)}
                      size="sm"
                      onToggle={(e) => {
                        e.stopPropagation();
                        toggleFavoriteProduct(product);
                      }}
                    />
                  </div>
                  {/* Out of stock overlay */}
                  {product.isOutOfStock && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="bg-red-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg">Hết hàng</span>
                    </div>
                  )}

                </div>

                {/* Card Body — tách khỏi ảnh để tên gian không dính mép ảnh */}
                <div className="px-4 pt-4 pb-4 flex flex-col flex-1 border-t border-slate-100/90 bg-white">
                  {/* Title */}
                  <h4 className="font-bold text-[13px] text-gray-900 leading-snug line-clamp-2 mb-2.5 min-h-[36px] group-hover:text-[#22c55e] transition-colors">
                    {product.name}
                  </h4>

                  {/* Rating & Sales */}
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-2">
                    <StarRating rating={product.rating} />
                    <span className="font-semibold text-gray-700">{product.rating}</span>
                    <span className="text-gray-400">({product.reviews})</span>
                    <span className="text-gray-300 mx-0.5">·</span>
                    <span className="text-orange-500 font-semibold">Đã bán {product.sold.toLocaleString()}</span>
                  </div>

                  {product.productTypeLabel && (
                    <div className="text-[11px] text-gray-600 mb-2 leading-snug">
                      <span className="text-gray-500 font-medium">Sản phẩm :</span>{' '}
                      <span className="font-semibold text-gray-800">{product.productTypeLabel}</span>
                    </div>
                  )}

                  {/* Description */}
                  <div className="text-[11px] text-gray-500 leading-relaxed mb-3 space-y-1">
                    <p className="flex items-start gap-1.5">
                      <span className="text-gray-300 mt-0.5 flex-shrink-0">◦</span>
                      <span className="line-clamp-2">{product.description}</span>
                    </p>
                    {product.businessProducts && (
                      <p className="flex items-start gap-1.5">
                        <span className="text-gray-300 mt-0.5 flex-shrink-0">◦</span>
                        <span className="line-clamp-3">
                          <span className="text-gray-600 font-medium">Kinh doanh:</span>{' '}
                          {product.businessProducts}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Seller Info */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 flex-shrink-0">
                        {product.sellerInitial}
                      </div>
                      <span className="text-[11px] text-gray-600 font-medium flex items-center gap-1 min-w-0">
                        <span className="text-gray-500 flex-shrink-0">Người bán:</span>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            openSellerPublicProfile(product.seller);
                          }}
                          className="truncate text-blue-600 hover:text-blue-700 hover:underline font-semibold text-left max-w-[140px]"
                          title={`Xem hồ sơ công khai — ${product.seller}`}
                        >
                          {product.seller}
                        </button>
                        <svg className="flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="#3b82f6" aria-hidden><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      </span>
                    </div>
                    <StorefrontStockBadge
                      stock={product.stock}
                      isOutOfStock={product.isOutOfStock}
                      isService={product.storefrontBusinessType === 'Dịch vụ'}
                    />
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {product.tags.map(tag => (
                      <span key={tag} className="text-[9px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Extra Tags */}
                  {product.extraTags && product.extraTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {product.extraTags.map(tag => (
                        <span key={tag} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Price & Button */}
                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
                    <div>
                      <span className={`text-[15px] font-bold ${product.isOutOfStock ? 'text-gray-400' : 'text-[#22c55e]'}`}>
                        {product.price}
                      </span>
                    </div>
                    {product.isOutOfStock ? (
                      <button className="px-4 py-1.5 bg-gray-100 text-gray-400 rounded-full text-[12px] font-medium border border-gray-200 cursor-not-allowed">
                        Liên hệ
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                        className="btn-buy px-4 py-2 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white rounded-full text-[12px] font-bold shadow-md shadow-green-500/25 flex items-center gap-1"
                      >
                        Mua ngay <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div ref={loadMoreSentinelRef} className="h-1 w-full pointer-events-none" aria-hidden />

          {/* Load More */}
          <div className="mt-8 text-center">
            {storefrontRemaining > 0 ? (
              <>
                <button
                  type="button"
                  onClick={loadMoreStorefront}
                  className="btn-buy bg-white border-2 border-[#22c55e] text-[#22c55e] font-bold px-8 py-3 rounded-xl text-[14px] hover:bg-[#22c55e] hover:text-white transition-all flex items-center gap-2 mx-auto"
                >
                  Xem thêm gian hàng <ArrowRight size={16} />
                </button>
                <p className="text-[12px] text-gray-400 mt-2">
                  Còn <b className="text-gray-600 tabular-nums">{storefrontRemaining.toLocaleString('vi-VN')}</b> gian hàng chưa hiển thị — hoặc cuộn xuống để tự động tải
                </p>
              </>
            ) : (
              <p className="text-[13px] text-gray-500 font-medium">Đã hiển thị toàn bộ gian hàng trong danh sách</p>
            )}
          </div>
        </section>
      </div>
      </div>
      </>
      ) : storefrontLoggedIn ? (
      <>
      <StorefrontShopHubSections
        productTypesByCategory={storefrontProductTypesByCategory}
        serviceTypesByCategory={storefrontServiceTypesByCategory}
        onHubSearch={({ category, productTypes, sortLabel, query }) => {
          const sortMap: Record<string, string> = {
            'Mới nhất': 'newest',
            'Phổ biến': 'popular',
            'Giá tăng dần': 'price-asc',
            'Giá giảm dần': 'price-desc',
          };
          setActiveSort(sortMap[sortLabel] ?? 'popular');
          setCatalogSearchQuery(query);
          if (category) {
            setSelectedCategories([category]);
            const isService = storefrontServiceTypesByCategory[category] !== undefined;
            const isProduct = storefrontProductTypesByCategory[category] !== undefined;
            if (isService && !isProduct) setActiveStorefrontLine('Dịch vụ');
            else if (isProduct) setActiveStorefrontLine('Bán sản phẩm');
          } else {
            setSelectedCategories([]);
          }
          setDraftCatalogProductTypes(productTypes);
          setAppliedCatalogProductTypes(productTypes);
          setDraftCatalogPriceMin('');
          setDraftCatalogPriceMax('');
          setAppliedCatalogPriceMin(null);
          setAppliedCatalogPriceMax(null);
          openCatalogPage();
        }}
        featuredItems={sampleProducts.slice(0, 6).map((p) => ({
          id: p.id,
          name: (p.productTypeLabel ?? p.name).length > 44 ? `${(p.productTypeLabel ?? p.name).slice(0, 44)}…` : (p.productTypeLabel ?? p.name),
          imageUrl: p.sellerAvatar,
          hasKhongTrung: p.hasKhongTrung,
          isHot: p.isHot,
          isSponsored: p.isSponsored,
        }))}
        sponsoredItems={storefrontSponsoredHubItems}
        onFeaturedClick={(id) => {
          const p =
            storefrontAdminCatalogProducts.find((x) => x.id === id) ??
            sampleProducts.find((x) => x.id === id);
          if (p) {
            setSelectedProduct(p);
            setStorefrontPage('shop');
            setUserMenuOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onSponsoredClick={(id) => {
          const p = storefrontAdminCatalogProducts.find((x) => x.id === id);
          if (p) {
            setSelectedProduct(p);
            setStorefrontPage('shop');
            setUserMenuOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          openCatalogPage();
          setUserMenuOpen(false);
        }}
        onScrollToCatalog={openCatalogPage}
        onDangKyBanHang={() => setShowSellerRegistrationModal(true)}
        dangKyBanHangLabel={sellerRegHubButtonLabel}
      />
      {/* Hub sau đăng nhập — gian hàng ở trang riêng */}
      </>
      ) : null}

      <StorefrontLandingFooter
        onChatSupport={storefrontLoggedIn ? openStorefrontSupportChat : openStorefrontRegister}
        onJoinSeller={
          storefrontLoggedIn
            ? () => setShowSellerRegistrationModal(true)
            : openStorefrontRegister
        }
        onOpenInfo={openStorefrontInfo}
      />
      </div>
      </div>
      ) : (
      <>
        <StorefrontGuestHeader
          onLogoClick={handleGuestLogoClick}
          productCategories={storefrontCategoryOptions}
          serviceCategories={storefrontServiceCategoryOptions}
          selectedCategories={selectedCategories}
          noCategoriesLabel={headerT.noCategories}
          onSelectProductCategory={name => openGuestCatalogWithCategory(name, 'Bán sản phẩm')}
          onSelectServiceCategory={name => openGuestCatalogWithCategory(name, 'Dịch vụ')}
          onOpenFaqs={() => openStorefrontInfo('faq')}
          onOpenSupport={openStorefrontSupportPage}
          onOpenShare={openStorefrontSharePage}
          onOpenTool={openStorefrontToolsPage}
          activeToolId={storefrontPageToToolId(storefrontPage)}
          sharePageActive={storefrontPage === 'share'}
          authSlot={() => (
            <StorefrontAuthDropdown
              onLoginSuccess={onStorefrontLoginSuccess}
              openRegisterSignal={registerPanelSignal}
            />
          )}
        />
        {storefrontPage === 'support' ? (
          <>
            <StorefrontSupportPage
              isLoggedIn={false}
              onOpenSupportChat={openStorefrontSupportChat}
              onRequireLogin={openStorefrontRegister}
              onOpenFaqs={() => openStorefrontInfo('faq')}
              fixedHeaderOffset
            />
            <StorefrontLandingFooter
              onChatSupport={openStorefrontRegister}
              onJoinSeller={openStorefrontRegister}
              onOpenInfo={openStorefrontInfo}
            />
          </>
        ) : storefrontPage === 'share' ? (
          <>
            <StorefrontSharePage
              isLoggedIn={false}
              onRequireLogin={openStorefrontRegister}
              fixedHeaderOffset
            />
            <StorefrontLandingFooter
              onChatSupport={openStorefrontRegister}
              onJoinSeller={openStorefrontRegister}
              onOpenInfo={openStorefrontInfo}
            />
          </>
        ) : isStorefrontToolPage(storefrontPage) ? (
          <>
            <StorefrontToolPage pageId={storefrontPage} fixedHeaderOffset />
            <StorefrontLandingFooter
              onChatSupport={openStorefrontRegister}
              onJoinSeller={openStorefrontRegister}
              onOpenInfo={openStorefrontInfo}
            />
          </>
        ) : guestInfoTab ? (
          <>
            <StorefrontInfoPage
              key={guestInfoTab}
              initialTab={guestInfoTab}
              onTabChange={setGuestInfoTab}
              fixedHeaderOffset
            />
            <StorefrontLandingFooter
              onChatSupport={openStorefrontRegister}
              onJoinSeller={openStorefrontRegister}
              onOpenInfo={openStorefrontInfo}
            />
          </>
        ) : (
          <StorefrontGuestLanding
            productTypesByCategory={storefrontProductTypesByCategory}
            serviceTypesByCategory={storefrontServiceTypesByCategory}
            onOpenRegister={openStorefrontRegister}
            onHubSearch={applyGuestHubSearch}
            sponsoredItems={storefrontSponsoredHubItems}
            onSponsoredClick={() => openStorefrontRegister()}
            onOpenInfo={openStorefrontInfo}
          />
        )}
      </>
      )}


      {storefrontLoggedIn && storefrontPopupOpen && activeStorefrontPopup ? (
        <div
          className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="storefront-popup-title"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-sky-50">
              <h2 id="storefront-popup-title" className="text-lg font-bold text-slate-900">
                {activeStorefrontPopup.title}
              </h2>
            </div>
            <div
              className="px-5 py-5 text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: activeStorefrontPopup.content }}
            />
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (activeStorefrontPopup.oncePerSession) {
                    markStorefrontPopupDismissed(activeStorefrontPopup.id);
                  }
                  setStorefrontPopupOpen(false);
                  setActiveStorefrontPopup(null);
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700"
              >
                {activeStorefrontPopup.buttonLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {storefrontLoggedIn && userNotifToast ? (
        <div
          className="fixed bottom-6 left-6 z-[175] max-w-sm px-4 py-3 rounded-xl bg-emerald-700 text-white text-sm font-medium shadow-2xl border border-emerald-600 flex items-start gap-3"
          role="status"
        >
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-bold leading-snug">{userNotifToast.title}</p>
            <p className="text-xs text-emerald-50/95 mt-1 leading-relaxed">{userNotifToast.content}</p>
          </div>
          <button
            type="button"
            onClick={() => setUserNotifToast(null)}
            className="shrink-0 p-1 rounded-lg hover:bg-white/10 text-emerald-100"
            aria-label="Đóng"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      {/* ════════════════════════════════════
          MODAL: Chỉnh sửa hồ sơ
          ════════════════════════════════════ */}
      {showEditProfile && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setShowEditProfile(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Edit2 size={15} className="text-white" />
                </div>
                <h3 className="text-[15px] font-black text-white">Chỉnh sửa hồ sơ</h3>
              </div>
              <button onClick={() => setShowEditProfile(false)} className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                <X size={14} className="text-white" />
              </button>
            </div>
            {/* Avatar upload */}
            <div className="flex flex-col items-center pt-5 pb-3 bg-slate-50 border-b border-slate-100">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-3xl">B</span>
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center shadow-md hover:bg-emerald-700 transition-colors">
                  <Edit2 size={11} className="text-white" />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">Nhấn vào icon để đổi ảnh đại diện</p>
            </div>
            {/* Form */}
            <div className="p-5 space-y-3">
              {[
                { key: 'fullName', label: 'Họ và tên', placeholder: 'Nhập họ và tên', icon: User, type: 'text' as const },
                { key: 'phone',    label: 'Số điện thoại', placeholder: '0xxxxxxxxx', icon: Phone, type: 'tel' as const },
                {
                  key: 'email',
                  label: 'Email',
                  placeholder: 'email@example.com',
                  icon: Mail,
                  type: 'email' as const,
                  readOnly: true,
                  hint: 'Email tài khoản không đổi tại đây.',
                },
                { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...', icon: ExternalLink, type: 'url' as const },
              ].map(({ key, label, placeholder, icon: Icon, type, readOnly, hint }) => (
                <div key={key}>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Icon size={14} className={readOnly ? 'text-slate-300' : 'text-slate-400'} />
                    </div>
                    <input
                      type={type}
                      placeholder={placeholder}
                      readOnly={readOnly}
                      aria-readonly={readOnly ? true : undefined}
                      title={readOnly ? 'Email đăng nhập không chỉnh sửa tại đây' : undefined}
                      value={profileForm[key as keyof typeof profileForm]}
                      onChange={
                        readOnly ? undefined : (e) => setProfileForm((f) => ({ ...f, [key]: e.target.value }))
                      }
                      className={
                        readOnly
                          ? 'w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-600 cursor-default shadow-[inset_0_0_0_1px_rgb(241_245_249)] read-only:focus:border-slate-200 read-only:focus:ring-0 selection:bg-emerald-200 selection:text-slate-900'
                          : 'w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 shadow-[inset_0_0_0_1px_rgb(241_245_249)] placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all selection:bg-emerald-200 selection:text-slate-900'
                      }
                    />
                  </div>
                  {hint ? <p className="text-[11px] text-slate-400 mt-1">{hint}</p> : null}
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="px-5 pb-5 flex gap-2.5">
              <button onClick={() => setShowEditProfile(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Hủy
              </button>
              <button
                onClick={() => {
                  const nextEmail = storefrontBuyerEmail.trim();
                  const ho = profileForm.fullName.trim();
                  setStorefrontHoVaTenForEmail(nextEmail, ho);
                  const acct = getStorefrontSignupByEmail(nextEmail);
                  const userPart = acct?.username ?? storefrontBuyerName;
                  setSessionDisplayName(ho || capStorefrontUsername(userPart));
                  setSessionBuyerEmail(nextEmail);
                  onStorefrontBuyerEmailPersist?.(nextEmail);
                  setShowEditProfile(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          MODAL: Đổi mật khẩu
          ════════════════════════════════════ */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Shield size={15} className="text-white" />
                </div>
                <h3 className="text-[15px] font-black text-white">Đổi mật khẩu</h3>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                <X size={14} className="text-white" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { key: 'current', label: 'Mật khẩu hiện tại', placeholder: '••••••••' },
                { key: 'next',    label: 'Mật khẩu mới',      placeholder: '••••••••' },
                { key: 'confirm', label: 'Xác nhận mật khẩu mới', placeholder: '••••••••' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <input
                    type="password"
                    placeholder={placeholder}
                    value={passwordForm[key as keyof typeof passwordForm]}
                    onChange={e => setPasswordForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-800 placeholder-slate-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                  />
                </div>
              ))}
              {passwordForm.next && passwordForm.confirm && passwordForm.next !== passwordForm.confirm && (
                <p className="text-[12px] text-red-500 font-medium flex items-center gap-1">
                  <X size={12} /> Mật khẩu xác nhận không khớp
                </p>
              )}
            </div>
            <div className="px-5 pb-5 flex gap-2.5">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Hủy
              </button>
              <button
                onClick={() => { setPasswordForm({ current: '', next: '', confirm: '' }); setShowPasswordModal(false); }}
                disabled={!passwordForm.current || !passwordForm.next || passwordForm.next !== passwordForm.confirm}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          MODAL: Kết nối Telegram
          ════════════════════════════════════ */}
      <StorefrontSellerRegistrationModal
        open={showSellerRegistrationModal}
        onClose={() => setShowSellerRegistrationModal(false)}
        isLoggedIn={storefrontLoggedIn}
        userEmail={storefrontBuyerEmail}
        displayName={storefrontHeaderDisplayName}
        telegramLinked={basicProfile.telegramLinked}
        onMarkTelegramLinked={handleMarkTelegramLinked}
        onRequireLogin={() => {
          setShowSellerRegistrationModal(false);
          if (!storefrontLoggedIn) {
            openStorefrontRegister();
          }
        }}
        onSuccess={() => {
          setSellerRegRevision(n => n + 1);
          bumpUserNotifRevision();
          bumpMessagesReadRevision();
        }}
      />

      {showTelegramDisconnectConfirm && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm"
          onClick={() => setShowTelegramDisconnectConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="telegram-disconnect-title"
          >
            <div className="px-6 py-4 flex items-center justify-between bg-gradient-to-r from-rose-500 to-red-600">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <AlertCircle size={16} className="text-white" />
                </div>
                <h3 id="telegram-disconnect-title" className="text-[15px] font-black text-white">
                  Ngắt kết nối Telegram
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTelegramDisconnectConfirm(false)}
                className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors shrink-0"
                aria-label="Đóng"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                Bạn có chắc muốn <span className="font-bold text-slate-900">ngắt kết nối Telegram</span> không?
              </p>
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-[12px] text-rose-900 leading-relaxed">
                Sau khi ngắt, bạn sẽ không nhận thông báo qua <span className="font-bold">@TaphoaMMO_bot</span> cho đến khi kết nối lại.
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTelegramDisconnectConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirmDisconnectTelegram}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-colors"
                >
                  Ngắt kết nối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <StorefrontTelegramConnectSuccessModal
        open={showTelegramConnectSuccess}
        onClose={() => setShowTelegramConnectSuccess(false)}
        showSellerOrderHint={isStorefrontSellerForTelegram}
      />

      {showTelegramModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setShowTelegramModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-end px-4 pt-4">
              <button
                type="button"
                onClick={() => setShowTelegramModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                aria-label="Đóng"
              >
                <X size={16} className="text-slate-600" />
              </button>
                </div>
            <div className="px-5 pb-5 pt-1">
              <StorefrontTelegramConnectPanel
                connected={basicProfile.telegramLinked}
                onMarkConnectedDemo={handleMarkTelegramLinked}
              />
              </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          MODAL: Bật / tắt 2FA
          ════════════════════════════════════ */}
      {twoFAModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm"
          onClick={closeTwoFAModal}
        >
          <div
            className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden ${
              twoFAModal === 'enable' ? 'max-w-md' : 'max-w-sm'
            }`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="two-fa-modal-title"
          >
            <div
              className={`px-6 py-4 flex items-center justify-between ${
                twoFAModal === 'disable'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Shield size={15} className="text-white" />
                </div>
                <h3 id="two-fa-modal-title" className="text-[15px] font-black text-white truncate">
                  {twoFAModal === 'disable' ? 'Tắt bảo mật 2 lớp' : 'Thiết lập bảo mật 2 lớp'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeTwoFAModal}
                className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors shrink-0"
                aria-label="Đóng"
              >
                <X size={14} className="text-white" />
              </button>
            </div>

            {twoFAModal === 'disable' ? (
              <>
            <div className="p-5 space-y-4">
                  <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
                    <AlertCircle size={18} className="shrink-0 text-amber-600 mt-0.5" aria-hidden />
                    <p className="text-[12px] text-amber-900 leading-relaxed">
                      Tắt 2FA làm tài khoản chỉ còn bảo vệ bằng mật khẩu. Nhập <span className="font-bold">mã 6 số hiện tại</span> từ app xác thực để xác nhận.
                    </p>
                </div>
                <div>
                    <label htmlFor="two-fa-disable-code" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Mã xác thực 2FA
                    </label>
                    <input
                      ref={twoFACodeInputRef}
                      id="two-fa-disable-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="000000"
                      value={twoFACode}
                      onChange={(e) => handleTwoFACodeChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && twoFACode.length === 6) confirmDisable2FA();
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-center text-xl font-mono font-bold tracking-[0.35em] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                    />
                    {twoFAError && (
                      <p className="mt-2 text-[12px] text-red-600 font-medium flex items-center gap-1">
                        <X size={12} aria-hidden /> {twoFAError}
                      </p>
                    )}
                </div>
              </div>
                <div className="px-5 pb-5 flex gap-2.5">
                  <button
                    type="button"
                    onClick={closeTwoFAModal}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={confirmDisable2FA}
                    disabled={twoFACode.length !== 6 || twoFASubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-[13px] font-bold hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    {twoFASubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                    Xác nhận tắt
                  </button>
                  </div>
              </>
            ) : twoFAEnableStep === 'setup' ? (
              <>
                <div className="p-5 space-y-4 max-h-[min(70vh,32rem)] overflow-y-auto">
                  <p className="text-[12px] text-slate-600 leading-relaxed">
                    Quét mã QR bằng <span className="font-semibold text-slate-800">Google Authenticator</span>, Authy hoặc app TOTP tương thích, rồi nhập mã 6 số để kích hoạt.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                    <div className="h-36 w-36 shrink-0 rounded-2xl border-2 border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col items-center justify-center text-center p-3">
                      <div className="grid grid-cols-5 gap-0.5 mb-2" aria-hidden>
                        {Array.from({ length: 25 }).map((_, i) => (
                          <span
                            key={i}
                            className={`h-2 w-2 rounded-sm ${i % 3 === 0 ? 'bg-slate-800' : 'bg-slate-300'}`}
                          />
                ))}
              </div>
                      <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wide">Mã QR</span>
                    </div>
                    <div className="flex-1 min-w-0 w-full space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Khóa thủ công</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 min-w-0 truncate rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-mono font-bold text-slate-800">
                            {STOREFRONT_2FA_DEMO_SECRET}
                          </code>
                          <button
                            type="button"
                            onClick={copyTwoFASecret}
                            className="shrink-0 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                            title="Sao chép khóa"
                          >
                            <Copy size={14} />
                          </button>
            </div>
                        {twoFACopyHint ? (
                          <p className="text-[10px] text-emerald-600 font-semibold mt-1">{twoFACopyHint}</p>
                        ) : null}
          </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Mã dự phòng (lưu an toàn)</p>
                        <ul className="space-y-1">
                          {STOREFRONT_2FA_DEMO_BACKUP_CODES.map((c) => (
                            <li
                              key={c}
                              className="text-[11px] font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1"
                            >
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setTwoFAEnableStep('verify');
                      setTwoFACode('');
                      setTwoFAError('');
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20"
                  >
                    Tôi đã quét — nhập mã xác nhận
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-5 space-y-4">
                  <p className="text-[12px] text-slate-600 leading-relaxed">
                    Nhập mã 6 số đang hiển thị trên app xác thực để hoàn tất bật 2FA.
                  </p>
                  <div>
                    <label htmlFor="two-fa-enable-code" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Mã xác thực
                    </label>
                    <input
                      ref={twoFACodeInputRef}
                      id="two-fa-enable-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="000000"
                      value={twoFACode}
                      onChange={(e) => handleTwoFACodeChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && twoFACode.length === 6) confirmEnable2FA();
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-center text-xl font-mono font-bold tracking-[0.35em] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                    />
                    {twoFAError && (
                      <p className="mt-2 text-[12px] text-red-600 font-medium flex items-center gap-1">
                        <X size={12} aria-hidden /> {twoFAError}
                      </p>
                    )}
                    <p className="mt-2 text-[10px] text-slate-400">
                      Demo: sau khi quét, nhập mã <span className="font-mono font-bold text-slate-500">{STOREFRONT_2FA_DEMO_CODE}</span>
                    </p>
                  </div>
                </div>
                <div className="px-5 pb-5 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTwoFAEnableStep('setup');
                      setTwoFACode('');
                      setTwoFAError('');
                    }}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={confirmEnable2FA}
                    disabled={twoFACode.length !== 6 || twoFASubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    {twoFASubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                    Kích hoạt 2FA
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
