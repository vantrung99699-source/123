import { getStorefrontSignupByEmail } from '../auth/storefrontDemoAccounts';
import { buildBuyerSellerThreadId } from './storefrontMessagingPersonas';

export const TAPHOAMMO_SUPPORT_SELLER_KEY = 'taphoammo_ho_tro';
export const TAPHOAMMO_SUPPORT_DISPLAY_NAME = 'TapHoaMMO Hỗ trợ';
export const TAPHOAMMO_PLATFORM_CHAT_LABEL = 'Chat với sàn';

export function resolveBuyerLoginForEmail(email: string, fullName = ''): string {
  const signup = getStorefrontSignupByEmail(email);
  if (signup?.username?.trim()) return signup.username.trim();
  const local = email.split('@')[0]?.trim();
  if (local) return local;
  return fullName.trim().replace(/\s+/g, '_').toLowerCase() || 'nguoi_ban';
}

/** Thread hỗ trợ — khóa theo email/login tài khoản. */
export function buildSupportThreadIdForBuyerEmail(email: string, _fullName?: string): string {
  const buyerLogin = resolveBuyerLoginForEmail(email, '');
  return buildBuyerSellerThreadId(buyerLogin, TAPHOAMMO_SUPPORT_SELLER_KEY);
}

export function isPlatformSupportThreadId(ownerEmail: string, threadId: string): boolean {
  if (!ownerEmail.trim() || !threadId.trim()) return false;
  return threadId === buildSupportThreadIdForBuyerEmail(ownerEmail);
}

/** Gộp tin nhắn thread hỗ trợ cũ (khóa theo họ tên) vào thread chuẩn. */
export function listLegacySupportThreadIds(email: string, extraNames: string[] = []): string[] {
  const canonical = buildSupportThreadIdForBuyerEmail(email);
  const legacyLogins = new Set<string>();
  for (const name of extraNames) {
    const login = resolveBuyerLoginForEmail(email, name);
    if (login) legacyLogins.add(login);
  }
  return [...legacyLogins]
    .map(login => buildBuyerSellerThreadId(login, TAPHOAMMO_SUPPORT_SELLER_KEY))
    .filter(id => id !== canonical);
}
