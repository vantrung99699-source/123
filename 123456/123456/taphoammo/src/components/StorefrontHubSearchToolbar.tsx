import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  ChevronDown,
  Clock,
  LayoutGrid,
  Check,
  Layers,
} from 'lucide-react';
import { uniqueCustomerProductTypeLabels } from '../storefront/storefrontProductTypeLabel';

const SHOP_HUB_CATEGORY_OPTIONS = [
  'Tất cả danh mục',
  'Người bán',
  'Tài khoản',
  'Gmail',
  'Phần mềm',
  'Thẻ nạp',
  'Tăng tương tác',
  'Dịch vụ phần mềm',
  'Dịch vụ khác',
] as const;

export type ShopHubSearchParams = {
  category: string | null;
  productTypes: string[];
  sortLabel: string;
  query: string;
};

function resolveHubCategoryKey(
  label: string,
  productTypesByCategory: Record<string, string[]>,
  serviceTypesByCategory: Record<string, string[]>
): string | null {
  if (!label || label === 'Tất cả danh mục' || label === 'Người bán') return null;
  for (const map of [productTypesByCategory, serviceTypesByCategory]) {
    if (map[label]?.length) return label;
    const found = Object.keys(map).find(k => k.toLowerCase() === label.toLowerCase());
    if (found) return found;
  }
  return null;
}

function useShopHubPortalDropdown() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listId = useRef(`shop-hub-dd-${Math.random().toString(36).slice(2)}`).current;
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el || typeof window === 'undefined') return;
    const r = el.getBoundingClientRect();
    const pad = 8;
    const minW = 220;
    const w = Math.max(r.width, minW);
    let left = r.left;
    if (left + w > window.innerWidth - pad) left = Math.max(pad, window.innerWidth - pad - w);
    if (left < pad) left = pad;
    setPanelStyle({
      position: 'fixed',
      top: r.bottom + 6,
      left,
      width: w,
      zIndex: 80,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    setOpen(v => !v);
    queueMicrotask(() => updatePosition());
  };

  return { open, setOpen, triggerRef, panelRef, listId, panelStyle, toggle, updatePosition };
}

function ShopHubCategoryDropdown({
  selectedIdx,
  onSelectIdx,
}: {
  selectedIdx: number;
  onSelectIdx: (idx: number) => void;
}) {
  const { open, setOpen, triggerRef, panelRef, listId, panelStyle, toggle } = useShopHubPortalDropdown();
  const selectedLabel = SHOP_HUB_CATEGORY_OPTIONS[selectedIdx];

  const panel =
    open &&
    createPortal(
      <div
        ref={panelRef}
        id={listId}
        role="listbox"
        aria-labelledby="shop-hub-category-trigger"
        className="max-h-[min(18rem,calc(100vh-6rem))] overflow-y-auto rounded-xl border border-slate-200/90 bg-white py-1 shadow-[0_16px_40px_-8px_rgba(15,23,42,0.18),0_0_0_1px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.03] backdrop-blur-sm"
        style={panelStyle}
      >
        {SHOP_HUB_CATEGORY_OPTIONS.map((label, i) => {
          const active = i === selectedIdx;
          return (
            <button
              key={label}
              type="button"
              role="option"
              aria-selected={active}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] transition-colors sm:py-2 sm:text-xs ${
                active
                  ? 'bg-emerald-50/95 font-semibold text-emerald-900'
                  : 'font-medium text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => {
                onSelectIdx(i);
                setOpen(false);
              }}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {active ? <Check size={14} className="text-emerald-600" strokeWidth={2.5} aria-hidden /> : null}
              </span>
              <span className="min-w-0 flex-1 leading-snug">{label}</span>
            </button>
          );
        })}
      </div>,
      document.body
    );

  return (
    <div className="relative min-w-0 sm:flex sm:min-w-[12rem] sm:items-stretch">
      <button
        ref={triggerRef}
        type="button"
        id="shop-hub-category-trigger"
        aria-label="Danh mục tìm kiếm"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={toggle}
        className="flex h-full w-full min-w-0 items-center gap-2 rounded-xl bg-slate-50/60 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-100/80 sm:rounded-none sm:bg-transparent sm:px-4 sm:py-2 border-b-2 border-slate-200 sm:border-0 sm:border-l-2 sm:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/35"
      >
        <LayoutGrid size={16} className="hidden shrink-0 text-emerald-600/80 sm:block" strokeWidth={2} aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-800 sm:text-xs">{selectedLabel}</span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {panel}
    </div>
  );
}

