import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Filter,
  ChevronDown,
  Search,
  MessageSquare,
  XCircle,
  Shield,
  Calendar,
  Users,
  Facebook,
  Music,
  Globe,
  Folder,
  Package,
  Truck,
  X,
  AlertCircle,
} from 'lucide-react';
import { compareOrdersNewestFirst, type Order, type OrderStatus } from '../ordersTypes';
import { fastForwardOrderTimeThreeDays, getFastForwardResultMessage } from '../storefront/orderTimers';
import { OrderStatusCell } from '../components/OrderStatusCell';
import { OrderRefundCell } from '../components/OrderRefundCell';
import { OrderSellerFeesCell } from '../components/OrderSellerFeesCell';
import { OrderTotalAmountCell } from '../components/OrderTotalAmountCell';
import { isPreOrderAwaitingFulfillment } from '../orderStatusBadge';

export interface ProductOrdersViewProps {
  orders: Order[];
  setOrders: Dispatch<SetStateAction<Order[]>>;
  onOrderClick?: (id: string) => void;
  /** Trừ kho gian hàng và giao hàng cho đơn đặt trước. */
  onFulfillPreOrder?: (orderId: string) => { ok: boolean; message: string };
  defaultStatusFilter?: string;
  onMessageBuyer?: (orderId: string) => void;
  /** Tab riêng đặt trước — ẩn lọc «Đặt trước», thêm «Chờ giao». */
  preOrderTab?: boolean;
}

