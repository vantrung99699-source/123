/**
 * Quản lý gian hàng trong Admin Panel — cùng UI bảng thẻ như Admin Console
 */
import { GianHangManagePanel } from '../gianHang/GianHangManagePanel';
import type { BusinessLine, Category, Product } from '../gianHang/types';

export interface GianHangApprovalViewProps {
  categories: Category[];
  classificationData: Record<string, Record<string, string[]>>;
  resolveBusinessLine: (cat: Category) => BusinessLine;
  lineForClassificationKey: (key: string) => BusinessLine | null;
  onApproveStore: (categoryId: string) => void;
  onRejectStore: (categoryId: string) => void;
  onApproveProduct: (productId: string) => void;
  onRejectProduct: (productId: string) => void;
  onOpenManagePlatforms?: () => void;
  onOpenManageProductTypes?: () => void;
  onOpenMove?: () => void;
  onCreatePlatform?: () => void;
  onCreateProduct?: (categoryId: string) => void;
  onEditCategory?: (category: Category) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onToggleProduct?: (productId: string) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onSwapGianHang?: (parentId: string, gianHangIdA: string, gianHangIdB: string) => void;
  onSwapProducts?: (categoryId: string, productIdA: string, productIdB: string) => void;
  onWarehouseProduct?: (product: Product, category: Category) => void;
  onShowStats?: (product: Product) => void;
  onShowHistory?: (product: Product) => void;
  onAdminCloseProduct?: (productId: string) => void;
  onAdminSuspendProduct?: (productId: string) => void;
  onAdminReopenProduct?: (productId: string) => void;
}

export function GianHangApprovalView({
  categories,
  classificationData,
  resolveBusinessLine,
  lineForClassificationKey,
  onApproveStore,
  onApproveProduct,
  onOpenManagePlatforms,
  onOpenManageProductTypes,
  onOpenMove,
  onCreatePlatform,
  onCreateProduct,
  onEditCategory,
  onDeleteCategory,
  onToggleProduct,
  onEditProduct,
  onDeleteProduct,
  onSwapGianHang,
  onSwapProducts,
  onWarehouseProduct,
  onShowStats,
  onShowHistory,
  onAdminCloseProduct,
  onAdminSuspendProduct,
  onAdminReopenProduct,
}: GianHangApprovalViewProps) {
  return (
    <GianHangManagePanel
      categories={categories}
      classificationData={classificationData}
      resolveBusinessLine={resolveBusinessLine}
      lineForClassificationKey={lineForClassificationKey}
      defaultActiveTab="Tất cả"
      showConfigToolbar
      showCreateGianHang={false}
      onOpenManagePlatforms={onOpenManagePlatforms}
      onOpenManageProductTypes={onOpenManageProductTypes}
      onOpenMove={onOpenMove}
      onCreatePlatform={onCreatePlatform}
      onCreateProduct={onCreateProduct}
      onEditCategory={onEditCategory}
      onDeleteCategory={onDeleteCategory}
      onToggleProduct={onToggleProduct}
      onEditProduct={onEditProduct}
      onDeleteProduct={onDeleteProduct}
      onApproveCategory={onApproveStore}
      onApproveProduct={onApproveProduct}
      onSwapGianHang={onSwapGianHang}
      onSwapProducts={onSwapProducts}
      onWarehouseProduct={onWarehouseProduct}
      onShowStats={onShowStats}
      onShowHistory={onShowHistory}
      onAdminCloseProduct={onAdminCloseProduct}
      onAdminSuspendProduct={onAdminSuspendProduct}
      onAdminReopenProduct={onAdminReopenProduct}
    />
  );
}
