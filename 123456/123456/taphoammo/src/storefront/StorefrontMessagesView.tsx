import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type ReactNode,
  type SetStateAction,
} from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Handshake,
  Headphones,
  Info,
  MessageCircle,
  Send,
  Store,
  User,
  ShoppingBag,
  Search,
  X,
} from 'lucide-react';
import type { Order } from '../ordersTypes';
import type { StorefrontAccountMode } from '../auth/roles';
import {
  isStorefrontBuyerAccountMode,
  isStorefrontResellerAccountMode,
  isStorefrontSellerAccountMode,
} from '../auth/roles';
import { computePartialRefundVnd, getOrderRefundDisplay, hasPendingRefundOffer } from '../orderRefund';
import { formatVnd } from '../orderAmountDisplay';
import type { ChatMessageAction } from './messageActions';
import {
  getPartialRefundAcceptPatch,
  getPartialRefundRejectPatch,
} from './buyerOfferResponses';
import {
  buildWarrantyAcceptResult,
  buildWarrantyRejectPatch,
  hasPendingWarrantyOffer,
} from './warrantyOffer';
import { appendBuyerActionReply } from './sellerResolveBuyerMessage';
import {
  resolvePendingActionMessageForOrder,
  updateThreadMessageActionStatus,
} from './storefrontMessagesStorage';
import { resolveBuyerSellerThreadIdFromOrder } from './storefrontMessageThreads';
import { resolveBuyerOwnerEmailForOrder } from './resolveBuyerEmail';
import type { MessageThreadSummary } from './storefrontMessageThreads';
import type { MessagePartnerProfile } from './storefrontMessagingPersonas';
import {
  getCurrentMessagingPersona,
  resolvePersonaById,
  type MessagingPersona,
} from './storefrontMessagingPersonas';
import type { ViewChatMessage } from './storefrontMessagesStorage';
import {
  appendThreadMessage,
  markThreadAsRead,
  readThreadMessagesForViewer,
  threadMatchesSearchQuery,
} from './storefrontMessagesStorage';

