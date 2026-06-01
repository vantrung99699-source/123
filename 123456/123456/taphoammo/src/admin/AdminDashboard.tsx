/**
 * AdminDashboard - Main shell component
 * Tích hợp toàn bộ admin dashboard vào project taphoammo
 */
import React from 'react';

import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { AdminSidebar } from './AdminSidebar';
import { StatisticsView } from './StatisticsView';
import { UserManagementView } from './UserManagementView';
import { SalesManagementView } from './SalesManagementView';
import { TopStoreManagementView } from './TopStoreManagementView';
import { MessageManagementView } from './MessageManagementView';
import { PaymentMethodsView } from './PaymentMethodsView';
import { WithdrawalManagementView } from './WithdrawalManagementView';
import { PaymentHistoryView } from './PaymentHistoryView';
import { NotificationView } from './NotificationView';
import { GianHangApprovalView } from './GianHangApprovalView';
import { WarehouseView } from '../gianHang/WarehouseView';
import { countGianHangPendingApproval } from '../gianHang/categorySectionUtils';
import type { BusinessLine, Category, Product } from '../gianHang/types';
import type { AdminView, PaymentHistory } from './types';
import type { Order } from '../ordersTypes';
import { ADMIN_NOTIFICATIONS } from './data';

const VIEW_COMPONENTS: Record<
  Exclude<
    AdminView,
    'payment-history' | 'seller-transaction-history' | 'sales' | 'gian-hang-approval'
  >,
  React.FC
> = {
  statistics: StatisticsView,
  users: UserManagementView,
  'top-stores': TopStoreManagementView,
  messages: MessageManagementView,
  'payment-methods': PaymentMethodsView,
  withdrawals: WithdrawalManagementView,
  notifications: NotificationView,
};

export function AdminDashboard({
  extraPaymentHistory = [],
  orders = [],
  setOrders,
  categories = [],
  classificationData = {},
  resolveBusinessLine,
  lineForClassificationKey,
  onApproveGianHang,
  onRejectGianHang,
  onApproveProduct,
  onRejectProduct,
  onCreateProduct,
  onEditCategory,
  onDeleteCategory,
  onToggleProduct,
  onEditProduct,
  onDeleteProduct,
  onSwapGianHang,
  onSwapProducts,
  onOpenManagePlatforms,
  onOpenManageProductTypes,
  onOpenMove,
  onCreateGianHang,
  onQuickCreateDemo,
  onCreatePlatform,
  onWarehouseProduct,
  isWarehouseOpen = false,
  warehouseProduct = null,
  warehouseCategory = null,
  onWarehouseBack,
  onWarehouseUpdateProduct,
}: {
  extraPaymentHistory?: PaymentHistory[];
  orders?: Order[];
  setOrders?: React.Dispatch<React.SetStateAction<Order[]>>;
  categories?: Category[];
  classificationData?: Record<string, Record<string, string[]>>;
  resolveBusinessLine?: (cat: Category) => BusinessLine;
  lineForClassificationKey?: (key: string) => BusinessLine | null;
  onApproveGianHang?: (categoryId: string) => void;
  onRejectGianHang?: (categoryId: string) => void;
  onApproveProduct?: (productId: string) => void;
  onRejectProduct?: (productId: string) => void;
  onCreateProduct?: (categoryId: string) => void;
  onEditCategory?: (category: Category) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onToggleProduct?: (productId: string) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onSwapGianHang?: (parentId: string, gianHangIdA: string, gianHangIdB: string) => void;
  onSwapProducts?: (categoryId: string, productIdA: string, productIdB: string) => void;
  onOpenManagePlatforms?: () => void;
  onOpenManageProductTypes?: () => void;
  onOpenMove?: () => void;
  onCreateGianHang?: () => void;
  onQuickCreateDemo?: (
    businessLine: BusinessLine
  ) => import('../gianHang/GianHangManagePanel').QuickCreateDemoResult | void;
  onCreatePlatform?: () => void;
  onWarehouseProduct?: (product: Product, category: Category) => void;
  isWarehouseOpen?: boolean;
  warehouseProduct?: Product | null;
  warehouseCategory?: Category | null;
  onWarehouseBack?: () => void;
  onWarehouseUpdateProduct?: (product: Product) => void;
}) {
  const [activeView, setActiveView] = useState<AdminView>('statistics');
  const notificationCount = ADMIN_NOTIFICATIONS.filter((n) => !n.read).length;
  const pendingGianHangCount = countGianHangPendingApproval(categories);

  const ActiveView =
    activeView === 'payment-history' ||
    activeView === 'seller-transaction-history' ||
    activeView === 'sales' ||
    activeView === 'gian-hang-approval'
      ? null
      : VIEW_COMPONENTS[activeView];

  const setOrdersSafe = setOrders ?? (() => {});
  const noop = () => {};

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AdminSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        notificationCount={notificationCount}
        pendingGianHangCount={pendingGianHangCount}
      />
      <main className="flex-1 min-w-0 overflow-hidden">
        {isWarehouseOpen && warehouseProduct && warehouseCategory && onWarehouseBack && onWarehouseUpdateProduct ? (
          <div className="p-6 h-full overflow-y-auto">
            <WarehouseView
              product={warehouseProduct}
              category={warehouseCategory}
              onBack={onWarehouseBack}
              onUpdateProduct={onWarehouseUpdateProduct}
            />
          </div>
        ) : (
        <AnimatePresence mode="wait">
          {activeView === 'payment-history' ? (
            <React.Fragment key="payment-history">
              <PaymentHistoryView extraRows={extraPaymentHistory} orders={orders} variant="all" />
            </React.Fragment>
          ) : activeView === 'seller-transaction-history' ? (
            <React.Fragment key="seller-transaction-history">
              <PaymentHistoryView extraRows={extraPaymentHistory} orders={orders} variant="seller" />
            </React.Fragment>
          ) : activeView === 'sales' ? (
            <React.Fragment key="sales">
              <SalesManagementView orders={orders} setOrders={setOrdersSafe} />
            </React.Fragment>
          ) : activeView === 'gian-hang-approval' ? (
            <React.Fragment key="gian-hang-approval">
              <GianHangApprovalView
                categories={categories}
                classificationData={classificationData}
                resolveBusinessLine={
                  resolveBusinessLine ?? (() => 'Bán sản phẩm' as BusinessLine)
                }
                lineForClassificationKey={lineForClassificationKey ?? (() => null)}
                onApproveStore={onApproveGianHang ?? noop}
                onRejectStore={onRejectGianHang ?? noop}
                onApproveProduct={onApproveProduct ?? noop}
                onRejectProduct={onRejectProduct ?? noop}
                onCreateProduct={onCreateProduct}
                onEditCategory={onEditCategory}
                onDeleteCategory={onDeleteCategory}
                onToggleProduct={onToggleProduct}
                onEditProduct={onEditProduct}
                onDeleteProduct={onDeleteProduct}
                onSwapGianHang={onSwapGianHang}
                onSwapProducts={onSwapProducts}
                onOpenManagePlatforms={onOpenManagePlatforms}
                onOpenManageProductTypes={onOpenManageProductTypes}
                onOpenMove={onOpenMove}
                onCreateGianHang={onCreateGianHang}
                onQuickCreateDemo={onQuickCreateDemo}
                onCreatePlatform={onCreatePlatform}
                onWarehouseProduct={onWarehouseProduct}
              />
            </React.Fragment>
          ) : (
            ActiveView && <ActiveView key={activeView} />
          )}
        </AnimatePresence>
        )}
      </main>
    </div>
  );
}
