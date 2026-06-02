/** Hành động tương tác trong tin nhắn (khách đồng ý / từ chối). */
export type ChatMessageActionKind = 'partial_refund' | 'warranty';

export type ChatMessageActionStatus = 'pending' | 'accepted' | 'rejected';

export interface ChatMessageAction {
  kind: ChatMessageActionKind;
  orderId: string;
  status: ChatMessageActionStatus;
  /** SL shop đề xuất bảo hành / hoàn một phần. */
  offerQuantity?: number;
  /** SL tối đa trên đơn gốc. */
  orderQuantity?: number;
  /** Số tiền hoàn (VND) — hoàn một phần. */
  refundAmountVnd?: number;
}
