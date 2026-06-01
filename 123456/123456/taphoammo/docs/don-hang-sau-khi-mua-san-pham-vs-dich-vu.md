# Đơn hàng sau khi mua — Sản phẩm vs Dịch vụ

Tài liệu mô tả **đơn hàng xuất hiện ở đâu** sau khi khách thanh toán trên storefront, tùy ngữ cảnh **Sản phẩm** hay **Dịch vụ**.

> **Ghi chú nhanh (nhớ khi xem admin):** Sau khi mua **sản phẩm** hoặc **dịch vụ**, đơn sẽ nằm ở **danh mục / menu tương ứng** trong **danh sách phía admin** — mua sản phẩm → mục đơn sản phẩm; mua dịch vụ → mục đơn dịch vụ.

---

## Quy tắc nghiệp vụ

| Ngữ cảnh mua | `Order.order_type` | Khách (storefront) | Admin (sidebar) |
|---------------|-------------------|--------------------|-----------------|
| Mua từ luồng **Sản phẩm** (menu **Sản phẩm**, gian / thẻ thuộc **Bán sản phẩm**) | `'product'` | **Đơn hàng đã mua** → bộ lọc **Sản phẩm** | **Quản lý đơn hàng** (`don-hang`) — đơn sản phẩm |
| Mua từ luồng **Dịch vụ** (menu **Dịch vụ**, gian thuộc **Dịch vụ**) | `'service'` | **Đơn hàng đã mua** → bộ lọc **Dịch vụ** | **Đơn hàng dịch vụ** (`don-hang-dich-vu`) |

- Cùng một `allOrders` trong `App.tsx`; phân loại nhờ trường **`order_type`** (`'product' \| 'service'`) trên kiểu `Order` ([`src/ordersTypes.ts`](../src/ordersTypes.ts)).
- Trên storefront, [`PurchasedOrdersView`](../src/PurchasedOrdersView.tsx) có tab lọc **Tất cả / Sản phẩm / Dịch vụ** — khớp `order_type`.

---

## Cách xác định `order_type` lúc thanh toán (storefront)

Logic trong [`HomeView.tsx`](../src/HomeView.tsx) (component `ProductDetailView`, `handleCheckoutPay`), theo thứ tự ưu tiên:

1. **`product.storefrontBusinessType`** — lấy từ gian admin khi thẻ map từ **Quản lý gian hàng** (`classification.businessType` là `Bán sản phẩm` hoặc `Dịch vụ`). Nếu có giá trị hợp lệ → **ghi đè** menu header (đúng với gian thật).
2. **`storefrontMenuLine`** — trạng thái menu header hiện tại: **`Bán sản phẩm`** → `'product'`, **`Dịch vụ`** → `'service'`. Dùng cho catalog mẫu / khi sản phẩm không gắn gian admin.

Kết quả:

- `storefrontBusinessType === 'Dịch vụ'` **hoặc** (không có businessType trên sản phẩm và) menu đang **Dịch vụ** → `order_type: 'service'`.
- Ngược lại → `order_type: 'product'`.

---

## Liên kết code tham chiếu

| Phần | File |
|------|------|
| Kiểu đơn + `order_type` | [`ordersTypes.ts`](../src/ordersTypes.ts) |
| Thanh toán + gán `order_type` | [`HomeView.tsx`](../src/HomeView.tsx) — `ProductDetailView` |
| Map gian admin → `storefrontBusinessType` | [`HomeView.tsx`](../src/HomeView.tsx) — `storefrontAdminGianHangToProduct` |
| Lọc đơn đã mua (khách) | [`PurchasedOrdersView.tsx`](../src/PurchasedOrdersView.tsx) |
| Danh sách đơn SP (admin) | [`App.tsx`](../src/App.tsx) — `currentView === 'don-hang'` → `OrdersView` |
| Danh sách đơn DV (admin) | [`App.tsx`](../src/App.tsx) — `currentView === 'don-hang-dich-vu'` → `ServiceOrdersView` |
| Đường dẫn admin | [`adminPaths.ts`](../src/adminPaths.ts) — `/admin/orders/...` |

---

## Ghi chú cho phát triển sau

- Nếu sau này có **deep link** mở chi tiết sản phẩm không qua header, nên vẫn truyền hoặc suy ra **line** (SP/DV) để `order_type` không sai.
- Đồng bộ **khiếu nại** / chi tiết đơn: các view admin đã lọc theo `order_type` ở nhiều chỗ — giữ một nguồn sự thật là `Order.order_type`.

---

## Ghi chú chỉ cho người xem file (không cần đưa vào ngữ cảnh AI / codegen)

Phần **blockquote** ngay đầu trang và mục này là **nhắc nhở cá nhân**: giúp **bạn** nhìn vào file là nhớ luồng đơn ở admin. **Tool / mô hình AI không bắt buộc phải đọc** các dòng này khi sửa code — thông tin kỹ thuật nằm ở các mục bảng và “Cách xác định `order_type`” phía trên.

---

*Cập nhật theo `PurchasedOrdersView`, `ProductDetailView` trong `HomeView.tsx` và shell admin trong `App.tsx`.*

<!--
sau khi mua sản phẩm hoặc dịch vụ sẽ cập nhật theo ở mục nào bên admin
ví dụ mua dịch vụ phải hiển thị ở mục dịch vụ
-->
