# Tạo / sửa gian hàng (`CreateCategoryView`)

Tài liệu tham chiếu form **Tạo gian hàng mới** và **Sửa gian hàng** trong admin — component `CreateCategoryView` tại [`src/App.tsx`](../src/App.tsx) (full-screen overlay, `z-[150]`).

| Hành động | Cách mở |
|-----------|---------|
| **Tạo** | Nút **Tạo gian hàng** trên **Quản lý gian hàng** (`setIsCreateCategoryViewOpen(true)`, `gianHangFormEditTarget = null`) |
| **Sửa** | Nút bút **Sửa** trên header `CategorySection` của **gian hàng con** (không phải nền tảng `isParent`) — mở cùng form, hydrate dữ liệu cũ theo bảng dưới |

**Nền tảng** (`category.isParent === true`): vẫn dùng modal nhỏ **Sửa gian hàng** (tên + icon), không dùng `CreateCategoryView`.

---

## Props component

| Prop | Kiểu | Ý nghĩa |
|------|------|---------|
| `onClose` | `() => void` | Đóng overlay; cha nên xóa `gianHangFormEditTarget` |
| `onSave` | `(data: CreateCategorySavePayload) => void` | Tạo mới hoặc cập nhật — cha phân nhánh theo `gianHangFormEditTarget` |
| `categories` | `Category[]` | Danh mục cha — map tên hiển thị option **Danh mục** |
| `classificationData` | `Record<line, Record<categoryKey, string[]>>` | Nguồn danh mục & loại sản phẩm (có chiết khấu trong label) |
| `danhMucOrderByLine` | `Record<'Bán sản phẩm' \| 'Dịch vụ', string[]>` | Thứ tự khóa danh mục đồng bộ storefront |
| `editingCategory` | `Category \| null` | Khác `null` ⇒ chế độ **sửa** (chỉ gian hàng con); hydrate form từ object này |
| `defaultBusinessLine` | `BusinessLine` | Khi `classification.businessType` không phải `Bán sản phẩm` / `Dịch vụ` (dữ liệu cũ), dùng line của **nền tảng cha** để chọn đúng tab phân loại |

Kiểu payload gửi lên `onSave` (khớp object trong code):

```ts
type CreateCategorySavePayload = {
  name: string;
  description: string;       // mô tả ngắn, tối đa 150 ký tự
  tags: string[];
  productDetails: string;
  classification: {
    businessType: string;    // 'Bán sản phẩm' | 'Dịch vụ'
    category: string;        // khóa danh mục (vd. 'tài khoản', 'Dịch vụ khác')
    product: string;         // giá trị select loại SP — chiết khấu sàn trong chuỗi
  };
  configuration: {
    refundRate: number;      // parse float, lỗi → 0
    isSingleProduct: boolean;
    isReseller: boolean;     // UI: «Cho phép Reseller»
    isPrivateWarehouse: boolean;
    isLiveUidCheck: boolean; // UI: «Check live UID FB»
    saleType: 'Newest' | 'Oldest' | 'Random';
  };
};
```

---

## Thông tin cơ bản (cột trái)

| Trường | UI | Ràng buộc / ghi chú |
|--------|-----|---------------------|
| **Tên gian hàng** | `input` text | Bắt buộc để bật nút **Thêm mới** |
| **Mô tả ngắn** | `textarea` 2 dòng | Tối đa **150** ký tự; bắt buộc cho **Thêm mới** |
| **Ảnh gian hàng** | Khối upload (Download) | *Chưa nối state / onSave* — chỉ giao diện |

---

## Tags

- Nhập tag, nhấn **Enter** để thêm (không trùng).
- Xóa từng tag bằng nút `X` trên chip.
- Gửi trong `onSave` dưới dạng `tags: string[]`.

---

## Chi tiết sản phẩm

- `textarea` lớn, placeholder «Nhập chi tiết sản phẩm…».
- Thanh công cụ (History, B, I, U, Code): *chưa gắn logic rich text* — chỉ UI.
- Giá trị: `productDetails: string`.

---

## Lưu ý (banner vàng)

Nội dung cố định trong UI: sản phẩm phải bán được trên site; không đăng thông tin liên hệ cá nhân trên ảnh.

---

## Phân loại (cột phải)

