/**
 * Quản lý bán hàng — cùng bảng đơn sản phẩm với /admin/orders/products (App shell).
 */
import type { Dispatch, SetStateAction } from 'react';
import type { Order } from '../ordersTypes';
import { ProductOrdersView } from './ProductOrdersView';

export interface SalesManagementViewProps {
  orders: Order[];
  setOrders: Dispatch<SetStateAction<Order[]>>;
}

export function SalesManagementView({ orders, setOrders }: SalesManagementViewProps) {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <ProductOrdersView orders={orders} setOrders={setOrders} />
    </div>
  );
}
