/**
 * Bảng quản lý gian hàng — UI đồng bộ Admin Console (lọc + thẻ CategorySection)
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Package,
  TrendingUp,
  Move,
  Filter,
  Search,
  ChevronDown,
  Plus,
  Globe,
  Folder,
  Zap,
} from 'lucide-react';
import { CategorySection, ICON_MAP, type ProductMoreMenuMode } from './CategorySection';
import {
  categoryDisplayOrderTimestamp,
  countGianHangPendingApproval,
  resolveGianHangBusinessLine,
} from './categorySectionUtils';
import type { BusinessLine, Category, GianHangLeaf, Product } from './types';

export interface QuickCreateDemoResult {
  gianHangId: string;
  gianHangName: string;
  businessLine: BusinessLine;
}

export type DanhMucFilterRow = {
  key: string;
  line: BusinessLine;
  kind: 'parent' | 'classification';
};

/** Lọc loại hình gian hàng — chỉ Admin Panel */
export type GianHangBusinessLineFilter = 'Tất cả' | BusinessLine;

export interface GianHangManagePanelProps {
  categories: Category[];
  classificationData: Record<string, Record<string, string[]>>;
  resolveBusinessLine: (cat: Category) => BusinessLine;
  lineForClassificationKey: (key: string) => BusinessLine | null;
  defaultActiveTab?: string;
  /** Thanh Quản lý danh mục / loại SP / Di chuyển — chỉ hiện trên Admin Panel */
  showConfigToolbar?: boolean;
  showCreateGianHang?: boolean;
  onOpenManagePlatforms?: () => void;
  onOpenManageProductTypes?: () => void;
  onOpenMove?: () => void;
  /** Gợi ý loại hình khi mở form (từ danh mục đang lọc, ví dụ Dịch vụ). */
  onCreateGianHang?: (defaultBusinessLine?: BusinessLine) => void;
  /** Gian + mặt hàng demo (SP: có kho; DV: không kho), giá 1đ, Đang bán */
  onQuickCreateDemo?: (businessLine: BusinessLine) => QuickCreateDemoResult | void;
  onCreatePlatform?: () => void;
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
  /** Admin Panel — đóng mặt hàng (Đã hủy). Không truyền từ shell người bán. */
  onAdminCloseProduct?: (productId: string) => void;
  /** Admin Panel — tạm ngưng mặt hàng. Không truyền từ shell người bán. */
  onAdminSuspendProduct?: (productId: string) => void;
  onAdminReopenProduct?: (productId: string) => void;
  onSwapProducts?: (categoryId: string, productIdA: string, productIdB: string) => void;
  /** Đổi thứ tự gian hàng con trong cùng danh mục cha */
  onSwapGianHang?: (parentId: string, gianHangIdA: string, gianHangIdB: string) => void;
  /** Cuộn tới & highlight gian (từ đơn hàng / đánh giá). */
  focusGianHangId?: string | null;
  onFocusGianHangConsumed?: () => void;
}

