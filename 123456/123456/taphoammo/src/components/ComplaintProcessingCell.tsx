import type { Order } from '../ordersTypes';
import { formatVnd } from '../orderAmountDisplay';
import { computePartialRefundVnd, getOrderRefundDisplay } from '../orderRefund';
import { hasPendingWarrantyOffer } from '../storefront/warrantyOffer';

export interface ComplaintResolveDraft {
  resolveAction: 'cancel' | 'warranty' | 'dispute';
  refundType?: 'full' | 'partial';
  quantity: number;
}

const toneClass = {
  idle: 'text-slate-400 bg-slate-50 border-slate-200',
  draft: 'text-violet-800 bg-violet-50 border-violet-200',
  pending: 'text-amber-800 bg-amber-50 border-amber-200',
  rejected: 'text-rose-800 bg-rose-50 border-rose-200',
} as const;

export function getComplaintAdminProcessing(
  order: Order,
  draft: ComplaintResolveDraft | null
): { title: string; detail?: string; tone: keyof typeof toneClass } {
  if (draft) {
    if (draft.resolveAction === 'cancel') {
      if (draft.refundType === 'partial') {
        const qty = Math.min(Math.max(1, draft.quantity), order.quantity);
        const vnd = computePartialRefundVnd(order, qty);
        return {
          title: 'Đang xử lý — hoàn một phần',
          detail: `${formatVnd(vnd)} · ${qty}/${order.quantity} SP`,
          tone: 'draft',
        };
      }
      return {
        title: 'Đang xử lý — hoàn 100%',
        detail: order.totalAmount,
        tone: 'draft',
      };
    }
    if (draft.resolveAction === 'warranty') {
      return {
        title: 'Đang xử lý — bảo hành',
        detail: `${draft.quantity}/${order.quantity} SP`,
        tone: 'draft',
      };
    }
    return { title: 'Đang xử lý — tranh chấp', tone: 'draft' };
  }

  if (hasPendingWarrantyOffer(order)) {
    const qty = order.warrantyOfferQuantity ?? order.quantity;
    return {
      title: 'Đã gửi — chờ khách',
      detail: `Bảo hành ${qty}/${order.quantity} SP`,
      tone: 'pending',
    };
  }

  if (order.warrantyOfferStatus === 'rejected') {
    return {
      title: 'Khách từ chối bảo hành',
      detail: 'Cần xử lý lại',
      tone: 'rejected',
    };
  }

  if (order.refundOfferStatus === 'pending_buyer') {
    const d = getOrderRefundDisplay(order);
    return {
      title: 'Đã gửi — chờ khách',
      detail: d.sub ? `${d.main} · ${d.sub}` : d.main,
      tone: 'pending',
    };
  }

  if (order.refundOfferStatus === 'rejected') {
    return {
      title: 'Khách từ chối hoàn 1 phần',
      detail: 'Cần xử lý lại',
      tone: 'rejected',
    };
  }

  return { title: 'Chưa xử lý', tone: 'idle' };
}

export function ComplaintProcessingCell({
  order,
  draft,
}: {
  order: Order;
  draft: ComplaintResolveDraft | null;
}) {
  const { title, detail, tone } = getComplaintAdminProcessing(order, draft);

  return (
    <div className="flex flex-col items-center gap-1 max-w-[200px] mx-auto">
      <span
        className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wide border whitespace-nowrap ${toneClass[tone]}`}
      >
        {title}
      </span>
      {detail && (
        <span className="text-[9px] font-semibold text-slate-600 text-center leading-tight line-clamp-2" title={detail}>
          {detail}
        </span>
      )}
    </div>
  );
}

export function isComplaintRowHighlighted(order: Order, draft: ComplaintResolveDraft | null): boolean {
  if (draft) return true;
  return (
    order.refundOfferStatus === 'pending_buyer' ||
    order.refundOfferStatus === 'rejected' ||
    order.warrantyOfferStatus === 'pending_buyer' ||
    order.warrantyOfferStatus === 'rejected'
  );
}
