/**
 * Types cho Admin Dashboard (không cần backend)
 */

export type AdminView =
  | 'statistics'
  | 'users'
  | 'sales'
  | 'product-orders'
  | 'service-orders'
  | 'complaint-orders'
  | 'gian-hang-approval'
  | 'top-stores'
  | 'messages'
  | 'payment-methods'
  | 'withdrawals'
  | 'notifications'
  | 'payment-history'
  | 'seller-transaction-history'
  | 'general-settings'
  | 'notification-settings'
  | 'seller-registrations'
  | 'share-posts';

export type AdminUserStatus = 'Hoạt động' | 'Bị cấm' | 'Chờ xác nhận' | 'Khóa chat' | 'Nghi spam';

export interface AdminUser {
  id: string;
  stt: number;
  userId: string;
  username: string;
  createdAt: string;
  name: string;
  email: string;
  balance: string;
  totalDeposit: string;
  totalSpent: string;
  status: AdminUserStatus;
  avatarColor: string;
  /** Đồng bộ storefront-auth-signup-parent: đăng ký form vs mock admin. */
  userSource?: 'storefront_signup' | 'mock';
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  isAdmin: boolean;
}

export interface ChatNote {
  id: string;
  author: string;
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  time: string;
  unreadCount: number;
  tags: string[];
  status: 'Bình thường' | 'Tranh chấp' | 'Cảnh báo';
  messages: Message[];
  notes: ChatNote[];
  isLocked?: boolean;
  lockedParticipants?: string[];
}

export interface TopStore {
  id: string;
  stt: number;
  storeCode: string;
  name: string;
  category: string;
  username: string;
  dateTime: string;
  totalPushCount: number;
  totalPushAmount: string;
  dailyPushCount: number;
  dailyPushAmount: string;
  rank: number;
  status: boolean;
  /** Tự động đẩy tin / đẩy hạng theo lịch */
  autoPush: boolean;
  /** Tự động duy trì vị trí Top 1 */
  holdTop1: boolean;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  name: string;
  amount: string;
  type: 'Nạp tiền' | 'Rút tiền' | 'Mua hàng' | 'Bán hàng' | 'Hoàn tiền';
  status: 'Thành công' | 'Chờ duyệt' | 'Thất bại';
  time: string;
  reason: string;
  balanceBefore: string;
  balanceAfter: string;
  calculation: string;
  /** Giao dịch mua storefront: tên người bán (chip cột Mã đơn / … / Người bán). Mock cũ không có — dùng `name` cho chip. */
  sellerName?: string;
}

export interface WithdrawalRequest {
  id: string;
  username: string;
  accountName: string;
  fullName: string;
  bankAccount: string;
  amount: string;
  status: 'Chờ duyệt' | 'Đang xử lý' | 'Hoàn thành' | 'Từ chối';
  time: string;
  totalComplaints: number;
  activeComplaints: number;
  totalWithdrawn: string;
  currentBalance: string;
  totalSales: string;
  heldFunds: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  time: string;
  read: boolean;
}

export type AdminSaleOrderStatus =
  | 'Hoàn thành'
  | 'Đang thực hiện'
  | 'Khiếu nại'
  | 'Thất bại'
  | 'Tạm giữ tiền';

export interface AdminSaleOrderRow {
  id: string;
  stt: number;
  orderId: string;
  buyer: string;
  seller: string;
  product: string;
  amount: string;
  fee: string;
  status: AdminSaleOrderStatus;
  date: string;
}
