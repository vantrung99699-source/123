# Đặc tả UI: ô **Mã đơn / Ngày / Người bán** (bảng Đơn hàng đã mua)

Tham chiếu mã: `src/PurchasedOrdersView.tsx` (cột thứ 2 trong `<tbody>`).

## Bố cục tổng thể

| Cấp | Mô tả |
|-----|--------|
| Bảng | `table.w-full text-left border-collapse min-w-[960px]` trong `div.overflow-x-auto.overflow-y-visible` |
| Hàng | `tr.hover:bg-slate-50/50.transition-colors.group` |
| **Ô dữ liệu** | `td.py-4.px-4.border-r.border-slate-300` |
| Khối nội dung | `div.flex.flex-col.gap-1.5` — xếp **dọc**, khoảng cách dọc `0.375rem` (6px) |

Thứ tự block trong ô (từ trên xuống):

1. Khối mã đơn (+ dòng phụ bảo hành nếu có).
2. Dòng ngày mua + icon lịch.
3. Chip tên người bán (pill).

---

## 1. Mã đơn (`order.id`)

**Vỏ:** `div.flex.flex-col` (chứa mã + các dòng bảo hành tùy điều kiện).

**Mã đơn (click mở chi tiết):**

| Thuộc tính | Giá trị (Tailwind) |
|------------|---------------------|
| Font size | `text-sm` (14px) |
| Font weight | `font-bold` |
| Font family | `font-mono` |
| Màu chữ | `text-blue-600` |
| Theo ký tự | `tracking-tight` |
| Tương tác | `hover:underline`, `cursor-pointer` |
| Semantics | `role="button"`, `tabIndex={0}` |

---

## 2. Dòng phụ bảo hành (chỉ khi có dữ liệu)

**`warrantedFromId` — “đơn hàng bảo hành từ đơn”**

- `text-[10px] text-rose-500 font-bold italic mt-0.5`
- Link “xem ngay”: `underline cursor-pointer`

**`isWarrantyProcessed` — “đơn hàng đã hỗ trợ bảo hành”**

- `text-[10px] text-amber-600 font-bold italic mt-0.5`
- Mã đơn con: `underline cursor-pointer`

---

## 3. Ngày mua (`order.purchaseDate`)

**Wrapper:** `span.text-xs.text-slate-600.font-bold.flex.items-center.gap-1.shrink-0.whitespace-nowrap`

| Phần tử | Class / ghi chú |
|---------|------------------|
| Icon `Calendar` | `size={13}`, `className="text-slate-500"` |
| Chữ ngày | kế icon, cùng dòng; `text-xs` + `text-slate-600` + `font-bold` |

---

## 4. Người bán (`order.sellerName`)

**Pill (chip):** `div.flex.items-center.gap-1.5.px-2.py-0.5.bg-blue-50.text-blue-600.rounded-full.border.border-blue-100.text-[10px].font-bold.hover:underline.cursor-pointer.transition-all.w-fit`

| Phần tử | Class / ghi chú |
|---------|------------------|
| Icon `User` (lucide-react — hình người, không dùng gói hàng) | `size={10}`, `className="text-blue-400 shrink-0"`, `strokeWidth={2.5}`, `aria-hidden` |
| Tên seller | `text-blue-600`, cỡ `text-[10px]`, `font-bold` |
| Nền / viền | `bg-blue-50`, `border-blue-100` |

---

## 5. Cột tiêu đề (thead) cùng cột

**`<th>`:** `py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200`

- Nhãn: **“Mã đơn / Ngày / Người bán”**
- Font display (Outfit / `font-display` theo theme Tailwind của project), chữ hoa, tracking rộng.

---

## 6. Bảng màu tóm tắt

| Vùng | Màu chữ | Nền / viền (nếu có) |
|------|---------|----------------------|
| Mã đơn | `#2563eb` (`blue-600`) | — |
| Icon lịch | `slate-500` | — |
| Ngày | `slate-600` | — |
| Chip seller | `blue-600` | `bg-blue-50`, `border-blue-100` |
| Icon người trong chip (`User`) | `blue-400` | — |
| Viền ô | — | `border-slate-300` (cạnh phải) |

---

## 7. Ghi chú khi tái hiện / Figma

- Toàn trang thường dùng **sans** hệ thống; riêng tiêu đề cột dùng **`font-display`**.
- Ô không set `text-left` riêng — kế thừa `text-left` của `table`.
- Khoảng đệm ô: **16px** ngang/dọc (`px-4 py-4`).
