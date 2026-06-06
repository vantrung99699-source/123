import { CheckCircle2, ChevronRight, Package, Store } from 'lucide-react';

export interface StorefrontHeaderNavCategoryDropdownProps {
  categories: { name: string }[];
  selectedCategories: string[];
  emptyLabel: string;
  menuTitle: string;
  variant: 'product' | 'service';
  onSelectCategory: (name: string) => void;
}

export function StorefrontHeaderNavCategoryDropdown({
  categories,
  selectedCategories,
  emptyLabel,
  menuTitle,
  variant,
  onSelectCategory,
}: StorefrontHeaderNavCategoryDropdownProps) {
  const isProduct = variant === 'product';
  return (
    <div
      role="menu"
      className="header-nav-menu-panel absolute left-0 top-full mt-2.5 w-[min(calc(100vw-2rem),300px)] rounded-2xl border border-white/20 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5 overflow-hidden z-[70]"
    >
      <div
        className={`px-4 py-3 ${
          isProduct
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
            : 'bg-gradient-to-r from-violet-600 to-indigo-600'
        }`}
      >
        <p className="text-[13px] font-bold text-white">{menuTitle}</p>
        <p className="text-[11px] text-white/85 mt-0.5">Chọn danh mục để mở catalog</p>
      </div>
      <div className="max-h-[min(340px,52vh)] overflow-y-auto overscroll-contain py-1.5">
        {categories.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-slate-500">{emptyLabel}</p>
        ) : (
          categories.map(cat => {
            const active = selectedCategories.includes(cat.name);
            return (
              <button
                key={cat.name}
                type="button"
                role="menuitem"
                onClick={() => onSelectCategory(cat.name)}
                className={`mx-1.5 flex w-[calc(100%-0.75rem)] items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors ${
                  active
                    ? isProduct
                      ? 'bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500/25'
                      : 'bg-violet-50 text-violet-900 font-semibold ring-1 ring-violet-500/25'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isProduct ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'
                  }`}
                  aria-hidden
                >
                  {isProduct ? <Package size={15} /> : <Store size={15} />}
                </span>
                <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                {active ? (
                  <CheckCircle2
                    size={16}
                    className={isProduct ? 'shrink-0 text-emerald-600' : 'shrink-0 text-violet-600'}
                    aria-hidden
                  />
                ) : (
                  <ChevronRight size={14} className="shrink-0 text-slate-300" aria-hidden />
                )}
              </button>
            );
          })
        )}
      </div>
      {categories.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/90 px-4 py-2.5">
          <p className="text-[10px] font-semibold text-slate-500 text-center tabular-nums">
            {categories.length.toLocaleString('vi-VN')} danh mục
          </p>
        </div>
      )}
    </div>
  );
}
