import type { Order } from '../ordersTypes';
import { formatOrderTotalDisplay } from '../orderAmountDisplay';
import { isWarrantyReplacementOrder } from '../storefront/warrantyOffer';

export function OrderTotalAmountCell({ order }: { order: Order }) {
  if (isWarrantyReplacementOrder(order)) {
    return (
      <div className="text-center">
        <span className="text-xs font-bold text-amber-700">Bảo hành</span>
      </div>
    );
  }

  return (
    <div className="text-right">
      <span className="text-xs font-bold text-blue-600 tabular-nums">{formatOrderTotalDisplay(order)}</span>
    </div>
  );
}
