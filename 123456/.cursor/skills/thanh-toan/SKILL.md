---
name: thanh-toan
description: >-
  Đồng bộ thanh toán storefront với tab Lịch sử giao dịch (HomeView): mỗi lần thanh toán
  tạo đơn phải thêm dòng giao dịch có đúng mã đơn hàng và số tiền VND đã trừ ví (amount âm,
  type Buying). Dùng khi sửa ProductDetailView, HomeView payment history, hoặc khi người
  dùng nhắc thanh_toan / lịch sử giao dịch sau thanh toán.
---

# Thanh toán → Lịch sử giao dịch (`thanh_toan`)

## Quy tắc

1. Sau **Thanh toán** thành công (modal chi tiết sản phẩm), đơn có `id` mới dạng **`GD-XXXXXX`** — đúng **6 chữ số** sau dấu gạch (ví dụ `GD-343232`), trùng với mã trên lịch sử giao dịch.
2. Tab **Lịch sử giao dịch** phải có **một dòng** tương ứng:
   - **`transactionCode`** = **`orderId`** = `Order.id` (một chuỗi `GD-…` duy nhất, không gọi `Date.now()` lần hai cho cột GD).
   - **Mã đơn** trong `reason`: `Thanh toán cho đơn hàng {orderId}` (cùng chuỗi với cột mã GD).
   - **`amount`** (số trong cột Số tiền) = **đúng số tiền đã thanh toán** — dạng **âm** (chi ví), ví dụ thanh toán 150.000đ → `amount: -150000`.
   - `type`: **`Buying`**.
   - `date`: cùng chuỗi `purchaseDate` với đơn (`formatPurchaseDateNow()`).
3. Dòng mới **đứng trên** mock cũ: state lịch sử storefront nằm **`App.tsx`** (prop vào `HomeView`), prepend merge `[...checkout, ...PAYMENT_HISTORY_MOCK_HISTORY]` — không giữ trong `HomeView` để tránh mất dữ liệu khi vào Admin (unmount).
4. Công thức số dư chạy dưới cột số tiền dùng **cùng danh sách merge** + `walletBalanceVnd` hiện tại.
5. **Badge cột Trạng thái** (tab Lịch sử giao dịch `HomeView` + admin `PaymentHistoryView`): pill chung `px-2.5 py-1 rounded-xl text-[11px] font-bold border whitespace-nowrap border-transparent`; **Thành công / Hoàn thành** → `bg-[#4caf50] text-white`; **Chờ duyệt** → `bg-[#ffb300] text-amber-900`; **Thất bại** → `bg-[#1c2331] text-white` (cùng bảng màu skill `taphoammo-order-status-badges`).

## Triển khai tham chiếu (repo)

- `ProductDetailView`: prop `onCheckoutPaid?.({ orderId, amountVnd, purchaseDate })` gọi ngay sau khi tạo đơn + trừ ví.
- `HomeView`: `setPaymentHistoryCheckoutItems` với `transactionCode: orderId`, `amount: -amountVnd`; đồng thời `onSyncAdminPaymentHistory` → `App` prepend `PaymentHistory` (mã `GD-######`, `userId`/`name` người mua, `sellerName` chip người bán, số dư & lý do khớp thanh toán).
- Admin `PaymentHistoryView`: merge `[...extraRows, ...PAYMENT_HISTORY]`; cột **Người dùng** = `tx.userId` + `tx.name` từng dòng (không lấy session cho mọi hàng).
- Chi tiết field đơn: `thanh_toan.md` ở root project taphoammo.

## Không làm

- Không ghi số tiền dương cho khoản **mua / trừ ví** trong lịch sử giao dịch (trừ khi đổi spec toàn hệ thống).
- Không tách mã đơn khỏi dòng giao dịch (reason hoặc cột riêng phải trace được `orderId`).
