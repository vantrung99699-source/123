/**
 * Tab tổng quan / xếp hạng giao dịch theo vai trò (admin).
 */
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ShoppingBag, Store, Users, Wallet } from 'lucide-react';
import type {
  BuyerPartySummary,
  ResellerPartySummary,
  SellerPartySummary,
  SystemLedgerRow,
  SystemTransactionOverview,
} from './transactionSystemOverview';

function formatVnd(n: number) {
  return `${n.toLocaleString('vi-VN')} đ`;
}

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Wallet;
  tone: 'blue' | 'emerald' | 'purple' | 'amber';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className={`inline-flex p-2 rounded-xl border mb-3 ${tones[tone]}`}>
        <Icon size={20} />
      </div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
      {sub ? <p className="text-xs text-slate-500 mt-1">{sub}</p> : null}
    </div>
  );
}

function ProductList({ items }: { items: { name: string; count: number; totalVnd: number }[] }) {
  if (items.length === 0) return <span className="text-xs text-slate-400">—</span>;
  return (
    <ul className="text-xs text-slate-600 space-y-1">
      {items.map(p => (
        <li key={p.name} className="flex justify-between gap-2">
          <span className="truncate max-w-[180px]" title={p.name}>
            {p.name} <span className="text-slate-400">×{p.count}</span>
          </span>
          <span className="font-semibold tabular-nums shrink-0">{formatVnd(p.totalVnd)}</span>
        </li>
      ))}
    </ul>
  );
}

function ExpandableRow({
  rank,
  label,
  email,
  cols,
  expanded,
  onToggle,
  children,
}: {
  rank: number;
  label: string;
  email?: string;
  cols: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <tr className="hover:bg-slate-50/80 transition-colors border-b border-slate-50">
        <td className="px-4 py-3 text-center text-sm font-bold text-slate-400">{rank}</td>
        <td className="px-4 py-3">
          <button type="button" onClick={onToggle} className="text-left group w-full">
            <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600">{label}</span>
            {email ? <p className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">{email}</p> : null}
          </button>
        </td>
        {cols}
        <td className="px-3 py-3 text-center">
          <button
            type="button"
            onClick={onToggle}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600"
            aria-label={expanded ? 'Thu gọn' : 'Mở rộng'}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr className="bg-slate-50/50">
          <td colSpan={20} className="px-6 py-4">
            {children}
          </td>
        </tr>
      ) : null}
    </>
  );
}

export function TransactionOverviewSummary({ overview }: { overview: SystemTransactionOverview }) {
  const { totals } = overview;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      <SummaryCard
        label="Tổng chi tiêu (người mua)"
        value={formatVnd(totals.buyerSpentVnd)}
        sub={`${overview.buyers.length} tài khoản có mua · Ví buyer: ${formatVnd(totals.totalBuyerWalletVnd)}`}
        icon={ShoppingBag}
        tone="blue"
      />
      <SummaryCard
        label="Doanh thu bán (người bán)"
        value={formatVnd(totals.sellerSalesVnd)}
        sub={`${overview.sellers.length} người bán · Ví seller: ${formatVnd(totals.totalSellerWalletVnd)}`}
        icon={Store}
        tone="emerald"
      />
      <SummaryCard
        label="Hoa hồng Reseller"
        value={formatVnd(totals.resellerCommissionVnd)}
        sub={`${overview.resellers.length} reseller · Ví HH: ${formatVnd(totals.totalResellerWalletVnd)}`}
        icon={Users}
        tone="purple"
      />
      <SummaryCard
        label="Dòng giao dịch"
        value={String(totals.ledgerCount)}
        sub="Từ đơn đã thanh toán + lịch sử nạp/rút/mock"
        icon={Wallet}
        tone="amber"
      />
    </div>
  );
}

