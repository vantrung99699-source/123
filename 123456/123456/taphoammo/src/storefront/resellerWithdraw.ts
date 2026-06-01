import { formatVnd } from '../orderAmountDisplay';

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

const WITHDRAWN_KEY_PREFIX = 'taphoammo_reseller_withdrawn_vnd_v1:';
const HISTORY_KEY_PREFIX = 'taphoammo_reseller_withdraw_history_v1:';

export interface ResellerWithdrawRecord {
  id: string;
  amountVnd: number;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  createdAtMs: number;
  status: 'Success';
}

/** Tổng VND reseller đã rút (demo — localStorage theo email). */
export function getResellerWithdrawnVnd(referrerEmail: string): number {
  if (typeof window === 'undefined' || !referrerEmail.trim()) return 0;
  try {
    const raw = localStorage.getItem(WITHDRAWN_KEY_PREFIX + normEmail(referrerEmail));
    if (raw == null) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function setResellerWithdrawnVnd(referrerEmail: string, amountVnd: number): void {
  if (typeof window === 'undefined' || !referrerEmail.trim()) return;
  try {
    const v = Math.max(0, Math.floor(amountVnd));
    localStorage.setItem(WITHDRAWN_KEY_PREFIX + normEmail(referrerEmail), String(v));
  } catch {
    /* ignore */
  }
}

export function getResellerWithdrawHistory(referrerEmail: string): ResellerWithdrawRecord[] {
  if (typeof window === 'undefined' || !referrerEmail.trim()) return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY_PREFIX + normEmail(referrerEmail));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ResellerWithdrawRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(r => r && typeof r.amountVnd === 'number' && r.amountVnd > 0)
      .sort((a, b) => b.createdAtMs - a.createdAtMs);
  } catch {
    return [];
  }
}

function saveResellerWithdrawHistory(referrerEmail: string, rows: ResellerWithdrawRecord[]): void {
  if (typeof window === 'undefined' || !referrerEmail.trim()) return;
  try {
    localStorage.setItem(HISTORY_KEY_PREFIX + normEmail(referrerEmail), JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

export function validateResellerWithdrawAmount(
  amountVnd: number,
  withdrawableVnd: number
): string | null {
  const amount = Math.floor(amountVnd);
  if (!Number.isFinite(amountVnd) || amount <= 0) {
    return 'Nhập số tiền lớn hơn 0';
  }
  if (withdrawableVnd <= 0) {
    return 'Hiện không có số dư rút được';
  }
  if (amount > withdrawableVnd) {
    return `Chỉ được rút tối đa ${formatVnd(withdrawableVnd)}`;
  }
  return null;
}

export function appendResellerWithdrawal(
  referrerEmail: string,
  payload: {
    amountVnd: number;
    bankName: string;
    accountHolder: string;
    accountNumber: string;
  }
): ResellerWithdrawRecord {
  const amountVnd = Math.floor(payload.amountVnd);
  const record: ResellerWithdrawRecord = {
    id: `RW-${Date.now()}`,
    amountVnd,
    bankName: payload.bankName.trim(),
    accountHolder: payload.accountHolder.trim(),
    accountNumber: payload.accountNumber.trim(),
    createdAtMs: Date.now(),
    status: 'Success',
  };
  const prevWithdrawn = getResellerWithdrawnVnd(referrerEmail);
  setResellerWithdrawnVnd(referrerEmail, prevWithdrawn + amountVnd);
  const history = getResellerWithdrawHistory(referrerEmail);
  saveResellerWithdrawHistory(referrerEmail, [record, ...history]);
  return record;
}

export function formatResellerWithdrawDate(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
