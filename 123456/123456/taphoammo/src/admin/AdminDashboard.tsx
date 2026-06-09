/**
 * AdminDashboard - Main shell component
 * Tích hợp toàn bộ admin dashboard vào project taphoammo
 */
import React from 'react';

import { useMemo, useState, useCallback } from 'react';
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
import { ProductOrdersView } from './ProductOrdersView';
import { ServiceOrdersView } from './ServiceOrdersView';
import { ComplaintOrdersView } from './ComplaintOrdersView';
import { AdminPanelOrderShell } from './AdminPanelOrderShell';
import { WarehouseView } from '../gianHang/WarehouseView';
import { OrderDetailView as ProductOrderDetailView } from '../OrderDetailView';
import { ServiceOrderDetailView } from '../ServiceOrderDetailView';
import { countGianHangPendingApproval } from '../gianHang/categorySectionUtils';
import type { BusinessLine, Category, Product } from '../gianHang/types';
import type { AdminView, PaymentHistory } from './types';
import type { Order } from '../ordersTypes';
import type { GianHangTop1State } from '../gianHang/gianHangTop1Storage';
import { GeneralSettingsView } from './GeneralSettingsView';
import { NotificationSettingsView } from './NotificationSettingsView';
import { SellerRegistrationManagementView } from './SellerRegistrationManagementView';
import { SharePostManagementView } from './SharePostManagementView';
import { readAdminNotifications } from './adminNotificationsStorage';
import { countPendingSellerRegistrations } from '../storefront/storefrontSellerRegistration';
import { countPendingSharePosts } from '../storefront/storefrontShare';

const VIEW_COMPONENTS: Record<
  Exclude<
    AdminView,
    | 'payment-history'
    | 'seller-transaction-history'
    | 'sales'
    | 'gian-hang-approval'
    | 'users'
    | 'product-orders'
    | 'service-orders'
    | 'complaint-orders'
    | 'top-stores'
    | 'general-settings'
    | 'notification-settings'
    | 'seller-registrations'
    | 'share-posts'
  >,
  React.FC
