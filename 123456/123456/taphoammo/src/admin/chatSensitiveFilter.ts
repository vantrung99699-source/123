/**
 * Quy tắc & quét nội dung nhạy cảm trong chat (SĐT, liên hệ, Zalo, web ngoài, chơi chữ).
 */

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
  };
}

function isSettings(raw: unknown): raw is SensitiveFilterSettings {
  if (!raw || typeof raw !== 'object') return false;
  const s = raw as SensitiveFilterSettings;
  return (
    typeof s.detectPhone === 'boolean' &&
    typeof s.detectUrls === 'boolean' &&
    typeof s.detectObfuscation === 'boolean' &&
    Array.isArray(s.customKeywords)
  );
}

export function readSensitiveFilterSettings(): SensitiveFilterSettings {
  if (typeof window === 'undefined') return defaultSensitiveFilterSettings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSensitiveFilterSettings();
    const parsed = JSON.parse(raw) as unknown;
    if (!isSettings(parsed)) return defaultSensitiveFilterSettings();
    return {
      detectPhone: parsed.detectPhone,
      detectUrls: parsed.detectUrls,
      detectObfuscation: parsed.detectObfuscation,
      customKeywords: parsed.customKeywords.filter(
        k => k && typeof k.id === 'string' && typeof k.phrase === 'string'
      ),
    };
  } catch {
    return defaultSensitiveFilterSettings();
  }
}

export function writeSensitiveFilterSettings(settings: SensitiveFilterSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore quota */
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
