# Lịch sử giao dịch (storefront) — Buying / Refund / Top-up / Selling

Tài liệu mô tả **tab «Lịch sử giao dịch»** trên storefront (trong `HomeView`) và các quy tắc đồng bộ khi:

- Khách **thanh toán** (trừ ví) → thêm dòng **Buying** (âm).
- Đơn hàng **Thất bại** sau khi đã thanh toán → **hoàn tiền** → thêm dòng **Refund** (dương) và **cộng lại ví**.

---

## Khái niệm dữ liệu

### `PaymentHistoryItem` (storefront)

Mỗi dòng lịch sử giao dịch của khách là một `PaymentHistoryItem` trong `HomeView.tsx`, có các trường chính:

- **`id`**: id nội bộ dùng chống trùng.
  - Dòng thanh toán: `chk-${orderId}`
  - Dòng hoàn tiền: `refund-${orderId}`
- **`date`**: thời gian hiển thị (format `DD/MM/YYYY HH:mm`).
- **`type`**: `'Sponsorship' | 'Selling' | 'Buying' | 'Top-up' | 'Refund'`
- **`amount`**:
  - `Buying`: số **âm** (trừ ví)
  - `Refund`: số **dương** (cộng ví)
- **`transactionCode`**: **mã đơn giao dịch** dạng `GD-xxxxxx` (ví dụ `GD-000001`), dùng để bấm mở/nhận diện dòng.
- **`reason`**: mô tả ngắn.

> Ghi chú: Lịch sử giao dịch hiển thị = `paymentHistoryCheckoutItems` (state thật) + `PAYMENT_HISTORY_MOCK_HISTORY` (mẫu).

---

## Quy tắc nghiệp vụ (storefront)

### 1) Khi thanh toán thành công (trừ ví)

Khi khách bấm thanh toán và trừ ví thành công, hệ thống tạo:

- **Dòng lịch sử**:
  - `type: 'Buying'`
  - `amount: -amountVnd`
  - `transactionCode: orderId` (mã `GD-...`)
  - `id: chk-${orderId}`
- **Đơn hàng**: `Order.checkoutPaid = true` (đánh dấu đã trừ ví).

Mục tiêu:

- Tab «Lịch sử giao dịch» hiển thị được dòng thanh toán ngay sau khi mua.
- Số dư ví được cập nhật theo `walletBalanceVnd`.

### 2) Khi đơn hàng thất bại (hoàn tiền đúng số đã mua)

Khi một đơn đã thanh toán (`checkoutPaid === true`) chuyển sang **`status: 'Thất bại'`**, hệ thống sẽ:

- **Hoàn tiền vào ví**: cộng lại `walletBalanceVnd` đúng số tiền hoàn.
- **Tạo dòng lịch sử hoàn tiền**:
  - `type: 'Refund'`
  - `amount: +refundVnd` (dương)
  - `transactionCode: orderId` (cùng mã `GD-...` với dòng Buying)
  - `id: refund-${orderId}`
  - `reason`: `Hoàn tiền đơn hàng thất bại (GD-...).`

Nguồn số tiền hoàn (ưu tiên):

1. `Order.refund` (nếu có)
2. fallback `Order.totalAmount`

Điều kiện an toàn để tránh cộng ví sai:

- Chỉ hoàn khi **đơn đã checkout** (`checkoutPaid`).
- Chỉ hoàn khi số tiền parse ra **> 0**.
- Chống trùng dòng hoàn tiền bằng `id: refund-${orderId}`.

> Lưu ý về React Strict Mode: effect có thể chạy 2 lần lúc dev; cần cơ chế chống cộng ví 2 lần (đã dùng Set ghi nhận orderId đã hoàn).

---

## Hiển thị số dư trước/sau trong bảng

Trong tab «Lịch sử giao dịch», số dư trước/sau được tính theo quy tắc:

- Danh sách hiển thị là **từ mới → cũ**.
- Neo vào **số dư ví hiện tại** (`walletBalanceVnd`) làm `balanceAfter` của dòng mới nhất.
- Với mỗi dòng:
  - `balanceBefore = balanceAfter - item.amount`
  - rồi cập nhật `balanceAfter = balanceBefore` cho dòng kế tiếp.

Điều này đảm bảo:

- `Buying` (âm) làm số dư sau **giảm**.
- `Refund` (dương) làm số dư sau **tăng**.

---

## Liên kết code tham chiếu

| Phần | File |
|------|------|
| Kiểu đơn `Order` + `checkoutPaid` + `status` | [`src/ordersTypes.ts`](../src/ordersTypes.ts) |
| Ghi lịch sử `Buying` sau thanh toán | [`src/HomeView.tsx`](../src/HomeView.tsx) — `onCheckoutPaid` |
| Hoàn tiền khi `Thất bại` (Refund + cộng ví) | [`src/HomeView.tsx`](../src/HomeView.tsx) — effect đồng bộ theo `myPurchasedOrders` |
| Hủy đơn (chuyển `Thất bại`) trong «Đơn đã mua» | [`src/PurchasedOrdersView.tsx`](../src/PurchasedOrdersView.tsx) |

---

## Test nhanh (manual)

- Mua 1 đơn (đảm bảo trừ ví) → vào tab **Lịch sử giao dịch**:
  - Có dòng **Buying** âm, `transactionCode` là `GD-...`.
- Vào **Đơn đã mua** → hủy để đơn sang **Thất bại**:
  - Ví tăng đúng số tiền đã mua/hoàn.
  - Lịch sử có thêm dòng **Refund** dương, cùng `GD-...`.

