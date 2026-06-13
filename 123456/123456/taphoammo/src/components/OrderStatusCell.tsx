import type { Order, OrderStatus } from '../ordersTypes';
import {
  ORDER_STATUS_BADGE_BASE,
  getOrderStatusDisplayLabel,
  getOrderStatusStyleForOrder,
  isPreOrderAwaitingFulfillment,
} from '../orderStatusBadge';
import { hasPendingRefundOffer, isPartialRefundOrder } from '../orderRefund';
import { getOrderFailureReasonLabel, isOrderTimerAutoFailure } from '../orderFailureLabel';
import { resolveOrderSellerDeadline } from '../storefront/orderDeadlineDisplay';
import { OrderTimeTestControls } from './OrderTimeTestControls';

export interface OrderStatusCellProps {
  order: Order;
  /** Admin bảng dùng px-3; storefront dùng base từ orderStatusBadge */
  badgeClassName?: string;
  getStatusStyle?: (status: OrderStatus) => string;
  showTimeTest?: boolean;
  onFastForward?: (orderId: string) => void;
  /** Bảng người bán: hiển thị hạn xử lý dưới badge trạng thái */
  showSellerDeadline?: boolean;
}

export function OrderStatusCell({
  order,
  badgeClassName,
  getStatusStyle: getStatusStyleProp,
  showTimeTest = false,
  onFastForward,
  showSellerDeadline = false,
}: OrderStatusCellProps) {
  const useCustomStatusStyle =
    isPreOrderAwaitingFulfillment(order) ||
    hasPendingRefundOffer(order) ||
    isPartialRefundOrder(order);
  const resolvedStyle =
    getStatusStyleProp && !useCustomStatusStyle
      ? getStatusStyleProp(order.status)
      : getOrderStatusStyleForOrder(order);
  const badgeClass =
    badgeClassName ?? `${ORDER_STATUS_BADGE_BASE} ${resolvedStyle}`;
  const failureLabel = getOrderFailureReasonLabel(order);
  const statusLabel = getOrderStatusDisplayLabel(order);
  const sellerDeadline = showSellerDeadline ? resolveOrderSellerDeadline(order) : null;

  return (
    <div className="flex flex-col items-center gap-1.5 max-w-[220px]">
      <span
        className={badgeClass}
        title={failureLabel ?? statusLabel}
      >
        {statusLabel}
      </span>
      {failureLabel && (
        <span
          className={
            isOrderTimerAutoFailure(order)
              ? 'text-[9px] font-bold text-rose-800 bg-rose-50 border border-rose-200/90 px-2 py-0.5 rounded-lg text-center leading-tight whitespace-nowrap max-w-full truncate'
              : 'text-[9px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-center leading-tight whitespace-nowrap max-w-full truncate'
          }
          title={failureLabel}
        >
          {failureLabel}
        </span>
      )}
      {sellerDeadline && (
        <div className="flex flex-col items-center gap-0.5 w-full">
          {sellerDeadline.note ? (
            <span className="text-[9px] font-semibold text-slate-400 leading-tight text-center">
              {sellerDeadline.note}
            </span>
          ) : null}
          <span
            className={`text-[10px] font-bold tabular-nums leading-snug text-center ${
              sellerDeadline.isOverdue ? 'text-rose-600' : 'text-slate-700'
            }`}
          >
            {sellerDeadline.deadlineDateLabel}
          </span>
          <span
            className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold tabular-nums ${
              sellerDeadline.isOverdue
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {sellerDeadline.countdownLabel}
          </span>
        </div>
      )}
      {showTimeTest && onFastForward && (
        <OrderTimeTestControls order={order} onFastForward={onFastForward} />
      )}
    </div>
  );
}
