# Gian hàng — component & dữ liệu (`gian_hang`)

Tài liệu tham chiếu **gian hàng** (category con, không phải nền tảng `isParent`) trên màn **Quản lý gian hàng** trong admin: component hiển thị, field state, định dạng ngày giờ.

---

## Component chính: `CategorySection`

- **File:** [`src/App.tsx`](../src/App.tsx) — định nghĩa inline `CategorySection`.
- **Vai trò:** Một thẻ gian hàng (hoặc lồng nhau theo `depth`): header + bảng mặt hàng / subcategories.

### Props (tóm tắt)

| Prop | Ý nghĩa |
|------|---------|
| `category` | Object `Category` cần render |
| `depth` | Độ lồng (margin trái cho sub) |
| `onCreateSubCategory`, `onDeleteCategory`, `onEditCategory` | Thao tác danh mục |
| `onCreateProduct`, `onToggleProduct`, … | Mặt hàng trong gian |
| `activeTab`, `searchQuery` | Lọc nội dung |
| `platformIconName` | Icon nền tảng cha (từ `visibleGianHangCategories`) |

---

## Header gian hàng (hàng tiêu đề xanh nhạt)

Thông tin đọc từ `category`:

| Vùng UI | Nguồn dữ liệu |
|---------|----------------|
| Tên | `category.name` |
| Badge «Trùng» / «Reseller» | Cố định khi `!category.isParent` |
| Cột phân loại (icon Globe) | `classification.product` (bỏ hậu tố ` (…`) hoặc `platform` |
| **Ngày giờ** (icon Calendar) | `formatGianHangDisplayDate(category.date)` — luôn có **giờ:phút** (xem dưới) |
| **Tên người bán hàng** (icon Users, chữ xanh đậm) | **`sellerDisplayName`** — mặc định / lưu khi để trống: **tên tài khoản đăng nhập** (`getSessionLoginUsername`); fallback **`createdByName`** → **`—`** — xem [`tenmathang.md`](tenmathang.md), [`storefront-auth-signup-parent.md`](storefront-auth-signup-parent.md) §8 |
| Nút «Tạo mặt hàng» | `onCreateProduct(category.id)` |
| Pill nền tảng | `category.platform` |
| Sửa / Xóa / More / Thu gọn | `onEditCategory`, `onDeleteCategory`, … |

### Ảnh đại diện (lưu trữ)

- Field tùy chọn: `category.storeImage` (data URL hoặc URL sau này).
- Form tạo/sửa: [`tao_gian_hang_moi.md`](tao_gian_hang_moi.md) + `CreateCategoryView` (upload kéo thả / chọn file).

*(Hiện header `CategorySection` có thể chưa render `storeImage`; bổ sung UI khi cần.)*

---

## Định dạng `Category.date`

- **Khuyến nghị lưu:** `dd/mm/yyyy HH:mm` (ví dụ `06/04/2026 14:35`), locale Việt Nam, `tabular-nums` trên span hiển thị.
- **Gian mới** (lưu trong `App` khi tạo từ form): `formatViDateTimeNow()` — có **giờ và phút** tại thời điểm tạo.
- **Hiển thị:** `formatGianHangDisplayDate(date)`:
  - Chuỗi đã chứa `H:mm` → giữ nguyên.
  - Chỉ có ngày đúng mẫu `d/m/yyyy` → nối thêm ` 00:00` (đầu ngày, tương thích dữ liệu cũ).

---

## Kiểu `Category` (liên quan gian hàng con)

Các field thường dùng cho **gian hàng** (không phải parent):

- `id`, `name`, `isParent: false`
- `platform`, `date`, `description`, `shortDescription`, `tags`, `productDetails`
- `classification`: `{ businessType, category, product }`
- `configuration`: hoàn tiền, reseller, kho riêng, v.v.
- `products`, `subCategories`, `storeImage`, `createdAt` (sắp xếp «mới lên đầu»), `sellerDisplayName` (tên người bán hàng — ưu tiên header), `createdByName` (fallback tên bán hàng / lưu `getSessionDisplayName()` khi tạo mới — audit, không dùng làm nhãn «người tạo» trên header)

Nền tảng cha (`isParent: true`): cùng component có thể dùng cho cấp khác; sửa tên nhanh qua modal riêng, không qua full form gian hàng.

---

## Luồng liên quan

| Luồng | Tài liệu / vị trí |
|-------|-------------------|
| Tạo / sửa full form | [`tao_gian_hang_moi.md`](tao_gian_hang_moi.md), `CreateCategoryView` |
| Hủy đơn / trạng thái | [`../huy_don.md`](../huy_don.md) (nếu áp dụng đơn hàng) |

---

## Đồng bộ storefront (lưới catalog `HomeView`)

- **Prop:** `App.tsx` truyền `storefrontAdminGianHangCategories={categories}` vào `HomeView`.
- **Lấy gian:** Chỉ các node **`!isParent`** (gian hàng con) được **flatten** cả khi lồng `subCategories`; nền tảng `isParent` không tạo thẻ riêng trên storefront.
- **Hiển thị thẻ:** Map sang `Product`: `name`, `storeImage` → `sellerAvatar`, `shortDescription`/`description` → **mô tả ngắn** (không dùng làm tên người bán), `classification.product` (bỏ hậu tố ` (…%)`) → `productTypeLabel`, dòng **Kinh doanh** chỉ hiện khi có ít nhất một mặt hàng — nội dung là **`products[].name`** nối ` | ` (xem [`tenmathang.md`](tenmathang.md)); **không** lấy từ `productDetails`. **Tên người bán** trên thẻ (có nhãn «Người bán:») → **`sellerDisplayName`** → **`products[].sellerName`** → **`createdByName`** → **`Category.name`** (chi tiết: [`tenmathang.md`](tenmathang.md)). `variantPrices` khi có `products`. `longDescription` (gồm `productDetails`) cho tab chi tiết, `createdAt`/`date` → `storefrontCreatedAt` (sắp xếp **Mới nhất**), `adminGianHangId` = `Category.id`.
- **Lọc:** Gian chỉ xuất hiện nếu `classification.product` (sau chuẩn hóa) **trùng** một loại đang có trong dữ liệu phân loại storefront (cùng logic `normalizeTypeLabel` với thẻ mock).
- **Thứ tự catalog:** Nguồn merge `[...gian admin, ...catalog mẫu]`. Trên storefront, **gian admin luôn đứng trước** catalog mẫu khi sort **Phổ biến** hoặc **Giá**; trong nhóm admin, **mới nhất trước** (`storefrontCreatedAt` / `date`). Sort **Mới nhất** áp dụng một lượt cho toàn danh sách theo `storefrontCreatedAt` rồi `id`.

---

*Cập nhật theo `CategorySection` và helper `formatGianHangDisplayDate` / `formatViDateTimeNow` trong `App.tsx`.*
