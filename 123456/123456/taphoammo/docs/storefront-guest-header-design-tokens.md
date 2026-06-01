# Thiết kế thanh header khách — `StorefrontGuestHeader` (+ vùng auth)

Tài liệu tham chiếu **cỡ chữ**, **màu chữ**, **màu nền** (theo class Tailwind trong code). Font toàn cục lấy từ `src/index.css` (`@theme`).

---

## Font chung (dự án)

| Token | Giá trị |
|--------|---------|
| **Sans (mặc định)** | `Inter`, `ui-sans-serif`, `system-ui`, `sans-serif` |
| **Display (logo)** | `Outfit` — class `font-display` trên chữ TapHoaMMO |

Nguồn: `src/index.css` — `@import` Google Fonts Inter + Outfit.

---

## Thanh header chính (`<header>`)

| Thuộc tính | Class Tailwind | Ghi chú / quy ước |
|------------|----------------|-------------------|
| **Nền** | `bg-emerald-500` | Xanh lá chủ đạo thanh bar (Tailwind mặc định ≈ `#10b981`) |
| **Vị trí** | `fixed top-0 left-0 right-0 z-50` | Cố định đỉnh viewport |
| **Đệm dọc** | `py-3` | 12px top/bottom (0.75rem) |
| **Đổ bóng** | `shadow-md` | Bóng vừa |

### Container trong header

| Thuộc tính | Class |
|------------|--------|
| **Căn lề** | `container mx-auto px-4` |
| **Flex** | `flex items-center justify-between` |

---

## Logo + tên thương hiệu

| Phần tử | Cỡ chữ / font | Màu chữ | Màu nền / khác |
|---------|----------------|---------|----------------|
| **Ô icon Store** | — (icon 24px) | `text-emerald-500` | `bg-white`, `rounded-xl`, `w-10 h-10`, `shadow-lg` |
| **Chữ “TapHoaMMO”** | `text-xl` (1.25rem), `font-black`, `tracking-tight`, `font-display` | `text-white` | — |
| **Focus logo** | — | — | `focus-visible:ring-2 focus-visible:ring-white/70`, `rounded-lg` |

---

## Menu điều hướng (desktop, `lg:flex`)

| Thuộc tính | Class |
|------------|--------|
| **Cỡ chữ** | `text-sm` (0.875rem) |
| **Độ đậm** | `font-medium` |
| **Màu chữ** | `text-white` |
| **Hover** | `hover:text-emerald-100` |
| **Khoảng cách nav** | `gap-6` giữa các mục |
| **Icon ChevronDown** | `size={14}` |

---

## Khu vực phải header (divider + ngôn ngữ + menu mobile)

| Phần tử | Cỡ chữ / font | Màu |
|---------|----------------|-----|
| **Vạch chia (≥ sm)** | — | `bg-white/20`, `h-8 w-px` |
| **Nút ngôn ngữ (Globe + VN/EN)** | `text-sm`, `font-bold` | `text-white`, `hover:text-emerald-100` |
| **Icon Globe** | 16px | kế thừa màu trắng nút |
| **Nút hamburger / đóng (mobile)** | `p-2` | `text-white`, icon `24px` |

**Khoảng cách:** `gap-3 sm:gap-4` giữa các cụm bên phải.

---

## Panel menu mobile (`motion.div`, `lg:hidden`)

| Thuộc tính | Class |
|------------|--------|
| **Nền** | `bg-white` |
| **Chữ (liên kết)** | `text-slate-800` |
| **Mục Sản phẩm / Dịch vụ** | `font-semibold` |
| **Mục Hỗ trợ** | mặc định độ đậm (không semibold) |
| **Đường kẻ** | `h-px bg-slate-100` |
| **Vị trí** | `fixed inset-0 top-[56px] z-40`, `px-6 pt-6 pb-10` |

---

## Vùng auth trên header (`authSlot` — `StorefrontAuthDropdown`)

Các nút này **nằm trên nền `bg-emerald-500`** của header (desktop `sm:flex`).

| Nút / trạng thái | Cỡ chữ | Font | Màu chữ | Màu nền / viền |
|------------------|--------|------|---------|----------------|
| **Đăng ký bán hàng** (`md+`) | `text-xs` → `lg:text-sm` | `font-bold` | `text-white` | `bg-white/10`, `hover:bg-white/20`, `border border-white/20`, `rounded-full` |
| **Đăng nhập** (đóng) | `text-xs` → `sm:text-sm` | `font-semibold` | `text-white`, `hover:text-emerald-100` | trong suốt, `rounded-full`, `px-2.5 sm:px-3 py-2` |
| **Đăng nhập** (đang mở panel login) | như trên | như trên | `text-white` | `bg-white/20` |
| **Đăng ký** (CTA chính) | `text-xs` → `sm:text-sm` | `font-bold` | `text-emerald-600` | `bg-white`, `hover:bg-emerald-50`, `shadow-lg`, `rounded-full` |
| **Đăng ký** (đang mở panel register) | như trên | như trên | `text-emerald-600` | `bg-emerald-50` |

**Dropdown form** (trắng, không nằm trên nền xanh header): nền `bg-white`, viền `border-slate-100`, chữ tiêu đề `text-slate-800`, nhãn `text-slate-700`, input `bg-slate-50 border-slate-200`, CTA chính form `bg-emerald-500 text-white` — chi tiết trong `src/components/StorefrontAuthDropdown.tsx`.

---

## Tóm tắt bảng màu (header bar)

| Vai trò | Tailwind | Hex tham chiếu (Tailwind mặc định) |
|---------|-----------|-------------------------------------|
| Nền bar | `emerald-500` | ≈ `#10b981` |
| Chữ / icon trên bar | `white` | `#ffffff` |
| Hover chữ | `emerald-100` | ≈ `#d1fae5` |
| Nền phủ nhẹ (Đăng nhập active, nút bán hàng) | `white/10`, `white/20` | trắng 10% / 20% opacity |
| CTA “Đăng ký” nền | `white` | `#ffffff` |
| CTA “Đăng ký” chữ | `emerald-600` | ≈ `#059669` |
| Vạch chia | `white/20` | — |

---

## Đồng bộ header đã đăng nhập (`HomeView`)

Thanh header storefront khi **đã đăng nhập** dùng cùng palette token:

| Thuộc tính | Áp dụng |
|------------|---------|
| **Nền** | `bg-emerald-500` (≈ `#10b981`) |
| **Viền dưới nhẹ** | `border-b border-emerald-600/25` |
| **Đổ bóng** | `shadow-md` |
| **Logo chữ** | `text-xl font-black text-white tracking-tight font-display` |
| **Ô chữ T** | `bg-white`, `text-emerald-500`, `rounded-xl`, `shadow-lg` |
| **Nav** | `text-sm font-medium text-white`, mục con `hover:text-emerald-100`, `hover:bg-white/15` |
| **Nút nhắn tin** | `bg-white/10`, `border-white/20` (cùng nhịp với `white/10` + `white/20` trong bảng auth) |
| **Focus logo** | `focus-visible:ring-white/70` |

File: `src/HomeView.tsx` (comment trỏ về tài liệu này).

---

## File nguồn

- `src/components/StorefrontGuestHeader.tsx`
- `src/components/StorefrontAuthDropdown.tsx` (auth trên header)
- `src/index.css` (font family)
- `src/HomeView.tsx` (header đã đăng nhập — đồng bộ token)