function formatMessageTime(ms: number): string {
  return new Date(ms).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function accountModeLabel(mode: StorefrontAccountMode): string {
  if (isStorefrontBuyerAccountMode(mode)) return 'Người mua';
  if (isStorefrontSellerAccountMode(mode)) return 'Người bán';
  if (isStorefrontResellerAccountMode(mode)) return 'Reseller';
  return 'Tài khoản';
}

function buildLatestOrderLines(partner: MessagePartnerProfile): string[] {
  const lines: string[] = [];
  if (partner.lastOrderId) lines.push(partner.lastOrderId);
  if (partner.lastProductName?.trim()) lines.push(partner.lastProductName.trim());
  if (partner.lastOrderPurchaseDate?.trim()) {
    lines.push(`Mua: ${partner.lastOrderPurchaseDate.trim()}`);
  }
  if (partner.lastOrderQuantity != null && partner.lastOrderQuantity > 0) {
    lines.push(`SL: ${partner.lastOrderQuantity}`);
  }
  if (partner.lastOrderTotalAmount?.trim()) {
    lines.push(`Tổng: ${partner.lastOrderTotalAmount.trim()}`);
  }
  return lines;
}

function partnerSubtitle(partner: MessageThreadSummary['partner']): string {
  if (partner.storeName) return partner.storeName;
  if (partner.loginName && partner.loginName !== partner.displayName) {
    return `@${partner.loginName}`;
  }
  if (partner.lastOrderId) return `Đơn ${partner.lastOrderId}`;
  return 'Đang trò chuyện';
}

export interface StorefrontMessagesViewProps {
  accountMode: StorefrontAccountMode;
  ownerEmail: string;
  selfLogin: string;
  selfDisplayName: string;
  threads: MessageThreadSummary[];
  initialThreadId?: string | null;
  /** Đơn hàng — dùng nút đồng ý / từ chối trong tin nhắn (người mua). */
  orders?: Order[];
  patchOrderById?: (orderId: string, patch: Partial<Order>) => void;
  setOrders?: Dispatch<SetStateAction<Order[]>>;
  /** Sau khi đánh dấu đã đọc — cập nhật badge header. */
  onUnreadChange?: () => void;
}

export function StorefrontMessagesView({
  accountMode,
  ownerEmail,
  selfLogin,
  selfDisplayName,
  threads,
  initialThreadId,
  orders = [],
  patchOrderById,
  setOrders,
  onUnreadChange,
}: StorefrontMessagesViewProps) {
  const isBuyerMode = isStorefrontBuyerAccountMode(accountMode);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    initialThreadId && threads.some(t => t.id === initialThreadId)
      ? initialThreadId
      : threads[0]?.id ?? null
  );
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ViewChatMessage[]>([]);
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const [threadSearch, setThreadSearch] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [chatMatchCursor, setChatMatchCursor] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageElRefs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    if (initialThreadId && threads.some(t => t.id === initialThreadId)) {
      setActiveThreadId(initialThreadId);
    }
  }, [initialThreadId, threads]);

  const activeThread = useMemo(
    () => threads.find(t => t.id === activeThreadId) ?? null,
    [threads, activeThreadId]
  );

  const session = useMemo(
    () => ({
      login: selfLogin,
      displayName: selfDisplayName,
      email: ownerEmail,
    }),
    [selfLogin, selfDisplayName, ownerEmail]
  );

  const viewerPersona = useMemo(
    () => getCurrentMessagingPersona(accountMode, session),
    [accountMode, session]
  );

  useEffect(() => {
    if (!activeThread) {
      setMessages([]);
      return;
    }
    markThreadAsRead(ownerEmail, activeThread.id);
    onUnreadChange?.();
    setMessages(
      readThreadMessagesForViewer(ownerEmail, activeThread.id, viewerPersona.id)
    );
    setMobileInfoOpen(false);
    setChatSearch('');
    setChatMatchCursor(0);
  }, [activeThread, ownerEmail, viewerPersona.id, onUnreadChange]);

  const reloadMessages = useCallback(() => {
    if (!activeThread) return;
    setMessages(readThreadMessagesForViewer(ownerEmail, activeThread.id, viewerPersona.id));
  }, [activeThread, ownerEmail, viewerPersona.id]);

  useEffect(() => {
    reloadMessages();
  }, [orders, reloadMessages]);

  const markChatOfferResolved = useCallback(
    (order: Order, kind: 'partial_refund' | 'warranty', status: 'accepted' | 'rejected') => {
      const buyerEmail = resolveBuyerOwnerEmailForOrder(order, ownerEmail);
      const threadId = resolveBuyerSellerThreadIdFromOrder(order);
      if (!buyerEmail || !threadId) return;
      const msg = resolvePendingActionMessageForOrder(buyerEmail, threadId, order.id, kind);
      if (msg) updateThreadMessageActionStatus(buyerEmail, threadId, msg.id, status);
      appendBuyerActionReply(buyerEmail, order, status === 'accepted', kind);
      reloadMessages();
    },
    [ownerEmail, reloadMessages]
  );

  const handleMessageOfferAction = useCallback(
    (messageId: string, orderId: string, kind: 'partial_refund' | 'warranty', accept: boolean) => {
      const msgAction = messages.find(m => m.id === messageId)?.action;
      const order = orders.find(o => o.id === orderId);
      if (!order || !activeThread) return;

      if (kind === 'partial_refund') {
        const pendingRefund =
          hasPendingRefundOffer(order) ||
          (msgAction?.kind === 'partial_refund' &&
            msgAction.status === 'pending' &&
            (msgAction.offerQuantity ?? 0) > 0);
        if (!pendingRefund) return;
        if (accept) {
          let mainLabel: string;
          if (hasPendingRefundOffer(order) || order.partialRefundQuantity != null) {
            mainLabel = getOrderRefundDisplay(order).main;
          } else if (msgAction?.refundAmountVnd != null) {
            mainLabel = formatVnd(msgAction.refundAmountVnd);
          } else if (msgAction?.offerQuantity != null) {
            mainLabel = formatVnd(computePartialRefundVnd(order, msgAction.offerQuantity));
          } else {
            mainLabel = getOrderRefundDisplay(order).main;
          }
          if (
            typeof window !== 'undefined' &&
            !window.confirm(
              `Chấp nhận hoàn ${mainLabel}? Đơn sẽ chuyển Thất bại và tiền về ví (nếu đã thanh toán).`
            )
          ) {
            return;
          }
          if (patchOrderById) patchOrderById(orderId, getPartialRefundAcceptPatch(order));
          else if (setOrders) {
            setOrders(prev =>
              prev.map(o => (o.id === orderId ? { ...o, ...getPartialRefundAcceptPatch(order) } : o))
            );
          }
          markChatOfferResolved(order, 'partial_refund', 'accepted');
        } else {
          if (
            typeof window !== 'undefined' &&
            !window.confirm(
              'Từ chối đề xuất hoàn một phần? Đơn vẫn ở trạng thái khiếu nại — shop sẽ xử lý lại.'
            )
          ) {
            return;
          }
          if (patchOrderById) patchOrderById(orderId, getPartialRefundRejectPatch());
          else if (setOrders) {
            setOrders(prev =>
              prev.map(o => (o.id === orderId ? { ...o, ...getPartialRefundRejectPatch() } : o))
            );
          }
          updateThreadMessageActionStatus(
            resolveBuyerOwnerEmailForOrder(order, ownerEmail),
            activeThread.id,
            messageId,
            'rejected'
          );
          markChatOfferResolved(order, 'partial_refund', 'rejected');
        }
        return;
      }

      if (kind === 'warranty') {
        const pendingWarranty =
          hasPendingWarrantyOffer(order) ||
          (msgAction?.kind === 'warranty' &&
            msgAction.status === 'pending' &&
            (msgAction.offerQuantity ?? 0) > 0);
        if (!pendingWarranty) return;
        if (accept) {
          const qty = order.warrantyOfferQuantity ?? msgAction?.offerQuantity ?? order.quantity;
          const maxQ = msgAction?.orderQuantity ?? order.quantity;
          if (
            typeof window !== 'undefined' &&
            !window.confirm(
              `Chấp nhận bảo hành ${qty}/${maxQ} SP? Shop sẽ gửi đơn thay thế.`
            )
          ) {
            return;
          }
          const result = buildWarrantyAcceptResult(order, qty, orders);
          if (!result) {
            window.alert('Không thể tạo đơn bảo hành.');
            return;
          }
          if (patchOrderById) {
            patchOrderById(orderId, result.originalPatch);
            setOrders?.(prev => [result.newOrder, ...prev]);
          } else if (setOrders) {
            setOrders(prev => [
              result.newOrder,
              ...prev.map(o => (o.id === orderId ? { ...o, ...result.originalPatch } : o)),
            ]);
          }
          updateThreadMessageActionStatus(
            resolveBuyerOwnerEmailForOrder(order, ownerEmail),
            activeThread.id,
            messageId,
            'accepted'
          );
          markChatOfferResolved(order, 'warranty', 'accepted');
        } else {
          if (
            typeof window !== 'undefined' &&
            !window.confirm('Từ chối đề xuất bảo hành? Đơn vẫn khiếu nại — shop có thể xử lý lại.')
          ) {
            return;
          }
          if (patchOrderById) patchOrderById(orderId, buildWarrantyRejectPatch());
          else if (setOrders) {
            setOrders(prev =>
              prev.map(o => (o.id === orderId ? { ...o, ...buildWarrantyRejectPatch() } : o))
            );
          }
          updateThreadMessageActionStatus(
            resolveBuyerOwnerEmailForOrder(order, ownerEmail),
            activeThread.id,
            messageId,
            'rejected'
          );
          markChatOfferResolved(order, 'warranty', 'rejected');
        }
      }
    },
    [
      messages,
      orders,
      activeThread,
      ownerEmail,
      patchOrderById,
      setOrders,
      markChatOfferResolved,
    ]
  );

  const chatMatchIds = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    if (!q) return [];
    return messages.filter(m => m.text.toLowerCase().includes(q)).map(m => m.id);
  }, [messages, chatSearch]);

  const scrollToChatMatch = useCallback(
    (index: number) => {
      const id = chatMatchIds[index];
      if (!id) return;
      const el = messageElRefs.current.get(id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [chatMatchIds]
  );

  useEffect(() => {
    setChatMatchCursor(0);
  }, [chatSearch]);

  useEffect(() => {
    if (!chatSearch.trim() || chatMatchIds.length === 0) return;
    const safe = Math.min(chatMatchCursor, chatMatchIds.length - 1);
    if (safe !== chatMatchCursor) setChatMatchCursor(safe);
    else scrollToChatMatch(safe);
  }, [chatSearch, chatMatchCursor, chatMatchIds, scrollToChatMatch]);

  const goChatMatchPrev = useCallback(() => {
    if (chatMatchIds.length === 0) return;
    setChatMatchCursor(i => (i <= 0 ? chatMatchIds.length - 1 : i - 1));
  }, [chatMatchIds.length]);

  const goChatMatchNext = useCallback(() => {
    if (chatMatchIds.length === 0) return;
    setChatMatchCursor(i => (i >= chatMatchIds.length - 1 ? 0 : i + 1));
  }, [chatMatchIds.length]);

  const setMessageElRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) messageElRefs.current.set(id, el);
    else messageElRefs.current.delete(id);
  }, []);

  const platformSupportThread = useMemo(
    () => threads.find(t => t.partner.isPlatformSupport) ?? null,
    [threads]
  );

  const filteredThreads = useMemo(() => {
    const q = threadSearch.trim();
    const withoutPlatform = threads.filter(t => !t.partner.isPlatformSupport);
    if (!q) return withoutPlatform;
    return withoutPlatform.filter(t =>
      threadMatchesSearchQuery(
        ownerEmail,
        t.id,
        t.partner,
        t.lastPreview,
        q
      )
    );
  }, [threads, threadSearch, ownerEmail]);

  const showPlatformSupportEntry =
    isBuyerMode &&
    platformSupportThread &&
    (!threadSearch.trim() ||
      threadMatchesSearchQuery(
        ownerEmail,
        platformSupportThread.id,
        platformSupportThread.partner,
        platformSupportThread.lastPreview,
        threadSearch.trim()
      ));

  useEffect(() => {
    if (chatSearch.trim()) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, activeThreadId, chatSearch]);

  const activeChatMatchId =
    chatMatchIds.length > 0 ? chatMatchIds[Math.min(chatMatchCursor, chatMatchIds.length - 1)] : null;

  const handleSend = () => {
    if (!activeThread || !draft.trim()) return;
    const next = appendThreadMessage(ownerEmail, activeThread.id, viewerPersona.id, draft);
    setMessages(next);
    setDraft('');
  };

  const modeLabel = accountModeLabel(accountMode);
  const showChatOnMobile = Boolean(activeThread);

  return (
    <div className="bg-[#eef0f2] font-sans text-slate-900">
      <div className="w-full max-w-[2000px] mx-auto px-2 sm:px-3 pt-2 pb-3">
        {/* Khung 3 cột — thu nhỏ chiều cao để ô nhập không bị khuất dưới viewport */}
        <div className="flex h-[calc(100dvh-10.5rem)] max-h-[calc(100dvh-10.5rem)] min-h-[400px] rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Cột trái — danh sách */}
        <aside
          className={`${
            showChatOnMobile ? 'hidden md:flex' : 'flex'
          } w-full md:w-[260px] lg:w-[280px] shrink-0 flex-col bg-white border-r border-slate-200`}
        >
          <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/90 shrink-0">
            <p className="text-sm font-bold text-slate-800">Nhắn tin</p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate" title={`Chế độ ${modeLabel}`}>
              <span className="font-semibold text-emerald-700">{modeLabel}</span>
              {' · '}
              <span className="font-mono">@{selfLogin}</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              {threads.length} hội thoại · đổi chế độ menu tài khoản để thử 3 user
            </p>
            <MessageSearchInput
              value={threadSearch}
              onChange={setThreadSearch}
              placeholder="Tìm tên hoặc nội dung tin nhắn"
              className="mt-2"
            />
          </div>
          {showPlatformSupportEntry && platformSupportThread && (
            <div className="px-2 py-2 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={() => setActiveThreadId(platformSupportThread.id)}
                className={`w-full text-left rounded-xl border px-3 py-3 flex gap-3 transition-all ${
                  platformSupportThread.id === activeThreadId
                    ? 'border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-500/10'
                    : 'border-emerald-200/80 bg-white hover:border-emerald-300 hover:bg-emerald-50/40'
                }`}
              >
                <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
                  <Headphones size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-emerald-800">Chat với sàn</p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    {platformSupportThread.partner.displayName} · hỗ trợ giao dịch, khiếu nại, tài khoản
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-1">
                    {platformSupportThread.lastPreview}
                  </p>
                </div>
                {platformSupportThread.unreadCount > 0 && (
                  <span className="shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold tabular-nums self-center">
                    {platformSupportThread.unreadCount > 99 ? '99+' : platformSupportThread.unreadCount}
                  </span>
                )}
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {threads.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 leading-relaxed">
                Chưa có hội thoại.{' '}
                Mua hàng, đổi chế độ tài khoản hoặc mở «Nhắn tin» tại sản phẩm để bắt đầu hội thoại.
              </div>
            ) : filteredThreads.length === 0 && !showPlatformSupportEntry ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Không tìm thấy hội thoại phù hợp.
              </div>
            ) : (
              filteredThreads.map(thread => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  active={thread.id === activeThreadId}
                  onSelect={() => setActiveThreadId(thread.id)}
                  highlightQuery={threadSearch.trim()}
                />
              ))
            )}
          </div>
        </aside>

        {/* Cột giữa — khung chat */}
        <main
          className={`${
            !showChatOnMobile ? 'hidden md:flex' : 'flex'
          } flex-1 min-w-0 flex-col bg-[#f0f2f5]`}
        >
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <MessageCircle size={56} className="mb-4 opacity-30" />
              <p className="text-base font-semibold text-slate-500">Chọn hội thoại để bắt đầu</p>
              <p className="text-sm text-slate-400 mt-1 text-center max-w-xs">
                Chọn người ở cột bên trái để nhắn tin
              </p>
            </div>
          ) : (
            <>
              <ChatTopBar
                thread={activeThread}
                onBackToList={() => setActiveThreadId(null)}
                onOpenInfo={() => setMobileInfoOpen(true)}
                chatSearch={chatSearch}
                onChatSearchChange={setChatSearch}
                matchCursor={chatMatchCursor}
                matchTotal={chatMatchIds.length}
                onMatchPrev={goChatMatchPrev}
                onMatchNext={goChatMatchNext}
              />
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-2.5"
              >
                {messages.map(msg => (
                  <MessageBubbleRow
                    key={msg.id}
                    message={msg}
                    session={session}
                    orders={orders}
                    isBuyerMode={isBuyerMode}
                    onOfferAction={handleMessageOfferAction}
                    highlightQuery={
                      chatSearch.trim() && msg.text.toLowerCase().includes(chatSearch.trim().toLowerCase())
                        ? chatSearch.trim()
                        : ''
                    }
                    isActiveMatch={activeChatMatchId === msg.id}
                    setMessageRef={setMessageElRef}
                  />
                ))}
                {chatSearch.trim() && chatMatchIds.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-6">
                    Không tìm thấy «{chatSearch.trim()}» trong lịch sử chat
                  </p>
                )}
              </div>
              <div className="shrink-0 px-3 py-2 bg-white border-t border-slate-200">
                <div className="flex gap-2 w-full items-center">
                  <input
                    type="text"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Nhập tin nhắn…"
                    className="flex-1 min-w-0 px-3 py-2 rounded-full border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!draft.trim()}
                    className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-sm transition-colors shrink-0"
                    aria-label="Gửi tin nhắn"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </main>

        {/* Cột phải — thông tin hội thoại (desktop) */}
        <aside className="hidden lg:flex w-[260px] xl:w-[300px] shrink-0 flex-col bg-white border-l border-slate-200">
          {activeThread ? (
            <PartnerInfoSidebar thread={activeThread} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <Info size={40} className="mb-3 opacity-25" />
              <p className="text-sm font-medium text-slate-500">Thông tin đối tác</p>
              <p className="text-xs mt-1">Chọn hội thoại để xem hồ sơ người mua / người bán</p>
            </div>
          )}
        </aside>
        </div>

        {/* Panel thông tin — mobile (không che header web) */}
        {mobileInfoOpen && activeThread && (
          <div className="lg:hidden fixed inset-x-0 top-[8.25rem] bottom-0 z-40 flex">
            <button
              type="button"
              className="flex-1 bg-black/35"
              aria-label="Đóng thông tin"
              onClick={() => setMobileInfoOpen(false)}
            />
            <aside className="w-[min(100%,340px)] h-full bg-white shadow-2xl flex flex-col border-l border-slate-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-800">Thông tin đối tác</p>
                <button
                  type="button"
                  onClick={() => setMobileInfoOpen(false)}
                  className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>
              <PartnerInfoSidebar thread={activeThread} />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeSearch(s: string): string {
  return s.trim().toLowerCase();
}

function highlightText(
  text: string,
  query: string,
  isSelf: boolean,
  isActiveMatch: boolean
): ReactNode {
  const q = normalizeSearch(query);
  if (!q) return text;
  const lower = text.toLowerCase();
  const parts: ReactNode[] = [];
  let start = 0;
  let idx = lower.indexOf(q, start);
  while (idx !== -1) {
    if (idx > start) parts.push(text.slice(start, idx));
    parts.push(
      <mark
        key={`${idx}-${start}`}
        className={`rounded px-0.5 ${
          isActiveMatch
            ? isSelf
              ? 'bg-amber-300 text-slate-900 ring-1 ring-amber-500'
              : 'bg-amber-400 text-slate-900 ring-1 ring-amber-500'
            : isSelf
              ? 'bg-emerald-400/45 text-white'
              : 'bg-amber-200/90 text-slate-900'
        }`}
      >
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    start = idx + q.length;
    idx = lower.indexOf(q, start);
  }
  if (start < text.length) parts.push(text.slice(start));
  return parts.length > 0 ? parts : text;
}

function canShowResolvableOffer(action: ChatMessageAction, order?: Order): boolean {
  if (action.status !== 'pending') return false;
  if (action.kind === 'warranty') {
    return Boolean(order && hasPendingWarrantyOffer(order)) || (action.offerQuantity ?? 0) > 0;
  }
  if (action.kind === 'partial_refund') {
    return Boolean(order && hasPendingRefundOffer(order)) || (action.offerQuantity ?? 0) > 0;
  }
  return false;
}

function getOfferActionSummary(action: ChatMessageAction, order?: Order): string | null {
  if (action.status !== 'pending') return null;
  const maxQ = action.orderQuantity ?? order?.quantity;
  if (action.kind === 'warranty' && action.offerQuantity != null) {
    const max = maxQ ?? action.offerQuantity;
    return `Số lượng bảo hành: ${action.offerQuantity}/${max} SP`;
  }
  if (action.kind === 'partial_refund' && action.offerQuantity != null) {
    const max = maxQ ?? action.offerQuantity;
    const money =
      action.refundAmountVnd != null
        ? formatVnd(action.refundAmountVnd)
        : order
          ? formatVnd(computePartialRefundVnd(order, action.offerQuantity))
          : null;
    return money
      ? `Hoàn ${money} · ${action.offerQuantity}/${max} SP`
      : `Hoàn ${action.offerQuantity}/${max} SP`;
  }
  return null;
}

function MessageSearchInput({
  value,
  onChange,
  placeholder,
  className = '',
  clearable = true,
  onKeyDown,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
  clearable?: boolean;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={14}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`w-full pl-8 py-1.5 text-[12px] rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 ${
          clearable && value.trim() ? 'pr-8' : 'pr-3'
        }`}
      />
      {clearable && value.trim() ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
          aria-label="Xóa tìm kiếm"
        >
          <X size={12} />
        </button>
      ) : null}
    </div>
  );
}

function MessageBubbleRow({
  message,
  session,
  orders = [],
  isBuyerMode = false,
  onOfferAction,
  highlightQuery = '',
  isActiveMatch = false,
  setMessageRef,
}: {
  message: ViewChatMessage;
  session: { login: string; displayName: string; email: string };
  orders?: Order[];
  isBuyerMode?: boolean;
  onOfferAction?: (
    messageId: string,
    orderId: string,
    kind: 'partial_refund' | 'warranty',
    accept: boolean
  ) => void;
  highlightQuery?: string;
  isActiveMatch?: boolean;
  setMessageRef?: (id: string, el: HTMLDivElement | null) => void;
}) {
  const isSelf = message.side === 'self';
  const sender = resolvePersonaById(message.sender, session);
  const action = message.action;
  const order = action ? orders.find(o => o.id === action.orderId) : undefined;
  const showOfferButtons =
    message.sender === 'seller' && action != null && canShowResolvableOffer(action, order);
  const offerSummary = action ? getOfferActionSummary(action, order) : null;
  const canClickOffer = showOfferButtons && isBuyerMode && !isSelf && Boolean(onOfferAction);

  return (
    <div
      ref={el => setMessageRef?.(message.id, el)}
      className={`w-full flex ${isSelf ? 'justify-end' : 'justify-start'} scroll-mt-24 scroll-mb-24 ${
        isActiveMatch ? 'relative z-[1]' : ''
      }`}
    >
      <div
        className={`flex items-end gap-2 max-w-[min(82%,560px)] ${
          isSelf ? '' : 'flex-row'
        }`}
      >
        {!isSelf && <PersonaAvatar persona={sender} size="chat" title={sender.displayName} />}
        <div
          className={`rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed shadow-sm transition-shadow ${
            isSelf
              ? 'bg-emerald-600 text-white rounded-br-md'
              : 'bg-white text-slate-800 rounded-bl-md border border-slate-200/90'
          } ${isActiveMatch ? 'ring-2 ring-amber-400 ring-offset-2 shadow-md' : ''}`}
        >
          <p className="whitespace-pre-wrap break-words">
            {highlightText(message.text, highlightQuery, isSelf, isActiveMatch)}
          </p>
          {showOfferButtons && action && (
            <div
              className={`flex flex-col gap-2 mt-2.5 pt-2 ${
                isSelf ? 'border-t border-white/25' : 'border-t border-slate-200/80'
              }`}
            >
              {offerSummary && (
                <p
                  className={`text-xs font-bold leading-snug ${
                    isSelf ? 'text-white' : 'text-amber-800 bg-amber-50 rounded-lg px-2 py-1.5 border border-amber-200/80'
                  }`}
                >
                  {offerSummary}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!canClickOffer}
                  onClick={() =>
                    canClickOffer &&
                    onOfferAction?.(message.id, action.orderId, action.kind, true)
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    canClickOffer
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : isSelf
                        ? 'bg-white/15 text-white/90 cursor-not-allowed'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Đồng ý
                </button>
                <button
                  type="button"
                  disabled={!canClickOffer}
                  onClick={() =>
                    canClickOffer &&
                    onOfferAction?.(message.id, action.orderId, action.kind, false)
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    canClickOffer
                      ? 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700'
                      : isSelf
                        ? 'bg-white/10 border border-white/20 text-white/80 cursor-not-allowed'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Từ chối
                </button>
              </div>
              {!canClickOffer && (
                <p className={`text-[10px] leading-snug ${isSelf ? 'text-emerald-100/90' : 'text-slate-500'}`}>
                  Chờ khách chọn Đồng ý hoặc Từ chối
                </p>
              )}
            </div>
          )}
          {action?.status === 'accepted' && (
            <p
              className={`text-[11px] font-semibold mt-2 ${
                isSelf ? 'text-emerald-100' : 'text-emerald-700'
              }`}
            >
              Đã đồng ý
            </p>
          )}
          {action?.status === 'rejected' && (
            <p
              className={`text-[11px] font-semibold mt-2 ${
                isSelf ? 'text-emerald-100' : 'text-rose-600'
              }`}
            >
              Đã từ chối
            </p>
          )}
          <p
            className={`text-[10px] mt-1 tabular-nums text-right ${
              isSelf ? 'text-emerald-100/90' : 'text-slate-400'
            }`}
          >
            {formatMessageTime(message.sentAtMs)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ThreadListItem({
  thread,
  active,
  onSelect,
  highlightQuery = '',
}: {
  thread: MessageThreadSummary;
  active: boolean;
  onSelect: () => void;
  highlightQuery?: string;
}) {
  const p = thread.partner;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 flex gap-3 transition-colors ${
        active ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : 'hover:bg-slate-50 border-l-4 border-l-transparent'
      }`}
    >
      <PartnerAvatar partner={p} size="md" ring={active} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-800 truncate">
          {highlightText(p.displayName, highlightQuery, false, false)}
        </p>
        <p className="text-[12px] text-slate-500 truncate mt-0.5">
          {highlightText(thread.lastPreview, highlightQuery, false, false)}
        </p>
        {p.orderCount > 0 && (
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">{p.orderCount} đơn</p>
        )}
      </div>
      {thread.unreadCount > 0 && (
        <span className="shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold tabular-nums">
          {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
        </span>
      )}
    </button>
  );
}

function ChatTopBar({
  thread,
  onBackToList,
  onOpenInfo,
  chatSearch,
  onChatSearchChange,
  matchCursor,
  matchTotal,
  onMatchPrev,
  onMatchNext,
}: {
  thread: MessageThreadSummary;
  onBackToList: () => void;
  onOpenInfo: () => void;
  chatSearch: string;
  onChatSearchChange: (v: string) => void;
  matchCursor: number;
  matchTotal: number;
  onMatchPrev: () => void;
  onMatchNext: () => void;
}) {
  const p = thread.partner;
  const hasQuery = Boolean(chatSearch.trim());
  const showNav = hasQuery && matchTotal > 0;
  const positionLabel = hasQuery
    ? matchTotal > 0
      ? `${matchCursor + 1}/${matchTotal}`
      : '0/0'
    : null;

  return (
    <div className="shrink-0 bg-white border-b border-slate-200">
      <div className="h-12 flex items-center gap-2 px-3">
        <button
          type="button"
          onClick={onBackToList}
          className="md:hidden w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 shrink-0"
          aria-label="Danh sách hội thoại"
        >
          <ArrowLeft size={20} />
        </button>
        <PartnerAvatar partner={p} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 truncate">{p.displayName}</p>
          <p className="text-[11px] text-slate-500 truncate">{partnerSubtitle(p)}</p>
        </div>
        <button
          type="button"
          onClick={onOpenInfo}
          className="lg:hidden w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-emerald-700 shrink-0"
          aria-label="Xem thông tin"
        >
          <Info size={20} />
        </button>
      </div>
      <div className="px-3 pb-2 flex items-center gap-1.5">
        <MessageSearchInput
          value={chatSearch}
          onChange={onChatSearchChange}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (e.shiftKey) onMatchPrev();
              else onMatchNext();
            }
          }}
          placeholder="Tìm vị trí trong lịch sử chat…"
          className="flex-1 min-w-0"
          clearable
        />
        {hasQuery && (
          <>
            <span
              className={`text-[11px] font-semibold shrink-0 tabular-nums min-w-[2.5rem] text-center ${
                matchTotal > 0 ? 'text-emerald-700' : 'text-slate-400'
              }`}
            >
              {positionLabel}
            </span>
            <button
              type="button"
              onClick={onMatchPrev}
              disabled={!showNav}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center text-slate-600"
              aria-label="Vị trí trước"
              title="Tin trước (Shift+Enter)"
            >
              <ChevronUp size={16} />
            </button>
            <button
              type="button"
              onClick={onMatchNext}
              disabled={!showNav}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center text-slate-600"
              aria-label="Vị trí sau"
              title="Tin sau (Enter)"
            >
              <ChevronDown size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PersonaAvatar({
  persona,
  size = 'md',
  ring,
  title,
}: {
  persona: MessagingPersona;
  size?: 'chat' | 'sm' | 'md' | 'lg';
  ring?: boolean;
  title?: string;
}) {
  const dim =
    size === 'lg'
      ? 'w-20 h-20'
      : size === 'md'
        ? 'w-11 h-11'
        : size === 'chat'
          ? 'w-8 h-8'
          : 'w-9 h-9';
  const icon = size === 'lg' ? 32 : size === 'md' ? 18 : size === 'chat' ? 14 : 16;
  const bg =
    persona.id === 'seller'
      ? 'bg-emerald-100 text-emerald-700'
      : persona.id === 'reseller'
        ? 'bg-violet-100 text-violet-700'
        : 'bg-sky-100 text-sky-700';

  return (
    <div
      className={`${dim} rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden ${
        ring ? 'ring-2 ring-emerald-500 ring-offset-1' : ''
      } ${persona.avatarUrl ? 'bg-white' : bg}`}
      title={title ?? persona.displayName}
    >
      {persona.avatarUrl ? (
        <img src={persona.avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : persona.id === 'seller' ? (
        <Store size={icon} />
      ) : persona.id === 'reseller' ? (
        <Handshake size={icon} />
      ) : (
        <User size={icon} />
      )}
    </div>
  );
}

function PartnerAvatar({
  partner,
  size = 'md',
  ring,
}: {
  partner: MessageThreadSummary['partner'];
  size?: 'sm' | 'md' | 'lg';
  ring?: boolean;
}) {
  const persona: MessagingPersona = {
    id: partner.personaId ?? (partner.role === 'seller' ? 'seller' : 'buyer'),
    login: partner.loginName ?? partner.displayName,
    displayName: partner.displayName,
    email: partner.email,
    storeName: partner.storeName,
    platform: partner.platform,
    avatarUrl: partner.avatarUrl,
  };
  return <PersonaAvatar persona={persona} size={size} ring={ring} />;
}

function PartnerInfoSidebar({ thread }: { thread: MessageThreadSummary }) {
  const p = thread.partner;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-5 pt-6 pb-4 text-center border-b border-slate-100 bg-gradient-to-b from-emerald-50/80 to-white">
        <div className="flex justify-center mb-3">
          <PartnerAvatar partner={p} size="lg" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">{p.displayName}</h2>
        <p className="text-[12px] text-slate-500 mt-1">{partnerSubtitle(p)}</p>
      </div>

      <div className="p-4 space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">
          Đơn hàng liên quan
        </p>
        {p.lastOrderId ? (
          <InfoRow
            icon={<ShoppingBag size={16} />}
            label="Đơn gần nhất"
            lines={buildLatestOrderLines(p)}
          />
        ) : (
          <p className="text-xs text-slate-400 px-3 py-2">Chưa có đơn chung</p>
        )}
        <InfoRow icon={<ShoppingBag size={16} />} label="Số đơn chung" value={String(p.orderCount)} />
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  lines,
  mono,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  lines?: string[];
  mono?: boolean;
}) {
  const stacked = lines && lines.length > 0;
  const single = value ?? '';

  return (
    <div className="flex gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors">
      <span className="text-emerald-600 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
        {stacked ? (
          <div className="mt-1 space-y-1">
            {lines.map((line, i) => (
              <p
                key={`${line}-${i}`}
                className={`text-[13px] text-slate-800 font-medium break-words leading-snug ${
                  i === 0 ? 'font-semibold text-slate-900' : ''
                }`}
              >
                {line}
              </p>
            ))}
          </div>
        ) : (
          <p
            className={`text-[13px] text-slate-800 font-medium mt-0.5 truncate ${
              mono ? 'font-mono text-[12px]' : ''
            }`}
            title={single}
          >
            {single}
          </p>
        )}
      </div>
    </div>
  );
}
