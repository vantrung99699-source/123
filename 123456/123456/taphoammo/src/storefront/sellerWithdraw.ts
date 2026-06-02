import { formatVnd } from '../orderAmountDisplay';

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

const WITHDRAWN_KEY_PREFIX = 'taphoammo_seller_withdrawn_vnd_v1:';
const HISTORY_KEY_PREFIX = 'taphoammo_seller_withdraw_history_v1:';

export interface SellerWithdrawRecord {
  id: string;
  amountVnd: number;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  createdAtMs: number;
  status: 'Success' | 'Processing';
}

export function getSellerWithdrawnVnd(sellerEmail: string): number {
  if (typeof window === 'undefined' || !sellerEmail.trim()) return 0;
  try {
    const raw = localStorage.getItem(WITHDRAWN_KEY_PREFIX + normEmail(sellerEmail));
    if (raw == null) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function setSellerWithdrawnVnd(sellerEmail: string, amountVnd: number): void {
  if (typeof window === 'undefined' || !sellerEmail.trim()) return;
  try {
    localStorage.setItem(
      WITHDRAWN_KEY_PREFIX + normEmail(sellerEmail),
      String(Math.max(0, Math.floor(amountVnd)))
    );
  } catch {
    /* ignore */
  }
}

export function getSellerWithdrawHistory(sellerEmail: string): SellerWithdrawRecord[] {
  if (typeof window === 'undefined' || !sellerEmail.trim()) return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY_PREFIX + normEmail(sellerEmail));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SellerWithdrawRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(r => r && typeof r.amountVnd === 'number' && r.amountVnd > 0)
      .sort((a, b) => b.createdAtMs - a.createdAtMs);
  } catch {
    return [];
  }
}

function saveSellerWithdrawHistory(sellerEmail: string, rows: SellerWithdrawRecord[]): void {
  if (typeof window === 'undefined' || !sellerEmail.trim()) return;
  try {
    localStorage.setItem(HISTORY_KEY_PREFIX + normEmail(sellerEmail), JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

export function validateSellerWithdrawAmount(
  amountVnd: number,
  withdrawableVnd: number
): string | null {
  const amount = Math.floor(amountVnd);
  if (!Number.isFinite(amountVnd) || amount <= 0) {
    return 'Nhập số tiền lớn hơn 0';
  }
  if (withdrawableVnd <= 0) {
    return 'Hiện không có số dư khả dụng rút';
  }
  if (amount < 500_000) {
    return 'Số tiền tối thiểu 500.000đ';
  }
  if (amount % 100_000 !== 0) {
    return 'Số tiền phải là bội số của 100.000đ';
  }
  if (amount > withdrawableVnd) {
    return `Chỉ được rút tối đa ${formatVnd(withdrawableVnd)}`;
  }
  return null;
}

export function appendSellerWithdrawal(
  sellerEmail: string,
  payload: {
    amountVnd: number;
    bankName: string;
    accountHolder: string;
    accountNumber: string;
  }
): SellerWithdrawRecord {
  const amountVnd = Math.floor(payload.amountVnd);
  const record: SellerWithdrawRecord = {
    id: `SW-${Date.now()}`,
    amountVnd,
    bankName: payload.bankName.trim(),
    accountHolder: payload.accountHolder.trim(),
    accountNumber: payload.accountNumber.trim(),
    createdAtMs: Date.now(),
    status: 'Success',
  };
  const prevWithdrawn = getSellerWithdrawnVnd(sellerEmail);
  setSellerWithdrawnVnd(sellerEmail, prevWithdrawn + amountVnd);
  const history = getSellerWithdrawHistory(sellerEmail);
  saveSellerWithdrawHistory(sellerEmail, [record, ...history]);
  return record;
}

export function formatSellerWithdrawDate(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
