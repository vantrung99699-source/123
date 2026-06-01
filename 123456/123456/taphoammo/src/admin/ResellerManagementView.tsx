import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, ChevronDown, Filter, Plus, Search, ShoppingBag, Trash2 } from 'lucide-react';
import type { Category } from '../gianHang/types';
import {
  formatResellerRequestDate,
  isResellerRequestForSeller,
  removeResellerRequest,
  resolveResellerRequest,
  type ResellerRequest,
} from '../reseller/resellerRequests';

export interface ResellerManagementViewProps {
  requests: ResellerRequest[];
  onRequestsChange: React.Dispatch<React.SetStateAction<ResellerRequest[]>>;
  categories: Category[];
  /** Shop chỉ thấy yêu cầu gian của mình; admin thấy tất cả. */
  sellerIdentityKeys?: Set<string>;
  isAdminSession?: boolean;
  onApproveRequest?: (request: ResellerRequest, approvedPercent: number) => void;
  /** Sau khi xóa yêu cầu đã duyệt — đồng bộ lại % gian nếu cần. */
  onDeleteApprovedRequest?: (request: ResellerRequest, remainingRequests: ResellerRequest[]) => void;
}

export function ResellerManagementView({
  requests,
  onRequestsChange,
  categories,
  sellerIdentityKeys,
  isAdminSession = true,
  onApproveRequest,
  onDeleteApprovedRequest,
}: ResellerManagementViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tất cả' | 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối'>('Tất cả');

  const visibleRequests = useMemo(() => {
    let list = requests;
    if (!isAdminSession && sellerIdentityKeys?.size) {
      list = list.filter(r => isResellerRequestForSeller(r, sellerIdentityKeys, categories));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        r =>
          r.gianHangName.toLowerCase().includes(q) ||
          r.requesterName.toLowerCase().includes(q) ||
          r.requesterEmail.toLowerCase().includes(q) ||
          (r.productName?.toLowerCase().includes(q) ?? false)
      );
    }
    if (statusFilter === 'Chờ duyệt') list = list.filter(r => r.status === 'pending');
    if (statusFilter === 'Đã duyệt') list = list.filter(r => r.status === 'approved');
    if (statusFilter === 'Từ chối') list = list.filter(r => r.status === 'rejected');
    return [...list].sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  }, [requests, search, statusFilter, isAdminSession, sellerIdentityKeys, categories]);

  const handleApprove = (row: ResellerRequest) => {
    if (row.status !== 'pending') return;
    onRequestsChange(prev => resolveResellerRequest(prev, row.id, 'approved'));
    onApproveRequest?.(row, row.requestedPercent);
  };

  const handleReject = (row: ResellerRequest) => {
    if (row.status !== 'pending') return;
    if (typeof window !== 'undefined' && !window.confirm('Từ chối yêu cầu tăng chiết khấu Reseller?')) return;
    onRequestsChange(prev => resolveResellerRequest(prev, row.id, 'rejected'));
  };

  const handleDelete = (row: ResellerRequest) => {
    if (row.status !== 'approved') return;
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        `Xóa yêu cầu đã duyệt ${row.requestedPercent}% của ${row.requesterName}? Người mua sẽ áp dụng mức duyệt trước đó hoặc % mặc định gian.`
      )
    ) {
      return;
    }
    onRequestsChange(prev => {
      const next = removeResellerRequest(prev, row.id);
      onDeleteApprovedRequest?.(row, next);
      return next;
    });
  };

  const statusLabel = (s: ResellerRequest['status']) => {
    if (s === 'pending') return 'Chờ duyệt';
    if (s === 'approved') return 'Đã duyệt';
    return 'Từ chối';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
        Yêu cầu tăng % chiết khấu Reseller từ người mua. Mỗi lần duyệt, người đó có thể gửi yêu cầu mới cao hơn mức đã
        duyệt (vd. 10% → 15%, sau đó 15% → 20%).
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none cursor-pointer"
          >
            <option value="Tất cả">Tất cả</option>
            <option value="Chờ duyệt">Chờ duyệt</option>
            <option value="Đã duyệt">Đã duyệt</option>
            <option value="Từ chối">Từ chối</option>
          </select>
          <ChevronDown
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            size={16}
          />
        </div>
        <div className="relative flex-1 max-w-md group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
            size={18}
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm gian hàng, email, người yêu cầu..."
            className="w-full pl-11 pr-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] w-28">
                  THAO TÁC
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em]">
                  GIAN HÀNG
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em]">
                  NGƯỜI YÊU CẦU
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em]">
                  NGÀY
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em]">
                  TỪ % → XIN %
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em]">
                  LỜI NHẮN
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] text-center">
                  TRẠNG THÁI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRequests.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-4 border-r border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={item.status !== 'pending'}
                        onClick={() => handleApprove(item)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          item.status === 'pending'
                            ? 'text-emerald-600 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100'
                            : 'text-slate-300 border-slate-100 cursor-not-allowed'
                        }`}
                        title="Duyệt"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={item.status !== 'pending'}
                        onClick={() => handleReject(item)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          item.status === 'pending'
                            ? 'text-rose-600 border-rose-200 bg-rose-50/50 hover:bg-rose-100'
                            : 'text-slate-300 border-slate-100 cursor-not-allowed'
                        }`}
                        title="Từ chối"
                      >
                        <Plus size={14} className="rotate-45" />
                      </button>
                      <button
                        type="button"
                        disabled={item.status !== 'approved'}
                        onClick={() => handleDelete(item)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          item.status === 'approved'
                            ? 'text-slate-600 border-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-rose-600 hover:border-rose-200'
                            : 'text-slate-300 border-slate-100 cursor-not-allowed'
                        }`}
                        title="Xóa yêu cầu đã duyệt"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                        <ShoppingBag size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-blue-600 block truncate">{item.gianHangName}</span>
                        {item.productName && (
                          <span className="text-[10px] text-slate-500 block truncate">{item.productName}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100">
                    <span className="text-xs font-bold text-slate-800 block">{item.requesterName}</span>
                    <span className="text-[10px] text-slate-500">{item.requesterEmail}</span>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 whitespace-nowrap">
                    <span className="text-xs font-medium text-slate-700">
                      {formatResellerRequestDate(item.updatedAtMs)}
                    </span>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 whitespace-nowrap">
                    <span className="text-xs font-bold text-slate-700">{item.baselinePercent}%</span>
                    <span className="text-slate-400 mx-1">→</span>
                    <span className="text-xs font-bold text-emerald-700">{item.requestedPercent}%</span>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100">
                    <p className="text-xs text-slate-600 line-clamp-2 max-w-xs">{item.message || '—'}</p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                        item.status === 'rejected'
                          ? 'bg-rose-600 text-white border-transparent'
                          : item.status === 'approved'
                            ? 'bg-green-600 text-white border-transparent'
                            : 'bg-amber-500 text-white border-transparent'
                      }`}
                    >
                      {statusLabel(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visibleRequests.length === 0 && (
          <p className="px-6 py-12 text-center text-sm text-slate-500">Chưa có yêu cầu Reseller.</p>
        )}
      </div>
    </motion.div>
  );
}
