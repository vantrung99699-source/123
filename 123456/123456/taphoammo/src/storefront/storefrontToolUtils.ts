const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input: string): Uint8Array | null {
  const cleaned = input.replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase();
  if (!cleaned) return null;
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx < 0) return null;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Uint8Array.from(output);
}

function counterToBytes(counter: number): Uint8Array {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(4, counter >>> 0, false);
  return new Uint8Array(buffer);
}

function truncateHmac(hmac: ArrayBuffer): string {
  const bytes = new Uint8Array(hmac);
  const offset = bytes[bytes.length - 1] & 0x0f;
  const binary =
    ((bytes[offset] & 0x7f) << 24) |
    ((bytes[offset + 1] & 0xff) << 16) |
    ((bytes[offset + 2] & 0xff) << 8) |
    (bytes[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
}

export async function generateTotpCode(secret: string, atMs = Date.now()): Promise<string | null> {
  const key = base32Decode(secret);
  if (!key || key.length === 0) return null;
  const counter = Math.floor(atMs / 1000 / 30);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const hmac = await crypto.subtle.sign('HMAC', cryptoKey, counterToBytes(counter));
  return truncateHmac(hmac);
}

export function extractFacebookUid(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d{8,20}$/.test(trimmed)) return trimmed;

  const idFromQuery = trimmed.match(/[?&]id=(\d{8,20})/i);
  if (idFromQuery) return idFromQuery[1];

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const id = url.searchParams.get('id');
    if (id && /^\d{8,20}$/.test(id)) return id;
    const pathMatch = url.pathname.match(/\/(\d{8,20})(?:\/|$)/);
    if (pathMatch) return pathMatch[1];
  } catch {
    return null;
  }
  return null;
}

export type FbLiveCheckStatus = 'live' | 'die' | 'invalid';

export interface FbLiveCheckRow {
  input: string;
  uid: string | null;
  status: FbLiveCheckStatus;
}

/** Demo: hash UID để mô phỏng live/die — production cần API thật. */
export function demoCheckFacebookLive(uid: string): FbLiveCheckStatus {
  if (!/^\d{8,20}$/.test(uid)) return 'invalid';
  let sum = 0;
  for (const ch of uid) sum += ch.charCodeAt(0);
  return sum % 3 === 0 ? 'die' : 'live';
}

export function parseUidList(text: string): string[] {
  return text
    .split(/[\n,;|\s]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

export type CutFilterMergeCutMode = 'value' | 'column';

export function parseCutColumnIndices(target: string): number[] {
  const seen = new Set<number>();
  const indices: number[] = [];
  for (const token of target.split(/[,;\s]+/)) {
    const columnIndex = Number.parseInt(token.trim(), 10);
    if (!Number.isFinite(columnIndex) || columnIndex < 1 || seen.has(columnIndex)) continue;
    seen.add(columnIndex);
    indices.push(columnIndex);
  }
  return indices;
}

export function cutLineByDelimiter(
  line: string,
  delimiter: string,
  mode: CutFilterMergeCutMode,
  target: string
): string {
  if (!delimiter) return line;
  const parts = line.split(delimiter);
  const trimmedTarget = target.trim();
  const filtered =
    mode === 'column'
      ? (() => {
          const columnsToRemove = new Set(parseCutColumnIndices(trimmedTarget));
          if (columnsToRemove.size === 0) return parts;
          return parts.filter((_, index) => !columnsToRemove.has(index + 1));
        })()
      : parts.filter(part => part !== trimmedTarget);
  return filtered.join(delimiter);
}

export function processCutFilterMerge(
  text: string,
  options: {
    removeEmpty: boolean;
    removeDuplicates: boolean;
    cutEnabled: boolean;
    cutDelimiter: string;
    cutMode: CutFilterMergeCutMode;
    cutTarget: string;
  }
): string {
  let lines = text.split(/\r?\n/);
  if (options.removeEmpty) {
    lines = lines.map(l => l.trim()).filter(Boolean);
  }
  if (options.removeDuplicates) {
    const seen = new Set<string>();
    lines = lines.filter(line => {
      const key = line.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  if (options.cutEnabled && options.cutDelimiter.trim() && options.cutTarget.trim()) {
    const delimiter = options.cutDelimiter;
    lines = lines.map(line =>
      cutLineByDelimiter(line, delimiter, options.cutMode, options.cutTarget)
    );
  }
  return lines.join('\n');
}