export function BuyerRankingTable({ buyers }: { buyers: BuyerPartySummary[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  return (
    <RankingTableShell
      title="Người mua — nhiều chi tiêu → ít"
      empty={buyers.length === 0}
      headers={['Tổng mua', 'Số đơn', 'Số dư ví']}
    >
      {buyers.map((b, i) => (
        <ExpandableRow
          key={b.key}
          rank={i + 1}
          label={b.label}
          email={b.email || undefined}
          expanded={expanded.has(b.key)}
          onToggle={() => toggle(b.key)}
          cols={
            <>
              <td className="px-4 py-3 text-sm font-bold text-red-600 tabular-nums">{formatVnd(b.totalSpentVnd)}</td>
              <td className="px-4 py-3 text-sm font-medium text-slate-700">{b.orderCount}</td>
              <td className="px-4 py-3 text-sm font-bold text-emerald-600 tabular-nums">{formatVnd(b.walletVnd)}</td>
            </>
          }
        >
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Sản phẩm đã mua (top)</p>
          <ProductList items={b.topProducts} />
        </ExpandableRow>
      ))}
    </RankingTableShell>
  );
}

export function SellerRankingTable({ sellers }: { sellers: SellerPartySummary[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  return (
    <RankingTableShell
      title="Người bán — doanh thu nhiều → ít"
      empty={sellers.length === 0}
      headers={['Doanh thu', 'Số đơn', 'Ví / Đã rút', 'Khả dụng rút']}
    >
      {sellers.map((s, i) => (
        <ExpandableRow
          key={s.key}
          rank={i + 1}
          label={s.label}
          email={s.email || undefined}
          expanded={expanded.has(s.key)}
          onToggle={() => toggle(s.key)}
          cols={
            <>
              <td className="px-4 py-3 text-sm font-bold text-emerald-600 tabular-nums">{formatVnd(s.totalSalesVnd)}</td>
              <td className="px-4 py-3 text-sm font-medium text-slate-700">{s.orderCount}</td>
              <td className="px-4 py-3 text-xs tabular-nums">
                <span className="font-bold text-slate-800">{formatVnd(s.walletVnd)}</span>
                <span className="text-slate-400 mx-1">/</span>
                <span className="text-red-600">{formatVnd(s.withdrawnVnd)}</span>
              </td>
              <td className="px-4 py-3 text-sm font-bold text-blue-600 tabular-nums">{formatVnd(s.availableVnd)}</td>
            </>
          }
        >
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Sản phẩm đã bán (top)</p>
          <ProductList items={s.topProducts} />
        </ExpandableRow>
      ))}
    </RankingTableShell>
  );
}

export function ResellerRankingTable({ resellers }: { resellers: ResellerPartySummary[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  return (
    <RankingTableShell
      title="Reseller — hoa hồng nhiều → ít"
      empty={resellers.length === 0}
      headers={['Tổng HH', 'Số đơn', 'Ví HH']}
    >
      {resellers.map((r, i) => (
        <ExpandableRow
          key={r.key}
          rank={i + 1}
          label={r.label}
          email={r.email}
          expanded={expanded.has(r.key)}
          onToggle={() => toggle(r.key)}
          cols={
            <>
              <td className="px-4 py-3 text-sm font-bold text-purple-600 tabular-nums">
                {formatVnd(r.totalCommissionVnd)}
              </td>
              <td className="px-4 py-3 text-sm font-medium text-slate-700">{r.orderCount}</td>
              <td className="px-4 py-3 text-sm font-bold text-emerald-600 tabular-nums">{formatVnd(r.walletVnd)}</td>
            </>
          }
        >
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Đơn giới thiệu (top SP)</p>
          <ProductList items={r.topProducts} />
        </ExpandableRow>
      ))}
    </RankingTableShell>
  );
}

function RankingTableShell({
  title,
  headers,
  empty,
  children,
}: {
  title: string;
  headers: string[];
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="px-4 py-3 w-12 text-center">#</th>
              <th className="px-4 py-3">Tài khoản</th>
              {headers.map(h => (
                <th key={h} className="px-4 py-3">
                  {h}
                </th>
              ))}
              <th className="px-3 py-3 w-10" />
            </tr>
          </thead>
          <tbody>{empty ? (
            <tr>
              <td colSpan={headers.length + 3} className="px-6 py-12 text-center text-sm text-slate-400">
                Chưa có dữ liệu từ đơn đã thanh toán.
              </td>
            </tr>
          ) : (
            children
          )}</tbody>
        </table>
      </div>
    </section>
  );
}

const roleLabels: Record<string, string> = {
  buyer: 'Người mua',
  seller: 'Người bán',
  reseller: 'Reseller',
  other: 'Khác',
};

export function SystemLedgerTable({
  rows,
  roleFilter,
  searchQuery,
}: {
  rows: SystemLedgerRow[];
  roleFilter: string;
  searchQuery: string;
}) {
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return rows.filter(r => {
      if (roleFilter !== 'all' && r.role !== roleFilter) return false;
      if (!q) return true;
      return (
        r.partyLabel.toLowerCase().includes(q) ||
        r.partyKey.includes(q) ||
        (r.orderId ?? '').toLowerCase().includes(q) ||
        (r.productName ?? '').toLowerCase().includes(q) ||
        (r.counterparty ?? '').toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.time.toLowerCase().includes(q)
      );
    });
  }, [rows, roleFilter, searchQuery]);

  return (
    <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="px-4 py-4 w-12 text-center">STT</th>
              <th className="px-4 py-4">Vai trò</th>
              <th className="px-4 py-4">Tài khoản</th>
              <th className="px-4 py-4">Thời gian / Đơn</th>
              <th className="px-4 py-4">Loại</th>
              <th className="px-4 py-4">Số tiền</th>
              <th className="px-4 py-4">Sản phẩm</th>
              <th className="px-4 py-4">Đối tác</th>
              <th className="px-4 py-4">Lý do</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-400">
                  Không có giao dịch khớp bộ lọc.
                </td>
              </tr>
            ) : (
              filtered.map((r, idx) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-center text-sm text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                      {roleLabels[r.role] ?? r.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900">{r.partyLabel}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-mono text-blue-600">{r.orderId ?? '—'}</div>
                    <div className="text-[11px] text-slate-500">{r.time}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-700">{r.type}</td>
                  <td
                    className={`px-4 py-3 text-sm font-bold tabular-nums ${
                      r.amountVnd >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {r.amountVnd >= 0 ? '+' : ''}
                    {formatVnd(Math.abs(r.amountVnd))}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[140px] truncate" title={r.productName}>
                    {r.productName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{r.counterparty ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] line-clamp-2">{r.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
