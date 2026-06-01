# Thanh toán (`thanh_toan`)

Tài liệu đồng bộ luồng **Thanh toán** trên storefront (modal xác nhận đơn → nút **Thanh toán**), **mã đơn mới**, và payload đơn để lấy/ghi dữ liệu (frontend hiện tại + gợi ý API).

## Vị trí trong mã

| Thành phần | File | Ghi chú |
|------------|------|---------|
| Modal + nút **Thanh toán** | `src/HomeView.tsx` | Trong `ProductDetailView`, `onClick={handleCheckoutPay}`. |
| Sinh mã đơn (thanh toán storefront) | `src/HomeView.tsx` | `GD-${Date.now()}` trong `handleCheckoutPay`, đảm bảo không trùng `id` trong mảng đơn. |
| Sinh mã `ORD-*` (khác luồng) | `src/HomeView.tsx` | Hàm `generateUniqueOrderId` (còn trong file nếu tái sử dụng). |
| Khóa sắp xếp / parse số trong mã | `src/ordersTypes.ts` | `orderIdSortKey`, `orderNewestSortKey`, kiểu `Order`. |

## Luồng UI

1. Người dùng mở chi tiết sản phẩm (`ProductDetailView`) → bấm thanh toán (mở modal **Xác nhận đơn hàng**).
2. Trong modal, bấm **Thanh toán** → gọi `handleCheckoutPay`.
3. Kiểm tra: không hết hàng; `walletBalanceVnd >= checkoutSummary.tongThanhToan`; nếu không đủ → lỗi `Số dư không đủ để thanh toán.`

## Mã đơn hàng mới (bắt buộc đồng bộ)

**Thanh toán từ chi tiết sản phẩm (storefront):**

- **Định dạng:** `GD-` + **đúng 6 chữ số** (ví dụ `GD-343232`). Sinh qua `generateUniqueGdOrderIdSixDigit` trong `HomeView.tsx` (ưu tiên tăng từ mã `GD-######` hiện có, trùng thì random / quét).
- **Một mã cho mọi chỗ:** `Order.id` = `onCheckoutPaid.orderId` = dòng lịch sử giao dịch `transactionCode` = chuỗi trong `reason` (“Thanh toán cho đơn hàng …”).

**Các luồng khác (admin / mẫu):** có thể vẫn dùng `ORD-{n}` và `generateUniqueOrderId`.

- **`orderIdSortKey`:** parse nhóm số cuối trong chuỗi — với `GD-343232` được `343232`.

## Bản ghi `Order` tạo khi thanh toán thành công

Sau khi thanh toán, một object `Order` được **prepend** vào đầu mảng orders (`[newOrder, ...prev]`).

| Trường | Giá trị / nguồn |
|--------|------------------|
| `id` | `generateUniqueGdOrderIdSixDigit(prev)` — `GD-XXXXXX` |
| `purchaseDate` | `formatPurchaseDateNow()` — `DD/MM/YYYY HH:mm` |
| `sellerName` | `product.seller` |
| `categoryName` | `product.name` (cắt tối đa 120 ký tự + `…`) |
| `productName` | `checkoutSummary.tenMatHang` (tên biến thể / mặt hàng) |
| `buyerName` | prop `buyerName` (storefront) |
| `quantity` | `checkoutSummary.qty` |
| `unitPrice` | `formatVnd(unitSale)` — `unitSale` từ `getDetailUnitPriceVnd(product, selectedVariant)` |
| `discount` | `formatVnd(promoOff + codeOff)` hoặc `'0đ'` |
| `totalAmount` | `formatVnd(tongThanhToan)` (số tiền đã trừ ví) |
| `refund` | `'0đ'` |
| `status` | `'Tạm giữ tiền'` |
| `order_type` | `'product'` |
| `checkoutPaid` | `true` |
| `createdAtMs` | `Date.now()` |

## Tác dụng phụ state

- `setWalletBalanceVnd(w => w - amount)` với `amount = checkoutSummary.tongThanhToan`.
- `setIsCheckoutOpen(false)`.
- `setPaymentSuccessOrder(createdOrderForSuccess)` để hiện modal **Thanh toán thành công**; sau đó có thể gọi `onAfterPaymentSuccess(order.id)` (điều hướng đơn đã mua).
- `onCheckoutPaid` (có `balanceBeforeVnd`, `balanceAfterVnd`, `sellerName`) → `HomeView` ghi storefront + gọi `onSyncAdminPaymentHistory` → `App` prepend bản ghi admin.

## Đồng bộ tab Lịch sử giao dịch

Quy tắc (skill `.cursor/skills/thanh-toan/SKILL.md`):

- Mỗi thanh toán thành công thêm một `PaymentHistoryItem` vào state `storefrontPaymentHistoryCheckoutItems` trong **`App.tsx`** (truyền xuống `HomeView`), merge với mock: `[...checkout, ...PAYMENT_HISTORY_MOCK_HISTORY]` — tránh để state trong `HomeView` vì vào Admin sẽ unmount và **mất lịch sử**.
- `transactionCode` = **`orderId`** (cùng chuỗi `GD-…` với `Order.id`, không sinh `GD` thứ hai).
- `reason` = `Thanh toán cho đơn hàng {orderId}`.
- `amount` = số âm bằng số tiền trừ ví (`checkoutSummary.tongThanhToan`).
- `type` = `Buying`, `date` = `purchaseDate` của đơn.

## Đồng bộ Admin → Lịch sử giao dịch

- `App` giữ `adminSyncedPaymentHistory`; `HomeView` nhận `onSyncAdminPaymentHistory` và đẩy `buildAdminPaymentHistoryFromCheckout` (type `PaymentHistory` trong `admin/types.ts`, `type: 'Mua hàng'`, `sellerName` = `product.seller`).
- `AdminDashboard` truyền `extraPaymentHistory` vào `PaymentHistoryView`; merge `[...extraRows, ...PAYMENT_HISTORY]`.
- Cột **Người dùng**: `tx.userId` + `tx.name` (người mua). Chip **Người bán**: `tx.sellerName ?? tx.name`.

## Gợi ý body API (để “lấy/ghi” dữ liệu tương đương)

Nếu backend tạo đơn thay client:

```json
{
  "product_id": "<id sản phẩm>",
  "quantity": 1,
  "variant_index": 0,
  "discount_code": "",
  "buyer_username": "<buyerName>"
}
```

Response nên có ít nhất: `order_id` (chuỗi, khuyến nghị `ORD-{n}`), `status: "Tạm giữ tiền"`, `total_amount_vnd`, `created_at`, và các trường mirror bảng `Order` để đồng bộ UI.

## Liên kết tài liệu khác

- Skill **thanh-toan** (lịch sử giao dịch): `.cursor/skills/thanh-toan/SKILL.md`.
- Badge trạng thái **Tạm giữ tiền**: skill `.cursor/skills/taphoammo-order-status-badges/SKILL.md`.
- Hủy đơn → **Thất bại**: `huy_don.md`.
