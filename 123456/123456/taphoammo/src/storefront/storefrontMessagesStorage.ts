import type { MessagingPersonaId } from './storefrontMessagingPersonas';
import {
  buildBuyerSellerThreadId,
  buildResellerBuyerThreadId,
  buildSellerResellerThreadId,
  DEMO_RESELLER_PERSONA,
  DEMO_SELLER_PERSONA,
  resolveBuyerPersona,
} from './storefrontMessagingPersonas';

export type MessageSenderSide = 'self' | 'partner';

export interface StoredChatMessage {
  id: string;
  /** Người gửi thật (buyer / seller / reseller) — không phụ thuộc chế độ đang xem. */
  sender: MessagingPersonaId;
  text: string;
  sentAtMs: number;
}

/** Tin nhắn đã map theo người đang xem. */
export interface ViewChatMessage {
  id: string;
  side: MessageSenderSide;
  sender: MessagingPersonaId;
  text: string;
  sentAtMs: number;
}

const KEY = 'taphoammo_storefront_messages_v2';
const DEMO_SEEDED_KEY = 'taphoammo_storefront_messages_demo_seeded_v1';

type Store = Record<string, Record<string, StoredChatMessage[]>>;

function normOwner(email: string): string {
  return email.trim().toLowerCase() || '_anonymous';
}

function readStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as Store;
    return typeof o === 'object' && o !== null ? o : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

function readRawThread(ownerEmail: string, threadId: string): StoredChatMessage[] {
  const store = readStore();
  const list = store[normOwner(ownerEmail)]?.[threadId];
  if (!Array.isArray(list)) return [];
  return list.filter(
    (m): m is StoredChatMessage =>
      m != null &&
      typeof m.text === 'string' &&
      (m.sender === 'buyer' || m.sender === 'seller' || m.sender === 'reseller')
  );
}

function writeRawThread(ownerEmail: string, threadId: string, messages: StoredChatMessage[]): void {
  const store = readStore();
  const owner = normOwner(ownerEmail);
  const row = store[owner] ?? {};
  row[threadId] = messages.slice(-200);
  store[owner] = row;
  writeStore(store);
}

export function readThreadMessagesForViewer(
  ownerEmail: string,
  threadId: string,
  viewerPersona: MessagingPersonaId
): ViewChatMessage[] {
  return readRawThread(ownerEmail, threadId).map(m => ({
    id: m.id,
    side: m.sender === viewerPersona ? ('self' as const) : ('partner' as const),
    sender: m.sender,
    text: m.text,
    sentAtMs: m.sentAtMs,
  }));
}

export function appendThreadMessage(
  ownerEmail: string,
  threadId: string,
  sender: MessagingPersonaId,
  text: string
): ViewChatMessage[] {
  const trimmed = text.trim();
  if (!trimmed) return readThreadMessagesForViewer(ownerEmail, threadId, sender);
  const prev = readRawThread(ownerEmail, threadId);
  const msg: StoredChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sender,
    text: trimmed,
    sentAtMs: Date.now(),
  };
  writeRawThread(ownerEmail, threadId, [...prev, msg]);
  return readThreadMessagesForViewer(ownerEmail, threadId, sender);
}

function pushDemoMessages(
  ownerEmail: string,
  threadId: string,
  messages: Array<{ sender: MessagingPersonaId; text: string; offsetMs: number }>
): void {
  if (readRawThread(ownerEmail, threadId).length > 0) return;
  const base = Date.now() - 3600_000;
  const seeded: StoredChatMessage[] = messages.map((m, i) => ({
    id: `demo-${threadId}-${i}`,
    sender: m.sender,
    text: m.text,
    sentAtMs: base + m.offsetMs,
  }));
  writeRawThread(ownerEmail, threadId, seeded);
}

/** Vài hội thoại mẫu giữa 3 persona (người mua / người bán / reseller). */
export function ensureDemoCrossModeMessages(ownerEmail: string, session: {
  login: string;
  displayName: string;
  email: string;
}): void {
  try {
    if (localStorage.getItem(DEMO_SEEDED_KEY) === '1') {
      /* vẫn cho phép thread trống được seed lần đầu mở */
    }
  } catch {
    /* ignore */
  }

  const buyer = resolveBuyerPersona(session);
  const seller = DEMO_SELLER_PERSONA;
  const reseller = DEMO_RESELLER_PERSONA;

  const bsId = buildBuyerSellerThreadId(buyer.login, seller.login);
  pushDemoMessages(ownerEmail, bsId, [
    {
      sender: 'buyer',
      text: 'Chào shop, mình vừa mua VPS Windows — cho mình hỏi thời gian giao hàng?',
      offsetMs: 0,
    },
    {
      sender: 'seller',
      text: 'Chào bạn! Đơn giao tự động trong 5–15 phút sau thanh toán. Cần gì cứ nhắn tại đây.',
      offsetMs: 120_000,
    },
    {
      sender: 'buyer',
      text: 'Ok shop, mình chờ nhận hàng trong đơn nhé.',
      offsetMs: 240_000,
    },
  ]);

  const brId = buildResellerBuyerThreadId(reseller.login, buyer.login);
  pushDemoMessages(ownerEmail, brId, [
    {
      sender: 'reseller',
      text: 'Chào bạn! Mình là Reseller giới thiệu — đơn qua link mình hỗ trợ nhanh nhé.',
      offsetMs: 0,
    },
    {
      sender: 'buyer',
      text: 'Chào bạn, mình đã mua qua link Reseller của bạn rồi.',
      offsetMs: 90_000,
    },
    {
      sender: 'reseller',
      text: 'Cảm ơn bạn! Có vấn đề đơn hàng cứ nhắn trực tiếp tại đây.',
      offsetMs: 180_000,
    },
  ]);

  const srId = buildSellerResellerThreadId(seller.login, reseller.login);
  pushDemoMessages(ownerEmail, srId, [
    {
      sender: 'seller',
      text: 'Chào Reseller, đơn ORD-882715 hoa hồng đã đối soát chưa?',
      offsetMs: 0,
    },
    {
      sender: 'reseller',
      text: 'Shop ơi, hoa hồng vào ví Reseller rồi — bạn kiểm tra lịch sử giúp mình.',
      offsetMs: 150_000,
    },
  ]);

  try {
    localStorage.setItem(DEMO_SEEDED_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** Tìm hội thoại theo tên đối tác hoặc nội dung tin trong thread. */
export function threadMatchesSearchQuery(
  ownerEmail: string,
  threadId: string,
  partner: {
    displayName: string;
    loginName?: string;
    storeName?: string;
  },
  lastPreview: string,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const fields = [
    partner.displayName,
    partner.loginName,
    partner.storeName,
    lastPreview,
  ]
    .filter((s): s is string => Boolean(s?.trim()))
    .map(s => s.toLowerCase());
  if (fields.some(f => f.includes(q))) return true;
  return readRawThread(ownerEmail, threadId).some(m => m.text.toLowerCase().includes(q));
}

export function getLastMessagePreview(
  ownerEmail: string,
  threadId: string
): { text: string; sentAtMs: number } | null {
  const list = readRawThread(ownerEmail, threadId);
  if (!list.length) return null;
  const last = list[list.length - 1];
  return { text: last.text, sentAtMs: last.sentAtMs };
}
