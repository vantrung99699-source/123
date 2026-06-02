/**
 * Quy tắc & quét nội dung nhạy cảm trong chat (SĐT, liên hệ, Zalo, web ngoài, chơi chữ).
 */
import { pushAdminNotification } from './adminNotificationsStorage';

export type SensitiveRuleCategory =
  | 'phone'
  | 'contact'
  | 'zalo_social'
  | 'external_web'
  | 'custom'
  | 'obfuscation';

export interface SensitiveKeywordRule {
  id: string;
  phrase: string;
  category: SensitiveRuleCategory;
  enabled: boolean;
  note?: string;
}

export interface SensitiveFilterSettings {
  detectPhone: boolean;
  detectUrls: boolean;
  detectObfuscation: boolean;
  customKeywords: SensitiveKeywordRule[];
  /** Một tài khoản nhắn nội dung gần giống cho nhiều người. */
  detectBulkSimilar: boolean;
  /** Số người nhận tối thiểu (≥2) để báo. */
  bulkSimilarMinRecipients: number;
  /** Độ tương đồng 0–1 (VD 0.85 = chỉ lệch vài ký tự). */
  bulkSimilarThreshold: number;
  /** Độ dài tối thiểu nội dung tin (bỏ qua «ok», «hi»…). */
  bulkSimilarMinTextLength: number;
  /** Gửi thông báo admin khi phát hiện (mỗi cụm chỉ báo một lần / phiên). */
  notifyAdminOnBulkSimilar: boolean;
}

export interface BulkSimilarRecipientHit {
  chatId: string;
  chatLabel: string;
  messageId: string;
  recipient: string;
  text: string;
  time: string;
  similarity: number;
}

export interface BulkSimilarFlag {
  id: string;
  sender: string;
  recipientCount: number;
  avgSimilarity: number;
  templateText: string;
  recipients: BulkSimilarRecipientHit[];
}

export interface SensitiveHit {
  ruleId: string;
  category: SensitiveRuleCategory;
  label: string;
  matchedText: string;
}

const STORAGE_KEY = 'taphoammo_chat_sensitive_rules_v1';

const CATEGORY_LABELS: Record<SensitiveRuleCategory, string> = {
  phone: 'Số điện thoại',
  contact: 'Liên hệ',
  zalo_social: 'Zalo / MXH',
  external_web: 'Web / link ngoài',
  custom: 'Từ khóa tùy chỉnh',
  obfuscation: 'Chơi chữ / lách',
};

/** Từ khóa mặc định — admin có thể tắt/xóa/thêm. */
export const DEFAULT_SENSITIVE_KEYWORDS: SensitiveKeywordRule[] = [
  { id: 'kw-zalo', phrase: 'zalo', category: 'zalo_social', enabled: true },
  { id: 'kw-zalo-me', phrase: 'zalo me', category: 'zalo_social', enabled: true },
  { id: 'kw-tele', phrase: 'telegram', category: 'zalo_social', enabled: true },
  { id: 'kw-fb', phrase: 'facebook', category: 'zalo_social', enabled: true },
  { id: 'kw-ib', phrase: 'inbox', category: 'contact', enabled: true },
  { id: 'kw-lh', phrase: 'liên hệ', category: 'contact', enabled: true },
  { id: 'kw-lh2', phrase: 'lien he', category: 'contact', enabled: true },
  { id: 'kw-sdt', phrase: 'sđt', category: 'phone', enabled: true },
  { id: 'kw-sdt2', phrase: 'sdt', category: 'phone', enabled: true },
  { id: 'kw-dt', phrase: 'điện thoại', category: 'phone', enabled: true },
  { id: 'kw-hotline', phrase: 'hotline', category: 'phone', enabled: true },
  { id: 'kw-call', phrase: 'gọi trực tiếp', category: 'contact', enabled: true },
  { id: 'kw-web', phrase: 'website', category: 'external_web', enabled: true },
  { id: 'kw-add', phrase: 'kết bạn ngoài', category: 'contact', enabled: true },
  { id: 'kw-wa', phrase: 'whatsapp', category: 'zalo_social', enabled: true },
];

export function getSensitiveCategoryLabel(cat: SensitiveRuleCategory): string {
  return CATEGORY_LABELS[cat] ?? cat;
}

