# Giao diện khối Hero + thanh tìm kiếm — `StorefrontShopHubSections`

Tài liệu mô tả **giao diện** (layout, token Tailwind, hành vi) của vùng DOM: thẻ gradient bo lớn chứa tiêu đề TapHoaMMO, CTA «Đăng ký bán hàng», và hàng **tìm kiếm / danh mục / sắp xếp / Tìm kiếm**.

**Nguồn triển khai:** `src/components/StorefrontShopHubSections.tsx`  
**Ngữ cảnh:** trang chủ sau đăng nhập (gian hàng), section đầu trong `bg-slate-50 border-b border-slate-200/90`.

**Bản guest đồng bộ:** [storefront-guest-landing-hero-ui.md](./storefront-guest-landing-hero-ui.md) (`StorefrontGuestLanding`).

---

## 1. Sơ đồ cấu trúc (từ ngoài vào trong)

```
div.bg-slate-50.border-b …                    ← vỏ section nền
  section.max-w-[1700px].mx-auto.px-6 …       ← giới hạn chiều ngang
    div.relative.overflow-hidden.rounded-[1.75rem]…  ← **THẺ HERO** (card gradient)
      [2 blob trang trí: emerald / teal, blur]
      div …                                   ← hàng tiêu đề + CTA
        div.min-w-0                           ← copy: eyebrow + H2 + mô tả
        button?                               ← Đăng ký bán hàng (có props)
      div.relative.mt-6 …                     ← **THANH TÌM** (card trắng mờ)
        div.flex.flex-col.sm:flex-row …
          [ô Search + input]
          [divider dọc, ẩn mobile]
          ShopHubCategoryDropdown
          [divider]
          [ô Sort + native select]
          button Tìm kiếm
```

---

## 2. Thẻ Hero (card gradient chính)

| Thuộc tính | Giá trị (Tailwind) | Ghi chú |
|------------|-------------------|---------|
| Bo góc | `rounded-[1.75rem] sm:rounded-[2rem]` | Mobile hơi nhỏ hơn desktop |
| Viền | `border border-slate-200/70` | |
| Nền | `bg-gradient-to-br from-white via-slate-50/95 to-emerald-50/40` | Trắng → slate nhạt → tint emerald |
| Đổ bóng | `shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)]` | Bóng slate sâu, mềm |
| Viền sáng | `ring-1 ring-white/60` | Viền “sáng” mỏng |
| Padding | `p-5 sm:p-7 md:p-8` | |
| Overflow | `overflow-hidden` | Cắt blob; panel dropdown danh mục render qua **portal** để không bị clip |

### Blob trang trí (không tương tác)

- Góc trên phải: `absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl`
- Góc dưới trái: `absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl`

---

## 3. Vùng tiêu đề + CTA

### Eyebrow («Gian hàng trực tuyến»)

- `text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600/90 mb-2`

### Logo chữ «TapHoa» + «MMO»

- Container H2: `text-2xl sm:text-3xl md:text-[1.85rem] font-black tracking-tight text-slate-900 font-display`
- **TapHoa:** gradient chữ `from-slate-900 via-slate-800 to-slate-900` + `bg-clip-text text-transparent`
- **MMO:** gradient chữ `from-emerald-600 via-teal-600 to-emerald-600` + `bg-clip-text text-transparent`

### Mô tả

- `mt-2 text-sm text-slate-600 max-w-xl leading-relaxed`
- Nhấn mạnh: `text-slate-800 font-medium` trên cụm «an toàn, bảo mật nhất»

### Nút «Đăng ký bán hàng» (khi có `onDangKyBanHang`)

- `inline-flex … rounded-2xl border border-emerald-200/90 bg-white/90 px-4 py-2.5 text-sm font-bold text-emerald-800`
- `shadow-sm ring-1 ring-emerald-500/10`
- Hover: `hover:border-emerald-300 hover:bg-white hover:shadow-md hover:ring-emerald-500/20`
- Active: `active:scale-[0.98]`
- Icon: `Store` lucide, `text-emerald-600`

### Bố cục hàng tiêu đề

- `flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6`

---

## 4. Thanh tìm kiếm (card lồng trong Hero)

Khối bọc: `relative mt-6 sm:mt-7 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 p-1.5 sm:p-2`  
+ `shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] backdrop-blur-sm`

