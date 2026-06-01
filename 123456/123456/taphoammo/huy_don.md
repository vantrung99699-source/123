# Hủy đơn (`huy_don`)

Tài liệu đồng bộ chức năng **Hủy đơn**: luồng UI, **trạng thái sau hủy**, và vai trò **component cha** (giữ `orders` / `allOrders` và cập nhật state).

## Quy tắc trạng thái (bắt buộc)

Sau khi người dùng **xác nhận hủy đơn** thành công, đơn phải chuyển sang:

- **`status: 'Thất bại'`** (kiểu `OrderStatus` trong `ordersTypes`).

Badge **Thất bại** trên UI dùng màu chuẩn skill `.cursor/skills/taphoammo-order-status-badges`: `bg-[#1c2331] text-white border-transparent`.

## Mẫu component cha (ý tưởng)

Component cha nắm danh sách đơn và hàm xử lý hủy; con chỉ gọi callback (mở modal / xác nhận).

```tsx
// Pseudocode — bám đúng hành vi hiện tại trong repo
const handleCancelOrder = (orderId: string) => {
  setOrders((prev) =>
    prev.map((order) =>
      order.id === orderId
        ? { ...order, status: 'Thất bại', refund: order.totalAmount }
        : order
    )
  );
  setIsCancelModalOpen(false);
};
```

- **`setOrders`**: có thể là `setOrders` (PurchasedOrdersView) hoặc `setAllOrders` (App).
- **`refund`**: trong luồng modal hủy từ bảng (admin / đơn đã mua), gán **`refund: order.totalAmount`** để phản ánh hoàn toàn bộ số tiền đơn.

## Các luồng đã có trong mã nguồn

| Ngữ cảnh | File | Handler | Điều kiện / ghi chú |
|----------|------|---------|---------------------|
| Đơn đã mua (người mua) | `src/PurchasedOrdersView.tsx` | `handleCancelOrder` | `status → 'Thất bại'`, `refund: order.totalAmount`, đóng modal. |
| Quản trị — bảng dịch vụ | `src/App.tsx` | `handleCancelOrder` (trong khối service admin) | Giống trên. |
| Quản trị — bảng sản phẩm | `src/App.tsx` | `handleCancelOrder` (trong khối product admin) | Giống trên. |
| Chi tiết đơn dịch vụ — hủy khi đang xử lý | `src/App.tsx` | `handleCancelServiceProcessing` | Chỉ khi `order_type === 'service'` và `status === 'Đang thực hiện'`: cập nhật `{ ...o, status: 'Thất bại' }` (không set `refund` trong handler này). Gọi từ `ServiceOrderDetailView` qua prop `onCancelServiceProcessing`. |

**Lưu ý:** Nút có `title="Hủy đơn"` (ví dụ `text-rose-600 bg-rose-50`) chỉ là **hành động UI**; trạng thái hợp lệ sau hủy vẫn là **`Thất bại`** theo bảng trên.

## Phân biệt với “hủy khiếu nại”

Trong `PurchasedOrdersView.tsx`, **`handleCancelComplain`** (không phải hủy đơn) đưa đơn về **`Tạm giữ tiền`**, không phải `Thất bại`. Không gộp hai luồng này.

## Khi thêm màn / nút mới

1. Giữ **một nguồn sự thật** cho danh sách đơn ở cha (`orders` / `allOrders`).
2. Sau xác nhận hủy, **`map` theo `orderId`** và gán **`status: 'Thất bại'`**; nếu là luồng “hủy đơn + hoàn tiền toàn phần” như modal hiện tại, thêm **`refund: order.totalAmount`**.
3. Đồng bộ badge với skill trạng thái (cột Thất bại).
