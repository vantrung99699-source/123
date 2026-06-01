---
name: taphoammo-order-status-badges
description: >-
  Chuẩn badge trạng thái đơn/khiếu nại dự án taphoammo (nhãn tiếng Việt + lớp Tailwind
  cố định). Dùng khi thêm/sửa bảng đơn, PurchasedOrders, ServiceOrderDetail, admin
  bán hàng, filter trạng thái, hoặc khi người dùng nhắc màu trạng thái đơn hàng.
---

# Badge trạng thái đơn (taphoammo)

Chỉ dùng **các nhãn và màu dưới đây** cho chip/badge trạng thái (không thêm trạng thái hay đổi màu tùy ý).

## Lớp chung

Áp dụng cho mọi badge dạng pill trong bảng:

`px-2.5 py-1 rounded-xl text-[11px] font-bold border whitespace-nowrap border-transparent`

## Bảng trạng thái → màu nền + chữ

| Nhãn hiển thị   | `background`   | `text`        |
|-----------------|----------------|---------------|
| Tranh chấp      | `bg-[#ef5350]` | `text-white`  |
| Chờ xác nhận    | `bg-[#ffb300]` | `text-amber-900` |
| Khiếu nại       | `bg-[#ef5350]` | `text-white`  |
| Thất bại        | `bg-[#1c2331]` | `text-white`  |
| Đang thực hiện  | `bg-[#42a5f5]` | `text-white`  |
| Hoàn thành      | `bg-[#4caf50]` | `text-white`  |
| Tạm giữ tiền    | `bg-[#2d6a61]` | `text-white`  |

**Ghi chú:** Tranh chấp và Khiếu nại dùng cùng cặp màu đỏ `#ef5350` + chữ trắng.

## Ví dụ Tailwind (một dòng)

```tsx
<span className="px-2.5 py-1 rounded-xl text-[11px] font-bold border whitespace-nowrap border-transparent bg-[#42a5f5] text-white">
  Đang thực hiện
</span>
```

## Khi chỉnh code

- Cập nhật `switch` / map `getStatusStyle` (hoặc tương đương) sao cho **mỗi nhãn trong bảng** khớp đúng cột màu.
- Không map trạng thái khác vào màu của một dòng trên (trừ khi đổi spec có chủ đích).
