# Quản lý người dùng (Admin)

Tài liệu component **Quản lý người dùng** trong dashboard admin — sidebar «Quản lý người dùng» → `UserManagementView`.

## Vị trí file

| Thành phần | Đường dẫn |
|------------|-----------|
| Màn hình chính | `src/admin/UserManagementView.tsx` |
| Gộp danh sách | `src/admin/mergeStorefrontUsersForAdmin.ts` |
| Dữ liệu mẫu | `src/admin/data.ts` (`ADMIN_USERS`) |
| Sidebar / view | `src/admin/AdminSidebar.tsx`, `AdminDashboard.tsx` (`users`) |

## Nguồn dữ liệu danh sách

1. **Đăng ký storefront** — đọc `listStorefrontSignups()` từ `taphoammo_storefront_demo_accounts` (chi tiết: `storefront-auth-signup-parent.md`). Hiển thị **trước** trong bảng.
2. **Người dùng mock** — các dòng còn lại từ `ADMIN_USERS`, **bỏ** email trùng với đăng ký storefront.

Làm mới danh sách khi `window` **focus** hoặc sự kiện **storage** (tab khác) cho các khóa `taphoammo_storefront_demo_accounts` và `taphoammo_storefront_wallet_by_email`.

## Số dư hiển thị

Hàm `getAdminUserBalanceVnd(email, mockFallbackVnd)` trong `src/auth/storefrontWalletByEmail.ts`:

- Có bản ghi trong `taphoammo_storefront_wallet_by_email` → dùng số đã lưu (mua hàng storefront hoặc thao tác admin).
- Email **đã đăng ký** storefront nhưng chưa có map → **0đ**.
- Người **mock** (không trong DB đăng ký), chưa map → dùng số dư gốc từ `ADMIN_USERS` (parse từ chuỗi).

Đồng bộ với ví người mua trên storefront khi cùng email (cùng map localStorage).

### Header storefront «Số dư» (`HomeView`)

Prop `walletBalanceVnd` do `App.tsx` giữ: đọc/ghi qua `getStorefrontWalletVndForEmail` / `setStorefrontWalletVndForEmail` (cùng khóa `taphoammo_storefront_wallet_by_email`). Khi đang ở route trang chủ (`currentView === 'home'`), khi đổi email session hoặc quay lại từ Admin, App tải lại số dư từ map; `focus` và sự kiện `storage` (tab khác chỉnh ví) cũng kéo lại giá trị.

## Modal «Chỉnh sửa số dư» (nút ví trên mỗi dòng)

- **Cộng tiền:** `số dư mới = số dư hiện tại + số nhập` → `setStorefrontWalletVndForEmail`.
- **Trừ tiền:** `số dư mới = max(0, hiện tại − số nhập)`.
- **Đặt lại số dư:** ghi đúng bằng số nhập (≥ 0).

Sau **Xác nhận**, bảng được bump `listRevision` để đọc lại số dư.

Ghi chú trong modal chỉ UI (chưa lưu lịch sử thật). Khối «Lịch sử giao dịch» là **dữ liệu mẫu**.

## Type liên quan

`AdminUser` trong `src/admin/types.ts` có thể có `userSource?: 'storefront_signup' | 'mock'` (phục vụ merge, không bắt buộc hiển thị).

## Liên quan

- `docs/storefront-auth-signup-parent.md` — đăng ký / session / ví theo email.
- `src/auth/storefrontDemoAccounts.ts`, `src/auth/storefrontWalletByEmail.ts`.
