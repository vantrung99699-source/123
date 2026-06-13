import type { Order } from '../ordersTypes';
import { isPreOrderAwaitingFulfillment } from '../orderStatusBadge';
import { isComplaintAutoFailCandidate, getComplaintStartedAtMs } from './complaintAutoFail';
import { DAY_MS } from './deliveryDeadlineDays';
import { isDisputeAutoRefundCandidate, getDisputeStartedAtMs } from './disputeAutoRefund';
import { getEscrowHoldStartMs, isEscrowAutoCompleteCandidate } from './escrowAutoComplete';
import { ORDER_TIMER_THREE_DAYS_MS, getOrderEffectiveNowMs } from './orderTimeSimulation';
import { getPreOrderDeadlineMs } from './preOrderAutoFail';
import {
  getServiceDeadlineMs,
  isServiceAwaitingDelivery,
  isServiceAwaitingSellerConfirm,
} from './serviceOrderAutoFail';

export interface OrderSellerDeadlineInfo {
  deadlineMs: number;
  deadlineDateLabel: string;
  countdownLabel: string;
  isOverdue: boolean;
  note: string | null;
}

function formatDeadlineDateVi(deadlineMs: number): string {
  return new Date(deadlineMs).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCountdownLabel(remainingMs: number): string {
  if (remainingMs <= 0) return 'Quá hạn';
  const days = Math.floor(remainingMs / DAY_MS);
  const hours = Math.floor((remainingMs % DAY_MS) / (60 * 60 * 1000));
  if (days > 0) {
    return hours > 0 ? `Còn ${days} ngày ${hours} giờ` : `Còn ${days} ngày`;
  }
  if (hours > 0) return `Còn ${hours} giờ`;
  const minutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
  return `Còn ${minutes} phút`;
}

/** Hạn xử lý đơn — dùng cho bảng người bán (xác nhận DV, giao hàng, tạm giữ ví, …). */
export function resolveOrderSellerDeadline(
  order: Order,
  realNowMs = Date.now()
): OrderSellerDeadlineInfo | null {
  let deadlineMs: number | null = null;
  let note: string | null = null;

  if (isServiceAwaitingSellerConfirm(order)) {
    deadlineMs = getServiceDeadlineMs(order, 'confirm');
    note = 'Hạn xác nhận';
  } else if (isServiceAwaitingDelivery(order)) {
    deadlineMs = getServiceDeadlineMs(order, 'deliver');
    note = 'Hạn giao DV';
  } else if (isPreOrderAwaitingFulfillment(order)) {
    deadlineMs = getPreOrderDeadlineMs(order);
    note = 'Hạn giao đặt trước';
  } else if (isEscrowAutoCompleteCandidate(order)) {
    deadlineMs = getEscrowHoldStartMs(order) + ORDER_TIMER_THREE_DAYS_MS;
    note = 'Tạm giữ ví';
  } else if (isComplaintAutoFailCandidate(order)) {
    deadlineMs = getComplaintStartedAtMs(order) + ORDER_TIMER_THREE_DAYS_MS;
    note = 'Xử lý khiếu nại';
  } else if (isDisputeAutoRefundCandidate(order)) {
    deadlineMs = getDisputeStartedAtMs(order) + ORDER_TIMER_THREE_DAYS_MS;
    note = 'Tranh chấp';
  }

  if (deadlineMs == null) return null;

  const remaining = deadlineMs - getOrderEffectiveNowMs(order, realNowMs);
  const isOverdue = remaining <= 0;

  return {
    deadlineMs,
    deadlineDateLabel: formatDeadlineDateVi(deadlineMs),
    countdownLabel: formatCountdownLabel(remaining),
    isOverdue,
    note,
  };
}
