import type { Order } from '../ordersTypes';
import { isPartialRefundOrder } from '../orderRefund';
import { formatOrderPlatformFeeDisplay, getOrderPlatformFeeVnd } from '../storefront/orderPlatformFee';
import {
  formatOrderResellerFeeDisplay,
  getOrderResellerFeeVnd,
  hasOrderResellerReferrer,
} from '../storefront/orderResellerFee';

export function OrderSellerFeesCell({ order }: { order: Order }) {
  const partial = isPartialRefundOrder(order);
  const platformFeeLabel = formatOrderPlatformFeeDisplay(order);
  const hasReferrer = hasOrderResellerReferrer(order);
  const resellerFeeLabel = formatOrderResellerFeeDisplay(order);
  const feeTitle = partial
    ? 'Phí tính trên phần doanh thu còn lại sau hoàn 1 phần'
    : undefined;

  return (
    <div className="flex flex-col gap-1 min-w-[100px]">
      <div className="flex items-center justify-center gap-1" title={feeTitle}>
        <span className="text-[9px] text-slate-400 font-bold uppercase shrink-0">Sàn:</span>
        <span
          className={`text-xs font-bold tabular-nums whitespace-nowrap ${
            partial ? 'text-violet-800' : 'text-slate-700'
          }`}
          title={feeTitle ? `${feeTitle} · ${getOrderPlatformFeeVnd(order).toLocaleString('vi-VN')}đ` : undefined}
        >
          {platformFeeLabel}
        </span>
      </div>
      <div className="flex items-center justify-center gap-1" title={feeTitle}>
        <span className="text-[9px] text-slate-400 font-bold uppercase">Reseller:</span>
        <span
          className={`text-xs font-bold tabular-nums whitespace-nowrap ${
            hasReferrer ? (partial ? 'text-violet-700' : 'text-blue-600') : 'text-slate-400'
          }`}
          title={
            feeTitle
              ? `${feeTitle} · ${getOrderResellerFeeVnd(order).toLocaleString('vi-VN')}đ`
              : hasReferrer && order.reseller?.trim()
                ? `Người giới thiệu: ${order.reseller}${
                    order.resellerPercent != null
                      ? ` · ${order.resellerPercent}% → ${resellerFeeLabel}`
                      : ` · ${resellerFeeLabel}`
                  }`
                : hasReferrer
                  ? 'Hoa hồng người giới thiệu'
                  : 'Không có người giới thiệu'
          }
        >
          {resellerFeeLabel}
        </span>
      </div>
    </div>
  );
}
