# Giao diện khối Hero guest — `StorefrontGuestLanding` (đồng bộ shop hub)

Hero đầu trang **khách** dùng cùng **ngôn ngữ giao diện** với [storefront-shop-hub-hero-ui.md](./storefront-shop-hub-hero-ui.md): thẻ gradient slate/emerald, blob mờ, chữ gradient `font-display`, CTA và **thanh tìm kiếm** `bg-white/90` một hàng.

**Nguồn triển khai:** `src/components/StorefrontGuestLanding.tsx` (section `container` đầu `main`).

---

## 1. Thẻ ngoài (giống shop hub)

| Thuộc tính | Tailwind |
|------------|----------|
| Bo góc | `rounded-[1.75rem] sm:rounded-[2rem]` |
| Viền / nền | `border border-slate-200/70 bg-gradient-to-br from-white via-slate-50/95 to-emerald-50/40` |
| Đổ bóng / ring | `shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)] ring-1 ring-white/60` |
| Padding | `p-5 sm:p-7 md:p-8` |
| Blob | `bg-emerald-400/15 blur-3xl` (góc phải trên), `bg-teal-400/10 blur-3xl` (góc trái dưới) |

---

## 2. Hàng trên: copy + thẻ trang trí (`lg`)

- **Eyebrow:** `text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600/90` — «Chợ MMO số 1 Việt Nam» (`motion.p`).
- **H1:** gradient chữ slate / emerald-teal xen kẽ cho «Giao dịch», «An toàn», «&», «Nhanh chóng»; `br` chỉ `lg+`.
- **Mô tả:** `text-sm text-slate-600`, nhấn `font-medium text-slate-800` trên «bảo đảm tuyệt đối».
- **CTA:** «Khám phá ngay» — gradient `from-emerald-500 via-emerald-500 to-teal-600`; «Đăng ký bán hàng» — viền emerald + `bg-white/90` + icon `Store` (cùng kiểu nút phụ shop hub).
- **Cột phải (`hidden lg:grid`):** bốn thẻ mock `bg-white/90`, viền `slate-200/80`, shadow nhẹ, icon tròn màu; thanh giả `bg-slate-200/90` / `bg-slate-100`.

---

## 3. Thanh tìm (cùng pattern `StorefrontShopHubSections`)

Khối: `mt-6 sm:mt-7 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 p-1.5 sm:p-2` + inset shadow + `backdrop-blur-sm`.

Hàng (`sm:flex-row`): ô search (icon trong hộp trắng + input) → divider dọc → select **Loại** (`LayoutGrid`, `aria-label="Loại tìm kiếm"`) → divider → select **Sắp xếp** (`Clock`) → nút **Tìm kiếm** gradient.

- Nút **Tìm kiếm** và **Khám phá ngay:** `scrollToId('guest-danh-sach-san-pham')`.

---

## 4. Responsive

- Thanh tìm: cột trên mobile, hàng từ `sm` (giống shop hub).
- Lưới mock: chỉ `lg+`; mobile chỉ thấy copy + CTA + thanh tìm.

---

*Tài liệu mô tả UI sau khi đồng bộ với shop hub; chỉnh song song với `StorefrontGuestLanding.tsx` khi đổi class.*
