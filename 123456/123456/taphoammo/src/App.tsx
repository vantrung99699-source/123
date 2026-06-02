/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeView, type PaymentHistoryItem } from './HomeView';
import {
  getStoredRole,
  canAccessAdminRoutes,
  getSessionLoginUsername,
  getSessionDisplayName,
  getSessionBuyerEmail,
  getStorefrontLoggedIn,
  setSessionLoginUsername,
  setSessionDisplayName,
  setSessionBuyerEmail,
  setStorefrontLoggedIn,
} from './auth/roles';
import { clearAdminImpersonateFlag } from './auth/adminImpersonateStorefront';
import {
  getStorefrontWalletVndForEmail,
  setStorefrontWalletVndForEmail,
  STOREFRONT_WALLET_BY_EMAIL_KEY,
} from './auth/storefrontWalletByEmail';
import {
  pathToAdminShellView,
  adminShellViewToPath,
  isSellerStoreAdminPath,
  sellerStoreAdminShellView,
} from './adminPaths';
import { AdminBrandLogo } from './components/AdminBrandLogo';
import { PurchasedOrdersView } from './PurchasedOrdersView';
import { ServiceOrderDetailView } from './ServiceOrderDetailView';
import { OrderDetailView as ProductOrderDetailView } from './OrderDetailView';
import { reportDefectiveItemsOnOrder } from './storefront/reportDefectiveItems';
import {
  applyDefectiveUploadToOrder,
  parseDefectiveUploadText,
} from './storefront/defectiveItemUpload';
import { AdminDashboard } from './admin/AdminDashboard';
import { GianHangTop1View } from './admin/GianHangTop1View';
import {
  readGianHangTop1State,
  writeGianHangTop1State,
  type GianHangTop1State,
} from './gianHang/gianHangTop1Storage';
import { ResellerManagementView } from './admin/ResellerManagementView';
import { ProductOrdersView } from './admin/ProductOrdersView';
import { ServiceOrdersView } from './admin/ServiceOrdersView';
import { ComplaintOrdersView } from './admin/ComplaintOrdersView';
import { SellerReviewsView } from './admin/SellerReviewsView';
import { SellerRevenueStatisticsView } from './admin/SellerRevenueStatisticsView';
import { findGianHangLeafById } from './gianHang/orderBuyerReviews';
import { resolveBuyerSellerThreadIdFromOrder } from './storefront/storefrontMessageThreads';
import { buildStorefrontMessagesNavState } from './storefront/storefrontMessagesNav';
import {
  countUnreadBuyerReviews,
  markAllCurrentBuyerReviewsSeen,
  readSeenReviewOrderIds,
} from './gianHang/sellerReviewNotifications';
import { PaymentHistoryView as AdminPaymentHistoryView } from './admin/PaymentHistoryView';
import type { PaymentHistory } from './admin/types';
import { compareOrdersNewestFirst, parsePurchaseDateToMs, type Order, type OrderStatus } from './ordersTypes';
import {
  GianHangManagePanel,
  type QuickCreateDemoResult,
} from './gianHang/GianHangManagePanel';
import { ProductStatsModal } from './gianHang/ProductStatsModal';
import { buildQuickDemoGianHangWithProduct } from './gianHang/quickDemoSeed';
import { demoStoreImageForGian } from './gianHang/demoStoreImages';
import {
  buildSeedDemoGianHangLeaves,
  buildSeedDemoGianHangServiceLeaves,
} from './gianHang/seedDemoGianHang';
import { WarehouseView } from './gianHang/WarehouseView';
import { CategorySection, ICON_MAP } from './gianHang/CategorySection';
import {
  buildGianHangSelectOptions,
  formatGianHangDisplayDate,
  parseResellerPercentInput,
  RESELLER_PERCENT_DEFAULT,
} from './gianHang/categorySectionUtils';
import {
  readDiscountCodesFromStorage,
  writeDiscountCodesToStorage,
  type DiscountCodeRow,
} from './admin/discountCodesStorage';
import {
  applyApprovedResellerPercentToCategories,
  getGianDefaultResellerPercent,
  getGianResellerPercentAfterDelete,
  readResellerRequestsFromStorage,
  writeResellerRequestsToStorage,
} from './reseller/resellerRequests';
import {
  formatProductTypeLabel,
  parsePlatformFeePercent,
  parseProductTypeLabel,
  productTypesIncludeLabel,
} from './gianHang/productTypeClassification';
import type {
  BusinessLine,
  Category,
  Product,
  Status,
  WarehouseItem,
} from './gianHang/types';
import { fulfillPurchaseInCategories } from './storefront/fulfillPurchase';
import {
  processAllOrderTimers,
  fastForwardOrderTimeThreeDays,
  getFastForwardResultMessage,
} from './storefront/orderTimers';
import { patchWhenEnteringDispute } from './storefront/disputeAutoRefund';
import { OrderStatusCell } from './components/OrderStatusCell';
import { OrderRefundCell } from './components/OrderRefundCell';
import { OrderSellerFeesCell } from './components/OrderSellerFeesCell';
import {
  ComplaintProcessingCell,
  getComplaintAdminProcessing,
  isComplaintRowHighlighted,
  type ComplaintResolveDraft,
} from './components/ComplaintProcessingCell';
import { buildPartialRefundOfferPatch, computePartialRefundVnd } from './orderRefund';
import { sendSellerResolveNotifyToBuyer } from './storefront/sellerResolveBuyerMessage';
import { buildWarrantyOfferPatch } from './storefront/warrantyOffer';
import { formatVnd } from './orderAmountDisplay';
import { getComplaintEventDisplay } from './orderDateDisplay';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Truck, 
  MessageSquare, 
  MessageSquareWarning, 
  MessageSquareX,
  Undo2,
  Users, 
  Star, 
  Ticket, 
  Trophy, 
  Search, 
  Plus, 
  ChevronDown, 
  ChevronLeft,
  MoreVertical, 
  Edit2, 
  Trash2, 
  Folder, 
  Package,
  ArrowUpRight,
  Filter,
  Download,
  Calendar,
  Check,
  ShoppingCart,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  Smartphone,
  Cpu,
  Gamepad2,
  Music,
  Heart,
  Zap,
  Shield,
  CreditCard,
  Wallet,
  Settings,
  GripVertical,
  Move,
  FileText,
  Code,
  Copy,
  X,
  XCircle,
  CheckSquare,
  Square,
  ChevronRight,
  Clock,
  History,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Layout,
  MessageCircle,
  Share2,
  SendHorizontal,
  ExternalLink,
  AlertCircle,
  Gavel,
  Hammer,
  Chrome,
  Apple,
  Play,
  Linkedin,
  Github,
  Slack,
  Trello,
  Figma,
  Dribbble,
  Cloud,
  Mail,
  Phone,
  Twitch,
  TrendingUp,
  DollarSign,
  BarChart2,
  Minus,
  ChevronUp,
  ShieldCheck,
  User,
  Home,
  LogOut,
  Dices
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DndContext, 
  closestCenter,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

// --- Types (gian hàng: ./gianHang/types) ---