export function defaultSensitiveFilterSettings(): SensitiveFilterSettings {
  return {
    detectPhone: true,
    detectUrls: true,
    detectObfuscation: true,
    customKeywords: DEFAULT_SENSITIVE_KEYWORDS.map(k => ({ ...k })),
    detectBulkSimilar: true,
    bulkSimilarMinRecipients: 2,
    bulkSimilarThreshold: 0.85,
    bulkSimilarMinTextLength: 12,
    notifyAdminOnBulkSimilar: true,
  };
}

function clampBulkRecipients(n: number): number {
  if (!Number.isFinite(n)) return 2;
  return Math.min(50, Math.max(2, Math.round(n)));
}

function clampSimilarityThreshold(n: number): number {
  if (!Number.isFinite(n)) return 0.85;
  return Math.min(0.99, Math.max(0.5, n));
}

function normalizeSettings(raw: unknown): SensitiveFilterSettings {
  const def = defaultSensitiveFilterSettings();
  if (!raw || typeof raw !== 'object') return def;
  const s = raw as Partial<SensitiveFilterSettings>;
  return {
    detectPhone: s.detectPhone !== false,
    detectUrls: s.detectUrls !== false,
    detectObfuscation: s.detectObfuscation !== false,
    customKeywords: Array.isArray(s.customKeywords)
      ? s.customKeywords.filter(
          k => k && typeof k.id === 'string' && typeof k.phrase === 'string'
        )
      : def.customKeywords,
    detectBulkSimilar: s.detectBulkSimilar !== false,
    bulkSimilarMinRecipients: clampBulkRecipients(
      Number(s.bulkSimilarMinRecipients) || def.bulkSimilarMinRecipients
    ),
    bulkSimilarThreshold: clampSimilarityThreshold(
      Number(s.bulkSimilarThreshold) || def.bulkSimilarThreshold
    ),
    bulkSimilarMinTextLength: Math.min(
      200,
      Math.max(5, Math.round(Number(s.bulkSimilarMinTextLength) || def.bulkSimilarMinTextLength))
    ),
    notifyAdminOnBulkSimilar: s.notifyAdminOnBulkSimilar !== false,
  };
}

export function readSensitiveFilterSettings(): SensitiveFilterSettings {
  if (typeof window === 'undefined') return defaultSensitiveFilterSettings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSensitiveFilterSettings();
    const parsed = JSON.parse(raw) as unknown;
    return normalizeSettings(parsed);
  } catch {
    return defaultSensitiveFilterSettings();
  }
}

export function writeSensitiveFilterSettings(settings: SensitiveFilterSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSettings(settings)));
  } catch {
    /* ignore quota */
  }
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

