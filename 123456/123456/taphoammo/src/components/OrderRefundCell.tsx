import type { Order } from '../ordersTypes';
import { getOrderRefundDisplay, hasPendingRefundOffer } from '../orderRefund';
import {
  hasPendingWarrantyOffer,
  resolveWarrantyOfferQuantities,
} from '../storefront/warrantyOffer';

export function OrderRefundCell({
  order,
  buyerOwnerEmail = '',
}: {
  order: Order;
  /** Email hội thoại — đọc SL bảo hành từ tin nhắn nếu đơn chưa sync. */
  buyerOwnerEmail?: string;
}) {
  const warrantyOffer = resolveWarrantyOfferQuantities(order, buyerOwnerEmail);
  const pendingWarranty =
    hasPendingWarrantyOffer(order) || warrantyOffer != null;
  const pendingRefund = hasPendingRefundOffer(order);
  const { main, sub } = getOrderRefundDisplay(order);

  if (pendingWarranty && warrantyOffer) {
    return (
      <div className="flex flex-col items-center gap-0.5 min-w-[88px]">
        <span
          className="text-xs font-bold text-amber-700 tabular-nums whitespace-nowrap text-center"
          title={`Bảo hành ${warrantyOffer.offer}/${warrantyOffer.max} SP — chờ bạn xác nhận`}
        >
          Bảo hành {warrantyOffer.offer}/{warrantyOffer.max} SP
        </span>
        <span className="text-[9px] font-semibold text-slate-500 leading-tight text-center max-w-[160px] line-clamp-2">
          Chờ bạn xác nhận
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[88px]">
      <span
        className={`text-xs font-bold tabular-nums whitespace-nowrap ${
          pendingRefund || pendingWarranty
            ? 'text-amber-700'
            : main === '0đ'
              ? 'text-slate-400'
              : 'text-emerald-700'
        }`}
        title={sub ? `${main} — ${sub}` : main}
      >
        {main}
      </span>
      {sub && (
        <span className="text-[9px] font-semibold text-slate-500 leading-tight text-center max-w-[160px] line-clamp-2">
          {sub}
        </span>
      )}
    </div>
  );
}
