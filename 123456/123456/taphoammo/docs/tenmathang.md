# Bảng mặt hàng gian hàng (`tenmathang`)

Tài liệu tham chiếu **bảng danh sách mặt hàng** trong **Quản lý gian hàng** (admin): cột tiêu đề, nguồn dữ liệu trên model `Product`, **tên người bán hàng** trên header gian, và component render.

---

## Vị trí code

| Phần | File | Ghi chú |
|------|------|---------|
| Bảng + `<thead>` | [`src/App.tsx`](../src/App.tsx) | Trong `CategorySection`, khi `filteredProducts.length > 0` |
| Hàng dữ liệu | [`src/App.tsx`](../src/App.tsx) | Component `ProductRow` |
| Kiểu dữ liệu | [`src/App.tsx`](../src/App.tsx) | `interface Product` (khác `Product` trong `HomeView.tsx`) |

Danh sách hiển thị lấy từ **`category.products`** sau khi lọc → **`filteredProducts`** (theo tab trạng thái `activeTab` và ô tìm kiếm `searchQuery`).

---

## Tên người bán hàng (header gian — `CategorySection`)

Cạnh **icon Users**, chữ **xanh đậm** trên nền header xanh nhạt là **tên người bán hàng** (nickname / shop bán), **không** phải mô tả sản phẩm và **không** phải tên người tạo phiên đăng nhập.

| Thứ tự ưu tiên | Field `Category` | Ghi chú |
|----------------|------------------|---------|
| 1 | **`sellerDisplayName`** | Ô **«Tên người bán»** trong `CreateCategoryView`. **Mặc định / fallback khi để trống:** `getSessionLoginUsername()` (tên tài khoản đăng nhập admin — xem [`storefront-auth-signup-parent.md`](storefront-auth-signup-parent.md) §8). |
| 2 | **`createdByName`** | Fallback dữ liệu cũ / demo (vd. `global_ads`) khi chưa có `sellerDisplayName` hợp lệ. |
| Không có | Hiển thị **`—`** | |

Thuộc tính gợi ý: `title="Tên người bán hàng"`. Cùng logic hiển thị áp dụng cho thanh meta tương tự trong `WarehouseView` (khi mở kho mặt hàng).

---

## Cột bảng → field `Product`

| Cột UI (header) | Field / nguồn | Mô tả ngắn |
|-----------------|----------------|------------|
| **Tên mặt hàng** | `product.name` | Tên hiển thị (in đậm, xanh). Kèm dòng phụ: `product.id` (nhãn ID), `product.date` (ngày). |
| **Đơn giá** | `product.price` | Chuỗi hiển thị (vd. định dạng tiền) — render trực tiếp, không format thêm trong ô. |
| **Tồn kho** | `product.stock` | Số nguyên `product.stock.toLocaleString()`. Đồng bộ **Kho** qua `warehouseItems.length` khi thao tác trong `WarehouseView`. |
| **Đã bán** | `product.sold` | Số nguyên `product.sold.toLocaleString()`. |
| **Trạng thái** | `product.status` | `Status`: `'Đang bán' \| 'Tạm ngưng' \| 'Chờ duyệt' \| 'Đã hủy'`. Badge `StatusBadge`. |

Cột liền kề khác: **Hành động**, **Bật/Tắt** → `product.active`.

**Cột tên người bán ở cấp mặt hàng:** `product.sellerName` (tùy chọn) — dùng trong chuỗi ưu tiên **storefront** (mục dưới), khác với **tên người bán hàng** ở header **gian** (`sellerDisplayName`).

---

## Kiểu `Product` (admin — mặt hàng trong `Category`)

```ts
type Status = 'Đang bán' | 'Tạm ngưng' | 'Chờ duyệt' | 'Đã hủy';

interface Product {
  id: string;
  name: string;
  price: string;
  stock: number;
  sold: number;
  fee: string;
  status: Status;
  active: boolean;
  date: string;
  sellerName?: string;
  warehouseItems?: WarehouseItem[];
}
```

**Lưu ý:** Đây là `Product` **trong `App.tsx`** (mặt hàng trong gian), **không** trùng `Product` storefront trong `HomeView.tsx`.

---

## Lọc danh sách (`filteredProducts`)

- **Theo tab:** `activeTab === 'Tất cả'` → không lọc trạng thái; tab bắt đầu bằng `Chờ duyệt` → chỉ `status === 'Chờ duyệt'`; các tab khác → `product.status === activeTab`.
- **Theo tìm kiếm:** `searchQuery` khớp `product.name` hoặc `product.id` (không phân biệt hoa thường).

---

## Đồng bộ storefront (thẻ catalog `HomeView`)

**Dòng «Kinh doanh»:** `businessProducts` chỉ khi có **`products[].name`**; không có mặt hàng → ẩn khối «Kinh doanh».

**`variantPrices`:** theo **`products[].price`** cùng thứ tự tên mặt hàng.

**Trang chi tiết (`ProductDetailView`):** nếu gian admin **chưa có** `businessProducts` (chưa tạo mặt hàng), danh sách **Mặt hàng** không hiển thị nút giả từ tên gian — hiện thông báo «chưa có mặt hàng» và **tắt** Mua hàng / Đặt trước / Thanh toán.

**Dòng «Người bán:»** (`Product.seller`), thứ tự ưu tiên (khớp logic header / bán hàng):

1. **`category.sellerDisplayName`**
2. **`products[].sellerName`** (mặt hàng đầu có giá trị)
3. **`category.createdByName`** (tương thích dữ liệu cũ / demo)
4. **`category.name`**

---

## Liên quan

| Luồng | Tài liệu / vị trí |
|-------|-------------------|
| Gian hàng (category) | [`gian_hang.md`](gian_hang.md) |
| Form tạo/sửa gian | [`tao_gian_hang_moi.md`](tao_gian_hang_moi.md) |

---

*Cập nhật theo `CategorySection`, `ProductRow`, `StatusBadge` và `interface Product` trong `App.tsx`.*