/** Ngày tạo / cập nhật gian hàng lưu trên `Category.date` — định dạng vi-VN có giờ:phút */
function formatViDateTimeNow(): string {
  const d = new Date();
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

type GianHangFormPayload = {
  name: string;
  description: string;
  /** Tên người bán (storefront) — tùy chọn, ưu tiên trên `products[].sellerName` / tên gian */
  sellerDisplayName: string;
  tags: string[];
  productDetails: string;
  classification: NonNullable<Category['classification']>;
  configuration: NonNullable<Category['configuration']>;
  /** Data URL ảnh gian hàng; `undefined` = không đổi (giữ logic đơn giản: luôn gửi giá trị hiện tại từ form) */
  storeImage?: string;
};

/** Cập nhật gian hàng con trong cây `subCategories` (theo payload form tạo/sửa gian hàng) */
function applyGianHangFormDataToStore(
  subs: Category[],
  rootPlatform: Category,
  targetId: string,
  data: GianHangFormPayload
): Category[] {
  return subs.map((s) => {
    if (s.id === targetId) {
      return {
        ...s,
        name: data.name,
        shortDescription: data.description,
        description: data.description,
        tags: data.tags,
        productDetails: data.productDetails,
        classification: data.classification,
        configuration: data.configuration,
        platform: data.classification.category,
        storeImage: data.storeImage,
        sellerDisplayName: (data.sellerDisplayName.trim() || getSessionLoginUsername()).slice(0, 60),
      };
    }
    if (s.subCategories?.length) {
      return {
        ...s,
        subCategories: applyGianHangFormDataToStore(s.subCategories, rootPlatform, targetId, data),
      };
    }
    return s;
  });
}

function findCategoryById(cats: Category[], id: string): Category | undefined {
  for (const cat of cats) {
    if (cat.id === id) return cat;
    if (cat.subCategories) {
      const found = findCategoryById(cat.subCategories, id);
      if (found) return found;
    }
  }
  return undefined;
}

/** Thứ tự khóa danh mục trong phân loại = thứ tự Quản lý danh mục; khóa thừa (chưa có trong order) xếp cuối A–Z */
function orderedClassificationCategoryKeys(
  line: string,
  clsLine: Record<string, string[]>,
  danhMucOrderByLine: Record<string, string[]>
): string[] {
  const clsKeys = new Set(Object.keys(clsLine));
  const ordered = danhMucOrderByLine[line] ?? [];
  const inOrder = ordered.filter(k => clsKeys.has(k));
  const extras = [...clsKeys].filter(k => !inOrder.includes(k)).sort((a, b) => a.localeCompare(b, 'vi'));
  return [...inOrder, ...extras];
}

const GIAN_HANG_RANDOM_PREFIXES = ['Gian hàng', 'Shop', 'Kho'] as const;
const GIAN_HANG_RANDOM_TOPICS = ['Facebook', 'Instagram', 'TikTok', 'Google', 'Zalo', 'Gmail'] as const;

function randomGianHangPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Tên gian hàng 15–60 ký tự (phục vụ test form) */
function randomGianHangShopName(): string {
  const id = Math.random().toString(36).slice(2, 8);
  let text = `${randomGianHangPick(GIAN_HANG_RANDOM_PREFIXES)} ${randomGianHangPick(GIAN_HANG_RANDOM_TOPICS)} ${id}`;
  if (text.length < 15) text = `${text} uy tín demo`;
  return text.slice(0, 60);
}

/** Mô tả ngắn ≥ 30 ký tự */
function randomGianHangShortDescription(): string {
  const lines = [
    'Gian hàng uy tín, giao nhanh 24/7, hỗ trợ đổi trong 7 ngày.',
    'Cam kết chất lượng, bảo hành đầy đủ, thanh toán an toàn qua sàn.',
    'Kho sẵn, cập nhật hàng ngày, không trùng — phù hợp test nhanh.',
  ];
  let text = `${randomGianHangPick(lines)} #${Math.random().toString(36).slice(2, 6)}`;
  while (text.trim().length < 30) text += ' Demo.';
  return text.slice(0, 150);
}

/** Chi tiết sản phẩm ≥ 100 ký tự */
function randomGianHangProductDetails(): string {
  const stamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
  let text = [
    '## Mô tả demo (tự sinh để test)',
    '',
    '- Sản phẩm kiểm tra trước khi giao.',
    '- Hướng dẫn gửi sau thanh toán qua hệ thống.',
    '- Hỗ trợ qua ticket, không công khai liên hệ cá nhân trên ảnh.',
    '',
    `Mã phiên test: ${stamp} · ${Math.random().toString(36).slice(2, 10)}`,
  ].join('\n');
  while (text.trim().length < 100) {
    text += '\nNội dung bổ sung phục vụ kiểm thử form tạo gian hàng.';
  }
  return text;
}

const gianHangRandomTestTags = ['DEMO', 'TEST', 'UY TÍN'] as const;

const MAT_HANG_RANDOM_NAME_TEMPLATES = [
  'Facebook Việt {n}k bạn bè — bảo hành login',
  'TikTok US PVA reg tay #{id}',
  'Gmail random IP US/VN — test {id}',
  'Instagram clone {n}k follow — uy tín',
  'Zalo cũ {n} tháng — không trùng',
  'Netflix Premium 1T — giao tự động',
] as const;

const MAT_HANG_RANDOM_PRICE_TIERS_VND = [
  15_000, 25_000, 49_000, 99_000, 150_000, 299_000, 500_000, 1_000_000, 2_000_000, 3_500_000,
] as const;

const RANDOM_FIELD_BUTTON_CLASS =
  'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-violet-600 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors';

function randomMatHangName(): string {
  const tpl = randomGianHangPick(MAT_HANG_RANDOM_NAME_TEMPLATES);
  const n = Math.floor(Math.random() * 800 + 100);
  const id = Math.random().toString(36).slice(2, 6);
  return tpl.replace('{n}', String(n)).replace('{id}', id);
}

/** Giá nhập form (chưa có hậu tố đ) — định dạng vi-VN */
function randomMatHangPriceInput(): string {
  const base = randomGianHangPick(MAT_HANG_RANDOM_PRICE_TIERS_VND);
  const jitter = Math.floor(Math.random() * 9_000) - 4_000;
  const vnd = Math.max(10_000, base + jitter);
  return vnd.toLocaleString('vi-VN');
}

// --- Components ---

const CreateCategoryView = ({ 
  onClose, 
  onSave,
  categories: categoriesProp,
  classificationData,
  danhMucOrderByLine,
  editingCategory = null,
  defaultBusinessLine = 'Bán sản phẩm',
}: { 
  onClose: () => void; 
  onSave: (data: any) => void;
  categories: Category[];
  classificationData: Record<string, Record<string, string[]>>;
  danhMucOrderByLine: Record<string, string[]>;
  /** Gian hàng con đang sửa — đồng bộ field theo `docs/tao_gian_hang_moi.md` */
  editingCategory?: Category | null;
  /** Khi `classification.businessType` trong DB không phải Bán SP / Dịch vụ, dùng line của nền tảng cha */
  defaultBusinessLine?: BusinessLine;
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [businessType, setBusinessType] = useState('Bán sản phẩm');
  const [category, setCategory] = useState('tài khoản');
  const [productType, setProductType] = useState(() => {
    const types = classificationData['Bán sản phẩm']?.['tài khoản'] ?? [];
    return types[0] ?? 'Chọn ...';
  });
  const [isSingleProduct, setIsSingleProduct] = useState(true);
  const [allowReseller, setAllowReseller] = useState(true);
  const [resellerDefaultPercent, setResellerDefaultPercent] = useState('');
  const [isPrivateWarehouse, setIsPrivateWarehouse] = useState(false);
  const [checkLiveUid, setCheckLiveUid] = useState(false);
  const [allowPreOrder, setAllowPreOrder] = useState(false);
  const [saleType, setSaleType] = useState('Mới nhất');
  const [storeImageDataUrl, setStoreImageDataUrl] = useState<string | undefined>(undefined);
  const [imageDragActive, setImageDragActive] = useState(false);
  const storeImageInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = Boolean(editingCategory && !editingCategory.isParent);

  const STORE_IMG_MAX_BYTES = 5 * 1024 * 1024;
  const applyStoreImageFile = (file: File) => {
    const okMime = /^image\/(jpeg|png|gif|webp|svg\+xml)$/i.test(file.type);
    const okName = /\.(jpe?g|png|gif|webp|svg)$/i.test(file.name);
    if (!okMime && !okName) {
      if (typeof window !== 'undefined') {
        window.alert('Chỉ chấp nhận ảnh: JPEG, PNG, GIF, WebP hoặc SVG.');
      }
      return;
    }
    if (file.size > STORE_IMG_MAX_BYTES) {
      if (typeof window !== 'undefined') {
        window.alert('Dung lượng ảnh tối đa 5 MB.');
      }
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setStoreImageDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!editingCategory || editingCategory.isParent) {
      setName('');
      setDescription('');
      setTags([]);
      setProductDetails('');
      setBusinessType('Bán sản phẩm');
      setCategory('tài khoản');
      const t0 = classificationData['Bán sản phẩm']?.['tài khoản'] ?? [];
      setProductType(t0[0] ?? 'Chọn ...');
      setIsSingleProduct(true);
      setAllowReseller(true);
      setResellerDefaultPercent('');
      setIsPrivateWarehouse(false);
      setCheckLiveUid(false);
      setAllowPreOrder(false);
      setSaleType('Mới nhất');
      setStoreImageDataUrl(undefined);
      return;
    }

    const c = editingCategory;
    setName(c.name);
    setDescription((c.shortDescription ?? c.description ?? '').slice(0, 150));
    setTags(Array.isArray(c.tags) ? [...c.tags] : []);
    setProductDetails(c.productDetails ?? '');

    const cls = c.classification;
    const bt: string =
      cls?.businessType === 'Bán sản phẩm' || cls?.businessType === 'Dịch vụ'
        ? cls.businessType
        : defaultBusinessLine;

    const keys = orderedClassificationCategoryKeys(bt, classificationData[bt] || {}, danhMucOrderByLine);
    const catKey =
      cls?.category && keys.includes(cls.category) ? cls.category : keys[0] ?? 'Chọn ...';

    setBusinessType(bt);
    setCategory(catKey);

    const types = classificationData[bt]?.[catKey] || [];
    const pt =
      cls?.product && types.includes(cls.product) ? cls.product : types[0] ?? 'Chọn ...';
    setProductType(pt);

    const cfg = c.configuration;
    if (cfg) {
      setIsSingleProduct(cfg.isSingleProduct ?? true);
      setAllowReseller(cfg.isReseller ?? true);
      setResellerDefaultPercent(
        cfg.resellerDefaultPercent != null ? String(cfg.resellerDefaultPercent) : ''
      );
      setIsPrivateWarehouse(cfg.isPrivateWarehouse ?? false);
      setCheckLiveUid(cfg.isLiveUidCheck ?? false);
      setAllowPreOrder(cfg.allowPreOrder ?? false);
      const st = cfg.saleType;
      setSaleType(st === 'Oldest' ? 'Cũ nhất' : st === 'Random' ? 'Ngẫu nhiên' : 'Mới nhất');
    } else {
      setIsSingleProduct(true);
      setAllowReseller(true);
      setResellerDefaultPercent('');
      setIsPrivateWarehouse(false);
      setCheckLiveUid(false);
      setAllowPreOrder(false);
      setSaleType('Mới nhất');
    }
    setStoreImageDataUrl(c.storeImage);
    // Chỉ hydrate lại khi đổi gian hàng đang sửa hoặc line cha (tránh reset form khi gõ ở chế độ tạo)
  }, [editingCategory?.id, defaultBusinessLine]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const categoryKeys =
    businessType !== 'Chọn ...'
      ? orderedClassificationCategoryKeys(businessType, classificationData[businessType] || {}, danhMucOrderByLine)
      : [];
  const productTypes = (businessType !== 'Chọn ...' && category !== 'Chọn ...') ? (classificationData[businessType]?.[category] || []) : [];

  const isServiceBusinessLine = businessType === 'Dịch vụ';

  const handleBusinessTypeChange = (val: string) => {
    setBusinessType(val);
    if (val === 'Dịch vụ') {
      setIsPrivateWarehouse(false);
      setAllowPreOrder(false);
      setCheckLiveUid(false);
    }
    const keys = orderedClassificationCategoryKeys(val, classificationData[val] || {}, danhMucOrderByLine);
    const firstCat = keys[0] ?? 'Chọn ...';
    setCategory(firstCat);
    const types = firstCat !== 'Chọn ...' ? (classificationData[val]?.[firstCat] || []) : [];
    setProductType(types[0] ?? 'Chọn ...');
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    const types = classificationData[businessType]?.[val] || [];
    setProductType(types[0] ?? 'Chọn ...');
  };

  const SHOP_NAME_MIN_LEN = 15;
  const SHOP_NAME_MAX_LEN = 60;
  const nameTrimLen = name.trim().length;
  const nameValid =
    nameTrimLen >= SHOP_NAME_MIN_LEN &&
    nameTrimLen <= SHOP_NAME_MAX_LEN;

  const SHORT_DESCRIPTION_MIN_LEN = 30;
  const SHORT_DESCRIPTION_MAX_LEN = 150;
  const shortDescriptionTrimLen = description.trim().length;
  const shortDescriptionValid = shortDescriptionTrimLen >= SHORT_DESCRIPTION_MIN_LEN;

  const PRODUCT_DETAILS_MIN_LEN = 100;
  const productDetailsTrimLen = productDetails.trim().length;
  const productDetailsValid = productDetailsTrimLen >= PRODUCT_DETAILS_MIN_LEN;

  const createCategoryFormValid =
    nameValid &&
    shortDescriptionValid &&
    productDetailsValid &&
    category !== 'Chọn ...' &&
    productType !== 'Chọn ...';

  const fillRandomGianHangForm = () => {
    const shopName = randomGianHangShopName();
    setName(shopName);
    setDescription(randomGianHangShortDescription());
    setProductDetails(randomGianHangProductDetails());
    setTags([...gianHangRandomTestTags]);
    const topic = GIAN_HANG_RANDOM_TOPICS.find((t) =>
      shopName.toLowerCase().includes(t.toLowerCase())
    );
    setStoreImageDataUrl(
      demoStoreImageForGian({
        iconName: topic,
        platform: topic,
        classificationCategory: topic,
      })
    );
  };

  const randomFieldButtonClass =
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-violet-600 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors';

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 z-[150] bg-slate-50 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display">
              {isEditMode ? 'Sửa gian hàng' : 'Tạo gian hàng mới'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {isEditMode
                ? 'Cập nhật thông tin theo form tạo gian hàng (đồng bộ docs/tao_gian_hang_moi.md)'
                : 'Thiết lập gian hàng — sau khi gửi sẽ ở trạng thái Chờ duyệt trước khi hiện trên sàn'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fillRandomGianHangForm}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-violet-50 border border-violet-200 text-violet-700 rounded-xl text-xs font-bold hover:bg-violet-100 transition-all active:scale-95"
            title="Điền ngẫu nhiên tên, mô tả, chi tiết và tags để test nhanh"
          >
            <Dices size={14} />
            Random form
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
          >
            Hủy
          </button>
          <button 
            onClick={() => {
              if (!createCategoryFormValid) return;
              onSave({ 
                name: name.trim(), 
                sellerDisplayName: (
                  isEditMode && editingCategory?.sellerDisplayName?.trim()
                    ? editingCategory.sellerDisplayName.trim()
                    : getSessionLoginUsername()
                ).slice(0, 60),
                description: description.trim(), 
                tags, 
                productDetails: productDetails.trim(),
                storeImage: storeImageDataUrl,
                classification: {
                  businessType,
                  category,
                  product: productType
                },
                configuration: {
                  refundRate: editingCategory?.configuration?.refundRate ?? 100,
                  isSingleProduct,
                  isReseller: allowReseller,
                  ...(allowReseller
                    ? { resellerDefaultPercent: parseResellerPercentInput(resellerDefaultPercent) }
                    : {}),
                  isPrivateWarehouse: isServiceBusinessLine ? false : isPrivateWarehouse,
                  isLiveUidCheck: isServiceBusinessLine ? false : checkLiveUid,
                  allowPreOrder: isServiceBusinessLine ? false : allowPreOrder,
                  saleType: saleType === 'Mới nhất' ? 'Newest' : saleType === 'Cũ nhất' ? 'Oldest' : 'Random'
                }
              });
            }}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 ${
              !createCategoryFormValid
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5'
            }`}
          >
            {isEditMode ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
          
          {/* Left Column */}
          <div className="col-span-8 space-y-6">
            
            {/* Basic Info & Avatar */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
                  <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Globe size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">
                    Thông tin cơ bản{isEditMode ? ' · chỉnh sửa' : ''}
                  </h3>
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tên gian hàng</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setName(randomGianHangShopName())}
                          className={randomFieldButtonClass}
                          title="Tên gian hàng ngẫu nhiên (15–60 ký tự)"
                        >
                          <Dices size={11} />
                          Random
                        </button>
                        <span
                          className={`text-[9px] font-bold tabular-nums ${
                            nameValid ? 'text-slate-300' : 'text-amber-600'
                          }`}
                        >
                          {nameTrimLen}/{SHOP_NAME_MAX_LEN} (tối thiểu {SHOP_NAME_MIN_LEN})
                        </span>
                      </div>
                    </div>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, SHOP_NAME_MAX_LEN))}
                      placeholder="Ví dụ: Bán tài khoản Facebook"
                      aria-invalid={name.length > 0 && !nameValid}
                      className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:bg-white transition-all outline-none ${
                        name.length > 0 && !nameValid
                          ? 'border-amber-400 focus:border-amber-500'
                          : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                    {name.length > 0 && !nameValid && (
                      <p className="text-[10px] font-semibold text-amber-700 ml-1">
                        Tên gian hàng cần từ {SHOP_NAME_MIN_LEN} đến {SHOP_NAME_MAX_LEN} ký tự (sau khi bỏ khoảng trắng đầu/cuối; hiện có {nameTrimLen}).
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Mô tả ngắn</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDescription(randomGianHangShortDescription())}
                          className={randomFieldButtonClass}
                          title="Mô tả ngắn ngẫu nhiên (≥ 30 ký tự)"
                        >
                          <Dices size={11} />
                          Random
                        </button>
                        <span
                          className={`text-[9px] font-bold tabular-nums ${
                            shortDescriptionValid ? 'text-slate-300' : 'text-amber-600'
                          }`}
                        >
                          {shortDescriptionTrimLen}/{SHORT_DESCRIPTION_MAX_LEN} (tối thiểu {SHORT_DESCRIPTION_MIN_LEN})
                        </span>
                      </div>
                    </div>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, SHORT_DESCRIPTION_MAX_LEN))}
                      placeholder="Nhập mô tả..."
                      rows={2}
                      aria-invalid={description.length > 0 && !shortDescriptionValid}
                      className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:bg-white transition-all outline-none resize-none ${
                        description.length > 0 && !shortDescriptionValid
                          ? 'border-amber-400 focus:border-amber-500'
                          : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                    {description.length > 0 && !shortDescriptionValid && (
                      <p className="text-[10px] font-semibold text-amber-700 ml-1">
                        Mô tả ngắn cần ít nhất {SHORT_DESCRIPTION_MIN_LEN} ký tự (không tính khoảng trắng đầu/cuối khi lưu; hiện có {shortDescriptionTrimLen}).
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col self-start">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center shrink-0">
                      <Smartphone size={16} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 font-display">Ảnh gian hàng</h3>
                  </div>
                  {storeImageDataUrl && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => storeImageInputRef.current?.click()}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Đổi ảnh
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setStoreImageDataUrl(undefined)}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline"
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  )}
                </div>
                <div className={storeImageDataUrl ? 'flex flex-col' : 'flex-1 flex flex-col min-h-0'}>
                  <input
                    ref={storeImageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,.jpg,.jpeg,.png,.gif,.webp,.svg"
                    className="sr-only"
                    aria-label="Chọn ảnh gian hàng"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (f) applyStoreImageFile(f);
                    }}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => storeImageInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        storeImageInputRef.current?.click();
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setImageDragActive(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setImageDragActive(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setImageDragActive(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) applyStoreImageFile(f);
                    }}
                    className={`group relative flex flex-col items-center justify-center cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                      storeImageDataUrl
                        ? 'py-2 px-2'
                        : 'flex-1 min-h-[160px]'
                    } ${
                      imageDragActive
                        ? 'bg-blue-100/80 border-2 border-dashed border-blue-400'
                        : 'bg-slate-50 hover:bg-blue-50/50 border-2 border-transparent'
                    }`}
                  >
                    {storeImageDataUrl ? (
                      <img
                        src={storeImageDataUrl}
                        alt="Ảnh gian hàng"
                        className="w-full h-auto max-h-[300px] object-contain block"
                      />
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all group-hover:scale-110">
                          <Download size={20} />
                        </div>
                        <div className="text-center px-2">
                          <p className="text-[10px] font-bold text-slate-700">Tải ảnh lên</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            Click để chọn file hoặc kéo thả ảnh vào đây
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tags</label>
              <div className="flex flex-wrap gap-2 p-2 bg-white border border-slate-200 rounded-2xl min-h-[46px] focus-within:border-blue-500 transition-all">
                {tags.map((tag, idx) => (
                  <span key={`${tag}-${idx}`} className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-600">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="text-slate-400 hover:text-rose-500"><X size={12} /></button>
                  </span>
                ))}
                <input 
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Thêm tag..."
                  className="flex-1 bg-transparent border-none outline-none text-xs font-medium px-2 min-w-[80px]"
                />
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">Chi tiết sản phẩm</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setProductDetails(randomGianHangProductDetails())}
                    className={randomFieldButtonClass}
                    title="Chi tiết sản phẩm ngẫu nhiên (≥ 100 ký tự)"
                  >
                    <Dices size={11} />
                    Random
                  </button>
                  <span
                    className={`text-[9px] font-bold tabular-nums ${
                      productDetailsValid ? 'text-slate-400' : 'text-amber-600'
                    }`}
                  >
                    {productDetailsTrimLen} ký tự (tối thiểu {PRODUCT_DETAILS_MIN_LEN})
                  </span>
                </div>
              </div>
              <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-1 bg-slate-50/30">
                <button className="p-1.5 text-slate-500 hover:bg-white rounded-lg transition-all"><History size={14} /></button>
                <button className="p-1.5 text-slate-900 font-bold hover:bg-white rounded-lg transition-all">B</button>
                <button className="p-1.5 text-slate-900 italic hover:bg-white rounded-lg transition-all">I</button>
                <button className="p-1.5 text-slate-900 underline hover:bg-white rounded-lg transition-all">U</button>
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <button className="p-1.5 text-slate-500 hover:bg-white rounded-lg transition-all"><Code size={14} /></button>
              </div>
              <div className="p-6 space-y-2">
                <textarea 
                  value={productDetails}
                  onChange={(e) => setProductDetails(e.target.value)}
                  placeholder="Nhập chi tiết sản phẩm..."
                  rows={12}
                  aria-invalid={productDetails.length > 0 && !productDetailsValid}
                  className={`w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-medium resize-none placeholder:text-slate-300 transition-all outline-none ${
                    productDetails.length > 0 && !productDetailsValid
                      ? 'border border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-400/40'
                      : 'border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/20'
                  }`}
                />
                {productDetails.length > 0 && !productDetailsValid && (
                  <p className="text-[10px] font-semibold text-amber-700 ml-1">
                    Mô tả chi tiết cần ít nhất {PRODUCT_DETAILS_MIN_LEN} ký tự (sau khi bỏ khoảng trắng đầu/cuối; hiện có {productDetailsTrimLen}).
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
              <MessageSquareWarning size={16} className="text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-amber-900">Lưu ý quan trọng:</p>
                <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                  Sản phẩm phải có thể bán trực tiếp trên site. Không đăng thông tin liên hệ cá nhân lên hình ảnh.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-4 space-y-6">
            {/* Classification */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
                <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Layout size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 font-display">Phân loại</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Loại hình kinh doanh</label>
                  <div className="relative">
                    <select 
                      value={businessType}
                      onChange={(e) => handleBusinessTypeChange(e.target.value)}
                      className="w-full appearance-none px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all outline-none pr-8"
                    >
                      <option>Bán sản phẩm</option>
                      <option>Dịch vụ</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Danh mục</label>
                  <div className="relative">
                    <select 
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full appearance-none px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all outline-none pr-8"
                    >
                      <option>Chọn ...</option>
                      {categoryKeys.map(key => {
                        const currentName = categoriesProp.find(c => c.originalName === key)?.name || key;
                        return <option key={key} value={key}>{currentName}</option>;
                      })}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {category !== 'Chọn ...' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Loại sản phẩm - Chiết khấu cho sàn</label>
                    <div className="relative">
                      <select 
                        value={productType}
                        onChange={(e) => setProductType(e.target.value)}
                        className="w-full appearance-none px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all outline-none pr-8"
                      >
                        <option>Chọn ...</option>
                        {productTypes.map((pt, idx) => (
                          <option key={`${pt}-${idx}`} value={pt}>{pt}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sale Type Section */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
                <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <ShoppingCart size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 font-display">Kiểu bán</h3>
              </div>
              <div className="p-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Kiểu bán</label>
                  <div className="relative">
                    <select 
                      value={saleType}
                      onChange={(e) => setSaleType(e.target.value)}
                      className="w-full appearance-none px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all outline-none pr-8"
                    >
                      <option>Mới nhất</option>
                      <option>Cũ nhất</option>
                      <option>Ngẫu nhiên</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
                <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Settings size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 font-display">Cấu hình</h3>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 gap-2">
                  {isServiceBusinessLine && (
                    <p className="text-[11px] text-violet-700 font-medium bg-violet-50 border border-violet-100 rounded-xl px-3 py-2 leading-relaxed">
                      Gian dịch vụ không dùng kho hàng — khách chọn gói (vd. tăng like Facebook) và đặt hàng ngay trên
                      storefront.
                    </p>
                  )}
                  {[
                    { label: 'Sản phẩm duy nhất', checked: isSingleProduct, onChange: setIsSingleProduct },
                    { label: 'Kho hàng riêng', checked: isPrivateWarehouse, onChange: setIsPrivateWarehouse, serviceHidden: true },
                    { label: 'Check live UID FB', checked: checkLiveUid, onChange: setCheckLiveUid, serviceHidden: true },
                    {
                      label: 'Cho phép đặt trước',
                      checked: allowPreOrder,
                      onChange: setAllowPreOrder,
                      hint: 'Hiện nút Đặt trước trên trang mua hàng',
                      serviceHidden: true,
                    },
                  ]
                    .filter(item => !isServiceBusinessLine || !item.serviceHidden)
                    .map((item, i) => (
                    <div 
                      key={i}
                      onClick={() => item.onChange(!item.checked)}
                      className={`px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        item.checked ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700">{item.label}</p>
                        {'hint' in item && item.hint && (
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.hint}</p>
                        )}
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                        item.checked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200'
                      }`}>
                        {item.checked && <Check size={10} strokeWidth={4} />}
                      </div>
                    </div>
                  ))}
                  <div className="space-y-2">
                    <div
                      onClick={() => setAllowReseller(!allowReseller)}
                      className={`px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        allowReseller ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-700">Cho phép Reseller</p>
                        {allowReseller && (
                          <p className="text-[10px] font-bold text-sky-700 mt-0.5 tabular-nums">
                            Chiết khấu:{' '}
                            <span className="text-sky-800">
                              {parseResellerPercentInput(resellerDefaultPercent)}%
                            </span>
                            {!resellerDefaultPercent.trim() && (
                              <span className="text-slate-400 font-semibold">
                                {' '}
                                (mặc định {RESELLER_PERCENT_DEFAULT}%)
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                        allowReseller ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200'
                      }`}>
                        {allowReseller && <Check size={10} strokeWidth={4} />}
                      </div>
                    </div>
                    {allowReseller && (
                      <div className="space-y-1.5 px-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                          % chiết khấu mặc định
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={resellerDefaultPercent}
                            onChange={(e) => {
                              const v = e.target.value.replace(/[^\d.,]/g, '');
                              setResellerDefaultPercent(v);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={String(RESELLER_PERCENT_DEFAULT)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all outline-none pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium ml-1">
                          Không điền = <strong className="text-slate-500">{RESELLER_PERCENT_DEFAULT}%</strong> mặc
                          định — hiển thị trên danh sách gian hàng
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface ProductTypeItemContentProps {
  type: string;
  rowId: string;
  editingRowId?: string | null;
  editingName?: string;
  editingFeePercent?: string;
  setEditingName?: (val: string) => void;
  setEditingFeePercent?: (val: string) => void;
  handleSaveEdit?: (rowId: string, oldType: string) => void;
  setEditingRowId?: (id: string | null) => void;
  handleDeleteProductType?: (rowId: string) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const ProductTypeItemContent: React.FC<ProductTypeItemContentProps> = ({
  type,
  rowId,
  editingRowId,
  editingName = '',
  editingFeePercent = '',
  setEditingName,
  setEditingFeePercent,
  handleSaveEdit,
  setEditingRowId,
  handleDeleteProductType,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
}) => {
  const parsed = parseProductTypeLabel(type);
  return (
    <div className="flex items-center justify-between p-3 rounded-xl transition-all bg-slate-50 border border-slate-100 group hover:border-blue-200">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {onMoveUp && onMoveDown && (
          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              title="Di chuyển lên"
              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronUp size={14} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              title="Di chuyển xuống"
              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronDown size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}
        
        {editingRowId === rowId &&
        setEditingName &&
        setEditingFeePercent &&
        handleSaveEdit &&
        setEditingRowId ? (
          <div className="flex-1 flex flex-wrap gap-2 mr-2 min-w-0 items-center">
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              placeholder="Tên loại"
              className="flex-1 min-w-[120px] px-3 py-1.5 bg-white border border-blue-400 rounded-lg text-sm font-bold outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit(rowId, type);
                if (e.key === 'Escape') setEditingRowId(null);
              }}
            />
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="text"
                inputMode="decimal"
                value={editingFeePercent}
                onChange={(e) => setEditingFeePercent(e.target.value)}
                placeholder="5"
                className="w-14 px-2 py-1.5 bg-white border border-blue-400 rounded-lg text-sm font-bold text-center outline-none"
              />
              <span className="text-xs font-bold text-slate-500">%</span>
            </div>
            <button
              type="button"
              onClick={() => handleSaveEdit(rowId, type)}
              className="p-1.5 shrink-0 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              onClick={() => setEditingRowId(null)}
              className="p-1.5 shrink-0 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm font-bold text-slate-700 truncate">{parsed.name}</span>
            {parsed.platformFeePercent > 0 && (
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md shrink-0">
                {parsed.platformFeePercent}% sàn
              </span>
            )}
          </div>
        )}
      </div>

      {editingRowId !== rowId &&
        setEditingRowId &&
        setEditingName &&
        setEditingFeePercent &&
        handleDeleteProductType && (
        <div className="flex items-center gap-1 shrink-0">
          <button 
            type="button"
            onClick={() => {
              const p = parseProductTypeLabel(type);
              setEditingRowId(rowId);
              setEditingName(p.name);
              setEditingFeePercent(
                p.platformFeePercent > 0 ? String(p.platformFeePercent) : ''
              );
            }}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Sá»­a"
          >
            <Edit2 size={16} />
          </button>
          <button 
            type="button"
            onClick={() => handleDeleteProductType(rowId)}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
            title="Xóa"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

const ManageProductTypesModal = ({ 
  isOpen, 
  onClose, 
  classificationData, 
  setClassificationData,
  danhMucOrderByLine,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  classificationData: Record<string, Record<string, string[]>>;
  setClassificationData: React.Dispatch<React.SetStateAction<Record<string, Record<string, string[]>>>>;
  /** Thứ tự danh mục đồng bộ Quản lý danh mục (kéo thả) — theo từng tab Bán SP / Dịch vụ */
  danhMucOrderByLine: Record<string, string[]>;
}) => {
  const [selectedBusinessType, setSelectedBusinessType] = useState('Bán sản phẩm');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newProductTypeName, setNewProductTypeName] = useState('');
  const [newPlatformFeePercent, setNewPlatformFeePercent] = useState('');

  const [localTypeRows, setLocalTypeRows] = useState<{ id: string; value: string }[]>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingFeePercent, setEditingFeePercent] = useState('');

  const businessTypes = Object.keys(classificationData);
  const categoryKeys = React.useMemo(
    () =>
      selectedBusinessType
        ? orderedClassificationCategoryKeys(
            selectedBusinessType,
            classificationData[selectedBusinessType] || {},
            danhMucOrderByLine
          )
        : [],
    [selectedBusinessType, classificationData, danhMucOrderByLine]
  );

  React.useEffect(() => {
    if (categoryKeys.length > 0 && !categoryKeys.includes(selectedCategory)) {
      setSelectedCategory(categoryKeys[0]);
    }
  }, [selectedBusinessType, categoryKeys, selectedCategory]);

  const handleCategorySelectChange = (cat: string) => {
    setSelectedCategory(cat);
    for (const bt of businessTypes) {
      if (classificationData[bt]?.[cat] !== undefined) {
        setSelectedBusinessType(bt);
        break;
      }
    }
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const types = classificationData[selectedBusinessType]?.[selectedCategory] ?? [];
    setLocalTypeRows(types.map(value => ({ id: crypto.randomUUID(), value })));
    setEditingRowId(null);
  }, [isOpen, selectedBusinessType, selectedCategory]);

  const handleAddProductType = () => {
    if (!selectedBusinessType || !selectedCategory || !newProductTypeName.trim()) return;
    const label = formatProductTypeLabel(
      newProductTypeName,
      parsePlatformFeePercent(newPlatformFeePercent)
    );
    const currentTypes = classificationData[selectedBusinessType]?.[selectedCategory] ?? [];
    if (productTypesIncludeLabel(currentTypes, label)) return;
    setClassificationData(prev => {
      const newData = { ...prev };
      newData[selectedBusinessType][selectedCategory] = [...currentTypes, label];
      return newData;
    });
    setLocalTypeRows(prev => [...prev, { id: crypto.randomUUID(), value: label }]);
    setNewProductTypeName('');
    setNewPlatformFeePercent('');
  };

  const handleDeleteProductType = (rowId: string) => {
    setLocalTypeRows(prev => {
      const next = prev.filter(r => r.id !== rowId);
      setClassificationData(p => {
        const newData = { ...p };
        newData[selectedBusinessType][selectedCategory] = next.map(r => r.value);
        return newData;
      });
      return next;
    });
  };

  const handleSaveEdit = (rowId: string, oldType: string) => {
    if (!editingName.trim()) {
      setEditingRowId(null);
      return;
    }
    const nextVal = formatProductTypeLabel(
      editingName,
      parsePlatformFeePercent(editingFeePercent)
    );
    if (nextVal === oldType) {
      setEditingRowId(null);
      return;
    }
    setLocalTypeRows(prev => {
      const next = prev.map(r => (r.id === rowId ? { ...r, value: nextVal } : r));
      setClassificationData(p => {
        const newData = { ...p };
        newData[selectedBusinessType][selectedCategory] = next.map(r => r.value);
        return newData;
      });
      return next;
    });
    setEditingRowId(null);
  };

  const handleSwapTypeRows = (rowIdA: string, rowIdB: string) => {
    setLocalTypeRows((prev) => {
      const i = prev.findIndex((r) => r.id === rowIdA);
      const j = prev.findIndex((r) => r.id === rowIdB);
      if (i === -1 || j === -1 || i === j) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      setClassificationData((p) => {
        const newData = { ...p };
        newData[selectedBusinessType][selectedCategory] = next.map((r) => r.value);
        return newData;
      });
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Package size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Quản lý loại sản phẩm</h3>
                <p className="text-xs text-slate-500 font-medium">Thêm hoặc xóa các loại sản phẩm cho từng danh mục</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Loại hình kinh doanh</label>
                <select 
                  value={selectedBusinessType}
                  onChange={(e) => setSelectedBusinessType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                >
                  {businessTypes.map(bt => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 font-medium ml-1">Đổi loại hình sẽ lọc danh mục theo đúng nhóm.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Danh mục</label>
                <div className="flex gap-2">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => handleCategorySelectChange(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                  >
                    {categoryKeys.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-slate-400 font-medium ml-1">Chọn danh mục sẽ tự khớp loại hình kinh doanh tương ứng.</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Thêm loại sản phẩm mới</label>
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tên loại</span>
                  <input
                    type="text"
                    value={newProductTypeName}
                    onChange={(e) => setNewProductTypeName(e.target.value)}
                    placeholder="Ví dụ: Tài khoản FB"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddProductType()}
                  />
                </div>
                <div className="w-36 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">% Chiết khấu sàn</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={newPlatformFeePercent}
                      onChange={(e) => setNewPlatformFeePercent(e.target.value)}
                      placeholder="5"
                      title="Để trống mặc định 5%"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center outline-none focus:border-blue-500 transition-all"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddProductType()}
                    />
                    <span className="text-sm font-bold text-slate-500 pr-1">%</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddProductType}
                  disabled={!newProductTypeName.trim()}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Plus size={18} />
                  Thêm
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-medium ml-1">
                % chiết khấu sàn: để trống = 5%. Hiển thị dạng «Tên (4%)» trên form tạo gian hàng.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Danh sách loại sản phẩm hiện có</label>
              <div className="grid grid-cols-1 gap-2 pt-1">
                {localTypeRows.map((row, idx) => {
                  const prev = localTypeRows[idx - 1];
                  const next = localTypeRows[idx + 1];
                  return (
                    <ProductTypeItemContent
                      key={row.id}
                      rowId={row.id}
                      type={row.value}
                      editingRowId={editingRowId}
                      editingName={editingName}
                      editingFeePercent={editingFeePercent}
                      setEditingName={setEditingName}
                      setEditingFeePercent={setEditingFeePercent}
                      handleSaveEdit={handleSaveEdit}
                      setEditingRowId={setEditingRowId}
                      handleDeleteProductType={handleDeleteProductType}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < localTypeRows.length - 1}
                      onMoveUp={() => {
                        if (prev) handleSwapTypeRows(row.id, prev.id);
                      }}
                      onMoveDown={() => {
                        if (next) handleSwapTypeRows(row.id, next.id);
                      }}
                    />
                  );
                })}
                {localTypeRows.length === 0 && (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Package className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-sm font-medium text-slate-400">Chưa có loại sản phẩm nào</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button 
              onClick={onClose}
              className="px-8 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
            >
              Đóng
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const HistoryModal = ({ isOpen, onClose, product }: { isOpen: boolean; onClose: () => void; product: Product | null }) => {
  if (!product) return null;

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string, type: 'old' | 'new') => {
    setExpandedItems(prev => ({
      ...prev,
      [`${id}-${type}`]: !prev[`${id}-${type}`]
    }));
  };

  const mockHistory = [
    { id: '1', field: 'Tên mặt hàng', oldValue: product.name, newValue: product.name + ' (Cập nhật)', timestamp: '2026-03-26 14:30:00', user: 'Admin' },
    { id: '2', field: 'Tạo gian hàng', oldValue: 'Gian hàng cũ', newValue: 'Gian hàng ' + (product.sellerName || 'admin_store'), timestamp: '2026-03-20 09:00:00', user: 'System' },
    { id: '3', field: 'Mô tả ngắn', oldValue: 'Mô tả cũ của sản phẩm', newValue: 'Sản phẩm chất lượng cao, bảo hành 24/7', timestamp: '2026-03-20 09:00:00', user: 'System' },
    { id: '4', field: 'Tag', oldValue: 'TRÙNG, VIP', newValue: 'TRÙNG, RESELLER, VIP', timestamp: '2026-03-20 09:00:00', user: 'System' },
    { id: '5', field: 'Mô tả chi tiết', oldValue: 'Đây là mô tả chi tiết cũ của gian hàng, nội dung này rất dài và cần được thu gọn để không làm vỡ giao diện người dùng khi hiển thị trong bảng lịch sử chỉnh sửa này. Người dùng có thể nhấn vào nút xem chi tiết để xem toàn bộ nội dung.', newValue: 'Đây là mô tả chi tiết mới của gian hàng, bao gồm các chính sách bảo hành và hỗ trợ khách hàng mới nhất năm 2026. Chúng tôi cam kết mang lại trải nghiệm tốt nhất cho khách hàng khi mua sắm tại gian hàng của chúng tôi.', timestamp: '2026-03-20 09:00:00', user: 'System' },
    { id: '6', field: 'Giá bán', oldValue: product.price + 'đ', newValue: (parseInt(product.price.replace(/\D/g, '')) + 1000).toLocaleString() + 'đ', timestamp: '2026-03-25 10:15:00', user: 'Admin' },
  ];

  const renderValue = (id: string, type: 'old' | 'new', value: string | null, isOld: boolean = false) => {
    if (!value) return <p className="text-sm font-medium text-slate-400 italic">Không có dữ liệu</p>;
    
    const isLong = value.length > 100;
    const isExpanded = expandedItems[`${id}-${type}`];
    const displayValue = isLong && !isExpanded ? value.substring(0, 100) + '...' : value;

    return (
      <div className={`p-3 rounded-xl border ${isOld ? 'bg-slate-50/50 border-slate-100' : 'bg-white border-blue-100 shadow-sm'} space-y-2`}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            {isOld ? 'Giá trị trước đó' : 'Giá trị hiện tại'}
          </p>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(value);
              // Could add a toast here
            }}
            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
            title="Sao chép"
          >
            <Copy size={12} />
          </button>
        </div>
        <p className={`text-sm leading-relaxed ${isOld ? 'text-slate-500 font-medium' : 'text-slate-900 font-bold'}`}>
          {displayValue}
        </p>
        {isLong && (
          <button 
            onClick={() => toggleExpand(id, type)}
            className="text-[10px] font-bold text-blue-600 uppercase hover:text-blue-700 transition-colors flex items-center gap-1 pt-1"
          >
            {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
            {isExpanded ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[80vh]"
      >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <History size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Lịch sử chỉnh sửa</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{product.name}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {mockHistory.map((item, idx) => (
                <div key={item.id} className="relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-[-24px] before:w-px before:bg-slate-200 last:before:hidden">
                  <div className="absolute left-0 top-1.5 w-6 h-6 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center z-10">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  </div>
                  
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{item.field}</span>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                        <Clock size={12} />
                        {item.timestamp}
                      </div>
                    </div>
                    
                    <div className={`grid gap-4 ${item.field.includes('Mô tả') ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} items-start`}>
                      {renderValue(item.id, 'old', item.oldValue, true)}
                      {renderValue(item.id, 'new', item.newValue)}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                      <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {item.user[0]}
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Người thực hiện: {item.user}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              Đóng
            </button>
          </div>
        </motion.div>
      </div>
  );
};

const UserProfileModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md relative overflow-hidden flex flex-col"
        >
          {/* Header with Logo and Message Button */}
          <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-white rounded-3xl p-1 shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden">
                  <img 
                    src="https://picsum.photos/seed/user/200/200" 
                    alt="User Logo" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold font-display tracking-tight">benson_lcdt5e</h3>
                <p className="text-blue-100/80 text-sm font-medium">batdongsan361@gmail.com</p>
              </div>

              <button className="flex items-center gap-2 px-6 py-2.5 bg-white text-blue-600 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-50 hover:-translate-y-0.5 transition-all active:scale-95">
                <MessageCircle size={18} />
                Nhắn tin ngay
              </button>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 space-y-5 bg-slate-50/50">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ngày đăng ký</p>
                <p className="text-sm font-bold text-slate-900">22/03/2026</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Đã bán</p>
                <p className="text-sm font-bold text-emerald-600">1,250 đơn</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <ShoppingBag size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Sản phẩm đã mua</span>
                </div>
                <span className="text-sm font-bold text-slate-900">45</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                    <Layout size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Số gian hàng</span>
                </div>
                <span className="text-sm font-bold text-slate-900">12</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                    <Share2 size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Bài viết đã chia sẻ</span>
                </div>
                <span className="text-sm font-bold text-slate-900">156</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center">
                    <SendHorizontal size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Telegram</span>
                </div>
                <span className="text-sm font-bold text-blue-600 hover:underline cursor-pointer">@benson_dev</span>
              </div>
            </div>

            <button className="w-full py-4 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group">
              Xem các gian hàng đang bán
              <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const SidebarItem = ({ icon: Icon, label, active = false, onClick, badge }: { icon: any; label: string; active?: boolean; onClick?: () => void; badge?: string | number }) => (
  <motion.div 
    whileHover={{ x: 4 }}
    onClick={onClick}
    className={`flex items-center gap-3 px-5 py-4 cursor-pointer transition-all duration-300 rounded-xl group relative overflow-hidden ${
      active 
        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    {active && (
      <motion.div 
        layoutId="sidebar-active"
        className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
      />
    )}
    <Icon size={18} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
    <span className="text-sm font-semibold tracking-tight flex-1">{label}</span>
    {badge && (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-rose-500 text-white shadow-sm'}`}>
        {badge}
      </span>
    )}
  </motion.div>
);

interface PlatformManageRowProps {
  platform: Category;
  businessLine: BusinessLine;
  onEdit: (platform: Category) => void;
  onDelete: (id: string) => void;
  productTypeCount?: number;
  missingInClassification?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const ClassificationOnlyManageRow = ({
  name,
  typeCount,
  onPromote,
}: {
  name: string;
  typeCount: number;
  onPromote?: () => void;
}) => (
  <div className="flex items-center gap-3 p-3 bg-slate-50/80 border border-dashed border-slate-200 rounded-xl">
    <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
      <Folder size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-slate-700 truncate">{name}</span>
        <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md shrink-0 bg-amber-100 text-amber-800">
          Chỉ trong phân loại
        </span>
      </div>
      <div className="text-[10px] text-slate-400 font-medium">{typeCount} loại (Quản lý loại SP)</div>
    </div>
    {onPromote && (
      <button
        type="button"
        onClick={onPromote}
        className="shrink-0 px-3 py-2 rounded-lg text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all"
      >
        Tạo danh mục
      </button>
    )}
  </div>
);

const PlatformManageRow = ({
  platform,
  businessLine,
  onEdit,
  onDelete,
  productTypeCount,
  missingInClassification,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
}: PlatformManageRowProps) => {
  const Icon = platform.iconName && ICON_MAP[platform.iconName] ? ICON_MAP[platform.iconName] : Globe;

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl transition-all group hover:border-blue-200">
      {onMoveUp && onMoveDown && (
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title="Di chuyển lên"
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronUp size={16} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title="Di chuyển xuống"
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronDown size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-slate-900 truncate">{platform.name}</span>
          <span
            className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md shrink-0 ${
              businessLine === 'Bán sản phẩm'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-violet-100 text-violet-800'
            }`}
          >
            {businessLine === 'Bán sản phẩm' ? 'Sản phẩm' : 'Dịch vụ'}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
          {platform.subCategories?.length || 0} gian hàng
          {productTypeCount != null && productTypeCount > 0 && (
            <span className="text-slate-300"> · </span>
          )}
          {productTypeCount != null && productTypeCount > 0 && (
            <span className="text-indigo-500/90">{productTypeCount} loại SP/DV</span>
          )}
        </div>
        {missingInClassification && (
          <div className="text-[10px] font-medium text-amber-600 mt-0.5">Chưa có trong phân loại</div>
        )}
      </div>

      <div className="flex items-center gap-1 transition-opacity">
        <button
          type="button"
          onClick={() => onEdit(platform)}
          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
          title="Sá»­a"
        >
          <Edit2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(platform.id)}
          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
          title="Xóa"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const ManagePlatformsModal = ({
  isOpen,
  onClose,
  platforms,
  onSwapPlatforms,
  onEdit,
  onDelete,
  onCreatePlatform,
  onPromoteClassificationKey,
  groupTab,
  onGroupTabChange,
  classificationOnlyKeys,
  classificationLineData,
}: {
  isOpen: boolean;
  onClose: () => void;
  platforms: Category[];
  onSwapPlatforms: (platformIdA: string, platformIdB: string) => void;
  onEdit: (platform: Category) => void;
  onDelete: (id: string) => void;
  /** Mở form thêm danh mục (tab hiện tại = loại hình kinh doanh) */
  onCreatePlatform?: (line: BusinessLine) => void;
  onPromoteClassificationKey?: (name: string, line: BusinessLine) => void;
  groupTab: BusinessLine;
  onGroupTabChange: (t: BusinessLine) => void;
  classificationOnlyKeys: string[];
  classificationLineData: Record<string, string[]>;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-400/10 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg relative overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Quản lý danh mục</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Danh mục đồng bộ với Quản lý loại sản phẩm — cùng tên khóa theo tab Bán sản phẩm / Dịch vụ
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex rounded-xl p-1 bg-slate-100/80 border border-slate-200/80 shrink-0 self-start">
                  {(['Bán sản phẩm', 'Dịch vụ'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => onGroupTabChange(tab)}
                      className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        groupTab === tab
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab === 'Bán sản phẩm' ? 'Bán sản phẩm' : 'Dịch vụ'}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {onCreatePlatform && (
                    <button
                      type="button"
                      onClick={() => onCreatePlatform(groupTab)}
                      className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition-all active:scale-95 shrink-0"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                      Thêm danh mục
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-3">
                {platforms.map((platform, idx) => {
                  const prev = platforms[idx - 1];
                  const next = platforms[idx + 1];
                  return (
                    <div key={platform.id}>
                      <PlatformManageRow
                        platform={platform}
                        businessLine={groupTab}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        productTypeCount={classificationLineData[platform.name]?.length ?? 0}
                        missingInClassification={classificationLineData[platform.name] === undefined}
                        canMoveUp={idx > 0}
                        canMoveDown={idx < platforms.length - 1}
                        onMoveUp={() => {
                          if (prev) onSwapPlatforms(platform.id, prev.id);
                        }}
                        onMoveDown={() => {
                          if (next) onSwapPlatforms(platform.id, next.id);
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {classificationOnlyKeys.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Có trong Quản lý loại SP, chưa có nền tảng (danh mục) tương ứng
                  </p>
                  <div className="space-y-3">
                    {classificationOnlyKeys.map(key => (
                      <div key={key}>
                        <ClassificationOnlyManageRow
                          name={key}
                          typeCount={classificationLineData[key]?.length ?? 0}
                          onPromote={
                            onPromoteClassificationKey
                              ? () => onPromoteClassificationKey(key, groupTab)
                              : undefined
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {platforms.length === 0 && classificationOnlyKeys.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <LayoutDashboard size={32} />
                  </div>
                  <p className="text-sm font-medium text-slate-500">Chưa có danh mục nào</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
              >
                Hoàn tất
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const IconPicker = ({ selectedIcon, onSelect }: { selectedIcon: string; onSelect: (icon: string) => void }) => {
  const icons = Object.keys(ICON_MAP);
  
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Chọn Icon</label>
      <div className="grid grid-cols-6 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
        {icons.map(iconName => {
          const Icon = ICON_MAP[iconName];
          return (
            <button
              key={iconName}
              onClick={() => onSelect(iconName)}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                selectedIcon === iconName 
                  ? 'bg-blue-600 text-white shadow-md scale-110' 
                  : 'bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-100'
              }`}
              title={iconName}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* CategorySection, ProductRow, StatusBadge → ./gianHang/CategorySection.tsx */
/* WarehouseView → ./gianHang/WarehouseView.tsx */
/* ServiceOrdersView, ComplaintOrdersView → ./admin/ */

function getDefaultDiscountForm() {
  return {
    store: '',
    code: '',
    discountType: 'percent' as 'percent' | 'fixed',
    percent: '',
    fixedAmount: '',
    maxDiscount: '',
    maxUsage: '',
    unlimitedUsage: true,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    unlimitedEnd: true,
  };
}

function parseDiscountVndInput(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  const n = parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function formatDiscountVndDisplay(vnd: number): string {
  return `${vnd.toLocaleString('vi-VN')}đ'`;
}

function formatDiscountDateDisplay(iso: string): string {
  if (!iso?.trim()) return '—';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

const DiscountCodesView = ({ categories }: { categories: Category[] }) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [filterGian, setFilterGian] = useState('Tất cả');
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [codes, setCodes] = useState<DiscountCodeRow[]>(() => readDiscountCodesFromStorage());
  const [form, setForm] = useState(getDefaultDiscountForm);

  useEffect(() => {
    writeDiscountCodesToStorage(codes);
  }, [codes]);

  const storeOptions = useMemo(
    () => buildGianHangSelectOptions(categories, true),
    [categories]
  );

  const randomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const result = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setForm((f) => ({ ...f, code: result }));
  };

  const resetForm = () => {
    setForm(getDefaultDiscountForm());
    setFormError(null);
  };

  const filteredCodes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return codes.filter((row) => {
      if (activeTab === 'Hoạt động' && !row.active) return false;
      if (activeTab === 'Tạm ngưng' && row.active) return false;
      if (filterGian !== 'Tất cả' && row.scopeStore !== filterGian) return false;
      if (q && !row.code.toLowerCase().includes(q) && !row.scopeStore.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [codes, search, activeTab, filterGian]);

  const handleCreateDiscountCode = () => {
    setFormError(null);
    if (!form.store.trim()) {
      setFormError('Chọn gian hàng áp dụng');
      return;
    }
    if (!form.code.trim()) {
      setFormError('Nhập mã giảm giá');
      return;
    }
    const codeUpper = form.code.trim().toUpperCase();
    if (codes.some((c) => c.code === codeUpper)) {
      setFormError('Mã giảm giá đã tồn tại');
      return;
    }

    let value = '';
    let maxDiscountLabel = 'Không giới hạn';

    if (form.discountType === 'percent') {
      const pct = parseFloat(form.percent.replace(',', '.'));
      if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
        setFormError('Nhập % giảm từ 1 đến 100');
        return;
      }
      value = `${pct}%`;
      const maxVnd = parseDiscountVndInput(form.maxDiscount);
      if (maxVnd > 0) maxDiscountLabel = formatDiscountVndDisplay(maxVnd);
    } else {
      const fixedVnd = parseDiscountVndInput(form.fixedAmount);
      if (fixedVnd <= 0) {
        setFormError('Nhập số tiền giảm cố định');
        return;
      }
      value = formatDiscountVndDisplay(fixedVnd);
      maxDiscountLabel = '—';
    }

    const usageLabel = form.unlimitedUsage
      ? '0/∞'
      : `0/${Math.max(1, parseInt(form.maxUsage, 10) || 0)}`;

    const timeEnd = form.unlimitedEnd ? 'Không hạn' : formatDiscountDateDisplay(form.endDate);

    const row: DiscountCodeRow = {
      id: `DC-${Date.now()}`,
      code: codeUpper,
      scopeStore: form.store,
      value,
      maxDiscount: maxDiscountLabel,
      time: {
        start: formatDiscountDateDisplay(form.startDate),
        end: timeEnd,
      },
      usage: usageLabel,
      status: 'Hoạt động',
      active: true,
      discountType: form.discountType,
      percentValue:
        form.discountType === 'percent'
          ? parseFloat(form.percent.replace(',', '.'))
          : undefined,
      fixedAmountVnd:
        form.discountType === 'fixed' ? parseDiscountVndInput(form.fixedAmount) : undefined,
      maxDiscountVnd:
        form.discountType === 'percent'
          ? parseDiscountVndInput(form.maxDiscount) || null
          : null,
      unlimitedUsage: form.unlimitedUsage,
      maxUsageCount: form.unlimitedUsage
        ? undefined
        : Math.max(1, parseInt(form.maxUsage, 10) || 0),
      usedCount: 0,
      unlimitedEnd: form.unlimitedEnd,
      startDateIso: form.startDate,
      endDateIso: form.unlimitedEnd ? undefined : form.endDate,
    };

    setCodes((prev) => [row, ...prev]);
    setShowModal(false);
    resetForm();
  };

  const toggleCodeActive = (id: string) => {
    setCodes((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              active: !c.active,
              status: !c.active ? 'Hoạt động' : 'Tạm ngưng',
            }
          : c
      )
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={filterGian}
                onChange={(e) => setFilterGian(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none cursor-pointer"
              >
                <option value="Tất cả">Tất cả gian hàng</option>
                {storeOptions
                  .filter((o) => o.value !== 'Tất cả gian hàng')
                  .map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm mã đơn, tên người mua, sản phẩm..."
                className="w-full pl-11 pr-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none shadow-sm"
              />
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <Plus size={18} />
              Thêm mã Giảm giá
            </button>
          </div>
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none cursor-pointer"
            >
              {['Tất cả', 'Hoạt động', 'Tạm ngưng'].map(tab => (
                <option key={tab} value={tab}>{tab}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200">MÃ GIẢM GIÁ</th>
                  <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200">ÁP DỤNG</th>
                  <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200">GIÁ TRỊ</th>
                  <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200">THỜI GIAN</th>
                  <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200">LƯỢT SỬ DỤNG</th>
                  <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200">TRẠNG THÁI</th>
                  <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display text-center">BẬT/TẮT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-4 border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700">{code.code}</span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(code.code)}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          title="Sao chép mã"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 text-[10px] font-bold">
                          <ShoppingBag size={10} /> GIAN HÀNG
                        </div>
                        <span className="text-[11px] font-bold text-blue-600">{code.scopeStore}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-blue-600">{code.value}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Max: {code.maxDiscount}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-slate-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Từ: <span className="font-bold">{code.time.start}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Đến:{' '}
                          <span
                            className={`font-bold ${code.time.end === 'Không hạn' ? 'text-blue-600' : ''}`}
                          >
                            {code.time.end}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-slate-100">
                      <span className="text-sm font-bold text-blue-600">{code.usage}</span>
                    </td>
                    <td className="py-4 px-4 border-r border-slate-100">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                          code.active
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {code.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleCodeActive(code.id)}
                        className={`w-12 h-6 rounded-full p-1 transition-all mx-auto block ${
                          code.active ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                        aria-label={code.active ? 'Tắt mã' : 'Bật mã'}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-all ${
                            code.active ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCodes.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-500">
              {codes.length === 0
                ? 'Chưa có mã giảm giá. Bấm «Thêm mã Giảm giá» để tạo mới.'
                : 'Không có mã phù hợp bộ lọc.'}
            </p>
          )}
        </div>
      </motion.div>

      {/* Modal Thêm mã giảm giá */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Ticket size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Thêm mã giảm giá</h2>
                    <p className="text-[11px] text-slate-400 font-medium">Tạo mã khuyến mãi mới cho gian hàng</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5">

                {/* 1. Gian hàng áp dụng */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                    Gian hàng áp dụng <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <ShoppingBag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <select
                      value={form.store}
                      onChange={(e) => setForm(f => ({ ...f, store: e.target.value }))}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 transition-all outline-none cursor-pointer"
                    >
                      <option value="">-- Chọn gian hàng --</option>
                      {storeOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                  </div>
                </div>

                {/* 2. Mã giảm giá */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                    Mã giảm giá <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Ticket className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        type="text"
                        value={form.code}
                        onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                        placeholder="VD: SUMMER2026"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 transition-all outline-none tracking-widest"
                      />
                    </div>
                    <button
                      onClick={randomCode}
                      title="Tạo mã ngẫu nhiên"
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all active:scale-95 whitespace-nowrap"
                    >
                      <Zap size={13} />
                      Ngẫu nhiên
                    </button>
                  </div>
                </div>

                {/* 3. Loại giảm giá */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                    Loại giảm giá <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-3">
                    <button
                      onClick={() => setForm(f => ({ ...f, discountType: 'percent' }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${form.discountType === 'percent' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <span className="text-sm font-black">%</span> Theo phần trăm
                    </button>
                    <button
                      onClick={() => setForm(f => ({ ...f, discountType: 'fixed' }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${form.discountType === 'fixed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <DollarSign size={12} /> Số tiền cố định
                    </button>
                  </div>

                  {form.discountType === 'percent' ? (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">% Giảm giá</label>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={form.percent}
                            onChange={(e) => setForm((f) => ({ ...f, percent: e.target.value }))}
                            placeholder="VD: 20"
                            className="w-full pl-4 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 transition-all outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            %
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                          Giảm tối đa (tùy chọn)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={form.maxDiscount}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                maxDiscount: e.target.value.replace(/[^\d]/g, ''),
                              }))
                            }
                            placeholder="VD: 50000"
                            className="w-full pl-4 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 transition-all outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                            đ'
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Không điền = giảm tối đa <span className="font-bold text-blue-600">không giới hạn</span>{' '}
                          (chỉ áp dụng trần % trên tổng đơn).
                        </p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Số tiền giảm cố định</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          value={form.fixedAmount}
                          onChange={(e) => setForm(f => ({ ...f, fixedAmount: e.target.value }))}
                          placeholder="VD: 50000"
                          className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 transition-all outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">đ'</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Lượt sử dụng tối đa */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                    Lượt sử dụng tối đa
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={form.maxUsage}
                      onChange={(e) => setForm(f => ({ ...f, maxUsage: e.target.value }))}
                      disabled={form.unlimitedUsage}
                      placeholder="VD: 100"
                      className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 transition-all outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </div>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer group w-fit">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, unlimitedUsage: !f.unlimitedUsage, maxUsage: !f.unlimitedUsage ? '' : f.maxUsage }))}
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${form.unlimitedUsage ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}
                    >
                      {form.unlimitedUsage && <Check size={10} className="text-white" strokeWidth={3} />}
                    </button>
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700 transition-colors select-none">Không giới hạn lượt sử dụng</span>
                  </label>
                </div>

                {/* 5. Thời gian áp dụng */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                    Thời gian áp dụng
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ngày bắt đầu</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        <input
                          type="date"
                          value={form.startDate}
                          onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ngày kết thúc</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        <input
                          type="date"
                          value={form.endDate}
                          onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))}
                          disabled={form.unlimitedEnd}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 transition-all outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer group w-fit">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, unlimitedEnd: !f.unlimitedEnd, endDate: !f.unlimitedEnd ? '' : f.endDate }))}
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${form.unlimitedEnd ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}
                    >
                      {form.unlimitedEnd && <Check size={10} className="text-white" strokeWidth={3} />}
                    </button>
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700 transition-colors select-none">Không giới hạn thời gian kết thúc</span>
                  </label>
                </div>

                {formError && (
                  <p className="text-sm font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                    {formError}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-all active:scale-95"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateDiscountCode}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Check size={15} />
                  Tạo mã giảm giá
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Admin tab "Lịch sử giao dịch" (custom admin shell) đã chuyển sang dùng
// `AdminPaymentHistoryView` từ `src/admin/PaymentHistoryView.tsx`.

const OrdersView = ({ onOrderClick, orders, setOrders }: { onOrderClick: (id: string) => void, orders: Order[], setOrders: React.Dispatch<React.SetStateAction<Order[]>> }) => {
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedOrderForWarranty, setSelectedOrderForWarranty] = useState<Order | null>(null);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);
  const [warrantyQuantity, setWarrantyQuantity] = useState<number>(0);
  const [warrantyMessage, setWarrantyMessage] = useState('');
  const [cancelQuantity, setCancelQuantity] = useState<number>(0);
  const [warrantyError, setWarrantyError] = useState<string | null>(null);

  const handleServiceWarranty = (order: Order) => {
    if (order.isWarrantyProcessed) {
      setWarrantyError('Chỉ bảo hành 1 lần');
      return;
    }
    setSelectedOrderForWarranty(order);
    setWarrantyQuantity(order.quantity);
    setIsWarrantyModalOpen(true);
  };

  const handleProductWarranty = (order: Order) => {
    console.log('Product warranty action for:', order.id);
    setSelectedOrderForWarranty(order);
    setWarrantyQuantity(order.quantity);
    setIsWarrantyModalOpen(true);
  };

  const handleConfirmWarranty = () => {
    if (selectedOrderForWarranty) {
      if (selectedOrderForWarranty.isWarrantyProcessed) {
        setWarrantyError('Chỉ bảo hành 1 lần');
        return;
      }

      let newOrderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      // Ensure newOrderId is unique
      while (orders.some(o => o.id === newOrderId)) {
        newOrderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      }

      const now = new Date();
      const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const newOrder: Order = {
        ...selectedOrderForWarranty,
        id: newOrderId,
        purchaseDate: formattedDate,
        quantity: warrantyQuantity,
        discount: selectedOrderForWarranty.unitPrice,
        totalAmount: '0đ',
        status: 'Tạm giữ tiền',
        warrantedFromId: selectedOrderForWarranty.id,
        isWarrantyProcessed: false,
        hasComplained: false,
        order_type: 'product',
        platformFee: '0đ',
        platformFeePercent: 0,
        reseller: undefined,
        resellerReferrerEmail: undefined,
        resellerPercent: undefined,
        resellerFee: '0đ',
      };

      setOrders(prev => [
        newOrder,
        ...prev.map(order => 
          order.id === selectedOrderForWarranty.id 
            ? { ...order, isWarrantyProcessed: true, warrantedToId: newOrderId } 
            : order
        )
      ]);

      setIsWarrantyModalOpen(false);
      setWarrantyMessage('');
    }
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId
        ? { ...order, status: 'Thất bại', refund: order.totalAmount, failureKind: 'seller_cancel' }
        : order
    ));
    setIsCancelModalOpen(false);
  };

  const filters = ['Tất cả', 'Hoàn thành', 'Đang thực hiện', 'Khiếu nại', 'Tranh chấp', 'Tạm giữ tiền', 'Thất bại', 'Chờ xác nhận'];

  const filteredOrders = orders
    .filter(order => {
      const isProduct = order.order_type !== 'service';
      if (!isProduct) return false;

      const matchesFilter = activeFilter === 'Tất cả' || order.status === activeFilter;
      const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase()) || 
                           order.buyerName.toLowerCase().includes(search.toLowerCase()) ||
                           order.productName.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort(compareOrdersNewestFirst);

  const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  };

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'Hoàn thành': return 'bg-[#4caf50] text-white border-transparent';
      case 'Đang thực hiện': return 'bg-[#42a5f5] text-white border-transparent';
      case 'Khiếu nại': return 'bg-[#ef5350] text-white border-transparent';
      case 'Tranh chấp': return 'bg-[#ef5350] text-white border-transparent';
      case 'Tạm giữ tiền': return 'bg-[#2d6a61] text-white border-transparent';
      case 'Thất bại': return 'bg-[#1c2331] text-white border-transparent';
      case 'Chờ xác nhận': return 'bg-[#ffb300] text-amber-900 border-transparent';
      default: return 'bg-slate-500 text-white border-transparent';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none cursor-pointer"
          >
            {filters.map(filter => (
              <option key={filter} value={filter}>{filter}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm mã đơn, tên người mua, sản phẩm..." 
            className="w-full pl-11 pr-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible">
        <div className="overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 w-24">HÀNH ĐỘNG</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200">MÃ ĐƠN / NGÀY MUA</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 min-w-[450px]">GIAN HÀNG / SẢN PHẨM</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200">NGƯỜI MUA</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-center w-20">SL</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-right">ĐƠN GIÁ</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-center">GIẢM</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-right">TỔNG TIỀN</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-center">HOÀN TIỀN</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-center">SÀN / RESELLER</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display text-center min-w-[200px]">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-4 border-r border-slate-100">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all" title="Nhắn tin">
                        <MessageSquare size={14} />
                      </button>
                      {(order.status === 'Chờ xác nhận' || order.status === 'Tạm giữ tiền' || order.status === 'Khiếu nại' || order.status === 'Tranh chấp' || order.status === 'Đang thực hiện') && (
                        <button 
                          onClick={() => {
                            setSelectedOrderForCancel(order);
                            setCancelQuantity(order.quantity);
                            setIsCancelModalOpen(true);
                          }}
                          className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 hover:scale-110 transition-all shadow-sm" 
                          title="Hủy đơn"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                      {(order.status === 'Tạm giữ tiền' || order.status === 'Khiếu nại' || order.status === 'Tranh chấp') && (
                        <button 
                          onClick={() => {
                            if (order.isWarrantyProcessed) {
                              setWarrantyError('Chỉ bảo hành 1 lần');
                              return;
                            }
                            if (order.order_type === 'product') {
                              handleProductWarranty(order);
                            } else {
                              handleServiceWarranty(order);
                            }
                          }}
                          className="p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-all" 
                          title="Bảo hành"
                        >
                          <Shield size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-col">
                        <span 
                          onClick={() => onOrderClick(order.id)}
                          className="text-sm font-bold text-blue-600 font-mono tracking-tight hover:underline cursor-pointer"
                        >
                          {order.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold whitespace-nowrap">
                        <Calendar size={13} className="text-slate-500" />
                        {order.purchaseDate}
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 text-[10px] font-bold hover:underline cursor-pointer transition-all w-fit">
                        <Users size={10} className="text-blue-400" />
                        {order.sellerName}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                          {order.categoryName.toLowerCase().includes('facebook') ? <Facebook size={14} /> :
                           order.categoryName.toLowerCase().includes('tiktok') ? <Music size={14} /> :
                           order.categoryName.toLowerCase().includes('google') ? <Globe size={14} /> :
                           <Folder size={14} />}
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer transition-colors uppercase tracking-wider truncate block">{order.categoryName || 'FACEBOOK'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0 border border-blue-100/50">
                          <Package size={14} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[13px] font-bold text-slate-800 leading-tight block line-clamp-2">{order.productName}</span>
                          {order.warrantedFromId && (
                            <span className="text-[10px] text-rose-500 font-bold italic mt-0.5 block">
                              đơn hàng bảo hành
                            </span>
                          )}
                          {order.isWarrantyProcessed && (
                            <span className="text-[10px] text-amber-600 font-bold italic mt-0.5 block">
                              đơn hàng đã hỗ trợ bảo hành {order.warrantedToId && (
                                <> ( mã đơn : <span className="underline cursor-pointer" onClick={() => onOrderClick(order.warrantedToId!)}>{order.warrantedToId}</span> )</>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100">
                    <span className="text-sm font-bold text-blue-600 hover:underline cursor-pointer transition-colors">
                      {removeAccents(order.buyerName)}
                    </span>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 text-center">
                    <span className="text-xs font-bold text-slate-900">{order.quantity.toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 text-right">
                    <span className="text-xs font-bold text-slate-900">{order.unitPrice}</span>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 text-center">
                    <span className="text-xs font-bold text-slate-900">{order.discount}</span>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 text-right">
                    <span className="text-xs font-bold text-slate-900">{order.totalAmount}</span>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 text-center">
                    <OrderRefundCell order={order} />
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 text-center">
                    <OrderSellerFeesCell order={order} />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <OrderStatusCell
                      order={order}
                      badgeClassName={`px-3 py-1 rounded-xl text-[11px] font-bold border whitespace-nowrap ${getStatusStyle(order.status)}`}
                      getStatusStyle={getStatusStyle}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isWarrantyModalOpen && selectedOrderForWarranty && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Yêu cầu bảo hành</h3>
                    <p className="text-xs text-slate-400 font-medium">Đơn hàng: {selectedOrderForWarranty.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsWarrantyModalOpen(false)} 
                  className="p-2 hover:bg-white rounded-xl transition-all text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số lượng bảo hành</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={warrantyQuantity}
                      onChange={(e) => setWarrantyQuantity(Number(e.target.value))}
                      max={selectedOrderForWarranty.quantity}
                      min={1}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 outline-none transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      Tối đa: {selectedOrderForWarranty.quantity}
                    </div>
                  </div>
                  {warrantyQuantity > selectedOrderForWarranty.quantity && (
                    <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                      <AlertCircle size={10} /> Số lượng không được vượt quá số lượng đã mua
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nội dung nhắn tin cho khách</label>
                  <textarea
                    value={warrantyMessage}
                    onChange={(e) => setWarrantyMessage(e.target.value)}
                    placeholder="Nhập nội dung tin nhắn gửi cho khách hàng..."
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setIsWarrantyModalOpen(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirmWarranty}
                  disabled={warrantyQuantity > selectedOrderForWarranty.quantity || warrantyQuantity < 1}
                  className="flex-1 py-3 bg-amber-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác nhận bảo hành
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <AnimatePresence>
          {warrantyError && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-400/10 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-sm w-full text-center space-y-4"
              >
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Thông báo</h3>
                <p className="text-sm text-slate-600 font-medium">{warrantyError}</p>
                <button
                  onClick={() => setWarrantyError(null)}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                >
                  Đóng
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {isCancelModalOpen && selectedOrderForCancel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                    <XCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Hủy đơn hàng</h3>
                    <p className="text-xs text-slate-400 font-medium">Đơn hàng: {selectedOrderForCancel.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCancelModalOpen(false)} 
                  className="p-2 hover:bg-white rounded-xl transition-all text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3">
                  <AlertCircle className="text-rose-600 shrink-0" size={20} />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-rose-900">Xác nhận hủy đơn</p>
                    <p className="text-xs text-rose-700 leading-relaxed font-medium">
                      Hệ thống sẽ thực hiện hủy toàn bộ đơn hàng và hoàn tiền 100% cho khách hàng.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={() => handleCancelOrder(selectedOrderForCancel.id)}
                  className="flex-1 py-3 bg-rose-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all"
                >
                  Xác nhận hủy đơn
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
const SortableItem = ({ id, index, label, icon: Icon }: { id: string; index: number; label: string; icon?: any; key?: string | number }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl mb-2 transition-all ${
        isDragging ? 'shadow-xl ring-2 ring-blue-500 z-50 opacity-50' : 'hover:border-blue-300'
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-blue-600">
        <GripVertical size={16} />
      </div>
      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-xs">
        {index + 1}
      </div>
      {Icon && <Icon size={16} className="text-blue-600" />}
      <span className="text-sm font-semibold text-slate-700 truncate flex-1">{label}</span>
    </div>
  );
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [homeAccessDeniedFlash, setHomeAccessDeniedFlash] = useState<string | null>(null);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProfileOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const root = profileMenuRef.current;
      if (root && !root.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [isProfileOpen]);
  const [currentView, setCurrentView] = useState<
    'home' | 'gian-hang' | 'don-hang' | 'don-hang-dich-vu' | 'don-hang-khieu-nai' | 'thong-ke' | 'quan-ly-reseller' | 'danh-gia' | 'ma-giam-gia' | 'don-hang-da-mua' | 'lich-su-thanh-toan' | 'order-detail' | 'admin-dashboard'
  >(() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname;
    if (path.startsWith('/admin/panel')) {
      return canAccessAdminRoutes(getStoredRole()) ? 'admin-dashboard' : 'home';
    }
    if (path.startsWith('/admin')) {
      if (isSellerStoreAdminPath(path)) return 'gian-hang';
      if (!canAccessAdminRoutes(getStoredRole())) return 'home';
      return pathToAdminShellView(path) ?? 'gian-hang';
    }
    return 'home';
  });
  const [previousView, setPreviousView] = useState<string>('gian-hang');

  /** Số dư ví khách theo email — demo 100tr, nạp lại khi < 1tr (xem storefrontWalletByEmail). */
  const [storefrontWalletVnd, setStorefrontWalletVnd] = useState(() =>
    getStorefrontWalletVndForEmail(getSessionBuyerEmail())
  );

  const [storefrontLoggedIn, setStorefrontLoggedInState] = useState(() => getStorefrontLoggedIn());
  const [storefrontBuyerName, setStorefrontBuyerName] = useState(() => getSessionLoginUsername());
  const [storefrontBuyerEmail, setStorefrontBuyerEmailState] = useState(() => getSessionBuyerEmail());
  const storefrontBuyerEmailRef = useRef(storefrontBuyerEmail);
  storefrontBuyerEmailRef.current = storefrontBuyerEmail;

  /** Đọc số dư ví theo email — storefront & admin shell (người bán / khách đã đăng nhập). */
  useEffect(() => {
    const email = storefrontBuyerEmail.trim();
    if (!email) return;
    setStorefrontWalletVnd(getStorefrontWalletVndForEmail(email));
  }, [currentView, storefrontBuyerEmail]);

  /** Ghi map ví khi số dư đổi — luôn dùng email hiện tại (ref), tránh ghi số dư user A sang email B khi đổi email). */
  useEffect(() => {
    if (!storefrontLoggedIn) return;
    const email = storefrontBuyerEmailRef.current.trim();
    if (!email) return;
    setStorefrontWalletVndForEmail(email, storefrontWalletVnd);
  }, [storefrontWalletVnd, storefrontLoggedIn]);

  /** Tab khác / Admin chỉnh ví, hoặc focus cửa sổ: đồng bộ lại từ localStorage. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pullWalletFromStorage = () => {
      const email = getSessionBuyerEmail().trim();
      if (!email) return;
      setStorefrontWalletVnd(getStorefrontWalletVndForEmail(email));
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STOREFRONT_WALLET_BY_EMAIL_KEY || e.key === null) pullWalletFromStorage();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', pullWalletFromStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', pullWalletFromStorage);
    };
  }, []);

  /** Giao dịch mua từ storefront — merge vào Admin / Lịch sử giao dịch (skill thanh-toan). */
  const [adminSyncedPaymentHistory, setAdminSyncedPaymentHistory] = useState<PaymentHistory[]>([]);

  /** Lịch sử giao dịch tab storefront — giữ khi vào Admin (HomeView unmount). */
  const [storefrontPaymentHistoryCheckoutItems, setStorefrontPaymentHistoryCheckoutItems] = useState<
    PaymentHistoryItem[]
  >([]);

  const [allOrders, setAllOrders] = useState<Order[]>([
    {
      id: 'ORD-882712',
      purchaseDate: '21/03/2026 14:30',
      sellerName: 'premium_accs',
      categoryName: 'Tài khoản Facebook Ads',
      productName: 'Via XMDT Việt Cổ - Bảo hành 24h - Bao login - Bao check - Hỗ trợ nhiệt tình 24/7 cho anh em chạy ads ngân sách lớn không lo bị die tài khoản giữa chừng',
      buyerName: 'benson_lcdt5e',
      quantity: 2,
      unitPrice: '150,000đ',
      discount: '0đ',
      totalAmount: '300,000đ',
      refund: '0đ',
      status: 'Hoàn thành',
      order_type: 'product'
    },
    {
      id: 'ORD-882713',
      purchaseDate: '21/03/2026 15:45',
      sellerName: 'tiktok_shop',
      categoryName: 'Tài khoản TikTok',
      productName: 'Acc Tiktok 10k Follow - Tương tác cao',
      buyerName: 'benson_lcdt5e',
      quantity: 1,
      unitPrice: '500,000đ',
      discount: '50,000đ',
      totalAmount: '450,000đ',
      refund: '0đ',
      status: 'Đang thực hiện',
      order_type: 'product'
    },
    {
      id: 'ORD-882714',
      purchaseDate: '22/03/2026 09:15',
      sellerName: 'google_ads_pro',
      categoryName: 'Mã Google Ads',
      productName: 'Mã giảm giá Google Ads 100$',
      buyerName: 'benson_lcdt5e',
      quantity: 5,
      unitPrice: '20,000đ',
      discount: '0đ',
      totalAmount: '100,000đ',
      refund: '0đ',
      status: 'Khiếu nại',
      isWarrantyProcessed: true,
      warrantedToId: 'ORD-882712',
      order_type: 'product',
      complaintStartedAtMs: parsePurchaseDateToMs('22/03/2026 11:20') ?? undefined,
      complaintReason: 'Sản phẩm không đúng mô tả, yêu cầu hoàn tiền',
      hasComplained: true,
    },
    {
      id: 'ORD-882715',
      purchaseDate: '22/03/2026 10:30',
      sellerName: 'cloud_service',
      categoryName: 'VPS Windows',
      productName: 'VPS Windows 4GB RAM - 1 Tháng',
      buyerName: 'benson_lcdt5e',
      quantity: 1,
      unitPrice: '250,000đ',
      discount: '0đ',
      totalAmount: '250,000đ',
      refund: '0đ',
      status: 'Tạm giữ tiền',
      order_type: 'service'
    },
    {
      id: 'ORD-882716',
      purchaseDate: '22/03/2026 11:00',
      sellerName: 'game_store',
      categoryName: 'Nạp Game Free Fire',
      productName: 'Nạp 1000 Kim Cương Free Fire',
      buyerName: 'benson_lcdt5e',
      quantity: 1,
      unitPrice: '180,000đ',
      discount: '0đ',
      totalAmount: '180,000đ',
      refund: '180,000đ',
      status: 'Thất bại',
      order_type: 'service'
    },
    {
      id: 'ORD-882719',
      purchaseDate: '24/03/2026 10:00',
      sellerName: 'service_pro',
      categoryName: 'Tăng Follow TikTok',
      productName: 'Tăng 1000 Follow Tiktok',
      buyerName: 'benson_lcdt5e',
      quantity: 1,
      unitPrice: '100,000đ',
      discount: '0đ',
      totalAmount: '100,000đ',
      refund: '0đ',
      status: 'Đang thực hiện',
      order_type: 'service'
    },
    {
      id: 'ORD-882720',
      purchaseDate: '24/03/2026 11:30',
      sellerName: 'service_pro',
      categoryName: 'Tăng Like Facebook',
      productName: 'Tăng 500 Like Facebook',
      buyerName: 'benson_lcdt5e',
      quantity: 1,
      unitPrice: '50,000đ',
      discount: '0đ',
      totalAmount: '50,000đ',
      refund: '0đ',
      status: 'Đang thực hiện',
      order_type: 'service'
    },
    {
      id: 'ORD-882721',
      purchaseDate: '24/03/2026 14:00',
      sellerName: 'service_pro',
      categoryName: 'Tăng View YouTube',
      productName: 'Tăng 200 View Youtube',
      buyerName: 'benson_lcdt5e',
      quantity: 1,
      unitPrice: '30,000đ',
      discount: '0đ',
      totalAmount: '30,000đ',
      refund: '30,000đ',
      status: 'Thất bại',
      order_type: 'service'
    },
    {
      id: 'ORD-882722',
      purchaseDate: '24/03/2026 15:00',
      sellerName: 'service_pro',
      categoryName: 'Tăng Sub YouTube',
      productName: 'Tăng 500 Sub Youtube',
      buyerName: 'benson_lcdt5e',
      quantity: 1,
      unitPrice: '150,000đ',
      discount: '0đ',
      totalAmount: '150,000đ',
      refund: '0đ',
      status: 'Hoàn thành',
      order_type: 'service'
    },
    {
      id: 'ORD-882723',
      purchaseDate: '24/03/2026 15:30',
      sellerName: 'service_pro',
      categoryName: 'Chạy Ads Facebook',
      productName: 'Chạy Ads Facebook 1M',
      buyerName: 'benson_lcdt5e',
      quantity: 1,
      unitPrice: '1,000,000đ',
      discount: '0đ',
      totalAmount: '1,000,000đ',
      refund: '0đ',
      status: 'Đang thực hiện',
      order_type: 'service'
    },
    {
      id: 'ORD-882724',
      purchaseDate: '24/03/2026 16:00',
      sellerName: 'service_pro',
      categoryName: 'Mắt Live Facebook',
      productName: 'Tăng 1000 Mắt Live FB',
      buyerName: 'benson_lcdt5e',
      quantity: 1,
      unitPrice: '50,000đ',
      discount: '0đ',
      totalAmount: '50,000đ',
      refund: '50,000đ',
      status: 'Thất bại',
      order_type: 'service'
    },
    {
      id: 'ORD-882725',
      purchaseDate: '24/03/2026 16:30',
      sellerName: 'service_pro',
      categoryName: 'Gói VIP TikTok',
      productName: 'Gói VIP View Tiktok 1 Tháng',
      buyerName: 'benson_lcdt5e',
      quantity: 1,
      unitPrice: '500,000đ',
      discount: '0đ',
      totalAmount: '500,000đ',
      refund: '0đ',
      status: 'Khiếu nại',
      order_type: 'service',
      complaintStartedAtMs: parsePurchaseDateToMs('24/03/2026 18:05') ?? undefined,
      complaintReason: 'Dịch vụ chưa đạt cam kết',
      hasComplained: true,
    },
    {
      id: 'ORD-882726',
      purchaseDate: '24/03/2026 17:00',
      sellerName: 'service_pro',
      categoryName: 'Thiết Kế Banner',
      productName: 'Thiết Kế Banner Quàng Cáo',
      buyerName: 'benson_lcdt5e',
      quantity: 1,
      unitPrice: '200,000đ',
      discount: '0đ',
      totalAmount: '200,000đ',
      refund: '0đ',
      status: 'Chờ xác nhận',
      order_type: 'service'
    },
    {
      id: 'ORD-882727',
      purchaseDate: '24/03/2026 17:30',
      sellerName: 'service_pro',
      categoryName: 'Thuê VPS Linux',
      productName: 'Thuê VPS Linux 1 Năm',
      buyerName: 'benson_lcdt5e',
      quantity: 1,
      unitPrice: '1,200,000đ',
      discount: '0đ',
      totalAmount: '1,200,000đ',
      refund: '0đ',
      status: 'Tranh chấp',
      order_type: 'service'
    },
    {
      id: 'ORD-882717',
      purchaseDate: '23/03/2026 08:30',
      sellerName: 'premium_acc',
      categoryName: 'FACEBOOK - TÀI KHOẢN QUẢNG CÁO CÁ NHÂN',
      productName: 'Tài khoản Netflix Premium - 1 Tháng',
      buyerName: 'benson_lcdt5e',
      quantity: 1,
      unitPrice: '120,000đ',
      discount: '0đ',
      totalAmount: '120,000đ',
      refund: '0đ',
      status: 'Đang thực hiện',
      order_type: 'product'
    },
    {
      id: 'ORD-882718',
      purchaseDate: '23/03/2026 09:45',
      sellerName: 'global_ads',
      categoryName: 'Google',
      productName: 'Tài khoản Ads Invoice',
      buyerName: 'benson_lcdt5e',
      quantity: 1,
      unitPrice: '2,000,000đ',
      discount: '0đ',
      totalAmount: '2,000,000đ',
      refund: '0đ',
      status: 'Tranh chấp',
      order_type: 'product'
    },
    {
      id: 'ORD-992831',
      purchaseDate: '21/03/2026 10:30',
      sellerName: 'admin_store',
      categoryName: 'FACEBOOK - TÀI KHOẢN QUẢNG CÁO CÁ NHÂN',
      productName: 'Via XMDT Việt Cổ - Bảo hành 24h',
      buyerName: 'nguyenvana',
      quantity: 5,
      unitPrice: '150,000đ',
      discount: '0đ',
      totalAmount: '750,000đ',
      refund: '0đ',
      status: 'Hoàn thành',
      platformFee: '15,000đ',
      reseller: 'affiliate_vn',
      resellerPercent: 10,
      resellerFee: '10,000đ',
      order_type: 'product'
    },
    {
      id: 'ORD-992832',
      purchaseDate: '21/03/2026 11:15',
      sellerName: 'reseller_pro',
      categoryName: 'TIKTOK - TÀI KHOẢN QUẢNG CÁO BC',
      productName: 'Acc Tiktok 10k Follow - Tương tác cao',
      buyerName: 'tranthib',
      quantity: 1,
      unitPrice: '500,000đ',
      discount: '50,000đ',
      totalAmount: '450,000đ',
      refund: '0đ',
      status: 'Chờ xác nhận',
      platformFee: '45,000đ',
      reseller: 'reseller_pro',
      resellerPercent: 15,
      resellerFee: '30,000đ',
      order_type: 'product'
    },
    {
      id: 'ORD-992833',
      purchaseDate: '21/03/2026 12:00',
      sellerName: 'global_ads',
      categoryName: 'GOOGLE - TÀI KHOẢN ADS INVOICE',
      productName: 'Tài khoản Ads Invoice',
      buyerName: 'levanc',
      quantity: 2,
      unitPrice: '2,000,000đ',
      discount: '200,000đ',
      totalAmount: '3,800,000đ',
      refund: '0đ',
      status: 'Chờ xác nhận',
      platformFee: '380,000đ',
      reseller: 'partner_ads',
      resellerPercent: 15,
      resellerFee: '250,000đ',
      order_type: 'product'
    },
    {
      id: 'ORD-992834',
      purchaseDate: '21/03/2026 13:45',
      sellerName: 'admin_store',
      categoryName: 'GMAIL - TÀI KHOẢN GMAIL CỔ',
      productName: 'Gmail Cổ 2015-2018 - Login All IP',
      buyerName: 'phamthid',
      quantity: 10,
      unitPrice: '50,000đ',
      discount: '0đ',
      totalAmount: '500,000đ',
      refund: '0đ',
      status: 'Thất bại',
      platformFee: '20,000đ',
      reseller: 'affiliate_vn',
      resellerPercent: 10,
      resellerFee: '15,000đ',
      order_type: 'product'
    },
    {
      id: 'ORD-992835',
      purchaseDate: '21/03/2026 14:20',
      sellerName: 'reseller_pro',
      categoryName: 'FACEBOOK - TÀI KHOẢN QUẢNG CÁO CÁ NHÂN',
      productName: 'Via XMDT Việt Cổ - Bảo hành 24h',
      buyerName: 'hoangvane',
      quantity: 2,
      unitPrice: '150,000đ',
      discount: '0đ',
      totalAmount: '300,000đ',
      refund: '0đ',
      status: 'Khiếu nại',
      platformFee: '12,000đ',
      reseller: 'reseller_pro',
      resellerPercent: 10,
      resellerFee: '8,000đ',
      order_type: 'product',
      complaintStartedAtMs: parsePurchaseDateToMs('21/03/2026 16:40') ?? undefined,
      complaintReason: 'Không đăng nhập được tài khoản',
      hasComplained: true,
    },
    {
      id: 'ORD-992836',
      purchaseDate: '21/03/2026 15:10',
      sellerName: 'global_ads',
      categoryName: 'GOOGLE - TÀI KHOẢN ADS INVOICE',
      productName: 'Tài khoản Ads Invoice',
      buyerName: 'nguyenthib',
      quantity: 1,
      unitPrice: '2,000,000đ',
      discount: '0đ',
      totalAmount: '2,000,000đ',
      refund: '0đ',
      status: 'Tranh chấp',
      platformFee: '200,000đ',
      reseller: 'partner_ads',
      resellerPercent: 15,
      resellerFee: '150,000đ',
      order_type: 'product'
    },
    {
      id: 'ORD-992837',
      purchaseDate: '21/03/2026 16:05',
      sellerName: 'admin_store',
      categoryName: 'FACEBOOK - TÀI KHOẢN QUẢNG CÁO CÁ NHÂN',
      productName: 'Via XMDT Việt Cổ - Bảo hành 24h',
      buyerName: 'dangvanc',
      quantity: 3,
      unitPrice: '150,000đ',
      discount: '0đ',
      totalAmount: '450,000đ',
      refund: '0đ',
      status: 'Tạm giữ tiền',
      platformFee: '18,000đ',
      reseller: 'affiliate_vn',
      resellerPercent: 10,
      resellerFee: '12,000đ',
      order_type: 'product'
    },
    {
      id: 'ORD-992838',
      purchaseDate: '21/03/2026 17:30',
      sellerName: 'reseller_pro',
      categoryName: 'TIKTOK - TÀI KHOẢN QUẢNG CÁO BC',
      productName: 'Acc Tiktok 10k Follow - Tương tác cao',
      buyerName: 'vuvanf',
      quantity: 1,
      unitPrice: '500,000đ',
      discount: '0đ',
      totalAmount: '500,000đ',
      refund: '0đ',
      status: 'Đang thực hiện',
      platformFee: '50,000đ',
      reseller: 'reseller_pro',
      resellerPercent: 15,
      resellerFee: '35,000đ',
      order_type: 'product'
    }
  ]);

  /** Đồng bộ với Đơn hàng đã mua (storefront): đếm đơn khiếu nại / tranh chấp để badge & thông báo quản lý */
  const complaintBadgeCount = useMemo(
    () => allOrders.filter(o => o.status === 'Khiếu nại' || o.status === 'Tranh chấp').length,
    [allOrders]
  );

  const [seenReviewOrderIds, setSeenReviewOrderIds] = useState(() => readSeenReviewOrderIds());

  const unreadReviewBadgeCount = useMemo(
    () => countUnreadBuyerReviews(allOrders, seenReviewOrderIds),
    [allOrders, seenReviewOrderIds]
  );

  useEffect(() => {
    if (currentView !== 'danh-gia') return;
    setSeenReviewOrderIds(markAllCurrentBuyerReviewsSeen(allOrders));
  }, [currentView, allOrders]);

  const pendingPreOrderCount = useMemo(
    () =>
      allOrders.filter(
        o =>
          o.isPreOrder &&
          !o.preOrderFulfilled &&
          !(o.deliveredItems?.length ?? 0)
      ).length,
    [allOrders]
  );

  /** Hẹn giờ đơn: tạm giữ → Hoàn thành; tranh chấp → hoàn tiền (tick 15s). */
  useEffect(() => {
    setAllOrders(prev => processAllOrderTimers(prev));
    const id = window.setInterval(() => {
      setAllOrders(prev => {
        const next = processAllOrderTimers(prev);
        return next === prev ? prev : next;
      });
    }, 15_000);
    return () => window.clearInterval(id);
  }, []);

  const navigateToOrderDetail = (orderId: string) => {
    setPreviousView(currentView);
    setSelectedOrderId(orderId);
    setCurrentView('order-detail');
  };

  const handleBackFromOrderDetail = () => {
    setCurrentView(previousView as any);
    setSelectedOrderId(null);
  };

  const handleReportDefectiveItems = useCallback((orderId: string, itemIds: string[]) => {
    setAllOrders(prev =>
      prev.map(o => (o.id === orderId ? reportDefectiveItemsOnOrder(o, itemIds) : o))
    );
  }, []);

  const handleUploadDefectiveItems = useCallback((orderId: string, payload: { text: string }) => {
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
  }, []);

  const handleAcceptServiceOrder = (id: string) => {
    setAllOrders((prev) =>
      prev.map((o) =>
        o.id === id && o.order_type === 'service' && o.status === 'Chờ xác nhận'
          ? { ...o, status: 'Đang thực hiện', serviceAcceptedAtMs: Date.now() }
          : o
      )
    );
  };

  const handleDeliverServiceOrder = (id: string, deliveryContent: string) => {
    const text = deliveryContent.trim();
    setAllOrders((prev) =>
      prev.map((o) =>
        o.id === id && o.order_type === 'service' && o.status === 'Đang thực hiện'
          ? {
              ...o,
              status: 'Tạm giữ tiền',
              deliveryContent: text,
              escrowHoldStartedAtMs: Date.now(),
            }
          : o
      )
    );
  };

  const handleCancelServiceProcessing = (id: string) => {
    setAllOrders((prev) =>
      prev.map((o) =>
        o.id === id &&
        o.order_type === 'service' &&
        (o.status === 'Đang thực hiện' || o.status === 'Chờ xác nhận')
          ? {
              ...o,
              status: 'Thất bại',
              refund: o.checkoutPaid ? o.totalAmount : '0đ',
              failureKind: 'seller_cancel',
            }
          : o
      )
    );
  };

  useLayoutEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '') {
      setCurrentView('home');
      return;
    }
    if (!path.startsWith('/admin')) {
      return;
    }
    if (path.startsWith('/admin/panel')) {
      if (!canAccessAdminRoutes(getStoredRole())) {
        setHomeAccessDeniedFlash(
          'Admin Panel chỉ dành cho quản trị viên (Admin / Super Admin).'
        );
        navigate('/', { replace: true });
        return;
      }
      setCurrentView('admin-dashboard');
      return;
    }
    if (isSellerStoreAdminPath(path)) {
      if (path === '/admin' || path === '/admin/') {
        navigate('/admin/gian-hang', { replace: true });
        return;
      }
      setCurrentView(sellerStoreAdminShellView(path));
      return;
    }
    if (!canAccessAdminRoutes(getStoredRole())) {
      setHomeAccessDeniedFlash(
        'Không có quyền truy cập khu vực này. Người bán dùng «Quản lý cửa hàng» trên trang chủ.'
      );
      navigate('/', { replace: true });
      return;
    }
    if (path === '/admin' || path === '/admin/') {
      navigate('/admin/gian-hang', { replace: true });
      return;
    }
    const v = pathToAdminShellView(path);
    if (v != null) {
      setCurrentView(v);
    } else {
      navigate('/admin/gian-hang', { replace: true });
    }
  }, [location.pathname, navigate]);

  const sessionRole = getStoredRole();
  const isAdminSession = canAccessAdminRoutes(sessionRole);
  const adminRoleLabel =
    sessionRole === 'super_admin' ? 'Super Admin' : sessionRole === 'admin' ? 'Admin' : 'Người bán';

  const adminNavState = useMemo(
    () =>
      (location.state ?? {}) as {
        focusOrderId?: string;
        focusGianHangId?: string;
        focusReviewOrderId?: string;
      },
    [location.state]
  );

  const clearAdminNavState = useCallback(() => {
    if (location.state == null || Object.keys(location.state as object).length === 0) return;
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const [activeTab, setActiveTab] = useState('Tất cả');
  const [platformFilter, setPlatformFilter] = useState('Tất cả danh mục');
  const [isPlatformFilterDropdownOpen, setIsPlatformFilterDropdownOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('Tất cả gian hàng');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateCategoryViewOpen, setIsCreateCategoryViewOpen] = useState(false);
  /** Gian hàng con đang mở form sửa (full CreateCategoryView) — đồng bộ docs/tao_gian_hang_moi.md */
  const [gianHangFormEditTarget, setGianHangFormEditTarget] = useState<Category | null>(null);
  const [gianHangFormParentLine, setGianHangFormParentLine] = useState<BusinessLine>('Bán sản phẩm');
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const [isManagePlatformsModalOpen, setIsManagePlatformsModalOpen] = useState(false);
  const [isManageProductTypesModalOpen, setIsManageProductTypesModalOpen] = useState(false);
  const [classificationData, setClassificationData] = useState<Record<string, Record<string, string[]>>>({
    'Bán sản phẩm': {
      'tài khoản': ['Tài khoản FB (4%)', 'Tài khoản BM (4%)', 'Tài khoản Twitter (4%)', 'Tài khoản Instagram (4%)', 'Tài khoản Shopee (3%)', 'Tài khoản Discord (3%)', 'Tài khoản TikTok (3%)', 'Tài khoản Khác (3%)'],
      'Gmail': ['Gmail (4%)', 'HotMail (5%)', 'OutlookMail (3%)', 'RuMail (4%)', 'DomainMail (4%)', 'YahooMail (4%)', 'ProtonMail (4%)', 'Loại Mail Khác (4%)'],
      'Phần mềm': ['Phần Mềm FB (4%)', 'Phần Mềm Google (6%)', 'Phần Mềm Youtube (6%)', 'Phần Mềm Tiện Ích (6%)', 'Phần Mềm PTC (6%)', 'Phần Mềm Captcha (6%)', 'Phần Mềm Offer (6%)', 'Phần Mềm Khác (6%)'],
      'Thẻ nạp': ['Thẻ Nạp (1%)']
    },
    'Dịch vụ': {
      'Tăng tương tác': ['Dịch vụ Facebook (4%)', 'Dịch vụ Tiktok (4%)', 'Dịch vụ Google (4%)', 'Dịch vụ Telegram (4%)', 'Dịch vụ Shopee (4%)', 'Dịch vụ Discord (4%)', 'Dịch vụ Twitter (4%)', 'Dịch vụ Youtube (4%)', 'Dịch vụ Zalo (4%)', 'Dịch vụ Instagram (4%)', 'Tương tác khác (4%)'],
      'Dịch vụ phần mềm': ['Dịch vụ code tool (6%)', 'Dịch vụ đồ họa (4%)', 'Dịch vụ video (4%)', 'Dịch vụ tool khác (6%)'],
      'Blockchain': ['Dịch vụ tiền ảo (4%)', 'Dịch vụ NFT (4%)', 'Dịch vụ Coinlist (4%)', 'Blockchain khác (5%)'],
      'Dịch vụ khác': ['Dịch vụ khác (5%)'],
      'Dịch vụ Quảng cáo': []
    }
  });
  const [editingPlatform, setEditingPlatform] = useState<Category | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveTab, setMoveTab] = useState<'categories' | 'products'>('categories');
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Folder');
  const [newPlatformBusinessLine, setNewPlatformBusinessLine] = useState<BusinessLine>('Bán sản phẩm');
  const [editingPlatformBusinessLine, setEditingPlatformBusinessLine] = useState<BusinessLine>('Bán sản phẩm');
  const [managePlatformTab, setManagePlatformTab] = useState<BusinessLine>('Bán sản phẩm');
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false);
  const [warehouseProduct, setWarehouseProduct] = useState<Product | null>(null);
  const [warehouseCategory, setWarehouseCategory] = useState<Category | null>(null);
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [selectedWarehouseItems, setSelectedWarehouseItems] = useState<string[]>([]);
  const [expandedWarehouseItems, setExpandedWarehouseItems] = useState<string[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);
  const [selectedProductForStats, setSelectedProductForStats] = useState<Product | null>(null);

  const handleShowHistory = (product: Product) => {
    setSelectedProductForHistory(product);
    setIsHistoryModalOpen(true);
  };

  const handleShowStats = (product: Product) => {
    setSelectedProductForStats(product);
    setIsStatsModalOpen(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    setCategories(prev => {
      const updateRecursively = (cats: Category[]): Category[] => {
        const activePlatformIdx = cats.findIndex(c => c.id === active.id);
        const overPlatformIdx = cats.findIndex(c => c.id === over.id);
        if (activePlatformIdx !== -1 && overPlatformIdx !== -1) {
          return arrayMove(cats, activePlatformIdx, overPlatformIdx);
        }

        return cats.map(cat => {
          if (cat.subCategories) {
            const activeSubIdx = cat.subCategories.findIndex(s => s.id === active.id);
            const overSubIdx = cat.subCategories.findIndex(s => s.id === over.id);
            if (activeSubIdx !== -1 && overSubIdx !== -1) {
              return {
                ...cat,
                subCategories: arrayMove(cat.subCategories, activeSubIdx, overSubIdx)
              };
            }
          }

          if (cat.products) {
            const activeProdIdx = cat.products.findIndex(p => p.id === active.id);
            const overProdIdx = cat.products.findIndex(p => p.id === over.id);
            if (activeProdIdx !== -1 && overProdIdx !== -1) {
              return {
                ...cat,
                products: arrayMove(cat.products, activeProdIdx, overProdIdx)
              };
            }
          }

          if (cat.subCategories) {
            return {
              ...cat,
              subCategories: updateRecursively(cat.subCategories)
            };
          }

          return cat;
        });
      };

      return updateRecursively(prev);
    });
  };

  const [gianHangTop1State, setGianHangTop1State] = useState<GianHangTop1State>(() =>
    readGianHangTop1State()
  );

  const handleGianHangTop1StateChange = (next: GianHangTop1State) => {
    setGianHangTop1State(next);
    writeGianHangTop1State(next);
  };

  const [categories, setCategories] = useState<Category[]>([
    {
      id: 'parent-1',
      name: 'tài khoản',
      originalName: 'tài khoản',
      isParent: true,
      businessLine: 'Bán sản phẩm',
      iconName: 'Share2',
      subCategories: buildSeedDemoGianHangLeaves()
    },
    {
      id: 'parent-2',
      name: 'Dịch vụ Quảng cáo',
      originalName: 'Dịch vụ',
      isParent: true,
      businessLine: 'Dịch vụ',
      iconName: 'LayoutDashboard',
      subCategories: buildSeedDemoGianHangServiceLeaves(),
    },
  ]);

  const openAdminGianHangFromOrder = useCallback(
    (order: Order) => {
      const gid = order.adminGianHangId?.trim();
      if (!gid || !findGianHangLeafById(categories, gid)) {
        window.alert('Không tìm thấy gian hàng cho đơn này.');
        return;
      }
      navigate(adminShellViewToPath('gian-hang'), { state: { focusGianHangId: gid } });
    },
    [categories, navigate]
  );

  const openAdminReviewsForOrder = useCallback(
    (order: Order) => {
      navigate(adminShellViewToPath('danh-gia'), {
        state: order.buyerReview ? { focusReviewOrderId: order.id } : {},
      });
    },
    [navigate]
  );

  const saveSellerReviewReply = useCallback((orderId: string, reply: string) => {
    const trimmed = reply.trim();
    if (!trimmed) return;
    setAllOrders((prev) =>
      prev.map((o) =>
        o.id === orderId && o.buyerReview
          ? {
              ...o,
              buyerReview: {
                ...o.buyerReview,
                sellerReply: trimmed,
                sellerReplyAtMs: Date.now(),
              },
            }
          : o
      )
    );
  }, []);

  const [resellerRequests, setResellerRequests] = useState(() => readResellerRequestsFromStorage());

  useEffect(() => {
    writeResellerRequestsToStorage(resellerRequests);
  }, [resellerRequests]);

  const sellerIdentityKeys = useMemo(() => {
    const keys = new Set<string>();
    const add = (s: string | undefined) => {
      const t = s?.trim();
      if (t) keys.add(t);
    };
    add(storefrontBuyerName);
    add(getSessionDisplayName());
    add(getSessionLoginUsername());
    for (const parent of categories) {
      for (const sub of parent.subCategories ?? []) {
        add(sub.sellerDisplayName);
        add(sub.createdByName);
        sub.products?.forEach(p => add(p.sellerName));
      }
    }
    return keys;
  }, [storefrontBuyerName, categories]);

  const openAdminMessagesWithBuyer = useCallback(
    (orderId: string) => {
      const order = allOrders.find((o) => o.id === orderId);
      if (!order) {
        window.alert('Không tìm thấy đơn hàng.');
        return;
      }
      const threadId = resolveBuyerSellerThreadIdFromOrder(order);
      if (!threadId) {
        window.alert('Không xác định được hội thoại với khách trên đơn này.');
        return;
      }
      navigate('/', { state: buildStorefrontMessagesNavState({ threadId, fromAdmin: true }) });
    },
    [allOrders, navigate]
  );

  const resolveBusinessLine = React.useCallback((cat: Category): BusinessLine => {
    if (cat.businessLine) return cat.businessLine;
    const n = cat.name;
    if (classificationData['Bán sản phẩm']?.[n] !== undefined) return 'Bán sản phẩm';
    if (classificationData['Dịch vụ']?.[n] !== undefined) return 'Dịch vụ';
    return 'Bán sản phẩm';
  }, [classificationData]);

  const lineForClassificationKey = React.useCallback((key: string): BusinessLine | null => {
    if (classificationData['Bán sản phẩm']?.[key] !== undefined) return 'Bán sản phẩm';
    if (classificationData['Dịch vụ']?.[key] !== undefined) return 'Dịch vụ';
    return null;
  }, [classificationData]);

  /** Thứ tự danh mục đồng bộ với Quản lý danh mục (kéo thả / sắp xếp trên từng tab) — không trộn Bán SP / Dịch vụ */
  const storefrontDanhMucBanSanPham = React.useMemo(() => {
    const line: BusinessLine = 'Bán sản phẩm';
    const parents = categories.filter(c => c.isParent && resolveBusinessLine(c) === line);
    const parentNames = new Set(parents.map(p => p.name));
    const clsLine = classificationData[line] || {};
    const orphanKeys = Object.keys(clsLine)
      .filter(k => !parentNames.has(k))
      .sort((a, b) => a.localeCompare(b, 'vi'));
    return [...parents.map(p => p.name), ...orphanKeys];
  }, [categories, classificationData, resolveBusinessLine]);

  const storefrontDanhMucDichVu = React.useMemo(() => {
    const line: BusinessLine = 'Dịch vụ';
    const parents = categories.filter(c => c.isParent && resolveBusinessLine(c) === line);
    const parentNames = new Set(parents.map(p => p.name));
    const clsLine = classificationData[line] || {};
    const orphanKeys = Object.keys(clsLine)
      .filter(k => !parentNames.has(k))
      .sort((a, b) => a.localeCompare(b, 'vi'));
    return [...parents.map(p => p.name), ...orphanKeys];
  }, [categories, classificationData, resolveBusinessLine]);

  /** Mỗi khóa trong phân loại (Quản lý loại SP) có một parent tương ứng — tự tạo nếu thiếu */
  React.useEffect(() => {
    setCategories(prev => {
      const lines = ['Bán sản phẩm', 'Dịch vụ'] as const;
      const additions: Category[] = [];
      for (const line of lines) {
        for (const key of Object.keys(classificationData[line] || {})) {
          const hasParent = prev.some(c => {
            if (!c.isParent || c.name !== key) return false;
            return resolveBusinessLine(c) === line;
          });
          if (!hasParent) {
            additions.push({
              id: `parent-sync-${crypto.randomUUID()}`,
              name: key,
              originalName: key,
              isParent: true,
              iconName: 'Folder',
              businessLine: line,
              subCategories: [],
            });
          }
        }
      }
      if (additions.length === 0) return prev;
      return [...prev, ...additions];
    });
  }, [classificationData, resolveBusinessLine]);

  /** Danh mục nền tảng + các khóa trong phân loại (cùng nguồn Quản lý loại sản phẩm) */
  const mergedDanhMucFilterOptions = React.useMemo(() => {
    const rows: { key: string; line: BusinessLine; kind: 'parent' | 'classification' }[] = [];
    const seen = new Set<string>();
    for (const p of categories.filter(c => c.isParent)) {
      if (!seen.has(p.name)) {
        seen.add(p.name);
        rows.push({ key: p.name, line: resolveBusinessLine(p), kind: 'parent' });
      }
    }
    for (const line of ['Bán sản phẩm', 'Dịch vụ'] as const) {
      for (const key of Object.keys(classificationData[line] || {})) {
        if (!seen.has(key)) {
          seen.add(key);
          rows.push({ key, line, kind: 'classification' });
        }
      }
    }
    return rows.sort((a, b) => {
      if (a.line !== b.line) return a.line === 'Bán sản phẩm' ? -1 : 1;
      return a.key.localeCompare(b.key, 'vi');
    });
  }, [categories, classificationData, resolveBusinessLine]);

  /** Khóa có trong Quản lý loại SP nhưng chưa có danh mục (parent) trùng tên — theo tab Bán SP / Dịch vụ */
  const managePlatformsClassificationBundle = React.useMemo(() => {
    const line = managePlatformTab;
    const clsLine = classificationData[line] || {};
    const baseKeys = Object.keys(clsLine).sort((a, b) => a.localeCompare(b, 'vi'));
    const lineParents = categories.filter(c => c.isParent && resolveBusinessLine(c) === line);
    const parentNames = new Set(lineParents.map(p => p.name));
    const classificationOnlyKeys = baseKeys.filter(k => !parentNames.has(k));
    return { classificationOnlyKeys, classificationLineData: clsLine };
  }, [managePlatformTab, classificationData, categories, resolveBusinessLine]);

  React.useEffect(() => {
    if (platformFilter === 'Tất cả danh mục') return;
    const valid = mergedDanhMucFilterOptions.some(o => o.key === platformFilter);
    if (!valid) {
      setPlatformFilter('Tất cả danh mục');
      setCategoryFilter('Tất cả gian hàng');
    }
  }, [mergedDanhMucFilterOptions, platformFilter]);

  const parentsMatchingDanhMucFilter = React.useMemo(() => {
    return categories.filter(parent => {
      if (!parent.isParent) return false;
      if (platformFilter === 'Tất cả danh mục') return true;
      if (parent.name === platformFilter) return true;
      const line = lineForClassificationKey(platformFilter);
      if (!line || resolveBusinessLine(parent) !== line) return false;
      return classificationData[line]?.[platformFilter] !== undefined;
    });
  }, [categories, platformFilter, classificationData, resolveBusinessLine, lineForClassificationKey]);

  const handleSwapPlatforms = (platformIdA: string, platformIdB: string) => {
    const line = managePlatformTab;
    setCategories((prev) => {
      const lineParents = prev.filter((c) => c.isParent && resolveBusinessLine(c) === line);
      const i = lineParents.findIndex((p) => p.id === platformIdA);
      const j = lineParents.findIndex((p) => p.id === platformIdB);
      if (i === -1 || j === -1 || i === j) return prev;
      const swapped = [...lineParents];
      [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
      let k = 0;
      return prev.map((c) => {
        if (c.isParent && resolveBusinessLine(c) === line) return swapped[k++];
        return c;
      });
    });
  };

  const handleEditPlatform = (platform: Category) => {
    setEditingPlatform(platform);
    setNewPlatformName(platform.name);
    setNewCategoryIcon(platform.iconName || 'Folder');
    setEditingPlatformBusinessLine(resolveBusinessLine(platform));
  };

  const confirmUpdatePlatform = () => {
    if (!editingPlatform || !newPlatformName) return;

    const oldName = editingPlatform.name;
    const prevLine = resolveBusinessLine(editingPlatform);

    setCategories(prev => prev.map(cat => {
      if (cat.id === editingPlatform.id) {
        const updatedCat = {
          ...cat,
          name: newPlatformName,
          iconName: newCategoryIcon,
          businessLine: editingPlatformBusinessLine
        };
        if (updatedCat.subCategories) {
          updatedCat.subCategories = updatedCat.subCategories.map(sub => ({
            ...sub,
            platform: newPlatformName
          }));
        }
        return updatedCat;
      }
      return cat;
    }));

    setClassificationData(prev => {
      const newData = { ...prev };
      const payload = newData[prevLine]?.[oldName];
      if (prevLine !== editingPlatformBusinessLine) {
        if (newData[prevLine]?.[oldName] !== undefined) {
          delete newData[prevLine][oldName];
        }
        if (!newData[editingPlatformBusinessLine]) newData[editingPlatformBusinessLine] = {};
        newData[editingPlatformBusinessLine][newPlatformName] = payload ?? [];
      } else if (newPlatformName !== oldName) {
        const data = newData[prevLine][oldName];
        newData[prevLine][newPlatformName] = data ?? [];
        delete newData[prevLine][oldName];
      }
      return newData;
    });

    if (platformFilter === oldName) {
      setPlatformFilter(newPlatformName);
    }

    setEditingPlatform(null);
    setNewPlatformName('');
    setNewCategoryIcon('Folder');
  };

  const handleDeletePlatform = (platformId: string) => {
    setCategoryToDelete(platformId);
    setIsDeleteModalOpen(true);
  };

  const handleCreateCategory = (parentId: string) => {
    setGianHangFormEditTarget(null);
    setCurrentParentId(parentId);
    setIsCreateCategoryViewOpen(true);
  };

  const openCreatePlatformModal = (line: BusinessLine = managePlatformTab) => {
    setNewPlatformName('');
    setNewCategoryIcon('Globe');
    setNewPlatformBusinessLine(line);
    setIsPlatformModalOpen(true);
  };

  const handleCreatePlatform = () => {
    openCreatePlatformModal(managePlatformTab);
  };

  const addPlatformCategory = (
    nameTrim: string,
    line: BusinessLine,
    iconName = 'Globe'
  ): boolean => {
    if (!nameTrim) return false;
    const duplicate = categories.some(
      (c) => c.isParent && c.name === nameTrim && resolveBusinessLine(c) === line
    );
    if (duplicate) {
      if (typeof window !== 'undefined') {
        window.alert(`Danh mục «${nameTrim}» đã tồn tại trong nhóm ${line}.`);
      }
      return false;
    }

    const newPlatform: Category = {
      id: `parent-${Date.now()}`,
      name: nameTrim,
      isParent: true,
      iconName,
      businessLine: line,
      subCategories: [],
    };

    setCategories((prev) => [...prev, newPlatform]);

    setClassificationData((prev) => {
      const newData = { ...prev };
      if (!newData[line]) newData[line] = {};
      if (!newData[line][nameTrim]) {
        newData[line][nameTrim] = [];
      }
      return newData;
    });

    return true;
  };

  const handlePromoteClassificationKey = (name: string, line: BusinessLine) => {
    addPlatformCategory(name.trim(), line, 'Folder');
  };

  const handleCreateProduct = (categoryId: string) => {
    setCurrentCategoryId(categoryId);
    setNewProductName('');
    setNewProductPrice('');
    setIsProductModalOpen(true);
  };

  const fillRandomProductForm = () => {
    setNewProductName(randomMatHangName());
    setNewProductPrice(randomMatHangPriceInput());
  };

  const confirmCreatePlatform = () => {
    if (!newPlatformName.trim()) return;
    const ok = addPlatformCategory(
      newPlatformName.trim(),
      newPlatformBusinessLine,
      newCategoryIcon
    );
    if (!ok) return;
    setIsPlatformModalOpen(false);
    setNewCategoryIcon('Folder');
  };

  const confirmCreateProduct = () => {
    if (!currentCategoryId || !newProductName || !newProductPrice) return;

    const newProduct: Product = {
      id: `${Date.now()}`,
      name: newProductName,
      price: `${newProductPrice}đ'`,
      stock: 0,
      sold: 0,
      fee: '10%',
      status: 'Chờ duyệt',
      active: false,
      date: new Date().toLocaleString(),
    };

    setCategories(prev => {
      const addProductRecursively = (cats: Category[]): Category[] => {
        return cats.map(cat => {
          if (cat.id === currentCategoryId) {
            return {
              ...cat,
              products: [newProduct, ...(cat.products || [])]
            };
          }
          if (cat.subCategories) {
            return {
              ...cat,
              subCategories: addProductRecursively(cat.subCategories)
            };
          }
          return cat;
        });
      };
      return addProductRecursively(prev);
    });

    setIsProductModalOpen(false);
    if (typeof window !== 'undefined') {
      window.alert('Mặt hàng đã được gửi và đang chờ phê duyệt.');
    }
  };

  const handleFulfillStorefrontPurchase = useCallback(
    (adminGianHangId: string, variantIndex: number, quantity: number) => {
      let result = fulfillPurchaseInCategories(
        categories,
        adminGianHangId,
        variantIndex,
        quantity
      );
      if (result.ok) {
        setCategories(result.categories);
      }
      return result;
    },
    [categories]
  );

  const handleFulfillPreOrder = useCallback(
    (orderId: string): { ok: boolean; message: string } => {
      const order = allOrders.find(o => o.id === orderId);
      if (!order?.isPreOrder) {
        return { ok: false, message: 'Không phải đơn đặt trước.' };
      }
      if (order.preOrderFulfilled || (order.deliveredItems?.length ?? 0) > 0) {
        return { ok: false, message: 'Đơn đã được giao từ kho.' };
      }
      if (!order.adminGianHangId) {
        return { ok: false, message: 'Không xác định được gian hàng.' };
      }
      const variantIndex = order.preOrderVariantIndex ?? 0;
      const result = fulfillPurchaseInCategories(
        categories,
        order.adminGianHangId,
        variantIndex,
        order.quantity
      );
      if (!result.ok) {
        return result;
      }
      setCategories(result.categories);
      setAllOrders(prev =>
        prev.map(o =>
          o.id === orderId
            ? {
                ...o,
                deliveredItems: result.items.map(i => ({
                  id: i.id,
                  content: i.content,
                  time: i.time,
                })),
                adminMatHangId: result.matHangId,
                preOrderFulfilled: true,
                status: 'Tạm giữ tiền',
                content: [
                  o.preOrderNote ? `Ghi chú khách: ${o.preOrderNote}` : null,
                  `Đã giao ${result.items.length} sản phẩm từ kho`,
                  'Tiền đang tạm giữ trên sàn',
                ]
                  .filter(Boolean)
                  .join(' · '),
              }
            : o
        )
      );
      return {
        ok: true,
        message: `Đã giao ${result.items.length.toLocaleString('vi-VN')} sản phẩm từ kho cho khách.`,
      };
    },
    [allOrders, categories]
  );

  const updateProductInCategories = (
    productId: string,
    patch: Partial<Product>
  ) => {
    setCategories((prev) => {
      const walk = (cats: Category[]): Category[] =>
        cats.map((cat) => {
          if (cat.products?.some((p) => p.id === productId)) {
            return {
              ...cat,
              products: cat.products.map((p) =>
                p.id === productId ? { ...p, ...patch } : p
              ),
            };
          }
          if (cat.subCategories?.length) {
            return { ...cat, subCategories: walk(cat.subCategories) };
          }
          return cat;
        });
      return walk(prev);
    });
  };

  const handleApproveProduct = (productId: string) => {
    updateProductInCategories(productId, { status: 'Đang bán', active: true });
  };

  const handleAdminCloseProduct = (productId: string) => {
    updateProductInCategories(productId, {
      status: 'Đóng',
      active: false,
      sellerToggleLocked: true,
    });
  };

  const handleAdminSuspendProduct = (productId: string) => {
    updateProductInCategories(productId, {
      status: 'Tạm ngưng',
      active: false,
      sellerToggleLocked: true,
    });
  };

  const handleAdminReopenProduct = (productId: string) => {
    updateProductInCategories(productId, {
      status: 'Đang bán',
      active: true,
      sellerToggleLocked: false,
    });
  };

  const handleApproveGianHang = (categoryId: string) => {
    setCategories((prev) => {
      const walk = (cats: Category[]): Category[] =>
        cats.map((cat) => {
          if (cat.id === categoryId && !cat.isParent) {
            return { ...cat, status: 'Đang bán' as Status };
          }
          if (cat.subCategories?.length) {
            return { ...cat, subCategories: walk(cat.subCategories) };
          }
          return cat;
        });
      return walk(prev);
    });
  };

  const handleQuickCreateDemoGianHang = (line: BusinessLine): QuickCreateDemoResult => {
    const stamp = Date.now();
    const parentName = line === 'Dịch vụ' ? 'Dịch vụ' : 'Bán sản phẩm';

    const leaf = buildQuickDemoGianHangWithProduct({
      sellerDisplayName: getSessionDisplayName() || getSessionLoginUsername(),
      createdByName: getSessionDisplayName(),
      parentPlatformName: parentName,
      businessLine: line,
      warehouseLineCount: 12,
    });

    setCategories((prev) => {
      let list = [...prev];
      let parentIdx = list.findIndex(
        (c) => c.isParent && resolveBusinessLine(c) === line
      );
      if (parentIdx < 0) {
        const autoParent: Category = {
          id: `parent-auto-${stamp}`,
          name: parentName,
          originalName: parentName,
          isParent: true,
          businessLine: line,
          iconName: line === 'Dịch vụ' ? 'Facebook' : 'Share2',
          subCategories: [],
        };
        list = [...list, autoParent];
        parentIdx = list.length - 1;
      }
      const parentId = list[parentIdx]!.id;
      const parentPlatform = list[parentIdx]!.name;
      const leafWithPlatform = {
        ...leaf,
        platform: leaf.classification?.category?.trim() || parentPlatform,
      };
      return list.map((c) =>
        c.id === parentId
          ? { ...c, subCategories: [leafWithPlatform, ...(c.subCategories || [])] }
          : c
      );
    });

    return { gianHangId: leaf.id, gianHangName: leaf.name, businessLine: line };
  };

  const handleRejectGianHang = (categoryId: string) => {
    setCategories((prev) => {
      const walk = (cats: Category[]): Category[] =>
        cats.map((cat) => {
          if (cat.id === categoryId && !cat.isParent) {
            return { ...cat, status: 'Đã hủy' as Status };
          }
          if (cat.subCategories?.length) {
            return { ...cat, subCategories: walk(cat.subCategories) };
          }
          return cat;
        });
      return walk(prev);
    });
  };

  const handleRejectProduct = (productId: string) => {
    updateProductInCategories(productId, { status: 'Đã hủy', active: false });
  };

  const handleSwapGianHang = (
    parentId: string,
    gianHangIdA: string,
    gianHangIdB: string
  ) => {
    setCategories((prev) =>
      prev.map((p) => {
        if (p.id !== parentId || !p.subCategories?.length) return p;
        const list = [...p.subCategories];
        const i = list.findIndex((s) => s.id === gianHangIdA);
        const j = list.findIndex((s) => s.id === gianHangIdB);
        if (i === -1 || j === -1 || i === j) return p;
        const next = [...list];
        [next[i], next[j]] = [next[j], next[i]];
        return { ...p, subCategories: next };
      })
    );
  };

  const handleSwapProducts = (
    categoryId: string,
    productIdA: string,
    productIdB: string
  ) => {
    setCategories((prev) => {
      const walk = (cats: Category[]): Category[] =>
        cats.map((cat) => {
          if (cat.id === categoryId && cat.products?.length) {
            const list = [...cat.products];
            const i = list.findIndex((p) => p.id === productIdA);
            const j = list.findIndex((p) => p.id === productIdB);
            if (i === -1 || j === -1 || i === j) return cat;
            const next = [...list];
            [next[i], next[j]] = [next[j], next[i]];
            return { ...cat, products: next };
          }
          if (cat.subCategories?.length) {
            return { ...cat, subCategories: walk(cat.subCategories) };
          }
          return cat;
        });
      return walk(prev);
    });
  };

  const handleToggleProduct = (productId: string) => {
    setCategories(prev => {
      const toggleRecursively = (cats: Category[]): Category[] => {
        return cats.map(cat => {
          if (cat.products) {
            const product = cat.products.find(p => p.id === productId);
            if (product) {
              if (product.status === 'Chờ duyệt' || product.status === 'Đóng' || product.sellerToggleLocked) {
                return cat;
              }
              return {
                ...cat,
                products: cat.products.map(p => 
                  p.id === productId 
                    ? {
                        ...p,
                        active: !p.active,
                        status: !p.active ? 'Đang bán' : 'Tạm ngưng',
                        sellerToggleLocked: false,
                      } 
                    : p
                )
              };
            }
          }
          if (cat.subCategories) {
            return {
              ...cat,
              subCategories: toggleRecursively(cat.subCategories)
            };
          }
          return cat;
        });
      };
      return toggleRecursively(prev);
    });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProductName(product.name);
    setNewProductPrice(product.price.replace('đ', '').replace(/,/g, ''));
    setIsEditProductModalOpen(true);
  };

  const confirmEditProduct = () => {
    if (!editingProduct || !newProductName || !newProductPrice) return;

    setCategories(prev => {
      const editRecursively = (cats: Category[]): Category[] => {
        return cats.map(cat => {
          if (cat.products) {
            const product = cat.products.find(p => p.id === editingProduct.id);
            if (product) {
              return {
                ...cat,
                products: cat.products.map(p => 
                  p.id === editingProduct.id 
                    ? { ...p, name: newProductName, price: `${newProductPrice}đ'` } 
                    : p
                )
              };
            }
          }
          if (cat.subCategories) {
            return {
              ...cat,
              subCategories: editRecursively(cat.subCategories)
            };
          }
          return cat;
        });
      };
      return editRecursively(prev);
    });

    setIsEditProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    setCategories(prev => {
      const deleteRecursively = (cats: Category[]): Category[] => {
        return cats.map(cat => {
          if (cat.products) {
            const product = cat.products.find(p => p.id === productId);
            if (product) {
              return {
                ...cat,
                products: cat.products.filter(p => p.id !== productId)
              };
            }
          }
          if (cat.subCategories) {
            return {
              ...cat,
              subCategories: deleteRecursively(cat.subCategories)
            };
          }
          return cat;
        });
      };
      return deleteRecursively(prev);
    });
  };

  const handleEditCategory = (category: Category) => {
    if (category.isParent) {
      setEditingCategory(category);
      setNewCategoryName(category.name);
      setNewCategoryIcon(category.iconName || (category.isParent ? 'Folder' : 'Package'));
      setIsEditCategoryModalOpen(true);
      return;
    }
    const parent = categories.find(
      (p) => p.isParent && p.subCategories?.some((s) => s.id === category.id)
    );
    setGianHangFormParentLine(parent ? resolveBusinessLine(parent) : 'Bán sản phẩm');
    setGianHangFormEditTarget(category);
    setCurrentParentId(null);
    setIsCreateCategoryViewOpen(true);
  };

  const confirmEditCategory = () => {
    if (!editingCategory || !newCategoryName) return;

    const oldName = editingCategory.name;

    setCategories(prev => {
      const editRecursively = (cats: Category[]): Category[] => {
        return cats.map(cat => {
          if (cat.id === editingCategory.id) {
            const updatedCat = { ...cat, name: newCategoryName, iconName: newCategoryIcon };
            // Update subcategories platform field to match the new name
            if (updatedCat.subCategories) {
              updatedCat.subCategories = updatedCat.subCategories.map(sub => ({
                ...sub,
                platform: newCategoryName
              }));
            }
            return updatedCat;
          }
          if (cat.subCategories) {
            return {
              ...cat,
              subCategories: editRecursively(cat.subCategories)
            };
          }
          return cat;
        });
      };
      return editRecursively(prev);
    });

    // Update classificationData keys if it's a parent category
    if (editingCategory.isParent && newCategoryName !== oldName) {
      setClassificationData(prev => {
        const newData = { ...prev };
        Object.keys(newData).forEach(businessType => {
          if (newData[businessType][oldName]) {
            newData[businessType][newCategoryName] = newData[businessType][oldName];
            delete newData[businessType][oldName];
          }
        });
        return newData;
      });
    }

    // Update category filter if it matches the old name
    if (categoryFilter === oldName) {
      setCategoryFilter(newCategoryName);
    }

    setIsEditCategoryModalOpen(false);
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryIcon('Folder');
  };

  const confirmCreateCategory = () => {
    if (!currentParentId || !newCategoryName) return;

    const parent = categories.find(c => c.id === currentParentId);
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: newCategoryName,
      iconName: newCategoryIcon,
      tags: ['Má»›i', 'Hot'],
      platform: parent?.name || 'Facebook',
      date: new Date().toLocaleString(),
      description: 'admin_store',
      products: [],
      createdAt: Date.now(),
      status: 'Chờ duyệt',
    };

    setCategories(prev => prev.map(cat => {
      if (cat.id === currentParentId) {
        return {
          ...cat,
          subCategories: [newCategory, ...(cat.subCategories || [])]
        };
      }
      return cat;
    }));

    setIsModalOpen(false);
    setNewCategoryName('');
    setNewCategoryIcon('Folder');
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;

    const removeCategoryRecursively = (cats: Category[]): Category[] => {
      return cats
        .filter(cat => cat.id !== categoryToDelete)
        .map(cat => ({
          ...cat,
          subCategories: cat.subCategories ? removeCategoryRecursively(cat.subCategories) : undefined
        }));
    };

    const platformToDelete = categories.find(c => c.id === categoryToDelete);
    if (platformToDelete?.isParent) {
      const platformName = platformToDelete.name;
      const line: BusinessLine =
        platformToDelete.businessLine || resolveBusinessLine(platformToDelete);
      setClassificationData(prev => {
        const newData = { ...prev };
        if (newData[line]?.[platformName] !== undefined) {
          newData[line] = { ...newData[line] };
          delete newData[line][platformName];
        }
        return newData;
      });
    }

    setCategories(prev => removeCategoryRecursively(prev));
    setIsDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  const handleWarehouseProduct = (product: Product, category: Category) => {
    setWarehouseProduct(product);
    setWarehouseCategory(category);
    setIsWarehouseOpen(true);
  };

  const handleWarehouseUpdateProduct = (updatedProduct: Product) => {
    setCategories(prev => {
      const updateRecursively = (cats: Category[]): Category[] => {
        return cats.map(cat => {
          if (cat.products) {
            const product = cat.products.find(p => p.id === updatedProduct.id);
            if (product) {
              return {
                ...cat,
                products: cat.products.map(p =>
                  p.id === updatedProduct.id ? updatedProduct : p
                ),
              };
            }
          }
          if (cat.subCategories) {
            return {
              ...cat,
              subCategories: updateRecursively(cat.subCategories),
            };
          }
          return cat;
        });
      };
      return updateRecursively(prev);
    });
    setWarehouseProduct(updatedProduct);
  };

  const closeWarehouseView = () => {
    setIsWarehouseOpen(false);
    setWarehouseProduct(null);
    setWarehouseCategory(null);
  };

  const findActiveItem = (id: string | null) => {
    if (!id) return null;
    
    // Check platforms
    const platform = categories.find(c => c.id === id);
    if (platform) return { type: 'platform', data: platform };

    // Check categories
    for (const p of categories) {
      const cat = p.subCategories?.find(s => s.id === id);
      if (cat) return { type: 'category', data: cat };
    }

    // Check products
    for (const p of categories) {
      for (const c of p.subCategories || []) {
        const prod = c.products?.find(pr => pr.id === id);
        if (prod) return { type: 'product', data: prod };
      }
    }
    return null;
  };

  const activeItem = findActiveItem(activeId);

  const deleteCategoryConfirmText = (() => {
    if (!categoryToDelete) {
      return 'Bạn có chắc chắn muốn xóa không? Hành động này không thể hoàn tác.';
    }
    const cat = findCategoryById(categories, categoryToDelete);
    if (!cat) {
      return 'Bạn có chắc chắn muốn xóa không? Hành động này không thể hoàn tác.';
    }
    if (cat.isParent) {
      const subCount = cat.subCategories?.length ?? 0;
      if (subCount > 0) {
        return `Xóa danh mục «${cat.name}» và ${subCount} gian hàng bên trong? Hành động này không thể hoàn tác.`;
      }
      return `Xóa danh mục «${cat.name}»? Hành động này không thể hoàn tác.`;
    }
    return `Xóa gian hàng «${cat.name}»? Hành động này không thể hoàn tác.`;
  })();

  /** Modal cấu hình gian hàng — dùng chung Admin Console & Admin Panel */
  const gianHangPanelToolingModals = (
    <>
      <ManageProductTypesModal
        isOpen={isManageProductTypesModalOpen}
        onClose={() => setIsManageProductTypesModalOpen(false)}
        classificationData={classificationData}
        setClassificationData={setClassificationData}
        danhMucOrderByLine={{
          'Bán sản phẩm': storefrontDanhMucBanSanPham,
          'Dịch vụ': storefrontDanhMucDichVu,
        }}
      />
      <ManagePlatformsModal
        isOpen={isManagePlatformsModalOpen}
        onClose={() => setIsManagePlatformsModalOpen(false)}
        platforms={categories.filter(c => c.isParent && resolveBusinessLine(c) === managePlatformTab)}
        groupTab={managePlatformTab}
        onGroupTabChange={setManagePlatformTab}
        onSwapPlatforms={handleSwapPlatforms}
        onEdit={handleEditPlatform}
        onDelete={handleDeletePlatform}
        onCreatePlatform={openCreatePlatformModal}
        onPromoteClassificationKey={handlePromoteClassificationKey}
        classificationOnlyKeys={managePlatformsClassificationBundle.classificationOnlyKeys}
        classificationLineData={managePlatformsClassificationBundle.classificationLineData}
      />
      <AnimatePresence>
        {isPlatformModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPlatformModalOpen(false)}
              className="absolute inset-0 bg-slate-400/10 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <LayoutDashboard size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-display">Thêm danh mục mới</h3>
                    <p className="text-xs text-slate-500 font-medium">Bán sản phẩm hoặc Dịch vụ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlatformModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Loại hình kinh doanh</label>
                  <select
                    value={newPlatformBusinessLine}
                    onChange={(e) => setNewPlatformBusinessLine(e.target.value as BusinessLine)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  >
                    <option value="Bán sản phẩm">Bán sản phẩm</option>
                    <option value="Dịch vụ">Dịch vụ</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tên danh mục</label>
                  <input
                    type="text"
                    value={newPlatformName}
                    onChange={(e) => setNewPlatformName(e.target.value)}
                    placeholder="Ví dụ: Gmail, Tăng tương tác…"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                    autoFocus
                  />
                </div>
                <IconPicker selectedIcon={newCategoryIcon} onSelect={setNewCategoryIcon} />
              </div>
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlatformModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={confirmCreatePlatform}
                  disabled={!newPlatformName.trim()}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0"
                >
                  Tạo danh mục
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editingPlatform && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPlatform(null)}
              className="absolute inset-0 bg-slate-400/10 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md relative overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <Edit2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-display">Sửa danh mục</h3>
                    <p className="text-xs text-slate-500 font-medium">Cập nhật thông tin danh mục</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPlatform(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Loại hình kinh doanh</label>
                  <select
                    value={editingPlatformBusinessLine}
                    onChange={(e) => setEditingPlatformBusinessLine(e.target.value as BusinessLine)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  >
                    <option value="Bán sản phẩm">Bán sản phẩm</option>
                    <option value="Dịch vụ">Dịch vụ</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tên danh mục</label>
                  <input
                    type="text"
                    value={newPlatformName}
                    onChange={(e) => setNewPlatformName(e.target.value)}
                    placeholder="Tên danh mục..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                  />
                </div>
                <IconPicker selectedIcon={newCategoryIcon} onSelect={setNewCategoryIcon} />
              </div>
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPlatform(null)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={confirmUpdatePlatform}
                  disabled={!newPlatformName.trim()}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0"
                >
                  Lưu thay đổi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Xác nhận xóa</h3>
                <p className="text-sm text-slate-500">{deleteCategoryConfirmText}</p>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteCategory}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-700 hover:-translate-y-0.5 transition-all active:scale-95"
                >
                  Xóa ngay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHistoryModalOpen && (
          <HistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            product={selectedProductForHistory}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isStatsModalOpen && (
          <ProductStatsModal
            isOpen={isStatsModalOpen}
            onClose={() => setIsStatsModalOpen(false)}
            product={selectedProductForStats}
            orders={allOrders}
          />
        )}
      </AnimatePresence>
    </>
  );

  if (currentView === 'admin-dashboard') {
    return (
      <>
        <AdminDashboard
          extraPaymentHistory={adminSyncedPaymentHistory}
          orders={allOrders}
          setOrders={setAllOrders}
          categories={categories}
          classificationData={classificationData}
          resolveBusinessLine={resolveBusinessLine}
          lineForClassificationKey={lineForClassificationKey}
          onApproveGianHang={handleApproveGianHang}
          onRejectGianHang={handleRejectGianHang}
          onApproveProduct={handleApproveProduct}
          onRejectProduct={handleRejectProduct}
          onCreateProduct={handleCreateProduct}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
          onToggleProduct={handleToggleProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          onSwapGianHang={handleSwapGianHang}
          onSwapProducts={handleSwapProducts}
          onOpenManagePlatforms={() => setIsManagePlatformsModalOpen(true)}
          onOpenManageProductTypes={() => setIsManageProductTypesModalOpen(true)}
          onOpenMove={() => setIsMoveModalOpen(true)}
          onCreatePlatform={handleCreatePlatform}
          onWarehouseProduct={handleWarehouseProduct}
          isWarehouseOpen={isWarehouseOpen}
          warehouseProduct={warehouseProduct}
          warehouseCategory={warehouseCategory}
          onWarehouseBack={closeWarehouseView}
          onWarehouseUpdateProduct={handleWarehouseUpdateProduct}
          onShowStats={handleShowStats}
          onShowHistory={handleShowHistory}
          onAdminCloseProduct={handleAdminCloseProduct}
          onAdminSuspendProduct={handleAdminSuspendProduct}
          onAdminReopenProduct={handleAdminReopenProduct}
          onFulfillPreOrder={handleFulfillPreOrder}
          onAcceptServiceOrder={handleAcceptServiceOrder}
          onDeliverServiceOrder={handleDeliverServiceOrder}
          onCancelServiceProcessing={handleCancelServiceProcessing}
          onReportDefectiveItems={handleReportDefectiveItems}
          onUploadDefectiveItems={handleUploadDefectiveItems}
        />
        {gianHangPanelToolingModals}
      </>
    );
  }

  if (currentView === 'home') {
    return (
      <HomeView
        onNavigateToAdmin={() => {
          if (!storefrontLoggedIn) {
            window.alert('Vui lòng đăng nhập để quản lý cửa hàng.');
            return;
          }
          navigate(
            pendingPreOrderCount > 0 ? '/admin/orders/products' : '/admin/gian-hang'
          );
        }}
        sellerPendingPreOrderCount={pendingPreOrderCount}
        allOrders={allOrders}
        setAllOrders={setAllOrders}
        storefrontBuyerName={storefrontBuyerName}
        storefrontBuyerEmail={storefrontBuyerEmail}
        storefrontLoggedIn={storefrontLoggedIn}
        onStorefrontLoginSuccess={({ username, email, displayName }) => {
          setSessionLoginUsername(username);
          setSessionDisplayName(displayName);
          setSessionBuyerEmail(email);
          setStorefrontLoggedIn(true);
          setStorefrontLoggedInState(true);
          setStorefrontBuyerName(username);
          setStorefrontBuyerEmailState(email);
          setStorefrontWalletVnd(getStorefrontWalletVndForEmail(email));
        }}
        onStorefrontLogout={() => {
          clearAdminImpersonateFlag();
          setStorefrontLoggedIn(false);
          setStorefrontLoggedInState(false);
          window.scrollTo(0, 0);
        }}
        onStorefrontBuyerEmailPersist={(email) => setStorefrontBuyerEmailState(email)}
        walletBalanceVnd={storefrontWalletVnd}
        setWalletBalanceVnd={setStorefrontWalletVnd}
        storefrontDanhMucBanSanPham={storefrontDanhMucBanSanPham}
        storefrontDanhMucDichVu={storefrontDanhMucDichVu}
        storefrontProductTypesByCategory={classificationData['Bán sản phẩm'] || {}}
        storefrontServiceTypesByCategory={classificationData['Dịch vụ'] || {}}
        accessDeniedFlash={homeAccessDeniedFlash}
        onDismissAccessDeniedFlash={() => setHomeAccessDeniedFlash(null)}
        onSyncAdminPaymentHistory={(row) =>
          setAdminSyncedPaymentHistory((prev) => [row, ...prev.filter((r) => r.id !== row.id)])
        }
        paymentHistoryCheckoutItems={storefrontPaymentHistoryCheckoutItems}
        setPaymentHistoryCheckoutItems={setStorefrontPaymentHistoryCheckoutItems}
        storefrontAdminGianHangCategories={categories}
        gianHangTop1State={gianHangTop1State}
        onFulfillPurchase={handleFulfillStorefrontPurchase}
        resellerRequests={resellerRequests}
        onResellerRequestsChange={setResellerRequests}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-700">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200/60 flex flex-col sticky top-0 h-screen z-20">
        <div className="h-16 shrink-0 flex items-center border-b border-slate-200/60 px-6">
          <AdminBrandLogo onClick={() => navigate('/')} />
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4 overflow-y-auto">
          <SidebarItem
            icon={LayoutDashboard}
            label={isAdminSession ? 'Quản lý gian hàng' : 'Quản lý cửa hàng'}
            active={currentView === 'gian-hang'}
            onClick={() => navigate(adminShellViewToPath('gian-hang'))}
          />
          {!isAdminSession && (
            <>
              <SidebarItem
                icon={ShoppingBag}
                label="Đơn hàng sản phẩm"
                active={currentView === 'don-hang'}
                onClick={() => navigate(adminShellViewToPath('don-hang'))}
                badge={pendingPreOrderCount > 0 ? pendingPreOrderCount : undefined}
              />
              <SidebarItem
                icon={BarChart2}
                label="Thống kê"
                active={currentView === 'thong-ke'}
                onClick={() => navigate(adminShellViewToPath('thong-ke'))}
              />
            </>
          )}
          {isAdminSession && (
            <>
              <SidebarItem
                icon={ShoppingBag}
                label="Đơn hàng sản phẩm"
                active={currentView === 'don-hang'}
                onClick={() => navigate(adminShellViewToPath('don-hang'))}
              />
              <SidebarItem
                icon={Truck}
                label="Đơn hàng dịch vụ"
                active={currentView === 'don-hang-dich-vu'}
                onClick={() => navigate(adminShellViewToPath('don-hang-dich-vu'))}
              />
              <SidebarItem
                icon={MessageSquareX}
                label="Đơn hàng khiếu nại"
                active={currentView === 'don-hang-khieu-nai'}
                onClick={() => navigate(adminShellViewToPath('don-hang-khieu-nai'))}
                badge={complaintBadgeCount > 0 ? complaintBadgeCount : undefined}
              />
              <SidebarItem
                icon={BarChart2}
                label="Thống kê"
                active={currentView === 'thong-ke'}
                onClick={() => navigate(adminShellViewToPath('thong-ke'))}
              />
              <div className="h-px bg-slate-100 my-4 mx-2" />
              <SidebarItem
                icon={Users}
                label="Quản lý Reseller"
                active={currentView === 'quan-ly-reseller'}
                onClick={() => navigate(adminShellViewToPath('quan-ly-reseller'))}
              />
              <SidebarItem
                icon={Star}
                label="Đánh giá"
                active={currentView === 'danh-gia'}
                onClick={() => navigate(adminShellViewToPath('danh-gia'))}
                badge={
                  unreadReviewBadgeCount > 0
                    ? unreadReviewBadgeCount > 99
                      ? '99+'
                      : unreadReviewBadgeCount
                    : undefined
                }
              />
              <SidebarItem
                icon={Ticket}
                label="Mã giảm giá"
                active={currentView === 'ma-giam-gia'}
                onClick={() => navigate(adminShellViewToPath('ma-giam-gia'))}
              />
              <SidebarItem
                icon={Trophy}
                label="Gian hàng Top 1"
                active={currentView === 'gian-hang-top-1'}
                onClick={() => navigate(adminShellViewToPath('gian-hang-top-1'))}
              />
              <div className="my-3 border-t border-slate-100" />
              <SidebarItem
                icon={Shield}
                label="Admin Panel"
                active={currentView === 'admin-dashboard'}
                onClick={() => navigate('/admin/panel')}
              />
            </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          {/* Header */}
          <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-end px-6 lg:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-6 lg:gap-8">
            {storefrontBuyerEmail.trim() && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/80">
                <Wallet size={16} className="text-amber-600 shrink-0" />
                <div className="text-right leading-tight">
                  <div className="text-[10px] font-semibold text-amber-800/80 uppercase tracking-wide">Số dư</div>
                  <div className="text-sm font-bold text-amber-900 tabular-nums">
                    {storefrontWalletVnd.toLocaleString('vi-VN')}đ'
                  </div>
                </div>
              </div>
            )}

            <div className="relative" ref={profileMenuRef}>
              <div 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-4 pl-8 border-l border-slate-200/60 cursor-pointer group"
              >
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900 font-display group-hover:text-blue-600 transition-colors">
                    {storefrontBuyerName}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">{adminRoleLabel}</div>
                </div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow-lg overflow-hidden ring-4 ring-blue-500/5 group-hover:ring-blue-500/20 transition-all">
                    <img src="https://picsum.photos/seed/admin/100/100" alt="Admin" referrerPolicy="no-referrer" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <ChevronDown size={18} className={`text-slate-300 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </div>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                    >
                      {/* User Info Header */}
                      <div className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden shrink-0">
                          <img src="https://picsum.photos/seed/admin/100/100" alt="Admin" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">{storefrontBuyerName}</div>
                          <div className="text-[11px] text-slate-500 truncate">{storefrontBuyerEmail}</div>
                        </div>
                      </div>

                      {storefrontBuyerEmail.trim() && (
                        <div className="mx-4 mb-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-amber-800">Số dư ví</span>
                          <span className="text-sm font-bold text-amber-900 tabular-nums">
                            {storefrontWalletVnd.toLocaleString('vi-VN')}đ'
                          </span>
                        </div>
                      )}

                      <div className="h-px bg-slate-100 mx-3" />

                      <div className="p-2">
                        <button
                          onClick={() => { navigate('/'); setIsProfileOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                        >
                          <Home size={16} className="text-slate-500" />
                          Trở về trang chủ
                        </button>
                      </div>

                      <div className="h-px bg-slate-100 mx-3" />

                      <div className="p-2">
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <LogOut size={16} />
                          Thoát
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {currentView === 'order-detail' && selectedOrderId ? (() => {
            const detailOrder = allOrders.find(o => o.id === selectedOrderId);
            if (!detailOrder) {
              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                  Không tìm thấy đơn hàng.
                  <button
                    type="button"
                    onClick={handleBackFromOrderDetail}
                    className="block mx-auto mt-4 text-blue-600 font-bold text-sm"
                  >
                    Quay lại
                  </button>
                </div>
              );
            }
            if (detailOrder.order_type === 'service') {
              return (
                <ServiceOrderDetailView
                  order={detailOrder}
                  onBack={handleBackFromOrderDetail}
                  onAcceptServiceOrder={handleAcceptServiceOrder}
                  onDeliverServiceOrder={handleDeliverServiceOrder}
                  onCancelServiceProcessing={handleCancelServiceProcessing}
                />
              );
            }
            return (
              <ProductOrderDetailView
                order={detailOrder}
                onBack={handleBackFromOrderDetail}
                onReportDefectiveItems={handleReportDefectiveItems}
                onUploadDefectiveItems={handleUploadDefectiveItems}
              />
            );
          })() : currentView === 'lich-su-thanh-toan' ? (
            <AdminPaymentHistoryView extraRows={adminSyncedPaymentHistory} orders={allOrders} />
          ) : currentView === 'don-hang-da-mua' ? (
            <PurchasedOrdersView
              onOrderClick={navigateToOrderDetail}
              orders={allOrders}
              setOrders={setAllOrders}
              onGianHangClick={openAdminGianHangFromOrder}
              onNavigateToReviews={openAdminReviewsForOrder}
              onNavigateToComplaint={(orderId) =>
                navigate(adminShellViewToPath('don-hang-khieu-nai'), { state: { focusOrderId: orderId } })
              }
            />
          ) : currentView === 'danh-gia' ? (
            <SellerReviewsView
              orders={allOrders}
              categories={categories}
              focusOrderId={adminNavState.focusReviewOrderId}
              onGianHangClick={(gianHangId) =>
                navigate(adminShellViewToPath('gian-hang'), { state: { focusGianHangId: gianHangId } })
              }
              onOrderClick={navigateToOrderDetail}
              onSaveSellerReply={saveSellerReviewReply}
              onMessageBuyer={openAdminMessagesWithBuyer}
            />
          ) : currentView === 'ma-giam-gia' ? (
            <DiscountCodesView categories={categories} />
          ) : currentView === 'gian-hang-top-1' ? (
            <GianHangTop1View
              categories={categories}
              top1State={gianHangTop1State}
              onTop1StateChange={handleGianHangTop1StateChange}
              walletBalanceVnd={storefrontWalletVnd}
              onWalletBalanceChange={setStorefrontWalletVnd}
            />
          ) : currentView === 'thong-ke' ? (
            <SellerRevenueStatisticsView
              orders={allOrders}
              sellerIdentityKeys={sellerIdentityKeys}
              isAdminSession={isAdminSession}
              sellerDisplayName={storefrontBuyerName}
            />
          ) : currentView === 'don-hang-khieu-nai' ? (
            <ComplaintOrdersView
              onOrderClick={navigateToOrderDetail}
              orders={allOrders}
              setOrders={setAllOrders}
              messagingOwnerEmail={storefrontBuyerEmail}
            />
          ) : currentView === 'quan-ly-reseller' ? (
            <ResellerManagementView
              requests={resellerRequests}
              onRequestsChange={setResellerRequests}
              categories={categories}
              sellerIdentityKeys={sellerIdentityKeys}
              isAdminSession={isAdminSession}
              onApproveRequest={(req, approvedPercent) => {
                setCategories(prev =>
                  applyApprovedResellerPercentToCategories(prev, req.gianHangId, approvedPercent)
                );
              }}
              onDeleteApprovedRequest={(req, remaining) => {
                setCategories(prev => {
                  const fallback = getGianDefaultResellerPercent(prev, req.gianHangId);
                  const nextPct = getGianResellerPercentAfterDelete(remaining, req, fallback);
                  return applyApprovedResellerPercentToCategories(prev, req.gianHangId, nextPct);
                });
              }}
            />
          ) : currentView === 'don-hang-dich-vu' ? (
            <ServiceOrdersView
              onOrderClick={navigateToOrderDetail}
              orders={allOrders}
              setOrders={setAllOrders}
              onMessageBuyer={openAdminMessagesWithBuyer}
            />
          ) : currentView === 'don-hang' ? (
            <ProductOrdersView
              onOrderClick={navigateToOrderDetail}
              orders={allOrders}
              setOrders={setAllOrders}
              onFulfillPreOrder={handleFulfillPreOrder}
              onMessageBuyer={openAdminMessagesWithBuyer}
              defaultStatusFilter={pendingPreOrderCount > 0 ? 'Đặt trước' : 'Tất cả'}
            />
          ) : isWarehouseOpen && warehouseProduct && warehouseCategory ? (
            <WarehouseView
              product={warehouseProduct}
              category={warehouseCategory}
              onBack={closeWarehouseView}
              onUpdateProduct={handleWarehouseUpdateProduct}
              orders={allOrders}
            />
          ) : (
            <GianHangManagePanel
              categories={categories}
              classificationData={classificationData}
              resolveBusinessLine={resolveBusinessLine}
              lineForClassificationKey={lineForClassificationKey}
              focusGianHangId={currentView === 'gian-hang' ? adminNavState.focusGianHangId : undefined}
              onFocusGianHangConsumed={clearAdminNavState}
              showConfigToolbar={false}
              onCreateGianHang={(line) => {
                setGianHangFormEditTarget(null);
                setCurrentParentId(null);
                if (line) setGianHangFormParentLine(line);
                setIsCreateCategoryViewOpen(true);
              }}
              onQuickCreateDemo={handleQuickCreateDemoGianHang}
              onCreatePlatform={handleCreatePlatform}
              onCreateSubCategory={handleCreateCategory}
              onDeleteCategory={handleDeleteCategory}
              onEditCategory={handleEditCategory}
              onCreateProduct={handleCreateProduct}
              onToggleProduct={handleToggleProduct}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onWarehouseProduct={handleWarehouseProduct}
              onShowHistory={handleShowHistory}
              onShowStats={handleShowStats}
              onSwapProducts={handleSwapProducts}
              onSwapGianHang={handleSwapGianHang}
            />
          )}
          
        <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.5',
                },
              },
            }),
          }}>
            {activeId && activeItem ? (
              <div className="w-full pointer-events-none">
                {activeItem.type === 'platform' && (
                  <div className="bg-white rounded-xl border-2 border-blue-500 shadow-2xl p-3 scale-[1.02] rotate-1">
                    <CategorySection category={activeItem.data as Category} />
                  </div>
                )}
                {activeItem.type === 'category' && (
                  <div className="bg-white rounded-xl border-2 border-blue-500 shadow-2xl p-3 scale-[1.02] rotate-1">
                    <CategorySection category={activeItem.data as Category} />
                  </div>
                )}
                {activeItem.type === 'product' && (
                  <div className="bg-white rounded-xl border-2 border-blue-500 shadow-2xl overflow-hidden scale-[1.02] rotate-1">
                    <table className="w-full text-left border-collapse">
                      <tbody className="bg-white">
                        <ProductRow product={activeItem.data as Product} index={0} />
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Fallback for SortableItem in Modal */}
                {!['platform', 'category', 'product'].includes(activeItem.type) && (
                   <div className="bg-white border-2 border-blue-500 rounded-xl p-3 shadow-2xl scale-[1.02] rotate-1">
                     <span className="text-sm font-bold text-slate-700">Đang di chuyển...</span>
                   </div>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </div>
      </DndContext>
    </main>

      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

      <ManageProductTypesModal 
        isOpen={isManageProductTypesModalOpen}
        onClose={() => setIsManageProductTypesModalOpen(false)}
        classificationData={classificationData}
        setClassificationData={setClassificationData}
        danhMucOrderByLine={{
          'Bán sản phẩm': storefrontDanhMucBanSanPham,
          'Dịch vụ': storefrontDanhMucDichVu,
        }}
      />

      <AnimatePresence>
        {isCreateCategoryViewOpen && (
          <React.Fragment key={gianHangFormEditTarget?.id ?? 'create-gian-hang'}>
          <CreateCategoryView 
            editingCategory={gianHangFormEditTarget}
            defaultBusinessLine={gianHangFormParentLine}
            onClose={() => {
              setIsCreateCategoryViewOpen(false);
              setGianHangFormEditTarget(null);
              setCurrentParentId(null);
            }}
            categories={categories}
            classificationData={classificationData}
            danhMucOrderByLine={{
              'Bán sản phẩm': storefrontDanhMucBanSanPham,
              'Dịch vụ': storefrontDanhMucDichVu,
            }}
            onSave={(data) => {
              const payload: GianHangFormPayload = {
                name: data.name,
                description: data.description,
                sellerDisplayName: typeof data.sellerDisplayName === 'string' ? data.sellerDisplayName : '',
                tags: data.tags,
                productDetails: data.productDetails,
                classification: data.classification,
                configuration: data.configuration,
                storeImage: data.storeImage,
              };

              if (gianHangFormEditTarget && !gianHangFormEditTarget.isParent) {
                const targetId = gianHangFormEditTarget.id;
                setCategories((prev) =>
                  prev.map((p) => {
                    if (!p.isParent || !p.subCategories?.length) return p;
                    return {
                      ...p,
                      subCategories: applyGianHangFormDataToStore(
                        p.subCategories,
                        p,
                        targetId,
                        payload
                      ),
                    };
                  })
                );
                setIsCreateCategoryViewOpen(false);
                setGianHangFormEditTarget(null);
                setCurrentParentId(null);
                return;
              }

              const clsCat = data.classification.category;
              const clsBiz = data.classification.businessType as BusinessLine;

              const parentByName = categories.find(
                c => c.isParent && (c.originalName === clsCat || c.name === clsCat)
              );
              const parentByLine = categories.find(c => c.isParent && resolveBusinessLine(c) === clsBiz);
              const parentId =
                currentParentId ||
                parentByName?.id ||
                parentByLine?.id ||
                categories.find(c => c.isParent)?.id;

              const parentPlatform = categories.find(c => c.id === parentId);

              const newCat: Category = {
                id: Math.random().toString(36).substr(2, 9),
                name: data.name,
                tags: data.tags,
                shortDescription: data.description,
                description: data.description,
                productDetails: data.productDetails,
                classification: data.classification,
                configuration: data.configuration,
                platform: clsCat,
                date: formatViDateTimeNow(),
                isParent: false,
                iconName: 'Package',
                products: [],
                subCategories: [],
                createdAt: Date.now(),
                storeImage: data.storeImage,
                sellerDisplayName: (
                  typeof data.sellerDisplayName === 'string' && data.sellerDisplayName.trim()
                    ? data.sellerDisplayName.trim()
                    : getSessionLoginUsername()
                ).slice(0, 60),
                createdByName: getSessionDisplayName(),
                status: 'Chờ duyệt',
                businessLine: clsBiz,
              };

              const addSub = (cats: Category[]): Category[] => {
                return cats.map(c => {
                  if (c.id === parentId) {
                    return {
                      ...c,
                      subCategories: [newCat, ...(c.subCategories || [])]
                    };
                  }
                  if (c.subCategories) {
                    return {
                      ...c,
                      subCategories: addSub(c.subCategories)
                    };
                  }
                  return c;
                });
              };
              setCategories((prev) => addSub(prev));
              setIsCreateCategoryViewOpen(false);
              setGianHangFormEditTarget(null);
              setCurrentParentId(null);
              if (typeof window !== 'undefined') {
                window.alert('Gian hàng đã được gửi và đang chờ phê duyệt.');
              }
            }}
          />
          </React.Fragment>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHistoryModalOpen && (
          <HistoryModal 
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            product={selectedProductForHistory}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isStatsModalOpen && (
          <ProductStatsModal
            isOpen={isStatsModalOpen}
            onClose={() => setIsStatsModalOpen(false)}
            product={selectedProductForStats}
            orders={allOrders}
          />
        )}
      </AnimatePresence>

      {/* Move Modal */}
      <AnimatePresence>
        {isMoveModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoveModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center">
                    <Move size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-display">Di chuyển & Sắp xếp</h3>
                    <p className="text-xs text-slate-500 font-medium">Thay đổi thứ tự hiển thị của các thành phần</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMoveModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <div className="flex border-b border-slate-100 bg-slate-50/30">
                <button
                  onClick={() => setMoveTab('categories')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                    moveTab === 'categories' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Gian hàng
                </button>
                <button
                  onClick={() => setMoveTab('products')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                    moveTab === 'products' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Mặt hàng
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/20">
                {moveTab === 'categories' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Chọn danh mục</label>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedPlatformId(cat.id)}
                            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                              selectedPlatformId === cat.id 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                            }`}
                          >
                            <Folder size={16} className={selectedPlatformId === cat.id ? 'text-white' : 'text-blue-500'} />
                            <span className="text-sm font-bold truncate">{cat.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedPlatformId && (
                      <div className="space-y-1 pt-4 border-t border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Kéo thả để sắp xếp danh mục</div>
                        <DndContext 
                          sensors={sensors} 
                          collisionDetection={closestCenter} 
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          modifiers={[restrictToVerticalAxis]}
                        >
                          <SortableContext 
                            items={categories.find(c => c.id === selectedPlatformId)?.subCategories?.map(s => s.id) || []} 
                            strategy={verticalListSortingStrategy}
                          >
                            {categories.find(c => c.id === selectedPlatformId)?.subCategories?.map((sub, idx) => (
                              <div key={sub.id} className={activeId === sub.id ? 'opacity-30' : 'opacity-100'}>
                                <SortableItem id={sub.id} index={idx} label={sub.name} icon={Package} />
                              </div>
                            ))}
                          </SortableContext>
                          <DragOverlay>
                            {activeId ? (
                              <div className="w-full scale-[1.02] shadow-2xl rotate-1 pointer-events-none">
                                <SortableItem 
                                  id={activeId} 
                                  index={categories.find(c => c.id === selectedPlatformId)?.subCategories?.findIndex(s => s.id === activeId) ?? 0} 
                                  label={categories.find(c => c.id === selectedPlatformId)?.subCategories?.find(s => s.id === activeId)?.name || ''} 
                                  icon={Package} 
                                />
                              </div>
                            ) : null}
                          </DragOverlay>
                        </DndContext>
                      </div>
                    )}
                  </div>
                )}

                {moveTab === 'products' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">1. Chọn danh mục</label>
                        <select 
                          value={selectedPlatformId || ''} 
                          onChange={(e) => {
                            setSelectedPlatformId(e.target.value);
                            setSelectedCategoryId(null);
                          }}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none"
                        >
                          <option value="">-- Chọn danh mục --</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">2. Chọn dịch vụ</label>
                        <select 
                          value={selectedCategoryId || ''} 
                          onChange={(e) => setSelectedCategoryId(e.target.value)}
                          disabled={!selectedPlatformId}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none disabled:opacity-50"
                        >
                          <option value="">-- Chọn dịch vụ --</option>
                          {categories.find(c => c.id === selectedPlatformId)?.subCategories?.map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {selectedCategoryId && (
                      <div className="space-y-1 pt-4 border-t border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Kéo thả để sắp xếp sản phẩm</div>
                        <DndContext 
                          sensors={sensors} 
                          collisionDetection={closestCenter} 
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          modifiers={[restrictToVerticalAxis]}
                        >
                          <SortableContext 
                            items={categories.find(c => c.id === selectedPlatformId)?.subCategories?.find(s => s.id === selectedCategoryId)?.products?.map(p => p.id) || []} 
                            strategy={verticalListSortingStrategy}
                          >
                            {categories.find(c => c.id === selectedPlatformId)?.subCategories?.find(s => s.id === selectedCategoryId)?.products?.map((prod, idx) => (
                              <div key={prod.id} className={activeId === prod.id ? 'opacity-30' : 'opacity-100'}>
                                <SortableItem id={prod.id} index={idx} label={prod.name} icon={ShoppingBag} />
                              </div>
                            ))}
                          </SortableContext>
                          <DragOverlay>
                            {activeId ? (
                              <div className="w-full scale-[1.02] shadow-2xl rotate-1 pointer-events-none">
                                <SortableItem 
                                  id={activeId} 
                                  index={categories.find(c => c.id === selectedPlatformId)?.subCategories?.find(s => s.id === selectedCategoryId)?.products?.findIndex(p => p.id === activeId) ?? 0} 
                                  label={categories.find(c => c.id === selectedPlatformId)?.subCategories?.find(s => s.id === selectedCategoryId)?.products?.find(p => p.id === activeId)?.name || ''} 
                                  icon={ShoppingBag} 
                                />
                              </div>
                            ) : null}
                          </DragOverlay>
                        </DndContext>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tự động lưu khi thay đổi</div>
                <button 
                  onClick={() => setIsMoveModalOpen(false)}
                  className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-black transition-all active:scale-95"
                >
                  Hoàn tất
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Product Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md relative overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-display">Tạo mặt hàng mới</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Sau khi tạo, mặt hàng ở trạng thái <strong className="text-amber-700">Chờ duyệt</strong> (giống sàn TMĐT).
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <button
                  type="button"
                  onClick={fillRandomProductForm}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors"
                >
                  <Dices size={14} />
                  Điền random (tên + giá)
                </button>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 ml-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên mặt hàng</label>
                    <button
                      type="button"
                      onClick={() => setNewProductName(randomMatHangName())}
                      className={RANDOM_FIELD_BUTTON_CLASS}
                    >
                      <Dices size={10} />
                      Random
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Ví dụ: Facebook Việt 1 2k bạn bè"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 ml-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giá (đ)</label>
                    <button
                      type="button"
                      onClick={() => setNewProductPrice(randomMatHangPriceInput())}
                      className={RANDOM_FIELD_BUTTON_CLASS}
                    >
                      <Dices size={10} />
                      Random
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="Ví dụ: 2,000,000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmCreateProduct}
                  disabled={!newProductName || !newProductPrice}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0"
                >
                  Tạo mặt hàng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {isEditProductModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditProductModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md relative overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                    <Edit2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-display">Sửa mặt hàng</h3>
                    <p className="text-xs text-slate-500 font-medium">Cập nhật thông tin mặt hàng</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditProductModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <button
                  type="button"
                  onClick={fillRandomProductForm}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors"
                >
                  <Dices size={14} />
                  Điền random (tên + giá)
                </button>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 ml-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên mặt hàng</label>
                    <button
                      type="button"
                      onClick={() => setNewProductName(randomMatHangName())}
                      className={RANDOM_FIELD_BUTTON_CLASS}
                    >
                      <Dices size={10} />
                      Random
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Ví dụ: Facebook Việt 1 2k bạn bè"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 ml-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giá (đ)</label>
                    <button
                      type="button"
                      onClick={() => setNewProductPrice(randomMatHangPriceInput())}
                      className={RANDOM_FIELD_BUTTON_CLASS}
                    >
                      <Dices size={10} />
                      Random
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="Ví dụ: 2,000,000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsEditProductModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmEditProduct}
                  disabled={!newProductName || !newProductPrice}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0"
                >
                  Cập nhật mặt hàng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Category Modal */}
      <AnimatePresence>
        {isEditCategoryModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditCategoryModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md relative overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <Edit2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-display">Sửa gian hàng</h3>
                    <p className="text-xs text-slate-500 font-medium">Cập nhật tên gian hàng của bạn</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditCategoryModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tên gian hàng</label>
                  <input 
                    type="text" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nhập tên gian hàng..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                    autoFocus
                  />
                </div>
                <IconPicker selectedIcon={newCategoryIcon} onSelect={setNewCategoryIcon} />
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsEditCategoryModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmEditCategory}
                  disabled={!newCategoryName}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0"
                >
                  Cập nhật
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ManagePlatformsModal
        isOpen={isManagePlatformsModalOpen}
        onClose={() => setIsManagePlatformsModalOpen(false)}
        platforms={categories.filter(c => c.isParent && resolveBusinessLine(c) === managePlatformTab)}
        groupTab={managePlatformTab}
        onGroupTabChange={setManagePlatformTab}
        onSwapPlatforms={handleSwapPlatforms}
        onEdit={handleEditPlatform}
        onDelete={handleDeletePlatform}
        onCreatePlatform={openCreatePlatformModal}
        onPromoteClassificationKey={handlePromoteClassificationKey}
        classificationOnlyKeys={managePlatformsClassificationBundle.classificationOnlyKeys}
        classificationLineData={managePlatformsClassificationBundle.classificationLineData}
      />

      {/* Edit Platform Modal */}
      <AnimatePresence>
        {editingPlatform && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPlatform(null)}
              className="absolute inset-0 bg-slate-400/10 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md relative overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <Edit2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-display">Sửa danh mục</h3>
                    <p className="text-xs text-slate-500 font-medium">Cập nhật thông tin danh mục</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingPlatform(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Loại hình kinh doanh</label>
                  <select
                    value={editingPlatformBusinessLine}
                    onChange={(e) => setEditingPlatformBusinessLine(e.target.value as BusinessLine)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  >
                    <option value="Bán sản phẩm">Bán sản phẩm</option>
                    <option value="Dịch vụ">Dịch vụ</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tên danh mục</label>
                  <input 
                    type="text" 
                    value={newPlatformName}
                    onChange={(e) => setNewPlatformName(e.target.value)}
                    placeholder="Tên danh mục..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                  />
                </div>
                <IconPicker selectedIcon={newCategoryIcon} onSelect={setNewCategoryIcon} />
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setEditingPlatform(null)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmUpdatePlatform}
                  disabled={!newPlatformName.trim()}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0"
                >
                  Lưu thay đổi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Platform Modal */}
      <AnimatePresence>
        {isPlatformModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPlatformModalOpen(false)}
              className="absolute inset-0 bg-slate-400/10 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md relative overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <LayoutDashboard size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-display">Thêm danh mục mới</h3>
                    <p className="text-xs text-slate-500 font-medium">Tạo không gian quản lý mới</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPlatformModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Loại hình kinh doanh</label>
                  <select
                    value={newPlatformBusinessLine}
                    onChange={(e) => setNewPlatformBusinessLine(e.target.value as BusinessLine)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  >
                    <option value="Bán sản phẩm">Bán sản phẩm</option>
                    <option value="Dịch vụ">Dịch vụ</option>
                  </select>
                  <p className="text-[11px] text-slate-400 font-medium ml-1">Danh mục chỉ gắn với đúng loại hình đã chọn.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tên danh mục</label>
                  <input 
                    type="text" 
                    value={newPlatformName}
                    onChange={(e) => setNewPlatformName(e.target.value)}
                    placeholder="Ví dụ: Dịch vụ Zalo, Dịch vụ Telegram..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                    autoFocus
                  />
                </div>
                <IconPicker selectedIcon={newCategoryIcon} onSelect={setNewCategoryIcon} />
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsPlatformModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmCreatePlatform}
                  disabled={!newPlatformName.trim()}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0"
                >
                  Tạo danh mục
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Category Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md relative overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Folder size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-display">Tạo gian hàng mới</h3>
                    <p className="text-xs text-slate-500 font-medium">Nhập thông tin cho gian hàng của bạn</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tên gian hàng</label>
                  <input 
                    type="text" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ví dụ: Bán tài khoản Facebook"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                    autoFocus
                  />
                </div>
                <IconPicker selectedIcon={newCategoryIcon} onSelect={setNewCategoryIcon} />
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmCreateCategory}
                  disabled={!newCategoryName}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0"
                >
                  Tạo ngay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm relative overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Xác nhận xóa</h3>
                <p className="text-sm text-slate-500">{deleteCategoryConfirmText}</p>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmDeleteCategory}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-700 hover:-translate-y-0.5 transition-all active:scale-95"
                >
                  Xóa ngay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
