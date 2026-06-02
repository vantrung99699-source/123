/**
 * Gian hàng Top 1 — lượt đẩy, xếp hạng 3 ngày, tag Tài trợ trên storefront.
 * Xếp hạng theo **danh mục** (classification.category / platform): mỗi danh mục có Top 1 & Tài trợ riêng.
 */
export type BoostRank = 'Top 1' | 'Top 2' | 'Top 3' | number;

/** Khóa danh mục dùng chung admin + storefront (vd. tài khoản, Tăng tương tác, Gmail). */
export function getGianHangBoostCategoryKey(cat: {
  classification?: { category?: string; businessType?: string };
  platform?: string;
}): string {
  return (
    cat.classification?.category?.trim() ||
    cat.platform?.trim() ||
    cat.classification?.businessType?.trim() ||
    'Khác'
  );
}

export interface CategoryTop1Resolution {
  top1ByCategory: Map<string, string | null>;
  sponsoredIds: Set<string>;
  gianHangIdToCategoryKey: Map<string, string>;
}

export function resolveCategoryTop1FromLeaves(
  leaves: Array<{
    id: string;
    classification?: { category?: string; businessType?: string };
    platform?: string;
  }>,
  state: GianHangTop1State,
  now = Date.now()
): CategoryTop1Resolution {
  const byCategory = new Map<string, string[]>();
  const gianHangIdToCategoryKey = new Map<string, string>();

  for (const leaf of leaves) {
    const key = getGianHangBoostCategoryKey(leaf);
    gianHangIdToCategoryKey.set(leaf.id, key);
    const list = byCategory.get(key) ?? [];
    list.push(leaf.id);
    byCategory.set(key, list);
  }

  const top1ByCategory = new Map<string, string | null>();
  const sponsoredIds = new Set<string>();

  for (const [key, ids] of byCategory) {
    const top1 = getTop1GianHangId(ids, state, now);
    top1ByCategory.set(key, top1);
    if (top1 && isGianHangSponsored(top1, state, ids, now)) {
      sponsoredIds.add(top1);
    }
  }

  return { top1ByCategory, sponsoredIds, gianHangIdToCategoryKey };
}

export const DEFAULT_AUTO_BOOST_DAILY_COUNT = 24;
export const DEFAULT_AUTO_BOOST_RUN_HOUR = 8;
export const DEFAULT_AUTO_PAUSE_AT_TOP1 = true;

export const DEFAULT_KEEP_TOP_MIN_DAILY = 15;
export const DEFAULT_KEEP_TOP_MAX_SPEND_VND = 1_200_000;
export const DEFAULT_KEEP_TOP_REACT_WHEN_LOST = true;

export interface GianHangBoostRecord {
  gianHangId: string;
  /** Lượt đẩy trong ngày (reset theo ngày lịch). */
  boostsToday: number;
  /** Mốc thời gian từng lần đẩy (ms) — dùng tính tổng 3 ngày. */
  boostEvents: number[];
  lastBoostDay?: string;
  isAutoBoostEnabled?: boolean;
  /** Số lượt auto đẩy mỗi ngày (khi bật Auto đẩy). */
  autoBoostDailyCount?: number;
  /** Giờ chạy auto đẩy (0–23). */
  autoBoostRunHour?: number;
  /** Tạm dừng auto khi gian đang Top 1. */
  autoBoostPauseAtTop1?: boolean;
  isKeepTopEnabled?: boolean;
  /** Lượt đẩy tối thiểu/ngày khi bật Giữ Top 1. */
  keepTopMinDailyBoosts?: number;
  /** Trần chi tiêu đẩy top/ngày (VND). */
  keepTopMaxSpendVnd?: number;
  /** Tự đẩy thêm khi bị gian khác vượt mất Top 1. */
  keepTopReactWhenLost?: boolean;
}

export type GianHangBoostSettingsPatch = Partial<
  Pick<
    GianHangBoostRecord,
    | 'isAutoBoostEnabled'
    | 'autoBoostDailyCount'
    | 'autoBoostRunHour'
    | 'autoBoostPauseAtTop1'
    | 'isKeepTopEnabled'
    | 'keepTopMinDailyBoosts'
    | 'keepTopMaxSpendVnd'
    | 'keepTopReactWhenLost'
  >
>;

export function resolveAutoBoostSettings(rec?: GianHangBoostRecord) {
  return {
    enabled: Boolean(rec?.isAutoBoostEnabled),
    dailyCount: clampBoostCount(rec?.autoBoostDailyCount ?? DEFAULT_AUTO_BOOST_DAILY_COUNT),
    runHour: clampRunHour(rec?.autoBoostRunHour ?? DEFAULT_AUTO_BOOST_RUN_HOUR),
    pauseAtTop1: rec?.autoBoostPauseAtTop1 ?? DEFAULT_AUTO_PAUSE_AT_TOP1,
  };
}

