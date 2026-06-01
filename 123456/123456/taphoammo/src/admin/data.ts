/**
 * Mock data cho Admin Dashboard (không cần backend)
 */

import type {
  AdminUser,
  AdminSaleOrderRow,
  Conversation,
  TopStore,
  PaymentHistory,
  WithdrawalRequest,
  AdminNotification,
} from './types';

export const ADMIN_USERS: AdminUser[] = [
  {
    id: '1', stt: 1, userId: 'USR-001', username: 'minhtuan123',
    createdAt: '12/03/2026 08:34', name: 'Nguyễn Văn An',
    email: 'nguyenvanan@gmail.com', balance: '1.250.000 đ',
    totalDeposit: '9.680.000 đ', totalSpent: '8.430.000 đ',
    status: 'Hoạt động', avatarColor: 'bg-blue-100 text-blue-600',
  },
  {
    id: '2', stt: 2, userId: 'USR-002', username: 'bich_tran_99',
    createdAt: '15/03/2026 14:12', name: 'Trần Thị Bích',
    email: 'tranthibich@gmail.com', balance: '320.000 đ',
    totalDeposit: '2.470.000 đ', totalSpent: '2.150.000 đ',
    status: 'Hoạt động', avatarColor: 'bg-purple-100 text-purple-600',
  },
  {
    id: '3', stt: 3, userId: 'USR-003', username: 'chau_le_pro',
    createdAt: '18/03/2026 09:07', name: 'Lê Minh Châu',
    email: 'leminhchau@gmail.com', balance: '5.800.000 đ',
    totalDeposit: '30.470.000 đ', totalSpent: '24.670.000 đ',
    status: 'Nghi spam', avatarColor: 'bg-orange-100 text-orange-600',
  },
  {
    id: '4', stt: 4, userId: 'USR-004', username: 'dung_pham_dev',
    createdAt: '22/03/2026 16:45', name: 'Phạm Quốc Dũng',
    email: 'phamquocdung@gmail.com', balance: '75.000 đ',
    totalDeposit: '1.055.000 đ', totalSpent: '980.000 đ',
    status: 'Nghi spam', avatarColor: 'bg-red-100 text-red-600',
  },
  {
    id: '5', stt: 5, userId: 'USR-005', username: 'em_hoang_90',
    createdAt: '25/03/2026 11:20', name: 'Hoàng Thị Em',
    email: 'hoangthiem@gmail.com', balance: '2.900.000 đ',
    totalDeposit: '17.100.000 đ', totalSpent: '14.200.000 đ',
    status: 'Hoạt động', avatarColor: 'bg-emerald-100 text-emerald-600',
  },
  {
    id: '6', stt: 6, userId: 'USR-006', username: 'phong_vu_99',
    createdAt: '28/03/2026 07:58', name: 'Vũ Thành Phong',
    email: 'vuthanhphong@gmail.com', balance: '450.000 đ',
    totalDeposit: '4.200.000 đ', totalSpent: '3.750.000 đ',
    status: 'Khóa chat', avatarColor: 'bg-amber-100 text-amber-600',
  },
  {
    id: '7', stt: 7, userId: 'USR-007', username: 'giang_dang_pro',
    createdAt: '01/04/2026 20:03', name: 'Đặng Thị Giang',
    email: 'dangthigiang@gmail.com', balance: '8.100.000 đ',
    totalDeposit: '39.600.000 đ', totalSpent: '31.500.000 đ',
    status: 'Hoạt động', avatarColor: 'bg-indigo-100 text-indigo-600',
  },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    participants: ['Nguyễn Văn Minh', 'Trần Thị Lan'],
    lastMessage: 'Được, mình gửi ngay.',
    time: '15-01', unreadCount: 0, tags: [], status: 'Bình thường',
    messages: [
      { id: 'm1', sender: 'Nguyễn Văn Minh', text: 'Chào bạn, bên bạn còn mẫu đó không?', time: '14:00', isAdmin: false },
      { id: 'm2', sender: 'Admin', text: 'Còn nhé, bạn cần loại nào?', time: '14:05', isAdmin: true },
      { id: 'm3', sender: 'Nguyễn Văn Minh', text: 'Loại 2 chỉ, hôm trước mình thấy bạn đăng.', time: '14:10', isAdmin: false },
      { id: 'm4', sender: 'Admin', text: 'Có, nhưng giá hôm nay thay đổi chút.', time: '14:15', isAdmin: true },
      { id: 'm5', sender: 'Nguyễn Văn Minh', text: 'Bạn gửi ảnh thật mình xem được không?', time: '14:25', isAdmin: false },
      { id: 'm6', sender: 'Admin', text: 'Được, mình gửi ngay.', time: '14:32', isAdmin: true },
    ],
    notes: [
      { id: 'n1', author: 'Admin Support', text: 'Chưa có dấu hiệu bất thường. Theo dõi định kỳ.', time: '15:10 15-01' },
      { id: 'n2', author: 'Admin Support', text: 'Cuộc trò chuyện bình thường. Có khả năng giao dịch mua bán.', time: '15:00 15-01' },
    ],
  },
  {
    id: 'c2',
    participants: ['Hoàng Anh', 'Phạm Duy'],
    lastMessage: 'Mình thấy hơi không an tâm',
    time: '15-01', unreadCount: 2, tags: ['Cảnh báo'], status: 'Cảnh báo',
    messages: [
      { id: 'm1', sender: 'Hoàng Anh', text: 'Bên bạn uy tín không vậy?', time: '13:00', isAdmin: false },
      { id: 'm2', sender: 'Phạm Duy', text: 'Mình thấy hơi không an tâm', time: '13:05', isAdmin: false },
    ],
    notes: [],
  },
  {
    id: 'c3',
    participants: ['Lê Tuấn', 'Quỳnh Mai'],
    lastMessage: 'Không hoàn được đâu',
    time: '14-01', unreadCount: 4, tags: ['Tranh chấp'], status: 'Tranh chấp',
    messages: [],
    notes: [],
  },
];