| Trường | State | Nguồn / hành vi |
|--------|--------|-----------------|
| **Loại hình kinh doanh** | `businessType` | Select: `Bán sản phẩm`, `Dịch vụ`. Đổi → cập nhật **Danh mục** + **Loại sản phẩm** theo `orderedClassificationCategoryKeys` + `classificationData` |
| **Danh mục** | `category` | Option động từ `categoryKeys`; nhãn hiển thị ưu tiên `categoriesProp.find(c => c.originalName === key)?.name \|\| key` |
| **Loại sản phẩm - Chiết khấu cho sàn** | `productType` | Chỉ hiện khi `category !== 'Chọn ...'`; option từ `classificationData[businessType][category]` |

**Điều kiện bật nút Thêm mới:** `category !== 'Chọn ...'` và `productType !== 'Chọn ...'` (cùng `name`, `description` không rỗng).

Mặc định khi mở form: `businessType = 'Bán sản phẩm'`, `category = 'tài khoản'`, `productType` = phần tử đầu của danh sách loại tương ứng (nếu có).

---

## Kiểu bán

| UI (tiếng Việt) | Giá trị trong `configuration.saleType` |
|-----------------|----------------------------------------|
| Mới nhất | `Newest` |
| Cũ nhất | `Oldest` |
| Ngẫu nhiên | `Random` |

State: `saleType` (string hiển thị), map khi gọi `onSave`.

---

## Cấu hình

### Hoàn tiền

- Input text + hiển thị `%` — state `refundRate` (chuỗi).
- Khi lưu: `refundRate: parseFloat(refundRate) || 0`.

### Các mục dạng checkbox (click cả hàng để bật/tắt)

| Nhãn UI | State | Trường trong `configuration` | Mặc định |
|---------|--------|--------------------------------|----------|
| Sản phẩm duy nhất | `isSingleProduct` | `isSingleProduct` | `true` |
| Cho phép Reseller | `allowReseller` | `isReseller` | `true` |
| Kho hàng riêng | `isPrivateWarehouse` | `isPrivateWarehouse` | `false` |
| Check live UID FB | `checkLiveUid` | `isLiveUidCheck` | `false` |

**Lưu ý:** nhãn «Cho phép Reseller» map sang key **`isReseller`** trong object cấu hình (không phải `allowReseller`).

---

## Map dữ liệu cũ → form (chế độ sửa)

| Field form | Nguồn `Category` |
|------------|------------------|
| Tên gian hàng | `name` |
| Mô tả ngắn | `shortDescription` hoặc fallback `description` (tối đa 150 ký tự) |
| Tags | `tags` |
| Chi tiết sản phẩm | `productDetails` |
| Loại hình KD | `classification.businessType` nếu là `Bán sản phẩm` / `Dịch vụ`; không thì `defaultBusinessLine` |
| Danh mục | `classification.category` nếu là khóa hợp lệ trong `classificationData[line]`; không thì khóa đầu trong thứ tự danh mục |
| Loại SP — chiết khấu | `classification.product` nếu thuộc danh sách loại của danh mục; không thì mục đầu |
| Hoàn tiền % | `configuration.refundRate` |
| Bốn ô cấu hình | `configuration.isSingleProduct`, `isReseller`, `isPrivateWarehouse`, `isLiveUidCheck` |
| Kiểu bán | `configuration.saleType` → `Mới nhất` / `Cũ nhất` / `Ngẫu nhiên` |

Khi **Cập nhật**, cha ghi lại vào cùng node cây `categories`: `name`, `shortDescription`, `description`, `tags`, `productDetails`, `classification`, `configuration`, đồng bộ `platform` với **tên nền tảng cha** (`rootPlatform.name`). Giữ nguyên `id`, `products`, `createdAt`, v.v.

---

## Header hành động

| Nút | Hành vi |
|-----|---------|
| ← / **Hủy** | `onClose()` |
| **Thêm mới** | Kiểm tra bắt buộc → `onSave` tạo gian hàng mới |
| **Cập nhật** | Cùng điều kiện bắt buộc → `onSave` cập nhật gian hàng theo `id` (khi `editingCategory` là gian hàng con) |

---

## Gợi ý khi tái sử dụng / refactor

- Tách type `CreateCategorySavePayload` ra file `types` dùng chung giữa form và handler `onSave` trong `App.tsx`.
- Nếu cần test E2E: data-testid theo từng section (*Thông tin cơ bản*, *Phân loại*, *Cấu hình*).
- Ảnh gian hàng và thanh format **Chi tiết sản phẩm** hiện chưa đi vào payload — bổ sung khi có API lưu file / editor.

---

*Cập nhật theo mã nguồn `CreateCategoryView` trong `App.tsx`.*