export function resolveKeepTopSettings(rec?: GianHangBoostRecord) {
  return {
    enabled: Boolean(rec?.isKeepTopEnabled),
    minDailyBoosts: clampBoostCount(rec?.keepTopMinDailyBoosts ?? DEFAULT_KEEP_TOP_MIN_DAILY),
    maxSpendVnd: Math.max(
      0,
      Math.min(50_000_000, rec?.keepTopMaxSpendVnd ?? DEFAULT_KEEP_TOP_MAX_SPEND_VND)
    ),
    reactWhenLost: rec?.keepTopReactWhenLost ?? DEFAULT_KEEP_TOP_REACT_WHEN_LOST,
  };
}

function clampBoostCount(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(500, Math.round(n)));
}

function clampRunHour(h: number): number {
  if (!Number.isFinite(h)) return DEFAULT_AUTO_BOOST_RUN_HOUR;
  return Math.max(0, Math.min(23, Math.round(h)));
}

export interface GianHangTop1State {
  records: Record<string, GianHangBoostRecord>;
}

const STORAGE_KEY = 'taphoammo_gian_hang_top1_v1';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const CALENDAR_DAY_MS = 24 * 60 * 60 * 1000;

function todayKey(d = new Date()): string {
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function startOfCalendarDayMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function countBoostsOnCalendarDay(record: GianHangBoostRecord, day: Date): number {
  const start = startOfCalendarDayMs(day);
  const end = start + CALENDAR_DAY_MS;
  return (record.boostEvents ?? []).filter((t) => t >= start && t < end).length;
}

/** Tổng lượt đẩy trong 3 ngày lịch liên tiếp (hôm nay + 2 ngày trước). */
export function getBoostsIn3ConsecutiveCalendarDays(
  record?: GianHangBoostRecord,
  now = Date.now()
): number {
  if (!record?.boostEvents?.length) return 0;
  const base = new Date(now);
  let total = 0;
  for (let i = 0; i < 3; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    total += countBoostsOnCalendarDay(record, d);
  }
  return total;
}

function pruneBoostEvents(events: number[], now = Date.now()): number[] {
  const cutoff = now - THIRTY_DAYS_MS;
  return events.filter((t) => t >= cutoff);
}

/** Đếm lượt đẩy trong N ngày gần nhất (theo mốc thời gian từng lần đẩy). */
export function countBoostEventsInWindow(
  record?: GianHangBoostRecord,
  windowMs = THIRTY_DAYS_MS,
  now = Date.now()
): number {
  if (!record?.boostEvents?.length) return 0;
  const since = now - windowMs;
  return record.boostEvents.filter((t) => t >= since && t <= now).length;
}

/** Tổng lượt đẩy trong 30 ngày gần nhất — dùng báo cáo admin panel. */
export function getBoostsInLast30Days(record?: GianHangBoostRecord, now = Date.now()): number {
  return countBoostEventsInWindow(record, THIRTY_DAYS_MS, now);
}

export function readGianHangTop1State(): GianHangTop1State {
  if (typeof window === 'undefined') return { records: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { records: {} };
    const parsed = JSON.parse(raw) as GianHangTop1State;
    if (!parsed?.records || typeof parsed.records !== 'object') return { records: {} };
    return parsed;
  } catch {
    return { records: {} };
  }
}

export function writeGianHangTop1State(state: GianHangTop1State): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/** Alias — dùng 3 ngày lịch liên tiếp (không còn cửa sổ 72h trượt). */
export function getBoostsInLast3Days(record?: GianHangBoostRecord, now = Date.now()): number {
  return getBoostsIn3ConsecutiveCalendarDays(record, now);
}

export function scoreGianHangForBoostRanking(
  gianHangId: string,
  state: GianHangTop1State,
  now = Date.now()
): number {
  return getBoostsIn3ConsecutiveCalendarDays(state.records[gianHangId], now);
}

/** Thời điểm lượt đẩy mới nhất trong 3 ngày lịch liên tiếp (tie-break: đẩy sau hơn thắng). */
export function getLastBoostTimeIn3ConsecutiveCalendarDays(
  record?: GianHangBoostRecord,
  now = Date.now()
): number {
  if (!record?.boostEvents?.length) return 0;
  const base = new Date(now);
  let last = 0;
  for (let i = 0; i < 3; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const start = startOfCalendarDayMs(d);
    const end = start + CALENDAR_DAY_MS;
    for (const t of record.boostEvents) {
      if (t >= start && t < end && t > last) last = t;
    }
  }
  return last;
}

export interface GianHangBoostRankEntry {
  id: string;
  score: number;
  lastBoostAt: number;
}

/** Sắp xếp: điểm 3 ngày ↓, hòa điểm thì lượt đẩy mới nhất ↓ (người đẩy sau lên Top 1). */
export function sortGianHangByBoostRanking(
  gianHangIds: string[],
  state: GianHangTop1State,
  now = Date.now()
): GianHangBoostRankEntry[] {
  return gianHangIds
    .map((id) => ({
      id,
      score: scoreGianHangForBoostRanking(id, state, now),
      lastBoostAt: getLastBoostTimeIn3ConsecutiveCalendarDays(state.records[id], now),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.lastBoostAt !== a.lastBoostAt) return b.lastBoostAt - a.lastBoostAt;
      return a.id.localeCompare(b.id, 'vi');
    });
}

export function getBoostsToday(record?: GianHangBoostRecord): number {
  if (!record) return 0;
  const day = todayKey();
  if (record.lastBoostDay !== day) return 0;
  return record.boostsToday;
}

export function recordGianHangBoost(
  state: GianHangTop1State,
  gianHangId: string,
  count = 1
): GianHangTop1State {
  const now = Date.now();
  const day = todayKey();
  const prev = state.records[gianHangId];
  let boostsToday = prev?.boostsToday ?? 0;
  if (prev?.lastBoostDay !== day) boostsToday = 0;
  const boostEvents = [
    ...pruneBoostEvents(prev?.boostEvents ?? [], now),
    ...Array.from({ length: Math.max(1, count) }, () => now),
  ];
  return {
    records: {
      ...state.records,
      [gianHangId]: {
        gianHangId,
        boostsToday: boostsToday + count,
        boostEvents,
        lastBoostDay: day,
        isAutoBoostEnabled: prev?.isAutoBoostEnabled,
        autoBoostDailyCount: prev?.autoBoostDailyCount,
        autoBoostRunHour: prev?.autoBoostRunHour,
        autoBoostPauseAtTop1: prev?.autoBoostPauseAtTop1,
        isKeepTopEnabled: prev?.isKeepTopEnabled,
        keepTopMinDailyBoosts: prev?.keepTopMinDailyBoosts,
        keepTopMaxSpendVnd: prev?.keepTopMaxSpendVnd,
        keepTopReactWhenLost: prev?.keepTopReactWhenLost,
      },
    },
  };
}

export function patchGianHangBoostSettings(
  state: GianHangTop1State,
  gianHangId: string,
  patch: GianHangBoostSettingsPatch
): GianHangTop1State {
  const prev = state.records[gianHangId] ?? {
    gianHangId,
    boostsToday: 0,
    boostEvents: [],
  };
  const next: GianHangBoostRecord = { ...prev, ...patch };
  if (patch.autoBoostDailyCount !== undefined) {
    next.autoBoostDailyCount = clampBoostCount(patch.autoBoostDailyCount);
  }
  if (patch.autoBoostRunHour !== undefined) {
    next.autoBoostRunHour = clampRunHour(patch.autoBoostRunHour);
  }
  if (patch.keepTopMinDailyBoosts !== undefined) {
    next.keepTopMinDailyBoosts = clampBoostCount(patch.keepTopMinDailyBoosts);
  }
  if (patch.keepTopMaxSpendVnd !== undefined) {
    next.keepTopMaxSpendVnd = Math.max(0, Math.min(50_000_000, Math.round(patch.keepTopMaxSpendVnd)));
  }
  return {
    records: {
      ...state.records,
      [gianHangId]: next,
    },
  };
}

/** Xếp hạng theo tổng lượt đẩy 3 ngày lịch liên tiếp (chỉ gian có điểm > 0 mới vào Top 1–3). */
export function computeBoostRanks(
  gianHangIds: string[],
  state: GianHangTop1State,
  now = Date.now()
): Map<string, BoostRank> {
  const map = new Map<string, BoostRank>();
  const scored = sortGianHangByBoostRanking(gianHangIds, state, now);

  let withScore = 0;
  for (const { id, score } of scored) {
    if (score <= 0) {
      map.set(id, 999);
      continue;
    }
    withScore += 1;
    if (withScore === 1) map.set(id, 'Top 1');
    else if (withScore === 2) map.set(id, 'Top 2');
    else if (withScore === 3) map.set(id, 'Top 3');
    else map.set(id, withScore);
  }
  for (const id of gianHangIds) {
    if (!map.has(id)) map.set(id, 999);
  }
  return map;
}

export function getTop1GianHangId(
  gianHangIds: string[],
  state: GianHangTop1State,
  now = Date.now()
): string | null {
  const best = sortGianHangByBoostRanking(gianHangIds, state, now)[0];
  if (!best || best.score <= 0) return null;
  return best.id;
}

/** Đang giữ hạng Top 1 theo tổng lượt 3 ngày liên tiếp. */
export function isGianHangHoldingTop1(
  gianHangId: string,
  state: GianHangTop1State,
  gianHangIds: string[],
  now = Date.now()
): boolean {
  return getTop1GianHangId(gianHangIds, state, now) === gianHangId;
}

/**
 * Tag Tài trợ: tổng lượt đẩy 3 ngày liên tiếp cao nhất VÀ vẫn đang giữ Top 1.
 */
export function isGianHangSponsored(
  gianHangId: string,
  state: GianHangTop1State,
  gianHangIds: string[],
  now = Date.now()
): boolean {
  if (!isGianHangHoldingTop1(gianHangId, state, gianHangIds, now)) return false;
  return scoreGianHangForBoostRanking(gianHangId, state, now) > 0;
}

export function resolveSponsoredGianHangIds(
  gianHangIds: string[],
  state: GianHangTop1State,
  now = Date.now()
): Set<string> {
  const top1 = getTop1GianHangId(gianHangIds, state, now);
  if (!top1 || !isGianHangSponsored(top1, state, gianHangIds, now)) return new Set();
  return new Set([top1]);
}