export const TOP_STORES: TopStore[] = [
  {
    id: 's1', stt: 1, storeCode: 'GH-8821',
    name: 'Hệ Thống Acc Facebook Clone/Via',
    category: 'Tài khoản FB', username: 'fb_master_99',
    dateTime: '12/03/2026 08:34',
    totalPushCount: 150, totalPushAmount: '1.500.000 đ',
    dailyPushCount: 12, dailyPushAmount: '120.000 đ',
    rank: 1, status: true,
    autoPush: true,
    holdTop1: false,
  },
  {
    id: 's2', stt: 2, storeCode: 'GH-5532',
    name: 'Shop Tài Khoản TikTok Follow Cao',
    category: 'Tài khoản TikTok', username: 'tiktok_ads_pro',
    dateTime: '15/03/2026 14:12',
    totalPushCount: 120, totalPushAmount: '1.200.000 đ',
    dailyPushCount: 8, dailyPushAmount: '80.000 đ',
    rank: 2, status: true,
    autoPush: false,
    holdTop1: true,
  },
  {
    id: 's3', stt: 3, storeCode: 'GH-1109',
    name: 'Cung Cấp Gmail/Outlook Cổ',
    category: 'Email/Hotmail', username: 'gmail_bulk_store',
    dateTime: '18/03/2026 09:07',
    totalPushCount: 95, totalPushAmount: '950.000 đ',
    dailyPushCount: 5, dailyPushAmount: '50.000 đ',
    rank: 3, status: false,
    autoPush: true,
    holdTop1: true,
  },
  {
    id: 's4', stt: 4, storeCode: 'GH-2204',
    name: 'Proxy Residential Việt — Gói Pro',
    category: 'Proxy/VPN', username: 'proxy_vn_shop',
    dateTime: '22/03/2026 11:20',
    totalPushCount: 42, totalPushAmount: '420.000 đ',
    dailyPushCount: 2, dailyPushAmount: '20.000 đ',
    rank: 5, status: false,
    autoPush: false,
    holdTop1: false,
  },
  {
    id: 's5', stt: 5, storeCode: 'GH-7781',
    name: 'Mã nguồn Web/App Laravel',
    category: 'Mã nguồn', username: 'code_market_vn',
    dateTime: '25/03/2026 16:02',
    totalPushCount: 18, totalPushAmount: '180.000 đ',
    dailyPushCount: 0, dailyPushAmount: '0 đ',
    rank: 8, status: true,
    autoPush: false,
    holdTop1: false,
  },
];

