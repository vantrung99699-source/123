/**
 * CategorySection, ProductRow, StatusBadge — dùng chung Admin Console & Admin Panel
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronUp,
  ChevronDown,
  LayoutDashboard,
  Users,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Folder,
  Package,
  Calendar,
  Globe,
  Layout,
  TrendingUp,
  Clock,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Gavel,
  Zap,
  FileText,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Smartphone,
  Cpu,
  Gamepad2,
  Music,
  Heart,
  Shield,
  CreditCard,
  Wallet,
  Settings,
  ShoppingBag,
  Truck,
  Star,
  Ticket,
  Trophy,
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
  MessageCircle,
  SendHorizontal,
  MessageSquare,
  Share2,
  ExternalLink,
} from 'lucide-react';
import type { Category, Product, Status, BusinessLine } from './types';
import {
  formatGianHangDisplayDate,
  effectiveGianHangStatus,
  resolveGianHangBusinessLine,
  resolveGianHangDanhMucLabel,
  matchesAdminStatusTab,
  getGianHangResellerPercent,
} from './categorySectionUtils';

/** Menu ⋮ mặt hàng: seller = Quản lý cửa hàng; admin = Admin Panel (đủ mục vận hành). */
export type ProductMoreMenuMode = 'seller' | 'admin';

type ProductMoreMenuItem = {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  onClick?: () => void;
  hidden?: boolean;
};

function buildProductMoreMenuItems(
  product: Product,
  mode: ProductMoreMenuMode,
  handlers: {
    onApprove?: (id: string) => void;
    onShowStats?: (product: Product) => void;
    onShowHistory?: (product: Product) => void;
  }
): ProductMoreMenuItem[] {
  const items: ProductMoreMenuItem[] = [];

  if (mode === 'admin') {
    items.push(
      {
        label: 'Phê duyệt',
        icon: CheckCircle2,
        color: 'text-emerald-600',
        onClick: () => handlers.onApprove?.(product.id),
        hidden: product.status !== 'Chờ duyệt' || !handlers.onApprove,
      },
      { label: 'Đóng', icon: XCircle, color: 'text-rose-600' },
      { label: 'Tạm ngưng', icon: Clock, color: 'text-amber-600' },
      { label: 'Khiếu nại', icon: AlertCircle, color: 'text-orange-600' },
      { label: 'Tranh chấp', icon: Gavel, color: 'text-indigo-600' },
      { label: 'Báo cáo', icon: Zap, color: 'text-purple-600' },
      { label: 'Ghi chú', icon: FileText, color: 'text-slate-600' }
    );
  }

  if (handlers.onShowStats) {
    items.push({
      label: 'Thống kê',
      icon: LayoutDashboard,
      color: 'text-blue-600',
      onClick: () => handlers.onShowStats?.(product),
    });
  }

  if (mode === 'admin' && handlers.onShowHistory) {
    items.push({
      label: 'Lịch sử chỉnh sửa',
      icon: History,
      color: 'text-slate-500',
      onClick: () => handlers.onShowHistory?.(product),
    });
  }

  return items;
}

