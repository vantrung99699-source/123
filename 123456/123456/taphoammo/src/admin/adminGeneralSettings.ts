/**
 * Cài đặt chung hệ thống — giới hạn gian hàng, mặt hàng, khiếu nại.
 */
export type ComplaintLimitScope = 'gian_hang' | 'mat_hang';

export type ComplaintLimitExceededAction = 'notify_admin' | 'suspend_gian' | 'notify_and_suspend';

/** Điều kiện bổ sung cho khiếu nại / tranh chấp (có thể thêm nhiều). */
export type ComplaintExtraRuleKind =
  | 'max_in_days'
  | 'max_dispute_status'
  | 'max_complaint_status'
  | 'notify_each_complaint';

export interface ComplaintExtraRule {
  id: string;
  kind: ComplaintExtraRuleKind;
  enabled: boolean;
  /** Để trống = dùng phạm vi mặc định của cài đặt chính. */
  scope?: ComplaintLimitScope;
  maxCount?: number;
  windowDays?: number;
  onExceeded?: ComplaintLimitExceededAction;
  note?: string;
}

export interface AdminGeneralSettings {
  /** Số gian hàng tối đa mỗi người bán được tạo. */
  maxGianHangPerSeller: number;
  /** Số mặt hàng tối đa trong một gian hàng. */
  maxProductsPerGianHang: number;
  /** Số khiếu nại / tranh chấp tối đa (theo phạm vi bên dưới). */
  maxComplaintsPerScope: number;
  complaintScope: ComplaintLimitScope;
  onComplaintLimitExceeded: ComplaintLimitExceededAction;
  complaintExtraRules: ComplaintExtraRule[];
}

const STORAGE_KEY = 'taphoammo_admin_general_settings_v1';

export const SETTING_NUMBER_MIN = 1;
export const SETTING_GIAN_HANG_MAX = 500;
export const SETTING_PRODUCT_MAX = 10_000;
export const SETTING_COMPLAINT_MAX = 500;

export function clampSettingNumber(
  value: number,
  min = SETTING_NUMBER_MIN,
  max = SETTING_GIAN_HANG_MAX
): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function isExceededAction(v: unknown): v is ComplaintLimitExceededAction {
  return v === 'notify_admin' || v === 'suspend_gian' || v === 'notify_and_suspend';
}

function isExtraRuleKind(v: unknown): v is ComplaintExtraRuleKind {
  return (
    v === 'max_in_days' ||
    v === 'max_dispute_status' ||
    v === 'max_complaint_status' ||
    v === 'notify_each_complaint'
  );
}

function normalizeExtraRule(raw: unknown, fallback: ComplaintExtraRule): ComplaintExtraRule {
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Partial<ComplaintExtraRule>;
  const kind = isExtraRuleKind(r.kind) ? r.kind : fallback.kind;
  return {
    id: typeof r.id === 'string' && r.id.trim() ? r.id : fallback.id,
    kind,
    enabled: r.enabled !== false,
    scope: r.scope === 'mat_hang' ? 'mat_hang' : r.scope === 'gian_hang' ? 'gian_hang' : undefined,
    maxCount:
      kind === 'notify_each_complaint'
        ? undefined
        : clampSettingNumber(Number(r.maxCount) || fallback.maxCount || 5, 1, SETTING_COMPLAINT_MAX),
    windowDays:
      kind === 'max_in_days'
        ? clampSettingNumber(Number(r.windowDays) || fallback.windowDays || 30, 1, 365)
        : undefined,
    onExceeded: isExceededAction(r.onExceeded) ? r.onExceeded : fallback.onExceeded,
    note: typeof r.note === 'string' ? r.note : undefined,
  };
}

function normalizeExtraRules(raw: unknown): ComplaintExtraRule[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) =>
    normalizeExtraRule(item, {
      id: `rule-${i}`,
      kind: 'max_in_days',
      enabled: true,
      maxCount: 3,
      windowDays: 30,
      onExceeded: 'notify_admin',
    })
  );
}

export function complaintExtraRuleKindLabel(kind: ComplaintExtraRuleKind): string {
  if (kind === 'max_in_days') return 'Giới hạn trong X ngày';
  if (kind === 'max_dispute_status') return 'Tối đa đơn đang Tranh chấp';
  if (kind === 'max_complaint_status') return 'Tối đa đơn đang Khiếu nại';
  return 'Thông báo admin mỗi khiếu nại mới';
}

