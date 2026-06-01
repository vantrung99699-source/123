# Đăng ký / đăng nhập storefront — lưu dữ liệu & component cha

Tài liệu cho luồng header khách (`StorefrontGuestHeader` + `StorefrontAuthDropdown`): sau **đăng ký thành công** dữ liệu được ghi **localStorage**; sau **đăng nhập thành công** session người mua được ghi qua `src/auth/roles.ts`.

## 1. Dữ liệu sau đăng ký thành công

| Nơi lưu | Khóa `localStorage` | Định dạng |
|--------|---------------------|-----------|
| Tài khoản demo đăng ký | `taphoammo_storefront_demo_accounts` | Một object JSON: **key** = email chữ thường (đã trim), **value** = bản ghi tài khoản |

### Cấu trúc một bản ghi (`StoredStorefrontSignup`)

| Trường | Ý nghĩa |
|--------|---------|
| `email` | Email đăng nhập (chuẩn hóa chữ thường) |
| `username` | Tên tài khoản hiển thị / đăng nhập phụ |
| `password` | Mật khẩu **plaintext** — **chỉ dùng demo**; production phải hash + API |
| `registeredAtIso` | Thời điểm đăng ký (ISO 8601), thêm khi tạo mới |

**API trong code:** `src/auth/storefrontDemoAccounts.ts`

- `saveStorefrontSignup(...)` — gọi khi validate đăng ký OK (`StorefrontAuthDropdown`).
- `getStorefrontSignupByEmail(email)` — đăng nhập: kiểm tra mật khẩu.
- `listStorefrontSignups()` — đọc toàn bộ (mới nhất trước), phục vụ debug / **Quản lý người dùng** admin (`mergeStorefrontUsersForAdmin.ts`).

**Lưu ý bảo mật:** Không commit file chứa dữ liệu thật từ trình duyệt; đây là mock cục bộ.

## 2. Đăng nhập

Chỉ chấp nhận **email đã có** trong `taphoammo_storefront_demo_accounts` và **mật khẩu khớp**; nếu không → thông báo lỗi trong panel (không còn đăng nhập “demo” bằng email bất kỳ).

## 3. Số dư ví theo email

| Khóa `localStorage` | Nội dung |
|---------------------|----------|
| `taphoammo_storefront_wallet_by_email` | Object: email (chữ thường) → số dư VND (số nguyên ≥ 0) |

**Logic** (`src/auth/storefrontWalletByEmail.ts`):

- Đã có bản ghi cho email → dùng số đã lưu (sau mỗi lần đổi ví khi đã đăng nhập, `App` ghi lại).
- Chưa có bản ghi nhưng email **có trong** `taphoammo_storefront_demo_accounts` (đăng ký form) → **0đ** (tài khoản mới).
- Chưa có bản ghi và **không** phải tài khoản đăng ký form → **5.000.000đ** (demo session cũ).

Sau `onStorefrontLoginSuccess`, `App` gọi `setStorefrontWalletVnd(getStorefrontWalletVndForEmail(email))`.

## 4. Dữ liệu sau đăng nhập thành công

Callback `onLoginSuccess` / `onStorefrontLoginSuccess` nhận `{ username, email, displayName }`. **Component cha** (`App.tsx` qua `HomeView`) ghi session:

| Khóa (xem `roles.ts`) | Nội dung |
|------------------------|----------|
| `taphoammo_demo_login_username` | `username` |
| `taphoammo_demo_buyer_email` | `email` |
| `taphoammo_demo_display_name` | `displayName` |
| `taphoammo_storefront_logged_in` | `'1'` |

Đồng thời cập nhật state React (`storefrontBuyerName`, `storefrontBuyerEmail`, `storefrontLoggedIn`, …).

## 5. Component cha — phân lớp trách nhiệm

