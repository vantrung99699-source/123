/** Ngân hàng nạp tiền demo — BIN VietQR (img.vietqr.io). */
export interface StorefrontTopUpBank {
  id: string;
  name: string;
  shortName: string;
  bin: string;
  accountNo: string;
  accountHolder: string;
  brandColor: string;
}

export const STOREFRONT_TOP_UP_BANKS: StorefrontTopUpBank[] = [
  {
    id: 'vcb',
    name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
    shortName: 'Vietcombank',
    bin: '970436',
    accountNo: '1023456789',
    accountHolder: 'TAPHOAMMO VIET NAM',
    brandColor: '#006c3a',
  },
  {
    id: 'tcb',
    name: 'Ngân hàng TMCP Kỹ thương Việt Nam',
    shortName: 'Techcombank',
    bin: '970407',
    accountNo: '19034567890123',
    accountHolder: 'TAPHOAMMO VIET NAM',
    brandColor: '#c8102e',
  },
  {
    id: 'mb',
    name: 'Ngân hàng TMCP Quân đội',
    shortName: 'MB Bank',
    bin: '970422',
    accountNo: '0901234567890',
    accountHolder: 'TAPHOAMMO VIET NAM',
    brandColor: '#141ed2',
  },
  {
    id: 'acb',
    name: 'Ngân hàng TMCP Á Châu',
    shortName: 'ACB',
    bin: '970416',
    accountNo: '888123456',
    accountHolder: 'TAPHOAMMO VIET NAM',
    brandColor: '#003087',
  },
  {
    id: 'bidv',
    name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
    shortName: 'BIDV',
    bin: '970418',
    accountNo: '8812345678',
    accountHolder: 'TAPHOAMMO VIET NAM',
    brandColor: '#006b68',
  },
];

export const TOP_UP_MIN_VND = 10_000;

export function buildTopUpTransferContent(userCode: string): string {
  const code = userCode.trim().replace(/\s+/g, '').slice(0, 24) || 'KHACH';
  return `NAP${code}`.toUpperCase();
}

export function buildVietQrImageUrl(
  bank: StorefrontTopUpBank,
  amountVnd: number,
  transferContent: string
): string {
  const amount = Math.max(0, Math.floor(amountVnd));
  const addInfo = encodeURIComponent(transferContent.slice(0, 50));
  const accountName = encodeURIComponent(bank.accountHolder);
  return `https://img.vietqr.io/image/${bank.bin}-${bank.accountNo}-compact2.jpg?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
}
