import type { Order } from '../ordersTypes';
import { applyBuyerDefectiveReportToOrder } from './sellerSoldWarehouse';

export function reportDefectiveItemsOnOrder(order: Order, itemIds: string[]): Order {
  const unique = [...new Set(itemIds.filter(Boolean))];
  if (unique.length === 0) return order;
  return applyBuyerDefectiveReportToOrder(order, unique);
}