```
App (session toàn app, điều hướng)
 └── HomeView
      └── StorefrontGuestHeader
            └── authSlot → StorefrontAuthDropdown
                  ├── validate: storefrontRegisterValidation.ts
                  ├── lưu đăng ký: saveStorefrontSignup
                  └── đăng nhập OK → onLoginSuccess → cha ghi session
```

- **Cha thực sự của “phiên người mua”:** `App` + `HomeView` (props `onStorefrontLoginSuccess`, state buyer).
- **Con UI:** `StorefrontAuthDropdown` — chỉ UI + localStorage đăng ký; **không** tự set session; mọi vào storefront sau login qua callback.
- **Header:** `StorefrontGuestHeader` nhận `authSlot` dạng `() => <StorefrontAuthDropdown … />` để desktop/mobile mỗi nơi một instance.

Khi tách **component cha** riêng (ví dụ `StorefrontGuestAuthShell`):

- Giữ `onLoginSuccess` / `onRegisterSuccess?` từ cha.
- `StorefrontAuthDropdown` nhận props ổn định; có thể thêm `onRegisterSuccess` nếu cha cần analytics (không bắt buộc vì dữ liệu đã lưu trong `saveStorefrontSignup`).

## 6. File tham chiếu

| File | Vai trò |
|------|---------|
| `src/components/StorefrontAuthDropdown.tsx` | Form đăng nhập / đăng ký, lỗi inline |
| `src/components/StorefrontGuestHeader.tsx` | Header khách, `authSlot` |
| `src/auth/storefrontDemoAccounts.ts` | Lưu đọc tài khoản đăng ký |
| `src/auth/storefrontRegisterValidation.ts` | Quy tắc validate đăng ký |
| `src/auth/roles.ts` | Session demo (username, email, displayName, logged in) |
| `src/auth/storefrontWalletByEmail.ts` | Số dư ví theo email (0đ tài khoản đăng ký mới) |
| `src/admin/mergeStorefrontUsersForAdmin.ts` | Gộp `listStorefrontSignups` + `ADMIN_USERS` cho bảng Quản lý người dùng |
| `src/admin/UserManagementView.tsx` | Bảng người dùng gộp storefront; làm mới khi `focus` / `storage` |
| `src/HomeView.tsx` | Gắn `authSlot`, props `onStorefrontLoginSuccess` |
| `src/App.tsx` | Session + ví: `onStorefrontLoginSuccess`, `useEffect` đồng bộ ví |

## 7. Kiểm tra nhanh trong DevTools

```js
JSON.parse(localStorage.getItem('taphoammo_storefront_demo_accounts') || '{}')
```

Không log mật khẩu ra console trên môi trường thật.

## 8. Admin — «Tên người bán» gian hàng = tên tài khoản đăng nhập (mặc định)

Trên form **Tạo / Sửa gian hàng** (`CreateCategoryView` trong `App.tsx`), ô **Tên người bán** (`Category.sellerDisplayName`):

- Khi mở form **tạo mới**, ô được điền sẵn bằng **`getSessionLoginUsername()`** (cùng khóa session `taphoammo_demo_login_username` — xem mục 4).
- Khi **Lưu** (tạo hoặc sửa), nếu người dùng **để trống** sau trim, backend mock vẫn lưu **`getSessionLoginUsername()`** (tối đa 60 ký tự). Nhờ đó header **Quản lý gian hàng** (`CategorySection`, span «Tên người bán hàng») và **storefront** không còn nhầm với mô tả gian.

**Tham chiếu thêm:** [`tenmathang.md`](tenmathang.md) (header gian + chuỗi ưu tiên storefront), [`gian_hang.md`](gian_hang.md).

*Ghi chú:* Đây là luồng **admin** (phiên demo `roles.ts`). Người mua storefront vẫn dùng bảng session ở mục 4; tên hiển thị có thể là `username` từ đăng ký / đăng nhập storefront — tách biệt với username admin cho tới khi có một nguồn session thống nhất.*
