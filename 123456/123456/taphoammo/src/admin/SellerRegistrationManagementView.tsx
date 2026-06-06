import { useMemo, useState } from 'react';
import {
  Check,
  ExternalLink,
  Facebook,
  Phone,
  RotateCcw,
  Search,
  Store,
  User,
  X,
} from 'lucide-react';
import {
  approveSellerRegistration,
  listSellerRegistrations,
  rejectSellerRegistration,
  revokeSellerRegistrationApproval,
  type SellerRegistrationRequest,
} from '../storefront/storefrontSellerRegistration';
import {
  readAdminSellerRegistrationSettings,
  writeAdminSellerRegistrationSettings,
} from './adminSellerRegistrationSettings';

type TabId = 'pending' | 'approved';

function formatSubmittedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeFacebookHref(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

export function SellerRegistrationManagementView({
  onDataChange,
}: {
  onDataChange?: () => void;
}) {
  const [tab, setTab] = useState<TabId>('pending');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<SellerRegistrationRequest[]>(() => listSellerRegistrations());
  const [actionHint, setActionHint] = useState<string | null>(null);
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(
    () => readAdminSellerRegistrationSettings().autoApproveEnabled
  );

  const refresh = () => {
    setRows(listSellerRegistrations());
    onDataChange?.();
  };

  const pendingRows = useMemo(
    () => rows.filter(r => r.status === 'pending'),
    [rows]
  );
  const approvedRows = useMemo(
    () => rows.filter(r => r.status === 'approved'),
    [rows]
  );

  const visibleRows = useMemo(() => {
    const source = tab === 'pending' ? pendingRows : approvedRows;
    const q = search.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      r =>
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.facebookUrl.toLowerCase().includes(q)
    );
  }, [tab, pendingRows, approvedRows, search]);

  const handleApprove = (row: SellerRegistrationRequest) => {
    if (row.status !== 'pending') return;
    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Duyệt đăng ký bán hàng của ${row.fullName} (${row.email})?`)
    ) {
      return;
    }
    approveSellerRegistration(row.id);
    refresh();
    setActionHint(`Đã duyệt đăng ký của ${row.fullName}. Đã gửi thông báo và tin nhắn hỗ trợ.`);
  };

  const handleReject = (row: SellerRegistrationRequest) => {
    if (row.status !== 'pending') return;
    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Từ chối đăng ký bán hàng của ${row.fullName}?`)
    ) {
      return;
    }
    rejectSellerRegistration(row.id);
    refresh();
    setActionHint(`Đã từ chối đăng ký của ${row.fullName}.`);
  };

  const handleRevoke = (row: SellerRegistrationRequest) => {
    if (row.status !== 'approved') return;
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        `Hủy duyệt đăng ký bán hàng của ${row.fullName}? Đơn sẽ chuyển về trạng thái chờ duyệt.`
      )
    ) {
      return;
    }
    revokeSellerRegistrationApproval(row.id);
    refresh();
    setTab('pending');
    setActionHint(`Đã hủy duyệt — ${row.fullName} chuyển về chờ duyệt.`);
  };

  return (
    <div className="p-8 w-full h-full overflow-y-auto">
      <div className="w-full space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Store size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Đơn đăng ký bán hàng</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Duyệt yêu cầu mở gian hàng từ storefront — dữ liệu lưu trên trình duyệt (demo).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Làm mới
          </button>
        </div>

        {actionHint ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {actionHint}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <label className="flex items-start justify-between gap-4 cursor-pointer group">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                Duyệt tự động đăng ký bán hàng
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Khi bật, đơn mới từ storefront được duyệt ngay. Hệ thống gửi thông báo và tin nhắn từ{' '}
                <span className="font-semibold text-slate-700">TapHoaMMO Hỗ trợ</span> cho người đăng ký.
                Duyệt thủ công cũng gửi thông báo và tin nhắn tương tự.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoApproveEnabled}
              onClick={() => {
                const next = !autoApproveEnabled;
                setAutoApproveEnabled(next);
                writeAdminSellerRegistrationSettings({ autoApproveEnabled: next });
                setActionHint(
                  next
                    ? 'Đã bật duyệt tự động — đơn mới sẽ được duyệt ngay khi gửi.'
                    : 'Đã tắt duyệt tự động — admin cần duyệt thủ công.'
                );
              }}
              className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                autoApproveEnabled ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  autoApproveEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => setTab('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === 'pending'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Chờ duyệt
              {pendingRows.length > 0 ? (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${
                    tab === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {pendingRows.length}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setTab('approved')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === 'approved'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Đã duyệt
              {approvedRows.length > 0 ? (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${
                    tab === 'approved' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {approvedRows.length}
                </span>
              ) : null}
            </button>
          </div>

          <div className="relative flex-1 min-w-[240px] group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm tên, email, SĐT, Facebook..."
              className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none shadow-sm"
            />
          </div>
        </div>

        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="py-4 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] w-14 border-r border-slate-100">
                    STT
                  </th>
                  <th className="py-4 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] min-w-[200px] border-r border-slate-100">
                    Họ tên
                  </th>
                  <th className="py-4 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] min-w-[220px] border-r border-slate-100">
                    Email
                  </th>
                  <th className="py-4 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] min-w-[280px] border-r border-slate-100">
                    Link Facebook
                  </th>
                  <th className="py-4 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] w-36 border-r border-slate-100">
                    SĐT
                  </th>
                  <th className="py-4 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] w-44 border-r border-slate-100">
                    Ngày gửi
                  </th>
                  <th className="py-4 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] w-44 border-r border-slate-100">
                    {tab === 'approved' ? 'Ngày duyệt' : 'Trạng thái'}
                  </th>
                  <th className="py-4 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] min-w-[200px]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-sm text-slate-500">
                      {tab === 'pending'
                        ? 'Chưa có đơn đăng ký bán hàng chờ duyệt.'
                        : 'Chưa có đơn đăng ký bán hàng đã duyệt.'}
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-5 border-r border-slate-100 text-sm font-bold text-slate-500 tabular-nums">
                        {index + 1}
                      </td>
                      <td className="py-4 px-5 border-r border-slate-100">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                            <User size={16} />
                          </div>
                          <span className="text-sm font-bold text-slate-800">{row.fullName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 border-r border-slate-100 text-sm text-slate-700 font-medium">
                        {row.email}
                      </td>
                      <td className="py-4 px-5 border-r border-slate-100">
                        <a
                          href={normalizeFacebookHref(row.facebookUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 min-w-0 max-w-full"
                        >
                          <Facebook size={14} className="shrink-0" />
                          <span className="truncate">{row.facebookUrl}</span>
                          <ExternalLink size={12} className="shrink-0 opacity-60" />
                        </a>
                      </td>
                      <td className="py-4 px-5 border-r border-slate-100">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 tabular-nums">
                          <Phone size={14} className="text-slate-400" />
                          {row.phone}
                        </span>
                      </td>
                      <td className="py-4 px-5 border-r border-slate-100 text-sm text-slate-600 tabular-nums whitespace-nowrap">
                        {formatSubmittedAt(row.submittedAtIso)}
                      </td>
                      <td className="py-4 px-5 border-r border-slate-100">
                        {tab === 'approved' ? (
                          <span className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
                            {row.approvedAtIso ? formatSubmittedAt(row.approvedAtIso) : '—'}
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            Chờ duyệt
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {tab === 'pending' ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(row)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                              title="Duyệt"
                            >
                              <Check size={14} />
                              Duyệt
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(row)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                              title="Từ chối"
                            >
                              <X size={14} />
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRevoke(row)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                            title="Hủy duyệt"
                          >
                            <RotateCcw size={14} />
                            Hủy duyệt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