export const PAYMENT_HISTORY: PaymentHistory[] = [
  { id: 'TX-1001', userId: 'USR-001', name: 'Nguyễn Văn An', amount: '+1.000.000 đ', type: 'Nạp tiền', status: 'Thành công', time: '02/04/2026 09:15', reason: 'Nạp tiền từ ngân hàng VCB', balanceBefore: '1.500.000 đ', balanceAfter: '2.500.000 đ', calculation: '1.500.000 + 1.000.000 = 2.500.000 đ' },
  { id: 'TX-1002', userId: 'USR-002', name: 'Trần Thị Bích', amount: '-200.000 đ', type: 'Rút tiền', status: 'Thành công', time: '02/04/2026 08:45', reason: 'Rút tiền về tài khoản ngân hàng', balanceBefore: '520.000 đ', balanceAfter: '320.000 đ', calculation: '520.000 - 200.000 = 320.000 đ' },
  { id: 'TX-1003', userId: 'USR-005', name: 'Hoàng Thị Em', amount: '+5.000.000 đ', type: 'Nạp tiền', status: 'Chờ duyệt', time: '02/04/2026 08:30', reason: 'Được tài trợ bởi bridger_hkc03k', balanceBefore: '2.900.000 đ', balanceAfter: '7.900.000 đ', calculation: '2.900.000 + 5.000.000 = 7.900.000 đ' },
  { id: 'TX-1004', userId: 'USR-007', name: 'Đặng Thị Giang', amount: '-1.500.000 đ', type: 'Mua hàng', status: 'Thành công', time: '01/04/2026 22:10', reason: 'Thanh toán cho đơn hàng ZNVHCZ4WFF', balanceBefore: '9.600.000 đ', balanceAfter: '8.100.000 đ', calculation: '9.600.000 - 1.500.000 = 8.100.000 đ' },
  { id: 'TX-1005', userId: 'USR-003', name: 'Lê Minh Châu', amount: '+2.000.000 đ', type: 'Nạp tiền', status: 'Thất bại', time: '01/04/2026 19:20', reason: 'Hoàn tiền cho đơn hàng không hoàn thành(GYV4DBNZBY)', balanceBefore: '5.800.000 đ', balanceAfter: '5.800.000 đ', calculation: '5.800.000 + 0 = 5.800.000 đ' },
  { id: 'TX-1006', userId: 'USR-006', name: 'Vũ Thành Phong', amount: '+150.000 đ', type: 'Bán hàng', status: 'Thành công', time: '01/04/2026 15:05', reason: 'Bán hàng cho shop: joziah_6ktv8c -> mã đơn hàng: KKWX1K7NPJ', balanceBefore: '300.000 đ', balanceAfter: '450.000 đ', calculation: '300.000 + 150.000 = 450.000 đ' },
  { id: 'TX-1007', userId: 'USR-001', name: 'Nguyễn Văn An', amount: '-500.000 đ', type: 'Mua hàng', status: 'Thành công', time: '01/04/2026 10:30', reason: 'Thanh toán cho đơn hàng HW0EXHS7AH', balanceBefore: '2.000.000 đ', balanceAfter: '1.500.000 đ', calculation: '2.000.000 - 500.000 = 1.500.000 đ' },
];

export const WITHDRAWAL_REQUESTS: WithdrawalRequest[] = [
  { id: 'WD-001', username: 'minhtuan123', accountName: 'Nguyễn Văn An', fullName: 'Nguyễn Văn An', bankAccount: '123456789 - VCB', amount: '5.000.000 đ', status: 'Chờ duyệt', time: '02/04/2026 10:30', totalComplaints: 0, activeComplaints: 0, totalWithdrawn: '25.000.000 đ', currentBalance: '15.450.000 đ', totalSales: '45.000.000 đ', heldFunds: '2.500.000 đ' },
  { id: 'WD-002', username: 'bich_tran_99', accountName: 'Trần Thị Bích', fullName: 'Trần Thị Bích', bankAccount: '987654321 - MB', amount: '1.200.000 đ', status: 'Đang xử lý', time: '02/04/2026 09:15', totalComplaints: 2, activeComplaints: 1, totalWithdrawn: '8.500.000 đ', currentBalance: '2.100.000 đ', totalSales: '12.000.000 đ', heldFunds: '500.000 đ' },
  { id: 'WD-003', username: 'em_hoang_90', accountName: 'Hoàng Thị Em', fullName: 'Hoàng Thị Em', bankAccount: '456123789 - Techcombank', amount: '10.500.000 đ', status: 'Hoàn thành', time: '01/04/2026 16:45', totalComplaints: 5, activeComplaints: 0, totalWithdrawn: '150.000.000 đ', currentBalance: '45.000.000 đ', totalSales: '210.000.000 đ', heldFunds: '12.000.000 đ' },
  { id: 'WD-004', username: 'giang_dang_pro', accountName: 'Đặng Thị Giang', fullName: 'Đặng Thị Giang', bankAccount: '321654987 - Agribank', amount: '2.800.000 đ', status: 'Từ chối', time: '01/04/2026 14:20', totalComplaints: 12, activeComplaints: 3, totalWithdrawn: '12.000.000 đ', currentBalance: '3.500.000 đ', totalSales: '18.000.000 đ', heldFunds: '1.200.000 đ' },
  { id: 'WD-005', username: 'phong_vu_99', accountName: 'Vũ Thành Phong', fullName: 'Vũ Thành Phong', bankAccount: '741852963 - BIDV', amount: '450.000 đ', status: 'Chờ duyệt', time: '01/04/2026 11:05', totalComplaints: 1, activeComplaints: 0, totalWithdrawn: '2.000.000 đ', currentBalance: '850.000 đ', totalSales: '3.500.000 đ', heldFunds: '150.000 đ' },
];