/** Độ giống 0–1 sau chuẩn hóa / bỏ chơi chữ. */
export function textSimilarityScore(a: string, b: string): number {
  const na = collapseObfuscation(a);
  const nb = collapseObfuscation(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const dist = levenshteinDistance(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return maxLen === 0 ? 0 : 1 - dist / maxLen;
}

export interface OutgoingChatMessage {
  chatId: string;
  chatLabel: string;
  messageId: string;
  sender: string;
  recipient: string;
  text: string;
  time: string;
  normalized: string;
}

export function resolveOtherParticipant(
  participants: string[],
  sender: string
): string {
  const others = participants.filter(p => p !== sender);
  return others[0] ?? participants.join(' · ');
}

export function collectOutgoingMessages(
  chats: { id: string; participants: string[]; messages: { id: string; sender: string; text: string; time: string }[] }[]
): OutgoingChatMessage[] {
  const out: OutgoingChatMessage[] = [];
  for (const chat of chats) {
    const label = chat.participants.join(' · ');
    for (const msg of chat.messages) {
      const text = msg.text?.trim() ?? '';
      if (!text || msg.sender === 'Admin') continue;
      const normalized = collapseObfuscation(text);
      if (!normalized) continue;
      out.push({
        chatId: chat.id,
        chatLabel: label,
        messageId: msg.id,
        sender: msg.sender,
        recipient: resolveOtherParticipant(chat.participants, msg.sender),
        text,
        time: msg.time,
        normalized,
      });
    }
  }
  return out;
}

export function detectBulkSimilarMessages(
  chats: { id: string; participants: string[]; messages: { id: string; sender: string; text: string; time: string }[] }[],
  settings: SensitiveFilterSettings
): BulkSimilarFlag[] {
  if (!settings.detectBulkSimilar) return [];

  const threshold = settings.bulkSimilarThreshold;
  const minRecipients = settings.bulkSimilarMinRecipients;
  const minLen = settings.bulkSimilarMinTextLength;
  const outgoing = collectOutgoingMessages(chats).filter(
    m => m.normalized.length >= minLen
  );

  const bySender = new Map<string, OutgoingChatMessage[]>();
  for (const m of outgoing) {
    const list = bySender.get(m.sender) ?? [];
    list.push(m);
    bySender.set(m.sender, list);
  }

  const flags: BulkSimilarFlag[] = [];
  const usedClusterKeys = new Set<string>();

  for (const [sender, messages] of bySender) {
    const assigned = new Set<string>();

    for (let i = 0; i < messages.length; i++) {
      const seed = messages[i];
      if (assigned.has(seed.messageId)) continue;

      const cluster: OutgoingChatMessage[] = [seed];
      assigned.add(seed.messageId);

      for (let j = i + 1; j < messages.length; j++) {
        const other = messages[j];
        if (assigned.has(other.messageId)) continue;
        const sim = textSimilarityScore(seed.text, other.text);
        if (sim >= threshold) {
          cluster.push(other);
          assigned.add(other.messageId);
        }
      }

      const byChat = new Map<string, OutgoingChatMessage>();
      for (const m of cluster) {
        const prev = byChat.get(m.chatId);
        if (!prev || m.normalized.length > prev.normalized.length) {
          byChat.set(m.chatId, m);
        }
      }

      if (byChat.size < minRecipients) continue;

      const recipients: BulkSimilarRecipientHit[] = [...byChat.values()].map(m => {
        const sim = textSimilarityScore(seed.text, m.text);
        return {
          chatId: m.chatId,
          chatLabel: m.chatLabel,
          messageId: m.messageId,
          recipient: m.recipient,
          text: m.text,
          time: m.time,
          similarity: sim,
        };
      });

      recipients.sort((a, b) => b.similarity - a.similarity);
      const avgSimilarity =
        recipients.reduce((s, r) => s + r.similarity, 0) / recipients.length;

      const clusterKey = `${sender}:${seed.normalized}:${byChat.size}`;
      if (usedClusterKeys.has(clusterKey)) continue;
      usedClusterKeys.add(clusterKey);

      flags.push({
        id: clusterKey,
        sender,
        recipientCount: recipients.length,
        avgSimilarity,
        templateText: seed.text,
        recipients,
      });
    }
  }

  return flags.sort((a, b) => b.recipientCount - a.recipientCount);
}

const BULK_NOTIFY_SESSION_KEY = 'taphoammo_bulk_similar_notified_v1';

export function notifyAdminBulkSimilarFlags(
  flags: BulkSimilarFlag[],
  settings: SensitiveFilterSettings
): void {
  if (typeof window === 'undefined' || !settings.notifyAdminOnBulkSimilar || flags.length === 0) {
    return;
  }
  let notified: string[] = [];
  try {
    const raw = sessionStorage.getItem(BULK_NOTIFY_SESSION_KEY);
    if (raw) notified = JSON.parse(raw) as string[];
  } catch {
    notified = [];
  }
  const notifiedSet = new Set(notified);
  const nextNotified = [...notified];

  for (const flag of flags) {
    if (notifiedSet.has(flag.id)) continue;
    notifiedSet.add(flag.id);
    nextNotified.push(flag.id);
    pushAdminNotification({
      type: 'warning',
      title: 'Spam tin giống nhau',
      content: `Tài khoản «${flag.sender}» gửi nội dung gần giống cho ${flag.recipientCount} người (${Math.round(flag.avgSimilarity * 100)}% giống). VD: «${flag.templateText.slice(0, 80)}${flag.templateText.length > 80 ? '…' : ''}»`,
    });
  }

  try {
    sessionStorage.setItem(BULK_NOTIFY_SESSION_KEY, JSON.stringify(nextNotified.slice(-200)));
  } catch {
    /* ignore */
  }
}

/** Bỏ dấu, thường hóa — dùng so khớp chơi chữ. */
export function normalizeForSensitiveMatch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/** Gộp khoảng trắng, bỏ ký tự chen giữa chữ (z.a.l.o → zalo). */
export function collapseObfuscation(text: string): string {
  const n = normalizeForSensitiveMatch(text);
  const noSep = n.replace(/[^a-z0-9@]+/g, '');
  const leet = noSep
    .replace(/@/g, 'a')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't');
  return leet;
}

const VN_PHONE_RE =
  /(?:\+?84|0)\s*[-.]?\s*(?:3|5|7|8|9)\s*[-.]?\s*(?:\d\s*[-.]?){7,9}\d|\b0[35789]\d{8,9}\b/g;

const URL_RE =
  /(?:https?:\/\/|www\.)[^\s]+|(?:[a-z0-9-]+\.)+(?:com|net|org|vn|io|me|link|xyz|top|shop|site)\b/gi;

const OBFUSCATION_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /z\s*[\W_]*a\s*[\W_]*l\s*[\W_]*o/gi, label: 'Zalo (chơi chữ)' },
  { re: /t\s*[\W_]*e\s*[\W_]*l\s*[\W_]*e\s*[\W_]*g\s*[\W_]*r\s*[\W_]*a\s*[\W_]*m/gi, label: 'Telegram (chơi chữ)' },
  { re: /s\s*[\W_]*d\s*[\W_]*t/gi, label: 'SĐT (chơi chữ)' },
  { re: /l\s*[\W_]*i\s*[\W_]*e\s*[\W_]*n\s*[\W_]*h\s*[\W_]*e/gi, label: 'Liên hệ (chơi chữ)' },
  { re: /\d\s+\d\s+\d\s+\d\s+\d/g, label: 'Số rời rạc' },
];

