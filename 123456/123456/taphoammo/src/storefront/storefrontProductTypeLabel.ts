/** Nhãn loại SP/DV hiển thị cho khách — ẩn % phí sàn ở cuối (vd. «Tài khoản FB (4%)» → «Tài khoản FB»). */
export function stripProductTypeFeePercent(label: string): string {
  return label.replace(/\s*\(\s*[\d.,]+\s*%?\s*\)\s*$/, '').trim();
}

export function uniqueCustomerProductTypeLabels(types: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of types) {
    const label = stripProductTypeFeePercent(raw);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push(label);
  }
  return out;
}
