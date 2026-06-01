import type { Order, OrderStatus } from '../ordersTypes';
import {
  ORDER_STATUS_BADGE_BASE,
  getOrderStatusDisplayLabel,
  getOrderStatusStyleForOrder,
  isPreOrderAwaitingFulfillment,
} from '../orderStatusBadge';
import { hasPendingRefundOffer, isPartialRefundOrder } from '../orderRefund';
import { getOrderFailureReasonLabel, isOrderTimerAutoFailure } from '../orderFailureLabel';
import { OrderTimeTestControls } from './OrderTimeTestControls';

export interface OrderStatusCellProps {
  order: Order;
  /** Admin bảng dùng px-3; storefront dùng base từ orderStatusBadge */
  badgeClassName?: string;
  getStatusStyle?: (status: OrderStatus) => string;
  showTimeTest?: boolean;
  onFastForward?: (orderId: string) => void;
}

export function OrderStatusCell({
  order,
  badgeClassName,
  getStatusStyle: getStatusStyleProp,
  showTimeTest = false,
  onFastForward,
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
      {showTimeTest && onFastForward && (
        <OrderTimeTestControls order={order} onFastForward={onFastForward} />
      )}
    </div>
  );
}
