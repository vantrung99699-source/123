/** Nhãn loại SP/DV trong classificationData — tên + % chiết khấu sàn */

export function parseProductTypeLabel(label: string): { name: string; platformFeePercent: number } {
  const trimmed = label.trim();
  const m = trimmed.match(/^(.+?)\s*\((\d+(?:[.,]\d+)?)%\)\s*$/);
  if (m) {
    const n = parseFloat(m[2].replace(',', '.'));
    return {
      name: m[1].trim(),
      platformFeePercent: Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0,
    };
  }
  return { name: trimmed, platformFeePercent: 0 };
}

/** Ô % để trống hoặc không hợp lệ → 5% */
export function parsePlatformFeePercent(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return 5;
  const n = parseFloat(trimmed.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return 5;
  return Math.min(n, 100);
}

export function formatProductTypeLabel(name: string, platformFeePercent: number): string {
  const n = name.trim();
  if (!n) return '';
  const p = Math.min(100, Math.max(0, platformFeePercent));
  return p > 0 ? `${n} (${p}%)` : n;
}

export function productTypesIncludeLabel(types: string[], label: string): boolean {
  const target = parseProductTypeLabel(label);
  return types.some((t) => {
    const p = parseProductTypeLabel(t);
    return p.name.toLowerCase() === target.name.toLowerCase();
  });
}
