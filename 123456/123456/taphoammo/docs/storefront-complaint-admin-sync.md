# Khiếu nại storefront → Admin «Đơn hàng khiếu nại»

> Cursor rule: `.cursor/rules/storefront-complaint-admin-sync.mdc`

## Luồng

```
Storefront «Đơn hàng đã mua» → Gửi khiếu nại
  → patchOrderById → allOrders (App)
  → status: Khiếu nại
Admin sidebar «Đơn hàng khiếu nại» (+ badge đếm)
  → ComplaintOrdersView lọc Khiếu nại | Tranh chấp
```

## Người mua (storefront)

- Vẫn ở trang Đơn hàng đã mua, không mở panel admin.
- Chỉ khiếu nại **1 lần** / đơn (`hasComplained`).

## Người bán / admin

- Mở **Đơn hàng khiếu nại** để thấy đơn với trạng thái **Khiếu nại** và cột **Nội dung** (`complaintReason`).

## Không làm

- Chuyển khách sang `/admin/orders/complaints` sau khi gửi khiếu nại.
- Tự đổi tab lọc «Khiếu nại» trên storefront sau gửi.