function findKeywordHits(
  text: string,
  keywords: SensitiveKeywordRule[],
  useObfuscation: boolean
): SensitiveHit[] {
  const hits: SensitiveHit[] = [];
  const plain = normalizeForSensitiveMatch(text);
  const collapsed = useObfuscation ? collapseObfuscation(text) : plain;

  for (const rule of keywords) {
    if (!rule.enabled || !rule.phrase.trim()) continue;
    const needle = normalizeForSensitiveMatch(rule.phrase);
    if (!needle) continue;

    let matched: string | null = null;
    if (plain.includes(needle)) {
      const idx = plain.indexOf(needle);
      matched = text.slice(idx, idx + rule.phrase.length) || rule.phrase;
    } else if (useObfuscation && collapsed.includes(collapseObfuscation(rule.phrase))) {
      matched = rule.phrase;
    }

    if (matched) {
      hits.push({
        ruleId: rule.id,
        category: rule.category,
        label: getSensitiveCategoryLabel(rule.category),
        matchedText: matched,
      });
    }
  }
  return hits;
}

export function scanMessageForSensitive(
  text: string,
  settings: SensitiveFilterSettings
): SensitiveHit[] {
  if (!text?.trim()) return [];
  const hits: SensitiveHit[] = [];
  const seen = new Set<string>();

  const push = (hit: SensitiveHit) => {
    const key = `${hit.ruleId}:${hit.matchedText}`;
    if (seen.has(key)) return;
    seen.add(key);
    hits.push(hit);
  };

  if (settings.detectPhone) {
    for (const m of text.matchAll(VN_PHONE_RE)) {
      if (m[0]) {
        push({
          ruleId: 'builtin-phone',
          category: 'phone',
          label: CATEGORY_LABELS.phone,
          matchedText: m[0].trim(),
        });
      }
    }
  }

  if (settings.detectUrls) {
    for (const m of text.matchAll(URL_RE)) {
      if (m[0]) {
        push({
          ruleId: 'builtin-url',
          category: 'external_web',
          label: CATEGORY_LABELS.external_web,
          matchedText: m[0].trim(),
        });
      }
    }
  }

  if (settings.detectObfuscation) {
    for (const { re, label } of OBFUSCATION_PATTERNS) {
      re.lastIndex = 0;
      for (const m of text.matchAll(re)) {
        if (m[0]) {
          push({
            ruleId: `obf-${label}`,
            category: 'obfuscation',
            label,
            matchedText: m[0].trim(),
          });
        }
      }
    }
  }

  for (const h of findKeywordHits(text, settings.customKeywords, settings.detectObfuscation)) {
    push(h);
  }

  return hits;
}

export function hasSensitiveContent(text: string, settings: SensitiveFilterSettings): boolean {
  return scanMessageForSensitive(text, settings).length > 0;
}
