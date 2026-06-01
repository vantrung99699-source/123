import { effectiveGianHangStatus, flattenGianHangLeaves } from './categorySectionUtils';
import type { Category } from './types';
import {
  computeBoostRanks,
  getBoostsIn3ConsecutiveCalendarDays,
  getBoostsToday,
  getGianHangBoostCategoryKey,
  isGianHangSponsored,
  resolveAutoBoostSettings,
  resolveKeepTopSettings,
  type BoostRank,
  type GianHangTop1State,
} from './gianHangTop1Storage';

export type BoostStore = {
  id: string;
  name: string;
  category: string;
  location: string;
  rank: BoostRank;
  boostsToday: number;
  daysAtTop1: number;
  status: string;
  createdAt: string;
  boostPrice: number;
  balance: number;
  isAutoBoostEnabled: boolean;
  autoBoostDailyCount: number;
  autoBoostRunHour: number;
  autoBoostPauseAtTop1: boolean;
  isKeepTopEnabled: boolean;
  keepTopMinDailyBoosts: number;
  keepTopMaxSpendVnd: number;
  keepTopReactWhenLost: boolean;
  ownerName: string;
};

/** Phí mỗi lượt đẩy top (VND). */
export const BOOST_PRICE_PER_PUSH_VND = 10_000;

/** Lượt đẩy gói «Lên Top 1 ngay». */
export const BOOST_INSTANT_TOP1_PUSH_COUNT = 15;

function gianCategoryLabel(cat: Category): string {
  return getGianHangBoostCategoryKey(cat);
}

function boostStatus(rank: BoostRank, boosts3d: number, sponsored: boolean): string {
  if (sponsored) return 'Tài trợ';
  if (rank === 'Top 1' && boosts3d > 0) return 'Đang giữ Top 1';
  if (rank === 'Top 2') return 'Top 2';
  if (rank === 'Top 3') return 'Top 3';
  if (typeof rank === 'number' && rank < 999) return `Hạng ${rank}`;
  return 'Đang bán';
}

export function listBoostableGianHang(categories: Category[]): Category[] {
  return flattenGianHangLeaves(categories).filter(
    (g) => effectiveGianHangStatus(g) === 'Đang bán'
  );
}

export function buildBoostStoresFromCategories(
  categories: Category[],
  state: GianHangTop1State
): BoostStore[] {
  const leaves = listBoostableGianHang(categories);
  const byCategory = new Map<string, Category[]>();
  for (const cat of leaves) {
    const key = getGianHangBoostCategoryKey(cat);
    const group = byCategory.get(key) ?? [];
    group.push(cat);
    byCategory.set(key, group);
  }

  const ranks = new Map<string, BoostRank>();
  for (const group of byCategory.values()) {
    const ids = group.map((g) => g.id);
    const groupRanks = computeBoostRanks(ids, state);
    for (const [id, rank] of groupRanks) ranks.set(id, rank);
  }

  return leaves.map((cat) => {
    const rec = state.records[cat.id];
    const boosts3d = getBoostsIn3ConsecutiveCalendarDays(rec);
    const rank = ranks.get(cat.id) ?? 999;
    const categoryKey = getGianHangBoostCategoryKey(cat);
    const idsInCategory = (byCategory.get(categoryKey) ?? []).map((g) => g.id);
    const sponsored = isGianHangSponsored(cat.id, state, idsInCategory);
    const owner =
      (cat.sellerDisplayName || cat.createdByName || cat.products?.[0]?.sellerName || '—').trim();
    const auto = resolveAutoBoostSettings(rec);
    const keep = resolveKeepTopSettings(rec);

    return {
      id: cat.id,
      name: cat.name,
      category: gianCategoryLabel(cat),
      location: 'Toàn quốc',
      rank,
      boostsToday: getBoostsToday(rec),
      daysAtTop1: boosts3d,
      status: boostStatus(rank, boosts3d, sponsored),
      createdAt: cat.date || '—',
      boostPrice: BOOST_PRICE_PER_PUSH_VND,
      balance: 0,
      isAutoBoostEnabled: auto.enabled,
      autoBoostDailyCount: auto.dailyCount,
      autoBoostRunHour: auto.runHour,
      autoBoostPauseAtTop1: auto.pauseAtTop1,
      isKeepTopEnabled: keep.enabled,
      keepTopMinDailyBoosts: keep.minDailyBoosts,
      keepTopMaxSpendVnd: keep.maxSpendVnd,
      keepTopReactWhenLost: keep.reactWhenLost,
      ownerName: owner || '—',
    };
  });
}