export const ADMIN_NOTIFICATIONS: AdminNotification[] = [
  { id: 'n1', title: 'Yêu cầu rút tiền mới', content: 'minhtuan123 yêu cầu rút 5.000.000 đ', type: 'warning', time: '02/04/2026 10:30', read: false },
  { id: 'n2', title: 'Khiếu nại đơn hàng', content: 'Đơn hàng ORD-835150 có khiếu nại mới', type: 'error', time: '02/04/2026 09:15', read: false },
  { id: 'n3', title: 'Người dùng mới', content: 'Đặng Thị Giang vừa đăng ký tài khoản mới', type: 'info', time: '01/04/2026 20:03', read: true },
  { id: 'n4', title: 'Gian hàng Top 1 mới', content: 'fb_master_99 vừa lên Top 1 danh mục Tài khoản FB', type: 'success', time: '01/04/2026 18:45', read: true },
  { id: 'n5', title: 'Cảnh báo spam', content: 'Phát hiện nghi vấn spam từ chau_le_pro', type: 'error', time: '01/04/2026 16:20', read: false },
];

/** Đơn hàng demo — có thể nối sau với `allOrders` trong App.tsx */
export const ADMIN_SALE_ORDERS: AdminSaleOrderRow[] = [
  { id: 'so1', stt: 1, orderId: 'ORD-882712', buyer: 'benson_lcdt5e', seller: 'premium_accs', product: 'Via XMDT Việt Cổ — bảo hành 24h', amount: '300.000 đ', fee: '12.000 đ', status: 'Hoàn thành', date: '21/03/2026 14:30' },
  { id: 'so2', stt: 2, orderId: 'ORD-882713', buyer: 'benson_lcdt5e', seller: 'tiktok_shop', product: 'Acc Tiktok 10k Follow', amount: '450.000 đ', fee: '18.000 đ', status: 'Đang thực hiện', date: '21/03/2026 15:45' },
  { id: 'so3', stt: 3, orderId: 'ORD-882714', buyer: 'minhtuan123', seller: 'google_ads_pro', product: 'Mã Google Ads 100$', amount: '100.000 đ', fee: '4.000 đ', status: 'Khiếu nại', date: '22/03/2026 09:15' },
  { id: 'so4', stt: 4, orderId: 'ORD-882715', buyer: 'bich_tran_99', seller: 'cloud_service', product: 'VPS Windows 4GB — 1 tháng', amount: '250.000 đ', fee: '10.000 đ', status: 'Tạm giữ tiền', date: '22/03/2026 10:30' },
  { id: 'so5', stt: 5, orderId: 'ORD-882801', buyer: 'em_hoang_90', seller: 'fb_master_99', product: 'BM Facebook Ads cũ', amount: '1.200.000 đ', fee: '48.000 đ', status: 'Hoàn thành', date: '28/03/2026 11:20' },
  { id: 'so6', stt: 6, orderId: 'ORD-882802', buyer: 'giang_dang_pro', seller: 'gmail_bulk_store', product: 'Gmail domain — gói 10 acc', amount: '500.000 đ', fee: '20.000 đ', status: 'Thất bại', date: '30/03/2026 08:05' },
  { id: 'so7', stt: 7, orderId: 'ORD-882803', buyer: 'chau_le_pro', seller: 'premium_accs', product: 'Tài khoản BM limit 50', amount: '2.800.000 đ', fee: '112.000 đ', status: 'Đang thực hiện', date: '01/04/2026 16:40' },
];

export const REVENUE_DATA = [
  { month: 'T10', revenue: 185, orders: 1240 },
  { month: 'T11', revenue: 210, orders: 1480 },
  { month: 'T12', revenue: 195, orders: 1320 },
  { month: 'T1', revenue: 245, orders: 1650 },
  { month: 'T2', revenue: 278, orders: 1820 },
  { month: 'T3', revenue: 312, orders: 2140 },
];
