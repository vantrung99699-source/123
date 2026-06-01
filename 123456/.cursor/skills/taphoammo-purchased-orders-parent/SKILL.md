---
name: taphoammo-purchased-orders-parent
description: >-
  Component cha bảng «Đơn đã mua» (PurchasedOrdersView): mỗi hàng theo mã đơn order.id;
  cột Hành động và modal đổi theo order.status; cập nhật state bằng setOrders map theo id.
  Dùng khi sửa PurchasedOrdersView, thêm nút/hành động theo trạng thái, hoặc đồng bộ hủy đơn / khiếu nại.
---

# Component cha bảng đơn đã mua (`PurchasedOrdersView`)

## Vai trò component cha

- **File:** `123456/taphoammo/src/PurchasedOrdersView.tsx`
- **Nguồn dữ liệu:** props `orders` + `setOrders` (state thật nằm ở `App.tsx`, không tách mảng đơn vào con để mất đồng bộ khi chuyển tab).
- **Khóa logic:** mọi thay đổi sau hành động phải xác định đúng **`order.id`** (mã đơn `GD-######`, `ORD-…`, v.v.) rồi cập nhật **đúng một** phần tử trong mảng.

Nguyên tắc: **một dòng = một `Order`**; UI cột **Hành động**, **Hoàn tiền**, **Trạng thái** là **phản chiếu** object đó sau khi `setOrders` chạy.

## Cập nhật theo mã đơn (pattern bắt buộc)

```ts
setOrders(prev =>
  prev.map(o => (o.id === orderId ? { ...o, /* patch */ } : o))
);
```

Không tìm index rồi splice trừ khi có lý do đặc biệt; `map` theo `id` tránh lệch hàng khi filter/sort.

## Hành động → patch `Order` (tham chiếu hiện tại)

| Hành động UI | Điều kiện / mở modal | `orderId` | Patch chính |
|--------------|----------------------|-----------|-------------|
| **Khiếu nại** | `status === 'Đang thực hiện'` hoặc `'Tạm giữ tiền'`; mở modal gắn `selectedOrderForComplaint` | id đơn được chọn | Sau confirm: `status: 'Khiếu nại'`, `previousStatus`, `hasComplained: true`, `complaintReason` |
| **Hủy khiếu nại** | `status === 'Khiếu nại'` hoặc `'Tranh chấp'` | id dòng | `status: 'Tạm giữ tiền'`, bỏ `previousStatus` (theo code hiện tại) |
| **Hủy đơn** | `status === 'Chờ xác nhận'`; modal `selectedOrderForCancel` | id đơn | `status: 'Thất bại'`, `refund: order.totalAmount` |
| **Đánh giá / Nhắn tin** | Hiển thị theo trạng thái (một số trạng thái chỉ có nút, chưa gắn handler trong mock) | — | Khi implement: vẫn truyền hoặc đóng `order.id` |

Modal **luôn** hiển thị `selectedOrderForCancel.id` / `selectedOrderForComplaint.id` trong tiêu đề để khớp mã đơn người dùng đang thao tác.

## Cột Hành động theo `order.status`

Render **theo từng hàng** (trong `filteredOrders.map`): chỉ hiện nút phù hợp `order.status`:

- **Hoàn thành:** Nhắn tin + Đánh giá
- **Đang thực hiện:** Nhắn tin + Khiếu nại
- **Khiếu nại** / **Tranh chấp:** Nhắn tin + Hủy khiếu nại
- **Chờ xác nhận:** Nhắn tin + Hủy đơn (mở modal)
- **Tạm giữ tiền:** Nhắn tin + Đánh giá + Khiếu nại
- **Thất bại:** chỉ Nhắn tin (hoặc tối thiểu như thiết kế)

Khi thêm trạng thái mới trong `OrderStatus` (`ordersTypes.ts`), cập nhật **cả** `getStatusStyle`, filter dropdown, và nhánh nút ở đây.

## Badge trạng thái

Dùng **`src/orderStatusBadge.ts`**: `ORDER_STATUS_BADGE_BASE` + `getOrderStatusStyle(status)` — cùng nguồn với skill **`taphoammo-order-status-badges`**.

### Admin Lịch sử giao dịch (`PaymentHistoryView`)

- Nhận prop **`orders`** (cùng nguồn `allOrders` từ `App`).
- **Ưu tiên** hiển thị **`Order.status`** + màu `getOrderStatusStyle` khi trace được đơn:
  1. `orders` có phần tử `id === tx.id` (giao dịch đồng bộ thanh toán dùng `id` = mã đơn `GD-…`).
  2. Hoặc parse mã đơn từ `reason`: `Thanh toán cho đơn hàng {id}`, `mã đơn hàng: {id}`, `…không hoàn thành({id})`.
- Nếu không có đơn khớp: fallback nhãn giao dịch `tx.status` (`Thành công` / `Chờ duyệt` / `Thất bại`) với map tương đương `OrderStatus` (`Hoàn thành` / `Chờ xác nhận` / `Thất bại`) cho màu badge.

## Liên quan

- Kiểu `Order` / `OrderStatus`: `src/ordersTypes.ts`
- Luồng thanh toán tạo đơn + mã `GD-######`: skill **`thanh-toan`**
- Hủy đơn chi tiết nghiệp vụ (nếu có): `huy_don.md`

## Khi tách component con (tùy chọn)

Nếu tách **`OrderRowActions`** hoặc **`PurchasedOrderRow`**:

- Con nhận `order: Order` + callbacks `(orderId: string) => void` hoặc handler đã bound `order.id`.
- **Không** giữ bản sao `orders` trong state cục bộ của con; cha vẫn là chủ `setOrders`.
- Modal vẫn ở **cha** (một overlay, `selectedOrder*` theo id) tránh trùng lặp và lệch mã đơn.

## Không làm

- Không cập nhật đơn bằng index từ `filteredOrders` thay cho `order.id` (filter đổi → sai đơn).
- Không đổi màu badge trạng thái tùy ý ngoài bảng chuẩn badge đơn hàng.
