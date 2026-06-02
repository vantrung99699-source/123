/** Route admin (đồng bộ với sidebar). User storefront: chỉ `/`. */

/** Người bán — «Quản lý cửa hàng» từ HomeView (chỉ khu gian hàng). */
export function isSellerStoreAdminPath(pathname: string): boolean {
  return (
    pathname === '/admin' ||
    pathname === '/admin/' ||
    pathname.startsWith('/admin/gian-hang') ||
    pathname === '/admin/orders/products' ||
    pathname.startsWith('/admin/orders/products') ||
    pathname === '/admin/thong-ke' ||
    pathname.startsWith('/admin/thong-ke')
  );
}

/** View admin shell cho người bán (gian hàng + đơn SP + thống kê). */
export function sellerStoreAdminShellView(pathname: string): 'gian-hang' | 'don-hang' | 'thong-ke' {
  if (pathname === '/admin/thong-ke' || pathname.startsWith('/admin/thong-ke')) {
    return 'thong-ke';
  }
  if (
    pathname === '/admin/orders/products' ||
    pathname.startsWith('/admin/orders/products')
  ) {
    return 'don-hang';
  }
  return 'gian-hang';
}

export type AdminShellView =
  | 'gian-hang'
  | 'don-hang'
  | 'don-hang-dich-vu'
  | 'don-hang-khieu-nai'
  | 'thong-ke'
  | 'quan-ly-reseller'
  | 'danh-gia'
  | 'ma-giam-gia'
  | 'don-hang-da-mua'
  | 'lich-su-thanh-toan'
  | 'gian-hang-top-1';

export function pathToAdminShellView(pathname: string): AdminShellView | null {
  if (!pathname.startsWith('/admin')) return null;
  if (pathname === '/admin' || pathname === '/admin/') return 'gian-hang';
  if (pathname.startsWith('/admin/gian-hang')) return 'gian-hang';
  if (pathname === '/admin/orders' || pathname.startsWith('/admin/orders/products')) return 'don-hang';
  if (pathname.startsWith('/admin/orders/services')) return 'don-hang-dich-vu';
  if (pathname.startsWith('/admin/orders/complaints')) return 'don-hang-khieu-nai';
  if (pathname === '/admin/thong-ke' || pathname.startsWith('/admin/thong-ke')) return 'thong-ke';
  if (pathname.startsWith('/admin/reseller')) return 'quan-ly-reseller';
  if (pathname.startsWith('/admin/reviews')) return 'danh-gia';
  if (pathname.startsWith('/admin/discount-codes')) return 'ma-giam-gia';
  if (pathname.startsWith('/admin/top1')) return 'gian-hang-top-1';
  if (pathname.startsWith('/admin/account/purchases')) return 'don-hang-da-mua';
  if (pathname.startsWith('/admin/account/payments')) return 'lich-su-thanh-toan';
  /** Dashboard TapHoa (user, chat, rút tiền, …) — App.tsx xử lý riêng qua `/admin/panel`. */
  if (pathname.startsWith('/admin/panel')) return null;
}

export function adminShellViewToPath(view: AdminShellView): string {
  switch (view) {
    case 'gian-hang':
      return '/admin/gian-hang';
    case 'don-hang':
      return '/admin/orders/products';
    case 'don-hang-dich-vu':
      return '/admin/orders/services';
    case 'don-hang-khieu-nai':
      return '/admin/orders/complaints';
    case 'thong-ke':
      return '/admin/thong-ke';
    case 'quan-ly-reseller':
      return '/admin/reseller';
    case 'danh-gia':
      return '/admin/reviews';
    case 'ma-giam-gia':
      return '/admin/discount-codes';
    case 'gian-hang-top-1':
      return '/admin/top1';
    case 'don-hang-da-mua':
      return '/admin/account/purchases';
    case 'lich-su-thanh-toan':
      return '/admin/account/payments';
    default:
      return '/admin/gian-hang';
  }
}