export function complaintExtraRuleKindHint(kind: ComplaintExtraRuleKind): string {
  if (kind === 'max_in_days') {
    return 'Đếm đơn khiếu nại/tranh chấp trong phạm vi trong khoảng thời gian (theo ngày mua / tạo đơn).';
  }
  if (kind === 'max_dispute_status') {
    return 'Chỉ đếm đơn có trạng thái «Tranh chấp» trong cùng phạm vi.';
  }
  if (kind === 'max_complaint_status') {
    return 'Chỉ đếm đơn có trạng thái «Khiếu nại» trong cùng phạm vi.';
  }
  return 'Vẫn cho gửi khiếu nại; mỗi lần gửi thành công sẽ báo admin.';
}

export function createComplaintExtraRule(kind: ComplaintExtraRuleKind): ComplaintExtraRule {
  const id = `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  if (kind === 'max_in_days') {
    return {
      id,
      kind,
      enabled: true,
      maxCount: 3,
      windowDays: 30,
      onExceeded: 'notify_admin',
    };
  }
  if (kind === 'notify_each_complaint') {
    return { id, kind, enabled: true };
  }
  return {
    id,
    kind,
    enabled: true,
    maxCount: 2,
    onExceeded: 'notify_and_suspend',
  };
}

export const COMPLAINT_EXTRA_RULE_KINDS: ComplaintExtraRuleKind[] = [
  'max_in_days',
  'max_dispute_status',
  'max_complaint_status',
  'notify_each_complaint',
];

export function defaultAdminGeneralSettings(): AdminGeneralSettings {
  return {
    maxGianHangPerSeller: 10,
    maxProductsPerGianHang: 50,
    maxComplaintsPerScope: 5,
    complaintScope: 'gian_hang',
    onComplaintLimitExceeded: 'notify_and_suspend',
    complaintExtraRules: [],
  };
}

export function normalizeAdminGeneralSettings(raw: unknown): AdminGeneralSettings {
  const def = defaultAdminGeneralSettings();
  if (!raw || typeof raw !== 'object') return def;
  const s = raw as Partial<AdminGeneralSettings>;
  return {
    maxGianHangPerSeller: clampSettingNumber(
      Number(s.maxGianHangPerSeller) || def.maxGianHangPerSeller,
      SETTING_NUMBER_MIN,
      SETTING_GIAN_HANG_MAX
    ),
    maxProductsPerGianHang: clampSettingNumber(
      Number(s.maxProductsPerGianHang) || def.maxProductsPerGianHang,
      SETTING_NUMBER_MIN,
      SETTING_PRODUCT_MAX
    ),
    maxComplaintsPerScope: clampSettingNumber(
      Number(s.maxComplaintsPerScope) || def.maxComplaintsPerScope,
      SETTING_NUMBER_MIN,
      SETTING_COMPLAINT_MAX
    ),
    complaintScope: s.complaintScope === 'mat_hang' ? 'mat_hang' : 'gian_hang',
    onComplaintLimitExceeded: isExceededAction(s.onComplaintLimitExceeded)
      ? s.onComplaintLimitExceeded
      : def.onComplaintLimitExceeded,
    complaintExtraRules: normalizeExtraRules(s.complaintExtraRules),
  };
}

export function readAdminGeneralSettings(): AdminGeneralSettings {
  if (typeof window === 'undefined') return defaultAdminGeneralSettings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAdminGeneralSettings();
    return normalizeAdminGeneralSettings(JSON.parse(raw) as unknown);
  } catch {
    return defaultAdminGeneralSettings();
  }
}

export function writeAdminGeneralSettings(settings: AdminGeneralSettings): void {
  if (typeof window === 'undefined') return;
  const normalized = normalizeAdminGeneralSettings(settings);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    /* ignore */
  }
}

export function complaintScopeLabel(scope: ComplaintLimitScope): string {
  return scope === 'gian_hang' ? 'Theo gian hàng' : 'Theo mặt hàng';
}

export function complaintActionLabel(action: ComplaintLimitExceededAction): string {
  if (action === 'notify_admin') return 'Chỉ thông báo admin';
  if (action === 'suspend_gian') return 'Chỉ tạm dừng gian hàng';
  return 'Thông báo admin + tạm dừng gian hàng';
}
