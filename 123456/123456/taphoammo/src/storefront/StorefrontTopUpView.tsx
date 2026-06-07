import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  Copy,
  Clock,
  History,
  QrCode,
  Wallet,
} from 'lucide-react';
import { formatVnd } from '../orderAmountDisplay';
import type { PaymentHistoryItem } from './paymentHistoryTypes';
import {
  buildTopUpTransferContent,
  buildVietQrImageUrl,
  STOREFRONT_TOP_UP_BANKS,
  TOP_UP_MIN_VND,
  type StorefrontTopUpBank,
} from './storefrontTopUpBanks';
import type { StorefrontTopUpNotice } from '../admin/adminStorefrontTopUpNotices';
import { StorefrontTopUpNotices } from '../components/StorefrontTopUpNotices';

export type TopUpHistoryStatus = 'pending' | 'success' | 'failed';

export interface TopUpHistoryRow {
  id: string;
  date: string;
  bankShortName: string;
  amountVnd: number;
  transferContent: string;
  status: TopUpHistoryStatus;
  transactionCode: string;
}

const TOP_UP_HISTORY_KEY = 'taphoammo_storefront_topup_pending_v1';

function readLocalTopUpHistory(): TopUpHistoryRow[] {
  try {
    const raw = localStorage.getItem(TOP_UP_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TopUpHistoryRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalTopUpHistory(rows: TopUpHistoryRow[]): void {
  try {
    localStorage.setItem(TOP_UP_HISTORY_KEY, JSON.stringify(rows.slice(0, 50)));
  } catch {
    /* ignore */
  }
}

function statusLabel(status: TopUpHistoryStatus): string {
  switch (status) {
    case 'pending':
      return 'Chờ xác nhận';
    case 'success':
      return 'Thành công';
    case 'failed':
      return 'Thất bại';
  }
}

function parseAmountFromReason(reason: string): number {
  const m = reason.match(/Nạp\s+([\d.,\s]+)đ/i);
  if (!m) return 0;
  const digits = m[1].replace(/[^\d]/g, '');
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? 0 : n;
}

function statusClass(status: TopUpHistoryStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'success':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'failed':
      return 'bg-rose-50 text-rose-700 border-rose-200';
  }
}

export interface StorefrontTopUpViewProps {
  walletBalanceVnd: number;
  transferUserCode: string;
  paymentHistoryCheckoutItems: PaymentHistoryItem[];
  topUpNotices?: StorefrontTopUpNotice[];
}

export function StorefrontTopUpView({
  walletBalanceVnd,
  transferUserCode,
  paymentHistoryCheckoutItems,
  topUpNotices = [],
}: StorefrontTopUpViewProps) {
  const [selectedBankId, setSelectedBankId] = useState(STOREFRONT_TOP_UP_BANKS[0].id);
  const [amountInput, setAmountInput] = useState('');
  const [localHistory, setLocalHistory] = useState<TopUpHistoryRow[]>(() => readLocalTopUpHistory());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);

  const selectedBank = useMemo(
    () => STOREFRONT_TOP_UP_BANKS.find(b => b.id === selectedBankId) ?? STOREFRONT_TOP_UP_BANKS[0],
    [selectedBankId]
  );

  const amountVnd = useMemo(() => {
    const digits = amountInput.replace(/\D/g, '');
    const n = parseInt(digits, 10);
    return Number.isNaN(n) ? 0 : n;
  }, [amountInput]);

  const transferContent = useMemo(
    () => buildTopUpTransferContent(transferUserCode),
    [transferUserCode]
  );

  /** QR luôn hiển thị: chưa nhập số tiền thì VietQR không gắn amount (0), vẫn có STK + nội dung CK. */
  const qrAmountVnd = amountVnd >= TOP_UP_MIN_VND ? amountVnd : 0;

  const qrUrl = useMemo(
    () => buildVietQrImageUrl(selectedBank, qrAmountVnd, transferContent),
    [selectedBank, qrAmountVnd, transferContent]
  );

  useEffect(() => {
    setQrError(false);
  }, [qrUrl]);

  const mergedHistory = useMemo((): TopUpHistoryRow[] => {
    const fromLedger: TopUpHistoryRow[] = paymentHistoryCheckoutItems
      .filter(item => item.type === 'Top-up')
      .map(item => ({
        id: item.id,
        date: item.date,
        bankShortName: item.reason.includes('VCB')
          ? 'Vietcombank'
          : item.reason.includes('TCB') || item.reason.includes('Techcombank')
            ? 'Techcombank'
            : item.reason.includes('MB')
              ? 'MB Bank'
              : item.reason.includes('ACB')
                ? 'ACB'
                : item.reason.includes('BIDV')
                  ? 'BIDV'
                  : 'Ngân hàng',
        amountVnd: item.amount > 0 ? item.amount : parseAmountFromReason(item.reason),
        transferContent: item.reason.match(/·\s*(\S+)\s*$/)?.[1] ?? transferContent,
        status: item.reason.includes('Chờ') ? ('pending' as const) : ('success' as const),
        transactionCode: item.transactionCode,
      }));

    const map = new Map<string, TopUpHistoryRow>();
    for (const row of [...localHistory, ...fromLedger]) {
      map.set(row.id, row);
    }
    return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [paymentHistoryCheckoutItems, localHistory, transferContent]);

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(key);
      window.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      window.alert('Không copy được — vui lòng chọn và copy thủ công.');
    }
  };

  const quickAmounts = [50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Nạp tiền vào ví</h1>
          <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
            Chọn ngân hàng, nhập số tiền, quét QR và chuyển khoản. Hệ thống{' '}
            <span className="font-bold text-slate-800">tự động đối soát</span> và cộng tiền vào ví khi đúng
            nội dung chuyển khoản (thường 1–15 phút).
          </p>
        </div>

        <StorefrontTopUpNotices notices={topUpNotices} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số dư hiện tại</p>
                  <p className="text-xl font-bold text-emerald-600 tabular-nums">{formatVnd(walletBalanceVnd)}</p>
                </div>
              </div>

              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Số tiền nạp (VNĐ)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={e => setAmountInput(e.target.value.replace(/[^\d]/g, ''))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                placeholder="Nhập số tiền"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Tối thiểu {formatVnd(TOP_UP_MIN_VND)}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountInput(String(amt))}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                      amountVnd === amt
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {formatVnd(amt)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Building2 size={18} className="text-slate-500" />
                <h2 className="text-sm font-bold text-slate-800">Chọn ngân hàng</h2>
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STOREFRONT_TOP_UP_BANKS.map(bank => {
                  const active = bank.id === selectedBankId;
                  return (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => {
                        setSelectedBankId(bank.id);
                        setQrError(false);
                      }}
                      className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        active
                          ? 'border-emerald-500 bg-emerald-50/80 shadow-sm'
                          : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                      }`}
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full mb-1.5"
                        style={{ backgroundColor: bank.brandColor }}
                      />
                      <p className="text-[13px] font-bold text-slate-800">{bank.shortName}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{bank.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div
                className="px-5 py-3 border-b border-slate-100 flex items-center justify-between"
                style={{ backgroundColor: `${selectedBank.brandColor}12` }}
              >
                <div className="flex items-center gap-2">
                  <QrCode size={18} style={{ color: selectedBank.brandColor }} />
                  <span className="text-sm font-bold text-slate-800">Quét mã — {selectedBank.shortName}</span>
                </div>
                <span className="text-lg font-extrabold text-emerald-600 tabular-nums">
                  {amountVnd >= TOP_UP_MIN_VND ? formatVnd(amountVnd) : '—'}
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-[300px] aspect-square rounded-2xl border-2 border-slate-100 bg-white flex items-center justify-center overflow-hidden shadow-inner">
                    {!qrError ? (
                      <img
                        src={qrUrl}
                        alt={`QR nạp tiền ${selectedBank.shortName}`}
                        className="w-full h-full object-contain"
                        onError={() => setQrError(true)}
                      />
                    ) : (
                      <div className="text-center px-4 text-slate-400 text-sm">
                        Không tải được QR — dùng thông tin chuyển khoản bên cạnh
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 text-center">
                    VietQR · quét bằng app ngân hàng
                    {qrAmountVnd === 0 && (
                      <span className="block text-slate-500 mt-0.5">
                        Nhập số tiền để QR gắn sẵn số tiền chuyển khoản
                      </span>
                    )}
                  </p>
                </div>

                <div className="space-y-3 text-[13px]">
                  <CopyRow
                    label="Ngân hàng"
                    value={selectedBank.shortName}
                    fieldKey="bank"
                    copiedField={copiedField}
                    onCopy={copyText}
                  />
                  <CopyRow
                    label="Số tài khoản"
                    value={selectedBank.accountNo}
                    fieldKey="acc"
                    copiedField={copiedField}
                    onCopy={copyText}
                    mono
                  />
                  <CopyRow
                    label="Chủ tài khoản"
                    value={selectedBank.accountHolder}
                    fieldKey="holder"
                    copiedField={copiedField}
                    onCopy={copyText}
                  />
                  <CopyRow
                    label="Số tiền"
                    value={amountVnd >= TOP_UP_MIN_VND ? formatVnd(amountVnd) : '—'}
                    fieldKey="amt"
                    copiedField={copiedField}
                    onCopy={copyText}
                  />
                  <CopyRow
                    label="Nội dung CK"
                    value={transferContent}
                    fieldKey="content"
                    copiedField={copiedField}
                    onCopy={copyText}
                    highlight
                    mono
                  />
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 leading-relaxed">
                    Không cần bấm xác nhận — sau khi chuyển khoản đúng nội dung{' '}
                    <span className="font-mono font-bold">{transferContent}</span>, tiền tự động vào ví và hiện
                    trong lịch sử bên dưới.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <History size={18} className="text-slate-500" />
            <h2 className="text-sm font-bold text-slate-800">Lịch sử nạp tiền</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Thời gian</th>
                  <th className="px-5 py-3">Ngân hàng</th>
                  <th className="px-5 py-3">Số tiền</th>
                  <th className="px-5 py-3">Nội dung</th>
                  <th className="px-5 py-3">Mã GD</th>
                  <th className="px-5 py-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mergedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                      Chưa có giao dịch nạp tiền.
                    </td>
                  </tr>
                ) : (
                  mergedHistory.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{row.date}</td>
                      <td className="px-5 py-4 font-medium text-slate-800">{row.bankShortName}</td>
                      <td className="px-5 py-4 font-bold text-emerald-700 tabular-nums">
                        +{row.amountVnd.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="px-5 py-4 font-mono text-[12px] text-slate-700">{row.transferContent}</td>
                      <td className="px-5 py-4 font-mono text-[12px] text-blue-600">{row.transactionCode}</td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusClass(row.status)}`}
                        >
                          {row.status === 'pending' && <Clock size={10} />}
                          {row.status === 'success' && <Check size={10} />}
                          {statusLabel(row.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  fieldKey,
  copiedField,
  onCopy,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  fieldKey: string;
  copiedField: string | null;
  onCopy: (key: string, text: string) => void;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-2 rounded-xl px-3 py-2 border ${
        highlight ? 'bg-amber-50/80 border-amber-200' : 'bg-slate-50 border-slate-100'
      }`}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className={`font-semibold text-slate-800 break-all ${mono ? 'font-mono text-[12px]' : ''}`}>
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onCopy(fieldKey, value)}
        className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:bg-white hover:text-emerald-600 border border-transparent hover:border-slate-200 transition-colors"
        title="Sao chép"
      >
        {copiedField === fieldKey ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
      </button>
    </div>
  );
}
