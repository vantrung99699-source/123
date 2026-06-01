import { FastForward } from 'lucide-react';
import type { Order } from '../ordersTypes';
import { formatOrderTimerHint } from '../storefront/orderTimers';

export interface OrderTimeTestControlsProps {
  order: Order;
  onFastForward: (orderId: string) => void;
}

/** Nút +3 ngày — luôn hiển thị mọi trạng thái (kiểm thử hẹn giờ tạm giữ / tranh chấp). */
export function OrderTimeTestControls({ order, onFastForward }: OrderTimeTestControlsProps) {
  const hint = formatOrderTimerHint(order);
  return (
    <div className="flex flex-col items-center gap-1.5">
      {hint && (
        <span className="text-[9px] font-semibold text-slate-400 max-w-[120px] text-center leading-tight">
          {hint}
        </span>
      )}
      <button
        type="button"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          onFastForward(order.id);
        }}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors"
        title="Kiểm thử: +3 ngày — Đặt trước (chưa giao)→Thất bại sau hạn 7 ngày; Tạm giữ→Hoàn thành; Khiếu nại→Thất bại; Tranh chấp→hoàn tiền; DV→Thất bại"
      >
        <FastForward size={10} />
        +3 ngày
      </button>
    </div>
  );
}
