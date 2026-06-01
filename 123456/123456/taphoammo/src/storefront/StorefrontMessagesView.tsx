import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Handshake,
  Info,
  MessageCircle,
  Send,
  Store,
  User,
  ShoppingBag,
  Mail,
  AtSign,
  Package,
  Search,
  X,
} from 'lucide-react';
import type { StorefrontAccountMode } from '../auth/roles';
import {
  isStorefrontBuyerAccountMode,
  isStorefrontResellerAccountMode,
  isStorefrontSellerAccountMode,
} from '../auth/roles';
import type { MessageThreadSummary } from './storefrontMessageThreads';
import {
  getCurrentMessagingPersona,
  resolvePersonaById,
  type MessagingPersona,
} from './storefrontMessagingPersonas';
import type { ViewChatMessage } from './storefrontMessagesStorage';
import {
  appendThreadMessage,
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
}

export function StorefrontMessagesView({
  accountMode,
  ownerEmail,
  selfLogin,
  selfDisplayName,
  threads,
  initialThreadId,
}: StorefrontMessagesViewProps) {
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
    setMessages(
      readThreadMessagesForViewer(ownerEmail, activeThread.id, viewerPersona.id)
    );
    setMobileInfoOpen(false);
    setChatSearch('');
    setChatMatchCursor(0);
  }, [activeThread, ownerEmail, viewerPersona.id]);

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

  const filteredThreads = useMemo(() => {
    const q = threadSearch.trim();
    if (!q) return threads;
    return threads.filter(t =>
      threadMatchesSearchQuery(
        ownerEmail,
        t.id,
        t.partner,
        t.lastPreview,
        q
      )
    );
  }, [threads, threadSearch, ownerEmail]);

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
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {threads.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 leading-relaxed">
                Chưa có hội thoại.{' '}
                Mua hàng, đổi chế độ tài khoản hoặc mở «Nhắn tin» tại sản phẩm để bắt đầu hội thoại.
              </div>
            ) : filteredThreads.length === 0 ? (
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
  highlightQuery = '',
  isActiveMatch = false,
  setMessageRef,
}: {
  message: ViewChatMessage;
  session: { login: string; displayName: string; email: string };
  highlightQuery?: string;
  isActiveMatch?: boolean;
  setMessageRef?: (id: string, el: HTMLDivElement | null) => void;
}) {
  const isSelf = message.side === 'self';
  const sender = resolvePersonaById(message.sender, session);

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
          Thông tin liên hệ
        </p>

        <InfoRow icon={<User size={16} />} label="Tên hiển thị" value={p.displayName} />
        {p.loginName && (
          <InfoRow icon={<AtSign size={16} />} label="Tên đăng nhập" value={p.loginName} mono />
        )}
        {p.email && <InfoRow icon={<Mail size={16} />} label="Email" value={p.email} mono />}
        {p.storeName && <InfoRow icon={<Store size={16} />} label="Gian hàng" value={p.storeName} />}
        {p.platform && <InfoRow icon={<Package size={16} />} label="Nền tảng" value={p.platform} />}

        <div className="pt-4 mt-2 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">
            Đơn hàng liên quan
          </p>
          {p.lastOrderId ? (
            <InfoRow
              icon={<ShoppingBag size={16} />}
              label="Đơn gần nhất"
              value={p.lastProductName ? `${p.lastOrderId} · ${p.lastProductName}` : p.lastOrderId}
              multiline
            />
          ) : (
            <p className="text-xs text-slate-400 px-3 py-2">Chưa có đơn chung</p>
          )}
          <InfoRow icon={<ShoppingBag size={16} />} label="Số đơn chung" value={String(p.orderCount)} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono,
  multiline,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="flex gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors">
      <span className="text-emerald-600 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
        <p
          className={`text-[13px] text-slate-800 font-medium mt-0.5 ${
            mono ? 'font-mono text-[12px]' : ''
          } ${multiline ? 'break-words leading-snug' : 'truncate'}`}
          title={value}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