Hàng điều khiển: `flex flex-col sm:flex-row sm:items-stretch sm:gap-1 sm:min-h-[3.25rem]`

### 4.1 Ô tìm kiếm (Search)

- Nền nhóm: `rounded-xl sm:rounded-2xl bg-slate-50/80 px-3.5 py-3 sm:py-2.5 sm:pl-4`, `flex-1`, `min-w-0`
- Focus trong nhóm: `focus-within:border-emerald-300/60 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]` (trên `sm` một phần style được nới cho đồng bộ layout ngang)
- Icon bọc: `h-9 w-9 rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-slate-100`
- Input: `placeholder="Tìm sản phẩm bạn cần..."`, chữ `text-[15px] sm:text-sm`, `placeholder:text-slate-400`

### 4.2 Divider dọc (chỉ `sm`+)

- `hidden … sm:block`, `h-8 w-px`, `bg-gradient-to-b from-transparent via-slate-200 to-transparent`

### 4.3 Dropdown danh mục (`ShopHubCategoryDropdown`)

- **Trigger:** full width trong cột, `sm:min-w-[12rem]`, nền `bg-slate-50/60`, hover `bg-slate-100/80`, bo `rounded-xl sm:rounded-2xl`, `border-b border-slate-100 sm:border-0`
- Icon `LayoutGrid` chỉ hiện từ `sm` (`hidden sm:block`), màu `text-emerald-600/80`
- Nhãn: `truncate text-[13px] font-semibold text-slate-800 sm:text-xs`
- Chevron: `text-slate-400`, xoay `rotate-180` khi mở
- Focus: `focus-visible:ring-2 focus-visible:ring-emerald-500/40 … ring-offset-white`
- **Panel (portal `document.body`):** `position: fixed`, `z-index: 80`, căn theo `getBoundingClientRect`, cập nhật khi scroll/resize
- Panel style: `max-h-[min(18rem,calc(100vh-6rem))]`, `overflow-y-auto`, `rounded-xl`, `border border-slate-200/90`, `bg-white`, bóng đậm slate + `ring-1 ring-slate-900/[0.03]`
- Mục chọn: active `bg-emerald-50/95 font-semibold text-emerald-900` + icon `Check` emerald; mặc định `hover:bg-slate-50`, `text-slate-700`
- Danh sách cố định: `SHOP_HUB_CATEGORY_OPTIONS` (Tất cả danh mục, Người bán, Tài khoản, …)

### 4.4 Sắp xếp (native `<select>`)

- Khung: tương tự dropdown trigger (slate nhạt, `sm:min-w-[8.5rem]`), icon `Clock` từ `sm`
- Options: Mới nhất, Phổ biến, Giá tăng dần, Giá giảm dần
- `aria-label="Sắp xếp"`

### 4.5 Nút «Tìm kiếm»

- `rounded-xl sm:rounded-2xl`, gradient `from-emerald-500 via-emerald-500 to-teal-600`, chữ trắng đậm
- `shadow-md shadow-emerald-500/25`, hover `brightness-[1.05]`, active `scale-[0.98]`
- `onClick` → `onScrollToCatalog` (demo cuộn tới catalog)

---

## 5. Responsive

- **Mobile:** các vùng xếp **cột** (`flex-col`); divider dọc ẩn; một số icon chỉ hiện từ `sm`.
- **Tablet/desktop (`sm`+):** hàng **ngang**, divider, `min-h` thanh cố định, căn `items-stretch`.

---

## 6. Token màu tóm tắt (chuỗi thương hiệu)

| Vai trò | Palette |
|---------|---------|
| Nền app / section | `slate-50`, `slate-200` viền |
| Thương hiệu / CTA | `emerald-500`–`600`, `teal-600` |
| Chữ phụ | `slate-600`, `slate-700` |
| Chữ chính | `slate-800`, `slate-900` |
| Focus / chọn | `emerald-300`, `emerald-50`, ring `emerald-500` |

---

## 7. Ghi chú triển khai

- Card Hero dùng `overflow-hidden`: menu danh mục **không** nằm trong card mà **portal** ra `body` để luôn hiển thị đúng lớp và vị trí.
- Font display cho tiêu đề: lớp `font-display` (cấu hình Tailwind/theme dự án).

---

*Tài liệu phản ánh code tại thời điểm tạo file; nếu chỉnh class trong component, nên cập nhật lại bảng tương ứng.*