export function ProductOrdersView({
  onOrderClick,
  orders,
  setOrders,
  onFulfillPreOrder,
  defaultStatusFilter = 'Tất cả',
  onMessageBuyer,
  preOrderTab = false,
}: ProductOrdersViewProps) {
  const [activeFilter, setActiveFilter] = useState(preOrderTab ? 'Chờ giao' : defaultStatusFilter);
  useEffect(() => {
    setActiveFilter(preOrderTab ? 'Chờ giao' : defaultStatusFilter);
  }, [defaultStatusFilter, preOrderTab]);
  const [search, setSearch] = useState('');
  const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedOrderForWarranty, setSelectedOrderForWarranty] = useState<Order | null>(null);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);
  const [warrantyQuantity, setWarrantyQuantity] = useState<number>(0);
  const [warrantyMessage, setWarrantyMessage] = useState('');
  const [cancelQuantity, setCancelQuantity] = useState<number>(0);
  const [warrantyError, setWarrantyError] = useState<string | null>(null);
  const [fulfillModalOrder, setFulfillModalOrder] = useState<Order | null>(null);
  const [fulfillError, setFulfillError] = useState<string | null>(null);

  const handleServiceWarranty = (order: Order) => {
    if (order.isWarrantyProcessed) {
      setWarrantyError('Chỉ bảo hành 1 lần');
      return;
    }
    setSelectedOrderForWarranty(order);
    setWarrantyQuantity(order.quantity);
    setIsWarrantyModalOpen(true);
  };

  const handleProductWarranty = (order: Order) => {
    setSelectedOrderForWarranty(order);
    setWarrantyQuantity(order.quantity);
    setIsWarrantyModalOpen(true);
  };

  const handleConfirmWarranty = () => {
    if (selectedOrderForWarranty) {
      if (selectedOrderForWarranty.isWarrantyProcessed) {
        setWarrantyError('Chỉ bảo hành 1 lần');
        return;
      }

      let newOrderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      // Ensure newOrderId is unique
      while (orders.some(o => o.id === newOrderId)) {
        newOrderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      }

      const now = new Date();
      const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const newOrder: Order = {
        ...selectedOrderForWarranty,
        id: newOrderId,
        purchaseDate: formattedDate,
        quantity: warrantyQuantity,
        discount: selectedOrderForWarranty.unitPrice,
        totalAmount: '0đ',
        status: 'Tạm giữ tiền',
        warrantedFromId: selectedOrderForWarranty.id,
        isWarrantyProcessed: false,
        hasComplained: false,
        order_type: 'product',
        platformFee: '0đ',
        platformFeePercent: 0,
        reseller: undefined,
        resellerReferrerEmail: undefined,
        resellerPercent: undefined,
        resellerFee: '0đ',
      };

      setOrders(prev => [
        newOrder,
        ...prev.map(order => 
          order.id === selectedOrderForWarranty.id 
            ? { ...order, isWarrantyProcessed: true, warrantedToId: newOrderId } 
            : order
        )
      ]);

      setIsWarrantyModalOpen(false);
      setWarrantyMessage('');
    }
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? {
              ...order,
              status: 'Thất bại',
              refund: order.checkoutPaid ? order.totalAmount : '0đ',
              failureKind: 'admin_cancel',
            }
          : order
      )
    );
    setIsCancelModalOpen(false);
  };

  const handleConfirmFulfillPreOrder = () => {
    if (!fulfillModalOrder || !onFulfillPreOrder) return;
    setFulfillError(null);
    const result = onFulfillPreOrder(fulfillModalOrder.id);
    if (!result.ok) {
      setFulfillError(result.message);
      return;
    }
    setFulfillModalOrder(null);
    window.alert(result.message);
  };

  const handleFastForwardTime = (orderId: string) => {
    const before = orders.find(o => o.id === orderId);
    if (!before) return;
    const after = fastForwardOrderTimeThreeDays(before);
    setOrders(prev => prev.map(o => (o.id === orderId ? after : o)));
    if (before.status !== after.status) {
      window.alert(`Đã cập nhật: ${before.status} → ${after.status}`);
      return;
    }
    window.alert(getFastForwardResultMessage(before, after));
  };

  const filters = preOrderTab
    ? ['Tất cả', 'Chờ giao', 'Hoàn thành', 'Thất bại']
    : [
        'Tất cả',
        'Hoàn thành',
        'Đang thực hiện',
        'Khiếu nại',
        'Tranh chấp',
        'Tạm giữ tiền',
        'Thất bại',
        'Chờ xác nhận',
        'Đặt trước',
      ];

  const filteredOrders = orders
    .filter(order => {
      const isProduct = order.order_type !== 'service';
      if (!isProduct) return false;

      let matchesFilter = true;
      if (preOrderTab) {
        if (activeFilter === 'Chờ giao') {
          matchesFilter = isPreOrderAwaitingFulfillment(order);
        } else if (activeFilter === 'Hoàn thành') {
          matchesFilter = Boolean(order.preOrderFulfilled) || order.status === 'Hoàn thành';
        } else if (activeFilter === 'Thất bại') {
          matchesFilter = order.status === 'Thất bại';
        }
      } else {
        matchesFilter =
          activeFilter === 'Tất cả' ||
          (activeFilter === 'Đặt trước' && order.isPreOrder === true) ||
          order.status === activeFilter;
      }
      const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase()) || 
                           order.buyerName.toLowerCase().includes(search.toLowerCase()) ||
                           order.productName.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort(compareOrdersNewestFirst);

  const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  };

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'Hoàn thành': return 'bg-[#4caf50] text-white border-transparent';
      case 'Đang thực hiện': return 'bg-[#42a5f5] text-white border-transparent';
      case 'Khiếu nại': return 'bg-[#ef5350] text-white border-transparent';
      case 'Tranh chấp': return 'bg-[#ef5350] text-white border-transparent';
      case 'Tạm giữ tiền': return 'bg-[#2d6a61] text-white border-transparent';
      case 'Thất bại': return 'bg-[#1c2331] text-white border-transparent';
      case 'Chờ xác nhận': return 'bg-[#ffb300] text-amber-900 border-transparent';
      default: return 'bg-slate-500 text-white border-transparent';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none cursor-pointer"
          >
            {filters.map(filter => (
              <option key={filter} value={filter}>{filter}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm mã đơn, tên người mua, sản phẩm..." 
            className="w-full pl-11 pr-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible">
        <div className="overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 w-24">HÀNH ĐỘNG</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200">MÃ ĐƠN / NGÀY MUA</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 min-w-[450px]">GIAN HÀNG / SẢN PHẨM</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200">NGƯỜI MUA</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-center w-20">SL</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-right">ĐƠN GIÁ</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-center">GIẢM</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-right">TỔNG TIỀN</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-center">HOÀN TIỀN</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-center">SÀN / RESELLER</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display text-center min-w-[200px]">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-4 border-r border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onMessageBuyer?.(order.id)}
                        disabled={!onMessageBuyer}
                        className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Nhắn tin với khách"
                      >
                        <MessageSquare size={14} />
                      </button>
                      {isPreOrderAwaitingFulfillment(order) && onFulfillPreOrder && (
                        <button
                          type="button"
                          onClick={() => {
                            setFulfillError(null);
                            setFulfillModalOrder(order);
                          }}
                          className="p-2 text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all border border-emerald-200/80"
                          title="Giao hàng từ kho"
                        >
                          <Truck size={14} />
                        </button>
                      )}
                      {(order.status === 'Chờ xác nhận' ||
                        isPreOrderAwaitingFulfillment(order) ||
                        order.status === 'Tạm giữ tiền' ||
                        order.status === 'Khiếu nại' ||
                        order.status === 'Tranh chấp' ||
                        order.status === 'Đang thực hiện') && (
                        <button 
                          onClick={() => {
                            setSelectedOrderForCancel(order);
                            setCancelQuantity(order.quantity);
                            setIsCancelModalOpen(true);
                          }}
                          className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 hover:scale-110 transition-all shadow-sm" 
                          title="Hủy đơn"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                      {(order.status === 'Tạm giữ tiền' ||
                        order.status === 'Khiếu nại' ||
                        order.status === 'Tranh chấp') &&
                        !order.isPreOrder && (
                        <button 
                          onClick={() => {
                            if (order.isWarrantyProcessed) {
                              setWarrantyError('Chỉ bảo hành 1 lần');
                              return;
                            }
                            if (order.order_type === 'product') {
                              handleProductWarranty(order);
                            } else {
                              handleServiceWarranty(order);
                            }
                          }}
                          className="p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-all" 
                          title="Bảo hành"
                        >
                          <Shield size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-col">
                        <span 
                          onClick={() => onOrderClick?.(order.id)}
                          className={`text-sm font-bold text-blue-600 font-mono tracking-tight ${onOrderClick ? 'hover:underline cursor-pointer' : ''}`}
                        >
                          {order.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold whitespace-nowrap">
                        <Calendar size={13} className="text-slate-500" />
                        {order.purchaseDate}
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 text-[10px] font-bold hover:underline cursor-pointer transition-all w-fit">
                        <Users size={10} className="text-blue-400" />
                        {order.sellerName}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                          {order.categoryName.toLowerCase().includes('facebook') ? <Facebook size={14} /> :
                           order.categoryName.toLowerCase().includes('tiktok') ? <Music size={14} /> :
                           order.categoryName.toLowerCase().includes('google') ? <Globe size={14} /> :
                           <Folder size={14} />}
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer transition-colors uppercase tracking-wider truncate block">{order.categoryName || 'FACEBOOK'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0 border border-blue-100/50">
                          <Package size={14} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[13px] font-bold text-slate-800 leading-tight block line-clamp-2">{order.productName}</span>
                          {order.isPreOrder && order.preOrderNote && (
                            <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block line-clamp-2">
                              Ghi chú: {order.preOrderNote}
                            </span>
                          )}
                          {order.warrantedFromId && (
                            <span className="text-[10px] text-rose-500 font-bold italic mt-0.5 block">
                              đơn hàng bảo hành
                            </span>
                          )}
                          {order.isWarrantyProcessed && (
                            <span className="text-[10px] text-amber-600 font-bold italic mt-0.5 block">
                              đơn hàng đã hỗ trợ bảo hành {order.warrantedToId && (
                                <> ( mã đơn : <span className={`underline ${onOrderClick ? 'cursor-pointer' : ''}`} onClick={() => onOrderClick?.(order.warrantedToId!)}>{order.warrantedToId}</span> )</>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100">
                    <span className="text-sm font-bold text-blue-600 hover:underline cursor-pointer transition-colors">
                      {removeAccents(order.buyerName)}
                    </span>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 text-center">
                    <span className="text-xs font-bold text-slate-900">{order.quantity.toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 text-right">
                    <span className="text-xs font-bold text-slate-900">{order.unitPrice}</span>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 text-center">
                    <span className="text-xs font-bold text-slate-900">{order.discount}</span>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100">
                    <OrderTotalAmountCell order={order} />
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 text-center">
                    <OrderRefundCell order={order} />
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 text-center">
                    <OrderSellerFeesCell order={order} />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <OrderStatusCell
                      order={order}
                      badgeClassName={`px-3 py-1 rounded-xl text-[11px] font-bold border whitespace-nowrap ${getStatusStyle(order.status)}`}
                      getStatusStyle={getStatusStyle}
                      showSellerDeadline
                      showTimeTest
                      onFastForward={handleFastForwardTime}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isWarrantyModalOpen && selectedOrderForWarranty && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Yêu cầu bảo hành</h3>
                    <p className="text-xs text-slate-400 font-medium">Đơn hàng: {selectedOrderForWarranty.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsWarrantyModalOpen(false)} 
                  className="p-2 hover:bg-white rounded-xl transition-all text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số lượng bảo hành</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={warrantyQuantity}
                      onChange={(e) => setWarrantyQuantity(Number(e.target.value))}
                      max={selectedOrderForWarranty.quantity}
                      min={1}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 outline-none transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      Tối đa: {selectedOrderForWarranty.quantity}
                    </div>
                  </div>
                  {warrantyQuantity > selectedOrderForWarranty.quantity && (
                    <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                      <AlertCircle size={10} /> Số lượng không được vượt quá số lượng đã mua
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nội dung nhắn tin cho khách</label>
                  <textarea
                    value={warrantyMessage}
                    onChange={(e) => setWarrantyMessage(e.target.value)}
                    placeholder="Nhập nội dung tin nhắn gửi cho khách hàng..."
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setIsWarrantyModalOpen(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirmWarranty}
                  disabled={warrantyQuantity > selectedOrderForWarranty.quantity || warrantyQuantity < 1}
                  className="flex-1 py-3 bg-amber-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác nhận bảo hành
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <AnimatePresence>
          {warrantyError && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-400/10 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-sm w-full text-center space-y-4"
              >
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Thông báo</h3>
                <p className="text-sm text-slate-600 font-medium">{warrantyError}</p>
                <button
                  onClick={() => setWarrantyError(null)}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                >
                  Đóng
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {isCancelModalOpen && selectedOrderForCancel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                    <XCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Hủy đơn hàng</h3>
                    <p className="text-xs text-slate-400 font-medium">Đơn hàng: {selectedOrderForCancel.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCancelModalOpen(false)} 
                  className="p-2 hover:bg-white rounded-xl transition-all text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3">
                  <AlertCircle className="text-rose-600 shrink-0" size={20} />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-rose-900">Xác nhận hủy đơn</p>
                    <p className="text-xs text-rose-700 leading-relaxed font-medium">
                      {selectedOrderForCancel.isPreOrder && !selectedOrderForCancel.checkoutPaid ? (
                        <>
                          Hủy yêu cầu đặt trước. Đơn chưa thanh toán nên không có khoản hoàn tiền.
                        </>
                      ) : (
                        <>Hệ thống sẽ thực hiện hủy toàn bộ đơn hàng và hoàn tiền 100% cho khách hàng.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={() => handleCancelOrder(selectedOrderForCancel.id)}
                  className="flex-1 py-3 bg-rose-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all"
                >
                  Xác nhận hủy đơn
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {fulfillModalOrder && onFulfillPreOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-emerald-200 w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-900">Giao hàng đặt trước</h3>
                    <p className="text-xs text-emerald-800/80 font-medium font-mono">{fulfillModalOrder.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFulfillModalOrder(null);
                    setFulfillError(null);
                  }}
                  className="p-2 hover:bg-white rounded-xl transition-all text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 text-sm text-slate-700">
                <p>
                  <span className="font-bold">Mặt hàng:</span> {fulfillModalOrder.productName}
                </p>
                <p>
                  <span className="font-bold">Số lượng:</span>{' '}
                  {fulfillModalOrder.quantity.toLocaleString('vi-VN')}
                </p>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                  <AlertCircle className="text-amber-600 shrink-0" size={20} />
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    Trước khi giao, hãy <span className="font-bold">thêm sản phẩm vào kho</span> mặt hàng tương ứng
                    (Quản lý cửa hàng → Kho hàng). Hệ thống sẽ lấy đúng số lượng từ kho và gửi cho khách (tiền đã
                    tạm giữ trên sàn).
                  </p>
                </div>
                {fulfillError && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                    {fulfillError}
                  </p>
                )}
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFulfillModalOrder(null);
                    setFulfillError(null);
                  }}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFulfillPreOrder}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
                >
                  Giao từ kho
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