const SHOP_HUB_SORT_OPTIONS = [
  'Mới nhất',
  'Phổ biến',
  'Giá tăng dần',
  'Giá giảm dần',
] as const;

function ShopHubProductTypeDropdown({
  typeOptions,
  selectedTypes,
  onToggleType,
  onClearTypes,
  disabled,
}: {
  typeOptions: string[];
  selectedTypes: string[];
  onToggleType: (type: string) => void;
  onClearTypes: () => void;
  disabled?: boolean;
}) {
  const { open, setOpen, triggerRef, panelRef, listId, panelStyle, toggle } = useShopHubPortalDropdown();

  const triggerLabel =
    selectedTypes.length === 0
      ? 'Tất cả loại'
      : selectedTypes.length === 1
        ? selectedTypes[0]
        : `${selectedTypes.length} loại đã chọn`;

  const panel =
    open &&
    !disabled &&
    createPortal(
      <div
        ref={panelRef}
        id={listId}
        role="listbox"
        aria-labelledby="shop-hub-type-trigger"
        className="max-h-[min(20rem,calc(100vh-6rem))] overflow-y-auto rounded-xl border border-slate-200/90 bg-white py-1 shadow-[0_16px_40px_-8px_rgba(15,23,42,0.18),0_0_0_1px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.03] backdrop-blur-sm"
        style={panelStyle}
      >
        <button
          type="button"
          className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] transition-colors sm:py-2 sm:text-xs ${
            selectedTypes.length === 0
              ? 'bg-emerald-50/95 font-semibold text-emerald-900'
              : 'font-medium text-slate-700 hover:bg-slate-50'
          }`}
          onClick={() => {
            onClearTypes();
            setOpen(false);
          }}
        >
          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
            {selectedTypes.length === 0 ? (
              <Check size={14} className="text-emerald-600" strokeWidth={2.5} aria-hidden />
            ) : null}
          </span>
          <span className="min-w-0 flex-1 leading-snug">Tất cả loại sản phẩm</span>
        </button>
        {typeOptions.map(type => {
          const active = selectedTypes.includes(type);
          return (
            <button
              key={type}
              type="button"
              role="option"
              aria-selected={active}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] transition-colors sm:py-2 sm:text-xs ${
                active
                  ? 'bg-emerald-50/95 font-semibold text-emerald-900'
                  : 'font-medium text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => onToggleType(type)}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {active ? <Check size={14} className="text-emerald-600" strokeWidth={2.5} aria-hidden /> : null}
              </span>
              <span className="min-w-0 flex-1 leading-snug">{type}</span>
            </button>
          );
        })}
      </div>,
      document.body
    );

  return (
    <div className="relative min-w-0 sm:flex sm:min-w-[10rem] sm:items-stretch">
      <button
        ref={triggerRef}
        type="button"
        id="shop-hub-type-trigger"
        aria-label="Loại sản phẩm"
        aria-haspopup="listbox"
        aria-expanded={open && !disabled}
        aria-controls={open && !disabled ? listId : undefined}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          toggle();
        }}
        className="flex h-full w-full min-w-0 items-center gap-2 rounded-xl bg-slate-50/60 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-100/80 sm:rounded-none sm:bg-transparent sm:px-4 sm:py-2 border-b-2 border-slate-200 sm:border-0 sm:border-l-2 sm:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/35 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Layers size={16} className="hidden shrink-0 text-emerald-600/80 sm:block" strokeWidth={2} aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-800 sm:text-xs">{triggerLabel}</span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {panel}
    </div>
  );
}

function ShopHubSortDropdown({
  selectedIdx,
  onSelectIdx,
}: {
  selectedIdx: number;
  onSelectIdx: (idx: number) => void;
}) {
  const { open, setOpen, triggerRef, panelRef, listId, panelStyle, toggle } = useShopHubPortalDropdown();

  const selectedLabel = SHOP_HUB_SORT_OPTIONS[selectedIdx];

  const panel =
    open &&
    createPortal(
      <div
        ref={panelRef}
        id={listId}
        role="listbox"
        aria-labelledby="shop-hub-sort-trigger"
        className="max-h-[min(14rem,calc(100vh-6rem))] overflow-y-auto rounded-xl border border-slate-200/90 bg-white py-1 shadow-[0_16px_40px_-8px_rgba(15,23,42,0.18),0_0_0_1px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.03] backdrop-blur-sm"
        style={panelStyle}
      >
        {SHOP_HUB_SORT_OPTIONS.map((label, i) => {
          const active = i === selectedIdx;
          return (
            <button
              key={label}
              type="button"
              role="option"
              aria-selected={active}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] transition-colors sm:py-2 sm:text-xs ${
                active
                  ? 'bg-emerald-50/95 font-semibold text-emerald-900'
                  : 'font-medium text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => {
                onSelectIdx(i);
                setOpen(false);
              }}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {active ? <Check size={14} className="text-emerald-600" strokeWidth={2.5} aria-hidden /> : null}
              </span>
              <span className="min-w-0 flex-1 leading-snug">{label}</span>
            </button>
          );
        })}
      </div>,
      document.body
    );

  return (
    <div className="relative min-w-0 sm:flex sm:min-w-[8.5rem] sm:items-stretch">
      <button
        ref={triggerRef}
        type="button"
        id="shop-hub-sort-trigger"
        aria-label="Sắp xếp"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={toggle}
        className="flex h-full w-full min-w-0 items-center gap-2 rounded-xl bg-slate-50/60 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-100/80 sm:rounded-none sm:bg-transparent sm:px-4 sm:py-2 border-b-2 border-slate-200 sm:border-0 sm:border-l-2 sm:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/35"
      >
        <Clock size={16} className="hidden shrink-0 text-emerald-600/70 sm:block" strokeWidth={2} aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-800 sm:text-xs">{selectedLabel}</span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {panel}
    </div>
  );
}

export function ShopHubSearchToolbar({
  productTypesByCategory,
  serviceTypesByCategory,
  onSearch,
}: {
  productTypesByCategory: Record<string, string[]>;
  serviceTypesByCategory: Record<string, string[]>;
  onSearch: (params: ShopHubSearchParams) => void;
}) {
  const [query, setQuery] = useState('');
  const [categoryIdx, setCategoryIdx] = useState(0);
  const [sortIdx, setSortIdx] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const categoryLabel = SHOP_HUB_CATEGORY_OPTIONS[categoryIdx];
  const categoryKey = resolveHubCategoryKey(
    categoryLabel,
    productTypesByCategory,
    serviceTypesByCategory
  );

  const typeOptions = categoryKey
    ? uniqueCustomerProductTypeLabels([
        ...(productTypesByCategory[categoryKey] ?? []),
        ...(serviceTypesByCategory[categoryKey] ?? []),
      ])
    : [];

  useEffect(() => {
    setSelectedTypes([]);
  }, [categoryKey]);

  const handleSearch = () => {
    onSearch({
      category: categoryKey,
      productTypes: selectedTypes,
      sortLabel: SHOP_HUB_SORT_OPTIONS[sortIdx],
      query: query.trim(),
    });
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2.5">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-50/80 sm:min-h-[3rem] sm:flex-row sm:rounded-2xl">
        <div className="group flex flex-1 items-center gap-2.5 min-w-0 px-3.5 py-2.5 sm:gap-3 sm:pl-4 sm:pr-3 sm:py-2 border-b-2 border-slate-200 transition-colors focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] sm:border-b-0 sm:focus-within:bg-transparent sm:focus-within:shadow-none">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm ring-1 ring-slate-100 sm:h-9 sm:w-9 sm:rounded-xl">
            <Search size={18} strokeWidth={2.25} aria-hidden />
          </span>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSearch();
            }}
            placeholder="Tìm sản phẩm bạn cần..."
            className="w-full min-w-0 border-none bg-transparent py-0.5 text-[15px] text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm"
          />
        </div>

        <ShopHubCategoryDropdown selectedIdx={categoryIdx} onSelectIdx={setCategoryIdx} />

        <ShopHubProductTypeDropdown
          typeOptions={typeOptions}
          selectedTypes={selectedTypes}
          onToggleType={type =>
            setSelectedTypes(prev =>
              prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
            )
          }
          onClearTypes={() => setSelectedTypes([])}
          disabled={!categoryKey || typeOptions.length === 0}
        />

        <ShopHubSortDropdown selectedIdx={sortIdx} onSelectIdx={setSortIdx} />
      </div>

      <button
        type="button"
        onClick={handleSearch}
        className="flex shrink-0 items-center justify-center rounded-xl border-2 border-emerald-600/80 bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/25 transition hover:brightness-[1.05] active:scale-[0.98] sm:rounded-2xl sm:px-7 sm:py-0 sm:min-h-[3rem]"
      >
        Tìm kiếm
      </button>
    </div>
  );
}
