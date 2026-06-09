import { Filter, KeyRound, Radio, UserSearch } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type StorefrontToolId = 'check-live-fb' | '2fa' | 'cut-filter-merge' | 'get-uid-fb';

export type StorefrontToolPageId =
  | 'tools-check-live-fb'
  | 'tools-2fa'
  | 'tools-cut-filter-merge'
  | 'tools-get-uid-fb';

export interface StorefrontToolItem {
  id: StorefrontToolId;
  pageId: StorefrontToolPageId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const STOREFRONT_TOOLS: StorefrontToolItem[] = [
  {
    id: 'check-live-fb',
    pageId: 'tools-check-live-fb',
    label: 'Check live FB',
    description: 'Kiểm tra UID Facebook còn hoạt động hay đã die.',
    icon: Radio,
  },
  {
    id: '2fa',
    pageId: 'tools-2fa',
    label: '2FA',
    description: 'Sinh mã xác thực 6 số từ secret key TOTP.',
    icon: KeyRound,
  },
  {
    id: 'cut-filter-merge',
    pageId: 'tools-cut-filter-merge',
    label: 'Cắt lọc ghép',
    description: 'Tách, lọc trùng và ghép danh sách dòng nhanh.',
    icon: Filter,
  },
  {
    id: 'get-uid-fb',
    pageId: 'tools-get-uid-fb',
    label: 'Get uid FB',
    description: 'Trích UID từ link hoặc chuỗi Facebook.',
    icon: UserSearch,
  },
];

export function findStorefrontTool(id: StorefrontToolId): StorefrontToolItem {
  return STOREFRONT_TOOLS.find(t => t.id === id) ?? STOREFRONT_TOOLS[0];
}

export function findStorefrontToolByPage(pageId: StorefrontToolPageId): StorefrontToolItem {
  return STOREFRONT_TOOLS.find(t => t.pageId === pageId) ?? STOREFRONT_TOOLS[0];
}

export function toolIdToStorefrontPage(toolId: StorefrontToolId): StorefrontToolPageId {
  return findStorefrontTool(toolId).pageId;
}

export function storefrontPageToToolId(pageId: string): StorefrontToolId | null {
  const tool = STOREFRONT_TOOLS.find(t => t.pageId === pageId);
  return tool?.id ?? null;
}

export function isStorefrontToolPage(pageId: string): pageId is StorefrontToolPageId {
  return STOREFRONT_TOOLS.some(t => t.pageId === pageId);
}
