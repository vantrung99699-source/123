/** Điều hướng từ admin (nút 💬) → trang Nhắn tin trên storefront (`HomeView`). */
export interface StorefrontMessagesNavState {
  openStorefrontMessages?: boolean;
  messagesThreadId?: string;
  /** Mở hội thoại người bán ↔ khách (từ quản lý đơn / đánh giá). */
  forceSellerAccountMode?: boolean;
}

export function buildStorefrontMessagesNavState(input: {
  threadId: string;
  fromAdmin?: boolean;
}): StorefrontMessagesNavState {
  return {
    openStorefrontMessages: true,
    messagesThreadId: input.threadId,
    forceSellerAccountMode: input.fromAdmin ?? true,
  };
}
