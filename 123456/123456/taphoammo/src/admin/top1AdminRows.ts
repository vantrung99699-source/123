/**
 * Dòng bảng Gian hàng Top 1 — admin panel (chỉ gian có lượt đẩy 30 ngày).
 */
import type { Category } from '../gianHang/types';
import {
  buildBoostStoresFromCategories,
  BOOST_PRICE_PER_PUSH_VND,
  type BoostStore,
} from '../gianHang/gianHangTop1Boost';
import {
  getBoostsInLast30Days,
  getBoostsToday,
  type BoostRank,
  type GianHangTop1State,
} from '../gianHang/gianHangTop1Storage';

export interface Top1AdminRow {
  store: BoostStore;
  stt: number;
  pushes30d: number;
  spend30dVnd: number;
  dailyPushCount: number;
  dailySpendVnd: number;
  rankNum: number;
  autoPush: boolean;
  holdTop1: boolean;
}

export function boostRankToNumber(rank: BoostRank): number {
  if (rank === 'Top 1') return 1;
  if (rank === 'Top 2') return 2;
  if (rank === 'Top 3') return 3;
  if (typeof rank === 'number' && rank < 999) return rank;
  return 999;
}

export function buildTop1AdminRows(
  categories: Category[],
  state: GianHangTop1State,
  now = Date.now()
): Top1AdminRow[] {
  const stores = buildBoostStoresFromCategories(categories, state);

  const withActivity = stores
    .map((store) => {
      const rec = state.records[store.id];
      const pushes30d = getBoostsInLast30Days(rec, now);
      const dailyPushCount = getBoostsToday(rec);
      return {
        store,
        stt: 0,
        pushes30d,
        spend30dVnd: pushes30d * BOOST_PRICE_PER_PUSH_VND,
        dailyPushCount,
        dailySpendVnd: dailyPushCount * BOOST_PRICE_PER_PUSH_VND,
        rankNum: boostRankToNumber(store.rank),
        autoPush: store.isAutoBoostEnabled,
        holdTop1: store.isKeepTopEnabled,
      };
    })
    .filter((row) => row.pushes30d > 0)
    .sort((a, b) => b.pushes30d - a.pushes30d || b.store.daysAtTop1 - a.store.daysAtTop1);

  return withActivity.map((row, i) => ({ ...row, stt: i + 1 }));
}
