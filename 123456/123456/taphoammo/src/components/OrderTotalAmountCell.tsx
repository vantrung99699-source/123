import type { Order } from '../ordersTypes';
import { formatOrderTotalDisplay } from '../orderAmountDisplay';

export function OrderTotalAmountCell({ order }: { order: Order }) {
  return (
    <div className="text-right">
      <span className="text-xs font-bold text-blue-600 tabular-nums">{formatOrderTotalDisplay(order)}</span>
    </div>
  );
}