> = {
  statistics: StatisticsView,
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
  onCreatePlatform,
  onWarehouseProduct,
  isWarehouseOpen = false,
  warehouseProduct = null,
  warehouseCategory = null,
  onWarehouseBack,
  onWarehouseUpdateProduct,
  onShowStats,
  onShowHistory,
  onAdminCloseProduct,
  onAdminSuspendProduct,
  onAdminReopenProduct,
  onFulfillPreOrder,
  onAcceptServiceOrder,
  onDeliverServiceOrder,
  onCancelServiceProcessing,
  onReportDefectiveItems,
  onUploadDefectiveItems,
  gianHangTop1State = { records: {} },
  onGianHangTop1StateChange,
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
  onCreatePlatform?: () => void;
  onWarehouseProduct?: (product: Product, category: Category) => void;
  isWarehouseOpen?: boolean;
  warehouseProduct?: Product | null;
  warehouseCategory?: Category | null;
  onWarehouseBack?: () => void;
  onWarehouseUpdateProduct?: (product: Product) => void;
  onShowStats?: (product: Product) => void;
  onShowHistory?: (product: Product) => void;
  onAdminCloseProduct?: (productId: string) => void;
  onAdminSuspendProduct?: (productId: string) => void;
  onAdminReopenProduct?: (productId: string) => void;
  onFulfillPreOrder?: (orderId: string) => { ok: boolean; message: string };
  onAcceptServiceOrder?: (orderId: string) => void;
  onDeliverServiceOrder?: (orderId: string, deliveryContent: string) => void;
  onCancelServiceProcessing?: (orderId: string) => void;
  onReportDefectiveItems?: (orderId: string, itemIds: string[]) => void;
  onUploadDefectiveItems?: (orderId: string, payload: { text: string }) => void;
  gianHangTop1State?: GianHangTop1State;
  onGianHangTop1StateChange?: (next: GianHangTop1State) => void;
}) {
  const [activeView, setActiveView] = useState<AdminView>('statistics');
  const [panelOrderDetailId, setPanelOrderDetailId] = useState<string | null>(null);
  const [sellerRegVersion, setSellerRegVersion] = useState(0);
  const [sharePostVersion, setSharePostVersion] = useState(0);
  const notificationCount = readAdminNotifications().filter((n) => !n.read).length;
  const pendingGianHangCount = countGianHangPendingApproval(categories);

  const complaintOrderCount = useMemo(
    () => orders.filter(o => o.status === 'Khiếu nại' || o.status === 'Tranh chấp').length,
    [orders]
  );

  const pendingPreOrderCount = useMemo(
    () =>
      orders.filter(
        o =>
          o.isPreOrder &&
          !o.preOrderFulfilled &&
          !(o.deliveredItems?.length ?? 0) &&
          o.order_type !== 'service'
      ).length,
    [orders]
  );

  const pendingSellerRegistrationCount = useMemo(
    () => countPendingSellerRegistrations(),
    [sellerRegVersion, activeView]
  );

  const pendingSharePostCount = useMemo(
    () => countPendingSharePosts(),
    [sharePostVersion, activeView]
  );

  const openPanelOrderDetail = useCallback((orderId: string) => {
    setPanelOrderDetailId(orderId);
  }, []);

  const closePanelOrderDetail = useCallback(() => {
    setPanelOrderDetailId(null);
  }, []);

  const ActiveView =
    activeView === 'payment-history' ||
    activeView === 'seller-transaction-history' ||
    activeView === 'sales' ||
    activeView === 'gian-hang-approval' ||
    activeView === 'users' ||
    activeView === 'product-orders' ||
    activeView === 'service-orders' ||
    activeView === 'complaint-orders' ||
    activeView === 'top-stores' ||
    activeView === 'general-settings' ||
    activeView === 'notification-settings' ||
    activeView === 'seller-registrations' ||
    activeView === 'share-posts'
      ? null
      : VIEW_COMPONENTS[activeView];

  const panelDetailOrder = panelOrderDetailId
    ? orders.find(o => o.id === panelOrderDetailId)
    : undefined;

  const setOrdersSafe = setOrders ?? (() => {});
  const noop = () => {};

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AdminSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        notificationCount={notificationCount}
        pendingGianHangCount={pendingGianHangCount}
        complaintOrderCount={complaintOrderCount}
        pendingPreOrderCount={pendingPreOrderCount}
        pendingSellerRegistrationCount={pendingSellerRegistrationCount}
        pendingSharePostCount={pendingSharePostCount}
      />
      <main className="flex-1 min-w-0 overflow-hidden">
        {panelDetailOrder ? (
          <div className="p-6 h-full overflow-y-auto">
            {panelDetailOrder.order_type === 'service' ? (
              <ServiceOrderDetailView
                order={panelDetailOrder}
                onBack={closePanelOrderDetail}
                onAcceptServiceOrder={onAcceptServiceOrder ?? noop}
                onDeliverServiceOrder={onDeliverServiceOrder ?? noop}
                onCancelServiceProcessing={onCancelServiceProcessing ?? noop}
              />
            ) : (
              <ProductOrderDetailView
                order={panelDetailOrder}
                onBack={closePanelOrderDetail}
                onReportDefectiveItems={onReportDefectiveItems ?? noop}
                onUploadDefectiveItems={onUploadDefectiveItems ?? noop}
              />
            )}
          </div>
        ) : isWarehouseOpen && warehouseProduct && warehouseCategory && onWarehouseBack && onWarehouseUpdateProduct ? (
          <div className="p-6 h-full overflow-y-auto">
            <WarehouseView
              product={warehouseProduct}
              category={warehouseCategory}
              onBack={onWarehouseBack}
              onUpdateProduct={onWarehouseUpdateProduct}
              orders={orders}
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
          ) : activeView === 'product-orders' ? (
            <React.Fragment key="product-orders">
              <AdminPanelOrderShell
                title="Đơn hàng sản phẩm"
                subtitle="Toàn bộ đơn sản phẩm của mọi người bán trên hệ thống — lọc theo người bán, xem chi tiết, giao đặt trước, bảo hành."
                orders={orders.filter(o => o.order_type !== 'service')}
              >
                {filtered => (
                  <ProductOrdersView
                    orders={filtered}
                    setOrders={setOrdersSafe}
                    onOrderClick={openPanelOrderDetail}
                    onFulfillPreOrder={onFulfillPreOrder}
                    defaultStatusFilter={pendingPreOrderCount > 0 ? 'Đặt trước' : 'Tất cả'}
                  />
                )}
              </AdminPanelOrderShell>
            </React.Fragment>
          ) : activeView === 'service-orders' ? (
            <React.Fragment key="service-orders">
              <AdminPanelOrderShell
                title="Đơn hàng dịch vụ"
                subtitle="Đơn dịch vụ của tất cả người bán — theo dõi trạng thái, hủy, bảo hành."
                orders={orders.filter(o => o.order_type === 'service')}
              >
                {filtered => (
                  <ServiceOrdersView
                    orders={filtered}
                    setOrders={setOrdersSafe}
                    onOrderClick={openPanelOrderDetail}
                  />
                )}
              </AdminPanelOrderShell>
            </React.Fragment>
          ) : activeView === 'complaint-orders' ? (
            <React.Fragment key="complaint-orders">
              <AdminPanelOrderShell
                title="Đơn hàng khiếu nại"
                subtitle="Đơn Khiếu nại / Tranh chấp của mọi người bán — giải quyết hoàn tiền, bảo hành, chuyển tranh chấp."
                orders={orders.filter(
                  o => o.status === 'Khiếu nại' || o.status === 'Tranh chấp'
                )}
              >
                {filtered => (
                  <ComplaintOrdersView
                    orders={filtered}
                    setOrders={setOrdersSafe}
                    onOrderClick={openPanelOrderDetail}
                  />
                )}
              </AdminPanelOrderShell>
            </React.Fragment>
          ) : activeView === 'users' ? (
            <React.Fragment key="users">
              <UserManagementView orders={orders} extraPaymentHistory={extraPaymentHistory} />
            </React.Fragment>
          ) : activeView === 'general-settings' ? (
            <React.Fragment key="general-settings">
              <GeneralSettingsView categories={categories} orders={orders} />
            </React.Fragment>
          ) : activeView === 'notification-settings' ? (
            <React.Fragment key="notification-settings">
              <NotificationSettingsView />
            </React.Fragment>
          ) : activeView === 'seller-registrations' ? (
            <React.Fragment key="seller-registrations">
              <SellerRegistrationManagementView onDataChange={() => setSellerRegVersion(v => v + 1)} />
            </React.Fragment>
          ) : activeView === 'share-posts' ? (
            <React.Fragment key="share-posts">
              <SharePostManagementView onDataChange={() => setSharePostVersion(v => v + 1)} />
            </React.Fragment>
          ) : activeView === 'top-stores' ? (
            <React.Fragment key="top-stores">
              <TopStoreManagementView
                categories={categories}
                top1State={gianHangTop1State}
                onTop1StateChange={onGianHangTop1StateChange}
              />
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
                onCreatePlatform={onCreatePlatform}
                onWarehouseProduct={onWarehouseProduct}
                onShowStats={onShowStats}
                onShowHistory={onShowHistory}
                onAdminCloseProduct={onAdminCloseProduct}
                onAdminSuspendProduct={onAdminSuspendProduct}
                onAdminReopenProduct={onAdminReopenProduct}
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
