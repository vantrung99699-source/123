import { ChevronRight } from 'lucide-react';
import { STOREFRONT_TOOLS, type StorefrontToolId } from '../storefront/storefrontTools';

export interface StorefrontHeaderNavToolsDropdownProps {
  menuTitle: string;
  activeToolId?: StorefrontToolId | null;
  onSelectTool: (id: StorefrontToolId) => void;
}

export function StorefrontHeaderNavToolsDropdown({
  menuTitle,
  activeToolId,
  onSelectTool,
}: StorefrontHeaderNavToolsDropdownProps) {
  return (
    <div
      role="menu"
      className="header-nav-menu-panel absolute left-0 top-full mt-2.5 w-[min(calc(100vw-2rem),280px)] rounded-2xl border border-white/20 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5 overflow-hidden z-[70]"
    >
      <div className="px-4 py-3 bg-gradient-to-r from-cyan-600 to-sky-600">
        <p className="text-[13px] font-bold text-white">{menuTitle}</p>
        <p className="text-[11px] text-white/85 mt-0.5">Tiện ích hỗ trợ MMO trên TapHoaMMO</p>
      </div>
      <div className="py-1.5">
        {STOREFRONT_TOOLS.map(tool => {
          const Icon = tool.icon;
          const active = activeToolId === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              role="menuitem"
              onClick={() => onSelectTool(tool.id)}
              className={`mx-1.5 flex w-[calc(100%-0.75rem)] items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors ${
                active
                  ? 'bg-cyan-50 text-cyan-900 font-semibold ring-1 ring-cyan-500/25'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700"
                aria-hidden
              >
                <Icon size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{tool.label}</span>
                <span className="block truncate text-[11px] font-normal text-slate-500 mt-0.5">
                  {tool.description}
                </span>
              </span>
              <ChevronRight size={14} className="shrink-0 text-slate-300" aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}
