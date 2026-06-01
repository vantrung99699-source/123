export type PaymentHistoryType =
  | 'Sponsorship'
  | 'Selling'
  | 'Buying'
  | 'Top-up'
  | 'Refund'
  | 'Reseller'
  | 'Withdraw';

export interface PaymentHistoryItem {
  id: string;
  date: string;
  type: PaymentHistoryType;
  amount: number;
  reason: string;
  transactionCode: string;
}