export function GianHangManagePanel({
  categories,
  classificationData,
  resolveBusinessLine,
  lineForClassificationKey,
  defaultActiveTab = 'Tất cả',
  showConfigToolbar = true,
  showCreateGianHang = true,
  onOpenManagePlatforms,
  onOpenManageProductTypes,
  onOpenMove,
  onCreateGianHang,
  onQuickCreateDemo,
  onCreatePlatform,
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
  onAdminCloseProduct,
  onAdminSuspendProduct,
  onAdminReopenProduct,
  onSwapProducts,
  onSwapGianHang,
  focusGianHangId,
  onFocusGianHangConsumed,
}: GianHangManagePanelProps) {
  const productMoreMenuMode: ProductMoreMenuMode = showConfigToolbar ? 'admin' : 'seller';
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tất cả gian hàng');
  const [platformFilter, setPlatformFilter] = useState('Tất cả danh mục');
  /** Admin Panel — lọc gian SP / DV */
  const [businessLineFilter, setBusinessLineFilter] = useState<GianHangBusinessLineFilter>('Tất cả');
  const [isPlatformFilterDropdownOpen, setIsPlatformFilterDropdownOpen] = useState(false);
  const [isQuickCreateMenuOpen, setIsQuickCreateMenuOpen] = useState(false);
  const quickCreateBtnRef = useRef<HTMLButtonElement>(null);
  const quickCreateMenuRef = useRef<HTMLDivElement>(null);
  const [quickCreateMenuPos, setQuickCreateMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [quickCreateToast, setQuickCreateToast] = useState<string | null>(null);
  const [highlightGianHangId, setHighlightGianHangId] = useState<string | null>(null);

  useEffect(() => {
    const id = focusGianHangId?.trim();
    if (!id) return;
    setActiveTab('Tất cả');
    setCategoryFilter('Tất cả gian hàng');
    setPlatformFilter('Tất cả danh mục');
    setSearchQuery('');
    setHighlightGianHangId(id);
    const scrollTimer = window.setTimeout(() => {
      document.getElementById(`gian-hang-card-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    const clearTimer = window.setTimeout(() => {
      setHighlightGianHangId(null);
      onFocusGianHangConsumed?.();
    }, 6000);
    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [focusGianHangId, onFocusGianHangConsumed]);

  const updateQuickCreateMenuPos = () => {
    const el = quickCreateBtnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const menuWidth = 220;
    setQuickCreateMenuPos({
      top: r.bottom + 6,
      left: Math.max(8, r.right - menuWidth),
      width: menuWidth,
    });
  };

  useLayoutEffect(() => {
    if (!isQuickCreateMenuOpen) return;
    updateQuickCreateMenuPos();
    const onResize = () => updateQuickCreateMenuPos();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [isQuickCreateMenuOpen]);

  useEffect(() => {
    if (!isQuickCreateMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (quickCreateBtnRef.current?.contains(target)) return;
      if (quickCreateMenuRef.current?.contains(target)) return;
      setIsQuickCreateMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [isQuickCreateMenuOpen]);

  const runQuickCreateDemo = (line: BusinessLine) => {
    if (!onQuickCreateDemo) return;
    setIsQuickCreateMenuOpen(false);
    const result = onQuickCreateDemo(line);
    if (!result?.gianHangId) {
      setQuickCreateToast('Không tạo được gian demo. Kiểm tra danh mục cha hoặc thử lại.');
      window.setTimeout(() => setQuickCreateToast(null), 6000);
      return;
    }
    setActiveTab('Tất cả');
    setCategoryFilter('Tất cả gian hàng');
    setPlatformFilter('Tất cả danh mục');
    setSearchQuery('');
    setHighlightGianHangId(result.gianHangId);
    setQuickCreateToast(
      line === 'Dịch vụ'
        ? `Đã tạo gian dịch vụ «${result.gianHangName}» (1đ) — cuộn xuống để xem.`
        : `Đã tạo gian sản phẩm «${result.gianHangName}» (1đ + kho) — cuộn xuống để xem.`
    );
    window.setTimeout(() => setQuickCreateToast(null), 8000);
    window.setTimeout(() => setHighlightGianHangId(null), 6000);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document
          .getElementById(`gian-hang-card-${result.gianHangId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  };

  const pendingApprovalCount = useMemo(
    () => countGianHangPendingApproval(categories),
    [categories]
  );

  const mergedDanhMucFilterOptions = useMemo((): DanhMucFilterRow[] => {
    const rows: DanhMucFilterRow[] = [];
    const seen = new Set<string>();
    for (const p of categories.filter((c) => c.isParent)) {
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

  const effectiveBusinessLineFilter: GianHangBusinessLineFilter = showConfigToolbar
    ? businessLineFilter
    : 'Tất cả';

  const danhMucFilterOptionsForToolbar = useMemo(() => {
    if (effectiveBusinessLineFilter === 'Tất cả') return mergedDanhMucFilterOptions;
    return mergedDanhMucFilterOptions.filter((o) => o.line === effectiveBusinessLineFilter);
  }, [mergedDanhMucFilterOptions, effectiveBusinessLineFilter]);

  const matchesBusinessLineFilter = (cat: Category): boolean => {
    if (effectiveBusinessLineFilter === 'Tất cả') return true;
    return resolveGianHangBusinessLine(cat) === effectiveBusinessLineFilter;
  };

  useEffect(() => {
    if (platformFilter === 'Tất cả danh mục') return;
    const valid = danhMucFilterOptionsForToolbar.some((o) => o.key === platformFilter);
    if (!valid) {
      setPlatformFilter('Tất cả danh mục');
      setCategoryFilter('Tất cả gian hàng');
    }
  }, [danhMucFilterOptionsForToolbar, platformFilter]);

  const parentsMatchingDanhMucFilter = useMemo(() => {
    return categories.filter((parent) => {
      if (!parent.isParent) return false;
      if (platformFilter === 'Tất cả danh mục') return true;
      if (parent.name === platformFilter) return true;
      const line = lineForClassificationKey(platformFilter);
      if (!line || resolveBusinessLine(parent) !== line) return false;
      return classificationData[line]?.[platformFilter] !== undefined;
    });
  }, [
    categories,
    platformFilter,
    classificationData,
    resolveBusinessLine,
    lineForClassificationKey,
  ]);

  const visibleGianHangCategories = useMemo((): GianHangLeaf[] => {
    const flat = parentsMatchingDanhMucFilter.flatMap((parent) => {
      const subs = parent.subCategories || [];
      if (platformFilter === 'Tất cả danh mục') {
        return subs.map((sub) => ({
          ...sub,
          platformIconName: parent.iconName,
          platformParentId: parent.id,
        }));
      }
      if (parent.name === platformFilter) {
        return subs.map((sub) => ({
          ...sub,
          platformIconName: parent.iconName,
          platformParentId: parent.id,
        }));
      }
      const filtered = subs.filter(
        (sub) =>
          sub.name === platformFilter ||
          sub.classification?.category === platformFilter ||
          sub.classification?.product === platformFilter
      );
      return filtered.map((sub) => ({
        ...sub,
        platformIconName: parent.iconName,
        platformParentId: parent.id,
      }));
    });
    return flat;
  }, [parentsMatchingDanhMucFilter, platformFilter]);

  const subOptions = useMemo(
    () =>
      parentsMatchingDanhMucFilter
        .flatMap((cat) => cat.subCategories || [])
        .filter((sub) => matchesBusinessLineFilter(sub)),
    [parentsMatchingDanhMucFilter, effectiveBusinessLineFilter]
  );

  const activeDanhMucLine = useMemo((): BusinessLine | null => {
    if (platformFilter === 'Tất cả danh mục') return null;
    return mergedDanhMucFilterOptions.find((o) => o.key === platformFilter)?.line ?? null;
  }, [platformFilter, mergedDanhMucFilterOptions]);

  const displayedGianHangList = useMemo(() => {
    const filtered = visibleGianHangCategories
      .filter((cat) => matchesBusinessLineFilter(cat))
      .filter(
        (cat) => categoryFilter === 'Tất cả gian hàng' || cat.name === categoryFilter
      )
      .filter((cat) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          cat.name.toLowerCase().includes(query) ||
          cat.platform?.toLowerCase().includes(query) ||
          cat.products?.some(
            (p) =>
              p.name.toLowerCase().includes(query) ||
              p.id.toLowerCase().includes(query)
          )
        );
      });

    return [...filtered].sort((a, b) => {
      if (activeDanhMucLine === 'Dịch vụ') {
        const aDv = resolveGianHangBusinessLine(a) === 'Dịch vụ' ? 1 : 0;
        const bDv = resolveGianHangBusinessLine(b) === 'Dịch vụ' ? 1 : 0;
        if (bDv !== aDv) return bDv - aDv;
      }
      const tb = categoryDisplayOrderTimestamp(b);
      const ta = categoryDisplayOrderTimestamp(a);
      if (tb !== ta) return tb - ta;
      return a.name.localeCompare(b.name, 'vi');
    });
  }, [
    visibleGianHangCategories,
    categoryFilter,
    searchQuery,
    activeDanhMucLine,
    effectiveBusinessLineFilter,
  ]);

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      {quickCreateToast && (
        <div
          role="status"
          className="sticky top-0 z-40 flex items-start gap-2 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm font-semibold shadow-sm"
        >
          <Zap size={16} className="shrink-0 mt-0.5 text-emerald-600" />
          <span>{quickCreateToast}</span>
        </div>
      )}
      {showConfigToolbar && (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onOpenManagePlatforms}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-50 hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <Settings size={18} />
            Quản lý danh mục
          </button>
          <button
            type="button"
            onClick={onOpenManageProductTypes}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-blue-200 text-blue-600 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-50 hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <Package size={18} />
            Quản lý loại sản phẩm
          </button>
          <button
            type="button"
            onClick={onOpenMove}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-orange-200 text-orange-600 rounded-xl text-sm font-bold shadow-sm hover:bg-orange-50 hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <Move size={18} />
            Di chuyển & Sắp xếp
          </button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-visible"
      >
        <div className="p-4 flex flex-wrap items-center gap-6 overflow-visible">
          <div className="flex flex-col gap-1.5 w-44 shrink-0">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
              Trạng thái
            </label>
            <div className="relative group">
              <Filter
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                size={16}
              />
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 appearance-none focus:bg-white focus:border-blue-500 transition-all outline-none cursor-pointer"
              >
                <option value="Tất cả">Tất cả</option>
                <option value="Đang bán">Đang bán</option>
                <option value="Tạm ngưng">Tạm ngưng</option>
                <option value="Đóng">Đóng</option>
                <option value="Chờ duyệt">
                  Chờ duyệt{pendingApprovalCount > 0 ? ` (${pendingApprovalCount})` : ''}
                </option>
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={14}
              />
            </div>
          </div>

          {showConfigToolbar && (
            <div className="flex flex-col gap-1.5 w-52 shrink-0">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Loại hình
              </label>
              <div className="relative group">
                {businessLineFilter === 'Dịch vụ' ? (
                  <TrendingUp
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-500 transition-colors"
                    size={16}
                  />
                ) : (
                  <Package
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                      businessLineFilter === 'Bán sản phẩm'
                        ? 'text-emerald-600'
                        : 'text-slate-400 group-focus-within:text-blue-500'
                    }`}
                    size={16}
                  />
                )}
                <select
                  value={businessLineFilter}
                  onChange={(e) => {
                    const next = e.target.value as GianHangBusinessLineFilter;
                    setBusinessLineFilter(next);
                    setCategoryFilter('Tất cả gian hàng');
                    setPlatformFilter((prev) => {
                      if (prev === 'Tất cả danh mục' || next === 'Tất cả') return prev;
                      const row = mergedDanhMucFilterOptions.find((o) => o.key === prev);
                      return row?.line === next ? prev : 'Tất cả danh mục';
                    });
                  }}
                  className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 appearance-none focus:bg-white focus:border-blue-500 transition-all outline-none cursor-pointer"
                >
                  <option value="Tất cả">Tất cả</option>
                  <option value="Bán sản phẩm">Bán sản phẩm</option>
                  <option value="Dịch vụ">Dịch vụ</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={14}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5 flex-grow min-w-[280px]">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
              Tìm kiếm
            </label>
            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                size={16}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo tên hoặc ID..."
                className="w-full pl-11 pr-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 flex-grow min-w-[240px]">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
              gian hàng
            </label>
            <div className="flex items-center">
              <div className="relative flex-1">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700 appearance-none focus:bg-white focus:border-blue-500 transition-all outline-none cursor-pointer ${
                    showCreateGianHang && onCreateGianHang
                      ? 'rounded-l-xl border-r-0'
                      : 'rounded-xl'
                  }`}
                >
                  <option value="Tất cả gian hàng">Tất cả gian hàng</option>
                  {subOptions.map((sub) => (
                    <option key={sub.id} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={14}
                />
              </div>
              {showCreateGianHang && onCreateGianHang && (
                <button
                  type="button"
                  onClick={() => onCreateGianHang(activeDanhMucLine ?? undefined)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-r-xl text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap"
                >
                  <Plus size={16} />
                  Tạo gian hàng
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 flex-grow min-w-[240px]">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
              danh mục
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setIsPlatformFilterDropdownOpen(!isPlatformFilterDropdownOpen)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 flex items-center gap-2 focus:bg-white focus:border-blue-500 transition-all outline-none cursor-pointer text-left min-w-0"
                >
                  {platformFilter === 'Tất cả danh mục' ? (
                    <Globe size={16} className="text-slate-400 shrink-0" />
                  ) : (
                    (() => {
                      const platform = categories.find(
                        (c) => c.isParent && c.name === platformFilter
                      );
                      if (platform?.iconName && ICON_MAP[platform.iconName]) {
                        const I = ICON_MAP[platform.iconName];
                        return <I size={16} className="text-blue-500 shrink-0" />;
                      }
                      return <Folder size={16} className="text-indigo-500 shrink-0" />;
                    })()
                  )}
                  <span className="truncate min-w-0">{platformFilter}</span>
                  <ChevronDown
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform shrink-0 ${isPlatformFilterDropdownOpen ? 'rotate-180' : ''}`}
                    size={14}
                  />
                </button>

                <AnimatePresence>
                  {isPlatformFilterDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsPlatformFilterDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden py-2 max-h-80 overflow-y-auto"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setPlatformFilter('Tất cả danh mục');
                            setCategoryFilter('Tất cả gian hàng');
                            setIsPlatformFilterDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm font-bold flex items-center gap-3 transition-colors hover:bg-slate-50 ${platformFilter === 'Tất cả danh mục' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}
                        >
                          <Globe
                            size={16}
                            className={
                              platformFilter === 'Tất cả danh mục'
                                ? 'text-blue-500'
                                : 'text-slate-400'
                            }
                          />
                          Tất cả danh mục
                        </button>
                        {danhMucFilterOptionsForToolbar.map((row) => {
                          const platform = categories.find(
                            (c) => c.isParent && c.name === row.key
                          );
                          const Icon =
                            platform?.iconName && ICON_MAP[platform.iconName]
                              ? ICON_MAP[platform.iconName]
                              : Folder;
                          const active = platformFilter === row.key;
                          return (
                            <button
                              type="button"
                              key={`${row.line}-${row.key}-${row.kind}`}
                              onClick={() => {
                                setPlatformFilter(row.key);
                                setCategoryFilter('Tất cả gian hàng');
                                setIsPlatformFilterDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left text-sm font-bold flex items-center gap-2 transition-colors hover:bg-slate-50 ${active ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}
                            >
                              <Icon
                                size={16}
                                className={`shrink-0 ${active ? 'text-blue-500' : 'text-slate-400'}`}
                              />
                              <span className="truncate flex-1 min-w-0">{row.key}</span>
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md shrink-0 ${
                                  row.line === 'Bán sản phẩm'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-violet-100 text-violet-800'
                                }`}
                              >
                                {row.line === 'Bán sản phẩm' ? 'SP' : 'DV'}
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              {onCreatePlatform && (
                <button
                  type="button"
                  onClick={onCreatePlatform}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Plus size={16} />
                  Thêm
                </button>
              )}
            </div>
          </div>

          {onQuickCreateDemo && (
            <div className="relative shrink-0 sm:ml-auto z-30">
              <button
                ref={quickCreateBtnRef}
                type="button"
                onClick={() => {
                  setIsQuickCreateMenuOpen((open) => {
                    const next = !open;
                    if (next) {
                      requestAnimationFrame(() => updateQuickCreateMenuPos());
                    }
                    return next;
                  });
                }}
                title="Tạo nhanh gian demo — chọn Sản phẩm hoặc Dịch vụ (giá 1đ)"
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                  isQuickCreateMenuOpen
                    ? 'text-white bg-emerald-600 border-emerald-600'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200/80 hover:bg-emerald-100'
                }`}
              >
                <Zap size={12} />
                Tạo nhanh
                <ChevronDown
                  size={12}
                  className={`transition-transform ${isQuickCreateMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {typeof document !== 'undefined' &&
                isQuickCreateMenuOpen &&
                quickCreateMenuPos &&
                createPortal(
                  <div
                    ref={quickCreateMenuRef}
                    role="menu"
                    style={{
                      position: 'fixed',
                      top: quickCreateMenuPos.top,
                      left: quickCreateMenuPos.left,
                      width: quickCreateMenuPos.width,
                    }}
                    className="z-[9999] bg-white border border-slate-200 rounded-xl shadow-2xl py-1 overflow-hidden pointer-events-auto"
                  >
                    <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                      Chọn loại gian
                    </p>
                    <button
                      type="button"
                      role="menuitem"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => runQuickCreateDemo('Bán sản phẩm')}
                      className="w-full px-3 py-2.5 text-left text-[11px] font-semibold flex items-center gap-2 hover:bg-emerald-50 text-slate-700 transition-colors"
                    >
                      <Package size={14} className="text-emerald-600 shrink-0" />
                      <span>
                        Gian <span className="text-emerald-700">sản phẩm</span>
                        <span className="block text-[9px] font-medium text-slate-400 mt-0.5">
                          + kho demo · giá 1đ
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => runQuickCreateDemo('Dịch vụ')}
                      className="w-full px-3 py-2.5 text-left text-[11px] font-semibold flex items-center gap-2 hover:bg-violet-50 text-slate-700 transition-colors border-t border-slate-100"
                    >
                      <Zap size={14} className="text-violet-600 shrink-0" />
                      <span>
                        Gian <span className="text-violet-700">dịch vụ</span>
                        <span className="block text-[9px] font-medium text-slate-400 mt-0.5">
                          không kho · giá 1đ
                        </span>
                      </span>
                    </button>
                  </div>,
                  document.body
                )}
            </div>
          )}
        </div>
      </motion.div>

      <div className="space-y-4">
        {displayedGianHangList.map((category, idx) => {
          const prev = displayedGianHangList[idx - 1];
          const next = displayedGianHangList[idx + 1];
          const parentId = category.platformParentId;
          const canMoveUp =
            idx > 0 && Boolean(parentId) && prev?.platformParentId === parentId;
          const canMoveDown =
            idx < displayedGianHangList.length - 1 &&
            Boolean(parentId) &&
            next?.platformParentId === parentId;

          return (
            <motion.div
              id={`gian-hang-card-${category.id}`}
              key={category.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 0.4), duration: 0.35 }}
              className={
                highlightGianHangId === category.id
                  ? 'rounded-2xl ring-2 ring-emerald-500 ring-offset-2'
                  : undefined
              }
            >
              <CategorySection
                category={category}
                depth={0}
                onCreateSubCategory={onCreateSubCategory}
                onDeleteCategory={onDeleteCategory}
                onEditCategory={onEditCategory}
                onCreateProduct={onCreateProduct}
                onToggleProduct={onToggleProduct}
                onEditProduct={onEditProduct}
                onDeleteProduct={onDeleteProduct}
                onWarehouseProduct={onWarehouseProduct}
                onShowHistory={onShowHistory}
                onShowStats={onShowStats}
                onApproveCategory={onApproveCategory}
                onApproveProduct={onApproveProduct}
                onAdminCloseProduct={showConfigToolbar ? onAdminCloseProduct : undefined}
                onAdminSuspendProduct={showConfigToolbar ? onAdminSuspendProduct : undefined}
                onAdminReopenProduct={showConfigToolbar ? onAdminReopenProduct : undefined}
                onSwapProducts={onSwapProducts}
                productMoreMenuMode={productMoreMenuMode}
                platformParentId={parentId}
                canMoveGianHangUp={canMoveUp}
                canMoveGianHangDown={canMoveDown}
                onMoveGianHangUp={() => {
                  if (prev && parentId) onSwapGianHang?.(parentId, category.id, prev.id);
                }}
                onMoveGianHangDown={() => {
                  if (next && parentId) onSwapGianHang?.(parentId, category.id, next.id);
                }}
                activeTab={activeTab}
                searchQuery={searchQuery}
                platformIconName={category.platformIconName}
                parentBusinessLine={
                  category.businessLine === 'Dịch vụ' ? 'Dịch vụ' : 'Bán sản phẩm'
                }
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