export function StatusBadge({ status }: { status: Status }) {
  const styles = {
    'Đang bán': 'bg-green-600 text-white border-transparent ring-green-500/10',
    'Tạm ngưng': 'bg-rose-600 text-white border-transparent ring-rose-500/10',
    'Chờ duyệt': 'bg-amber-400 text-amber-900 border-transparent ring-amber-500/10',
    'Đã hủy': 'bg-slate-500 text-white border-transparent ring-slate-500/10',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ring-4 ${styles[status]}`}>
      {status}
    </span>
  );
};

export function ProductRow({ 
  product, 
  index, 
  onToggle, 
  onEdit, 
  onDelete,
  onWarehouse,
  onShowHistory,
  onShowStats,
  onApprove,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  moreMenuMode = 'seller',
  hideWarehouse = false,
}: { 
  product: Product; 
  index: number; 
  onToggle?: (id: string) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onWarehouse?: (product: Product) => void;
  /** Gian «Dịch vụ» — không có kho hàng. */
  hideWarehouse?: boolean;
  onShowHistory?: (product: Product) => void;
  onShowStats?: (product: Product) => void;
  onApprove?: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  moreMenuMode?: ProductMoreMenuMode;
  key?: string | number;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const moreMenuItems = buildProductMoreMenuItems(product, moreMenuMode, {
    onApprove,
    onShowStats,
    onShowHistory,
  }).filter(item => !item.hidden);

  return (
    <motion.tr 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.02 }}
      style={{
        zIndex: isDropdownOpen ? 9999 : undefined,
        position: 'relative' as const,
      }}
      className="border-b border-slate-200 hover:bg-slate-50/80 transition-all duration-200 group"
    >
      <td className="py-5 pl-4 border-r border-slate-200">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              title="Di chuyển lên"
              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-30 disabled:pointer-events-none disabled:cursor-not-allowed"
            >
              <ChevronUp size={14} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              title="Di chuyển xuống"
              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-30 disabled:pointer-events-none disabled:cursor-not-allowed"
            >
              <ChevronDown size={14} strokeWidth={2.5} />
            </button>
          </div>
          {!hideWarehouse && (
            <button 
              type="button"
              onClick={() => onWarehouse?.(product)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
            >
              <Package size={14} />
              Kho
            </button>
          )}
          <button 
            onClick={() => onEdit?.(product)}
            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => onDelete?.(product.id)}
            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
          >
            <Trash2 size={14} />
          </button>
          
          <div className="relative overflow-visible">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`p-1.5 rounded-lg transition-all ${isDropdownOpen ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
            >
              <MoreVertical size={14} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-[60]" 
                    onClick={() => setIsDropdownOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute left-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[10000] overflow-hidden py-2"
                  >
                    {moreMenuItems.length === 0 ? (
                      <p className="px-4 py-2.5 text-[12px] text-slate-400 font-medium">
                        Chưa có thao tác khác
                      </p>
                    ) : (
                      moreMenuItems.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            item.onClick?.();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all group"
                        >
                          <item.icon
                            size={16}
                            className={`${item.color} group-hover:scale-110 transition-transform`}
                          />
                          {item.label}
                        </button>
                      ))
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </td>
    <td className="py-3 px-4 border-r border-slate-200">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shrink-0">
          <Package size={16} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-all line-clamp-2 leading-snug">{product.name}</div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
            <span className="font-mono font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-300">ID: {product.id}</span>
            <span className="flex items-center gap-1 font-bold">
              <Calendar size={10} /> {product.date}
            </span>
          </div>
        </div>
      </div>
    </td>
    <td className="py-3 px-4 text-sm font-bold text-slate-900 font-display border-r border-slate-200">{product.price}</td>
    <td className="py-3 px-4 text-sm font-semibold text-slate-600 border-r border-slate-200">
      {hideWarehouse ? (
        <span className="text-violet-600 font-bold text-xs">Dịch vụ</span>
      ) : (
        product.stock.toLocaleString()
      )}
    </td>
    <td className="py-3 px-4 text-sm font-semibold text-blue-600 border-r border-slate-200">{product.sold.toLocaleString()}</td>
    <td className="py-3 px-4 border-r border-slate-200">
      <StatusBadge status={product.status} />
    </td>
    <td className="py-3 pr-4 pl-4">
      <div 
        onClick={() => {
          if (product.status === 'Chờ duyệt') return;
          onToggle?.(product.id);
        }}
        title={product.status === 'Chờ duyệt' ? 'Cần phê duyệt trước khi bật bán' : undefined}
        className={`w-8 h-4 rounded-full relative transition-all duration-300 ring-2 ${
          product.status === 'Chờ duyệt'
            ? 'bg-slate-100 ring-slate-200/50 cursor-not-allowed opacity-60'
            : product.active
              ? 'bg-blue-600 ring-blue-500/10 cursor-pointer'
              : 'bg-slate-200 ring-slate-500/5 cursor-pointer'
        }`}
      >
        <motion.div 
          animate={{ x: product.active ? 16 : 3 }}
          className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </td>
  </motion.tr>
  );
};

// --- Constants ---
/** Icon ô đầu thẻ gian hàng con theo loại hình kinh doanh. */
export const GIAN_HANG_PRODUCT_ICON = Package;
export const GIAN_HANG_SERVICE_ICON = TrendingUp;

export const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Folder,
  Package,
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
  ShoppingBag,
  Truck,
  Users,
  Star,
  Ticket,
  Trophy,
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
  MessageCircle,
  SendHorizontal,
  LayoutDashboard,
  Layout,
  MessageSquare,
  Share2,
  ExternalLink,
};

export function CategorySection({ 
  category, 
  depth = 0, 
  onCreateSubCategory,
  onDeleteCategory,
  onEditCategory,
  onCreateProduct,
  onToggleProduct,
  onEditProduct,
  onDeleteProduct,
  onWarehouseProduct,
  onShowHistory,
  onShowStats,
  onApproveCategory,
  onApproveProduct,
  onSwapProducts,
  activeTab,
  searchQuery,
  platformIconName,
  parentBusinessLine,
  platformParentId,
  canMoveGianHangUp = false,
  canMoveGianHangDown = false,
  onMoveGianHangUp,
  onMoveGianHangDown,
  productMoreMenuMode = 'seller',
}: { 
  category: Category; 
  depth?: number; 
  onCreateSubCategory?: (parentId: string) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onEditCategory?: (category: Category) => void;
  onCreateProduct?: (categoryId: string) => void;
  onToggleProduct?: (productId: string) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onWarehouseProduct?: (product: Product, category: Category) => void;
  onShowHistory?: (product: Product) => void;
  onShowStats?: (product: Product) => void;
  onApproveCategory?: (categoryId: string) => void;
  onApproveProduct?: (productId: string) => void;
  /** Hoán đổi thứ tự hai mặt hàng trong gian hàng */
  onSwapProducts?: (categoryId: string, productIdA: string, productIdB: string) => void;
  activeTab?: string;
  searchQuery?: string;
  platformIconName?: string;
  /** Line nền tảng cha — fallback khi gian con chưa có classification.businessType */
  parentBusinessLine?: BusinessLine;
  platformParentId?: string;
  canMoveGianHangUp?: boolean;
  canMoveGianHangDown?: boolean;
  onMoveGianHangUp?: () => void;
  onMoveGianHangDown?: () => void;
  productMoreMenuMode?: ProductMoreMenuMode;
  key?: string | number;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const gianHangBusinessLine = resolveGianHangBusinessLine(category, parentBusinessLine);
  const isServiceGianHang = gianHangBusinessLine === 'Dịch vụ';
  const gianHangResellerPercent = !category.isParent ? getGianHangResellerPercent(category) : null;
  const showTrungBadge =
    !category.isParent &&
    (category.tags?.some(t => t.toUpperCase() === 'TRÙNG' || t.toUpperCase() === 'TRUNG') ?? false);
  const canShowGianHangMoveMenu =
    !category.isParent &&
    depth === 0 &&
    Boolean(platformParentId) &&
    Boolean(onMoveGianHangUp);
  const gianHangStatus = !category.isParent ? effectiveGianHangStatus(category) : null;
  const gianHangDanhMucLabel = !category.isParent ? resolveGianHangDanhMucLabel(category) : '';

  /** Gian hàng con: một icon theo loại hình — SP = kho hàng, DV = tăng tương tác / dịch vụ. */
  const IconComponent =
    !category.isParent && gianHangBusinessLine
      ? gianHangBusinessLine === 'Dịch vụ'
        ? GIAN_HANG_SERVICE_ICON
        : GIAN_HANG_PRODUCT_ICON
      : (category.platform && ICON_MAP[category.platform])
        ? ICON_MAP[category.platform]
        : category.iconName && ICON_MAP[category.iconName]
          ? ICON_MAP[category.iconName]
          : category.isParent
            ? Folder
            : Package;

  // Filter products based on activeTab and searchQuery
  const filteredProducts = category.products?.filter(product => {
    let matchesStatus = matchesAdminStatusTab(product.status, activeTab);

    // Search filter
    let matchesSearch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matchesSearch = product.name.toLowerCase().includes(query) || 
                      product.id.toLowerCase().includes(query);
    }

    return matchesStatus && matchesSearch;
  }) || [];

  // Filter subcategories recursively
  // A subcategory is shown if it has matching products or matching sub-subcategories
  const hasMatchingContent = (cat: Category): boolean => {
    if (!cat.isParent && matchesAdminStatusTab(effectiveGianHangStatus(cat), activeTab)) {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      if (cat.name.toLowerCase().includes(query)) return true;
    }

    const hasMatchingProducts = cat.products?.some(p => {
      let matchesStatus = matchesAdminStatusTab(p.status, activeTab);

      // Search filter
      let matchesSearch = true;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        matchesSearch = p.name.toLowerCase().includes(query) || 
                        p.id.toLowerCase().includes(query);
      }

      return matchesStatus && matchesSearch;
    });
    
    if (hasMatchingProducts) return true;
    
    return cat.subCategories?.some(sub => hasMatchingContent(sub)) || false;
  };

  if ((activeTab && activeTab !== 'Tất cả' || searchQuery) && !hasMatchingContent(category)) {
    return null;
  }

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-visible ${depth > 0 ? 'ml-4 mt-2' : ''}`}>
      {/* Category Header */}
      <div className="flex items-center justify-between p-5 px-8 transition-all duration-300 bg-blue-100/40 hover:bg-blue-100/70 border-b border-blue-200/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 bg-blue-600 text-white shadow-blue-500/20">
            <IconComponent size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-display text-slate-900 tracking-tight">
                  {category.name}
                </span>
              </div>
              {!category.isParent && (
                <div className="flex gap-1.5 flex-wrap items-center">
                  {gianHangStatus && <StatusBadge status={gianHangStatus} />}
                  {showTrungBadge && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-tight bg-emerald-50/50 text-emerald-600 border-emerald-100">
                      Trùng
                    </span>
                  )}
                  {gianHangResellerPercent != null && (
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-tight bg-sky-50/50 text-sky-600 border-sky-100 tabular-nums"
                      title={`Chiết khấu reseller mặc định: ${gianHangResellerPercent}%`}
                    >
                      Reseller {gianHangResellerPercent}%
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] mt-1 font-medium text-slate-400 flex-wrap">
              {gianHangBusinessLine && (
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                    gianHangBusinessLine === 'Bán sản phẩm'
                      ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200'
                      : 'bg-violet-50/80 text-violet-700 border-violet-200'
                  }`}
                  title={
                    gianHangBusinessLine === 'Bán sản phẩm'
                      ? 'Gian hàng bán sản phẩm'
                      : 'Gian hàng dịch vụ'
                  }
                >
                  {gianHangBusinessLine === 'Bán sản phẩm' ? (
                    <GIAN_HANG_PRODUCT_ICON size={10} />
                  ) : (
                    <GIAN_HANG_SERVICE_ICON size={10} />
                  )}
                  {gianHangBusinessLine}
                </span>
              )}
              {gianHangBusinessLine &&
                (category.classification?.product || category.platform) && (
                  <span className="text-slate-200 opacity-20">|</span>
                )}
              {(category.classification?.product || category.platform) && (
                <span className="flex items-center gap-1">
                  <Globe size={10} className="text-blue-500" /> 
                  {category.classification?.product.split(' (')[0] || category.platform}
                </span>
              )}
              {(category.classification?.product || category.platform) &&
                (category.date || !category.isParent) && (
                  <span className="text-slate-200 opacity-20">|</span>
                )}
              {category.date && (
                <span className="flex items-center gap-1 tabular-nums">
                  <Calendar size={10} className="text-blue-500" /> 
                  {formatGianHangDisplayDate(category.date)}
                </span>
              )}
              {category.date && !category.isParent && (
                <span className="text-slate-200 opacity-20">|</span>
              )}
              {!category.isParent && (
                <span
                  className="flex items-center gap-1 text-blue-600 font-bold"
                  title="Tên người bán hàng"
                >
                  <Users size={10} className="text-blue-500" /> 
                  {category.sellerDisplayName?.trim() || category.createdByName?.trim() || '—'}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!category.isParent && gianHangStatus === 'Chờ duyệt' && onApproveCategory && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onApproveCategory(category.id);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[11px] font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <CheckCircle2 size={16} />
              Phê duyệt gian
            </button>
          )}
          {!category.isParent && onCreateProduct && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onCreateProduct(category.id);
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Plus size={16} />
              Tạo mặt hàng
            </button>
          )}
          
          {/* Category Pill (Deep Indigo) - Only for subcategories */}
          {!category.isParent && (
            <div className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-900 text-white rounded-xl shadow-lg shadow-indigo-900/10 hover:bg-indigo-800 transition-colors">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                {(() => {
                  const Icon = (platformIconName && ICON_MAP[platformIconName]) ? ICON_MAP[platformIconName] : Folder;
                  return <Icon size={14} />;
                })()}
              </div>
              <span className="text-[11px] font-bold whitespace-nowrap tracking-tight" title="Danh mục (đồng bộ storefront)">
                {gianHangDanhMucLabel}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 ml-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEditCategory?.(category);
              }}
              className="p-2 rounded-lg transition-all hover:scale-110 active:scale-95 text-blue-500 hover:bg-blue-50"
            >
              <Edit2 size={18} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCategory?.(category.id);
              }}
              className="p-2 rounded-lg transition-all hover:scale-110 active:scale-95 text-rose-500 hover:bg-rose-50"
            >
              <Trash2 size={18} />
            </button>
            <div className="relative overflow-visible">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (canShowGianHangMoveMenu) setIsHeaderMenuOpen((v) => !v);
                }}
                className={`p-2 rounded-lg transition-all hover:scale-110 active:scale-95 ${
                  isHeaderMenuOpen
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
                title={canShowGianHangMoveMenu ? 'Thao tác thêm' : undefined}
              >
                <MoreVertical size={18} />
              </button>
              <AnimatePresence>
                {isHeaderMenuOpen && canShowGianHangMoveMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-[60]"
                      onClick={() => setIsHeaderMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[10000] overflow-hidden py-2"
                    >
                      <button
                        type="button"
                        disabled={!canMoveGianHangUp}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!canMoveGianHangUp) return;
                          setIsHeaderMenuOpen(false);
                          onMoveGianHangUp?.();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all group disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed"
                      >
                        <ChevronUp
                          size={16}
                          className="text-blue-600 group-hover:scale-110 transition-transform"
                        />
                        Di chuyển lên
                      </button>
                      <button
                        type="button"
                        disabled={!canMoveGianHangDown}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!canMoveGianHangDown) return;
                          setIsHeaderMenuOpen(false);
                          onMoveGianHangDown?.();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all group disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed"
                      >
                        <ChevronDown
                          size={16}
                          className="text-blue-600 group-hover:scale-110 transition-transform"
                        />
                        Di chuyển xuống
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="w-px h-6 mx-1 bg-slate-200" />
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-lg transition-colors hover:bg-slate-100"
            >
              <ChevronDown size={22} className={`transition-transform duration-300 ${isOpen ? '' : '-rotate-90'} text-slate-300`} />
            </button>
          </div>
        </div>
      </div>

      {/* Category Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className=""
          >
            {/* Render Subcategories */}
            {category.subCategories && category.subCategories.map(sub => (
              <CategorySection 
                key={sub.id} 
                category={sub} 
                depth={depth + 1} 
                onCreateSubCategory={onCreateSubCategory} 
                onDeleteCategory={onDeleteCategory}
                onEditCategory={onEditCategory}
                onCreateProduct={onCreateProduct}
                onToggleProduct={onToggleProduct}
                onEditProduct={onEditProduct}
                onDeleteProduct={onDeleteProduct}
                onWarehouseProduct={onWarehouseProduct}
                onApproveCategory={onApproveCategory}
                onApproveProduct={onApproveProduct}
                productMoreMenuMode={productMoreMenuMode}
                activeTab={activeTab}
                searchQuery={searchQuery}
                parentBusinessLine={
                  gianHangBusinessLine ??
                  (category.businessLine === 'Dịch vụ' ? 'Dịch vụ' : 'Bán sản phẩm')
                }
              />
            ))}

            {/* Render Products Table */}
            {filteredProducts.length > 0 && (
              <div className="overflow-visible">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-slate-100">
                      <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] w-[160px] font-display border-r border-slate-100">Hành động</th>
                      <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-100">Tên mặt hàng</th>
                      <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-100">Đơn giá</th>
                      <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-100">
                        {isServiceGianHang ? 'Loại' : 'Tồn kho'}
                      </th>
                      <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-100">Đã bán</th>
                      <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-100">Trạng thái</th>
                      <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display">Bật/Tắt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((product, idx) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        index={idx}
                        onToggle={onToggleProduct}
                        onEdit={onEditProduct}
                        onDelete={onDeleteProduct}
                        onWarehouse={isServiceGianHang ? undefined : (p) => onWarehouseProduct?.(p, category)}
                        onShowHistory={onShowHistory}
                        onShowStats={onShowStats}
                        onApprove={onApproveProduct}
                        moreMenuMode={productMoreMenuMode}
                        hideWarehouse={isServiceGianHang}
                        canMoveUp={idx > 0}
                        canMoveDown={idx < filteredProducts.length - 1}
                        onMoveUp={() => {
                          const prev = filteredProducts[idx - 1];
                          if (prev) onSwapProducts?.(category.id, product.id, prev.id);
                        }}
                        onMoveDown={() => {
                          const next = filteredProducts[idx + 1];
                          if (next) onSwapProducts?.(category.id, product.id, next.id);
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};