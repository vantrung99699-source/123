# Đơn sản phẩm storefront — Tạm giữ tiền sau mua

> Tài liệu nghiệp vụ để team / AI context không quên. Cursor rule: `.cursor/rules/storefront-order-status.mdc`

## Quy tắc

Sau khi khách mua hàng thành công (**sản phẩm**, không áp dụng thay đổi này cho đơn dịch vụ trừ khi được mô tả riêng):

1. **`Order.status` = `Tạm giữ tiền`** — luôn luôn, ngay sau thanh toán.
2. Sàn giữ tiền để xử lý rủi ro sản phẩm lỗi / khiếu nại.
3. Giao hàng vào kho người mua (`deliveredItems`, «Đi tới kho hàng») **không** đồng nghĩa `Hoàn thành` hay giải phóng tiền cho seller.

## Luồng kỹ thuật (tóm tắt)

```
Thanh toán → fulfillPurchase (trừ kho seller, deliveredItems)
          → tạo Order (status: Tạm giữ tiền, checkoutPaid: true)
          → UI: Đang xử lý → Thành công → Đi tới kho hàng
```

## Tự hoàn tất sau 3 ngày

Đơn **`status === 'Tạm giữ tiền'`** (SP/DV, đã thanh toán):

- Sau **3 ngày** kể từ `escrowHoldStartedAtMs` / `createdAtMs` → **`Hoàn thành`**.
- Logic: `src/storefront/escrowAutoComplete.ts`; nút **+3 ngày** mô phỏng hết hạn tạm giữ.

Đang **`Khiếu nại`** / **`Tranh chấp`** → **không** tự hoàn tất tạm giữ. **Hủy khiếu nại** về lại **Tạm giữ tiền** → tiếp tục đếm 3 ngày (`hasComplained` chỉ chặn khiếu nại lần 2, không chặn giải ngân).

## Đơn dịch vụ — Tạm giữ tiền sau giao

Luồng DV khác SP: thanh toán → `Chờ xác nhận` → shop nhận → `Đang thực hiện` → shop giao → **`Tạm giữ tiền`**.

Khi **`order_type === 'service'`** và **`status === 'Tạm giữ tiền'`** (đã có `deliveryContent`):

1. Đếm **3 ngày** từ `escrowHoldStartedAtMs` (lúc chuyển Tạm giữ sau giao).
2. Hết hạn → **`Hoàn thành`** — cùng `escrowAutoComplete.ts` (được phép trong `isEscrowAutoCompleteCandidate`).
3. **Ví chỉ tạm giữ 3 ngày** — nút **+3 ngày**: một lần bấm → **`Hoàn thành`** (mô phỏng hết hạn tạm giữ).

Cursor rule: `.cursor/rules/storefront-service-escrow.mdc`

## Khiếu nại — Thất bại sau 3 ngày

`status === 'Khiếu nại'`, người mua **không** hủy khiếu nại trong **3 ngày** (`complaintStartedAtMs`):

- → `Thất bại`, `refund` = `totalAmount`, `complaintAutoFailed: true`
- Logic: `src/storefront/complaintAutoFail.ts`
- UI: nhãn «Thất bại — hết hạn khiếu nại (3 ngày)»

## Tranh chấp — hoàn tiền sau 3 ngày

`status === 'Tranh chấp'`, người mua **không** hủy tranh chấp (vẫn giữ trạng thái) trong **3 ngày** kể từ `disputeStartedAtMs`:

- → `Thất bại`, `refund` = `totalAmount`, `disputeAutoRefunded: true` (nhận biết trên UI / API: cờ này + nhãn «Hoàn tiền — hết hạn tranh chấp»)
- Storefront: `checkoutPaid` → cộng lại ví + dòng Refund (như hủy đơn thất bại)
- Logic: `src/storefront/disputeAutoRefund.ts`, gộp tick: `orderTimers.ts`

## Không làm

- Đặt `Hoàn thành` ngay sau checkout vì đã có `deliveredItems`.
- Hiển thị badge «Hoàn thành» trên modal thanh toán thành công cho đơn mới mua sản phẩm.
