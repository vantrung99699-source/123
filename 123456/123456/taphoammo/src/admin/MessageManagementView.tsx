/**
 * MessageManagementView - Quản lý nhắn tin
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  MessageSquare,
  Lock,
  Unlock,
  X,
  Tags,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from 'lucide-react';
import { CONVERSATIONS } from './data';
import { MessageSensitiveContentTab } from './MessageSensitiveContentTab';
import {
  readSensitiveFilterSettings,
  scanMessageForSensitive,
} from './chatSensitiveFilter';

type MessageAdminTab = 'conversations' | 'sensitive';

const TAG_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Cảnh báo': { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600' },
  'Tranh chấp': { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600' },
  'VIP': { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600' },
  'Bị báo cáo': { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600' },
  'Nghi spam': { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600' },
  'Có ghi chú': { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' },
  'Khóa chat': { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-600' },
};

const ALL_TAGS = Object.keys(TAG_COLORS);

const SCOPE_FILTERS = ['Tất cả', 'Khách - Khách', 'Khách - Admin'] as const;

export function MessageManagementView() {
  const [adminTab, setAdminTab] = useState<MessageAdminTab>('conversations');
  const [chats, setChats] = useState(CONVERSATIONS);
  const [selectedChatId, setSelectedChatId] = useState(CONVERSATIONS[0]?.id || '');
  const [sensitiveSettings, setSensitiveSettings] = useState(() => readSensitiveFilterSettings());
  const [scopeFilter, setScopeFilter] = useState<(typeof SCOPE_FILTERS)[number]>('Tất cả');
  const [tagFilter, setTagFilter] = useState<string>('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');
  const [noteText, setNoteText] = useState('');
  const [tagOverviewOpen, setTagOverviewOpen] = useState(false);

  const selectedChat = chats.find((c) => c.id === selectedChatId) || chats[0];

  const tagIndex = useMemo(() => {
    const byTag: Record<string, Array<{ id: string; label: string }>> = {};
    for (const t of ALL_TAGS) byTag[t] = [];
    for (const chat of chats) {
      const label = chat.participants.join(' · ');
      for (const tag of chat.tags) {
        if (!byTag[tag]) byTag[tag] = [];
        byTag[tag].push({ id: chat.id, label });
      }
    }
    return byTag;
  }, [chats]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of ALL_TAGS) counts[t] = tagIndex[t]?.length ?? 0;
    return counts;
  }, [tagIndex]);

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      const matchesSearch =
        chat.participants.join(' ').toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (scopeFilter === 'Khách - Khách' && !chat.participants.every((p) => !p.toLowerCase().includes('admin'))) {
        return false;
      }
      if (scopeFilter === 'Khách - Admin' && !chat.participants.some((p) => p.toLowerCase().includes('admin'))) {
        return false;
      }
      if (tagFilter !== 'Tất cả' && !chat.tags.includes(tagFilter)) return false;
      return true;
    });
  }, [chats, searchTerm, scopeFilter, tagFilter]);

  const handleToggleTag = (tag: string) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === selectedChatId) {
          const hasTag = chat.tags.includes(tag);
          return { ...chat, tags: hasTag ? chat.tags.filter((t) => t !== tag) : [...chat.tags, tag] };
        }
        return chat;
      })
    );
  };

  const handleAddNote = () => {
    if (!noteText.trim() || !selectedChatId) return;
    const newNote = {
      id: `n-${Date.now()}`,
      author: 'Admin Support',
      text: noteText,
      time: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
    };
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === selectedChatId) {
          return {
            ...chat,
            notes: [newNote, ...chat.notes],
            tags: chat.tags.includes('Có ghi chú') ? chat.tags : [...chat.tags, 'Có ghi chú'],
          };
        }
        return chat;
      })
    );
    setNoteText('');
  };

  const handleDeleteNote = (noteId: string) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === selectedChatId) {
          const updatedNotes = chat.notes.filter((n) => n.id !== noteId);
          return { ...chat, notes: updatedNotes };
        }
        return chat;
      })
    );
  };

  const handleGlobalLockToggle = () => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === selectedChatId) {
          const newLockedState = !chat.isLocked;
          let newTags = [...chat.tags];
          if (newLockedState) {
            if (!newTags.includes('Khóa chat')) newTags.push('Khóa chat');
          } else {
            newTags = newTags.filter((t) => t !== 'Khóa chat');
          }
          return { ...chat, isLocked: newLockedState, tags: newTags };
        }
        return chat;
      })
    );
  };

  const toggleParticipantLock = (participantName: string) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== selectedChatId) return chat;
        const cur = new Set(chat.lockedParticipants ?? []);
        if (cur.has(participantName)) cur.delete(participantName);
        else cur.add(participantName);
        return { ...chat, lockedParticipants: Array.from(cur) };
      })
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 w-full h-full overflow-hidden flex flex-col"
    >
      <header className="mb-4 flex flex-wrap items-end justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Quản lý nhắn tin</h2>
          <p className="text-slate-500 text-sm">
            {adminTab === 'conversations'
              ? 'Theo dõi và quản lý hội thoại chat'
              : 'Từ khóa & nội dung nhạy cảm — SĐT, liên hệ, Zalo, web ngoài, chơi chữ'}
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setAdminTab('conversations')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              adminTab === 'conversations'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare size={14} />
            Hội thoại
          </button>
          <button
            type="button"
            onClick={() => setAdminTab('sensitive')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              adminTab === 'sensitive'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldAlert size={14} />
            Nội dung nhạy cảm
          </button>
        </div>
      </header>

      {adminTab === 'sensitive' ? (
        <MessageSensitiveContentTab
          chats={chats}
          onSettingsChange={setSensitiveSettings}
          onOpenConversation={chatId => {
            setSelectedChatId(chatId);
            setAdminTab('conversations');
          }}
        />
      ) : (
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left: Conversation List */}
        <div className="w-80 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-600" />
                <h3 className="font-bold text-slate-900">Hội thoại</h3>
                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{chats.length}</span>
              </div>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Tìm tên, mã KH..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500/20"
              />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Loại hội thoại</p>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {SCOPE_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setScopeFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${scopeFilter === f ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Lọc theo tag</p>
                <button
                  type="button"
                  onClick={() => setTagOverviewOpen((o) => !o)}
                  className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700"
                >
                  <Tags size={12} />
                  Đã tag những ai?
                  {tagOverviewOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 mb-2"
              >
                <option value="Tất cả">Tất cả tag</option>
                {ALL_TAGS.map((t) => (
                  <option key={t} value={t}>
                    {t} ({tagCounts[t] ?? 0})
                  </option>
                ))}
              </select>
              <div className="flex gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setTagFilter('Tất cả')}
                  className={`px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${tagFilter === 'Tất cả' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}
                >
                  Mọi tag
                </button>
                {ALL_TAGS.map((t) => {
                  const n = tagCounts[t] ?? 0;
                  const colors = TAG_COLORS[t];
                  const on = tagFilter === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTagFilter(on ? 'Tất cả' : t)}
                      className={`px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${
                        on
                          ? `${colors.bg} ${colors.border} ${colors.text}`
                          : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      {t}
                      {n > 0 && <span className="ml-0.5 opacity-80">({n})</span>}
                    </button>
                  );
                })}
              </div>
              <AnimatePresence>
                {tagOverviewOpen && (
                  <motion.div
                    key="tag-overview"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 max-h-48 overflow-y-auto space-y-2">
                      <p className="text-[10px] font-bold text-slate-500">Hội thoại đang có tag (theo thành viên)</p>
                      {ALL_TAGS.map((t) => {
                        const rows = tagIndex[t] ?? [];
                        if (rows.length === 0) return null;
                        const colors = TAG_COLORS[t];
                        return (
                          <div key={t} className="rounded-xl border border-slate-100 bg-white p-2">
                            <p className={`text-[9px] font-bold uppercase mb-1.5 ${colors.text}`}>{t}</p>
                            <ul className="space-y-1">
                              {rows.map((row) => (
                                <li key={`${t}-${row.id}`}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedChatId(row.id);
                                      setTagFilter(t);
                                    }}
                                    className="w-full text-left text-[11px] text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg px-2 py-1 transition-colors"
                                  >
                                    {row.label}
                                    <span className="text-slate-400 font-mono text-[10px] ml-1">({row.id})</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                      {ALL_TAGS.every((t) => (tagIndex[t]?.length ?? 0) === 0) && (
                        <p className="text-[11px] text-slate-400 italic">Chưa có hội thoại nào được gắn tag.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`p-4 cursor-pointer border-b border-slate-50 transition-all hover:bg-slate-50/50 ${
                  selectedChatId === chat.id ? 'bg-blue-50/50 border-l-4 border-l-blue-600' :
                  chat.tags.includes('Cảnh báo') ? 'bg-amber-50/30' :
                  chat.tags.includes('Tranh chấp') ? 'bg-red-50/30' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className="relative">
                    <div className="flex -space-x-2">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold border-2 border-white">
                        {chat.participants[0]?.[0] || '?'}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold border-2 border-white">
                        {chat.participants[1]?.[0] || '?'}
                      </div>
                    </div>
                    {(chat.isLocked || (chat.lockedParticipants?.length ?? 0) > 0) && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center text-white">
                        <Lock size={8} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {chat.participants.join(' - ')}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1 shrink-0">{chat.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{chat.lastMessage}</p>
                    {chat.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {chat.tags.slice(0, 2).map((tag) => {
                          const colors = TAG_COLORS[tag] || TAG_COLORS['Cảnh báo'];
                          return (
                            <span key={tag} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${colors.bg} ${colors.text}`}>
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {chat.unreadCount > 0 && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {chat.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Chat Detail */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col min-w-0">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {selectedChat.participants.map((p, i) => (
                      <div key={i} className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold border-2 border-white">
                        {p[0]}
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{selectedChat.participants.join(' - ')}</p>
                    <p className="text-[10px] text-slate-400">ID: {selectedChat.id} · {selectedChat.status}</p>
                    <div className="mt-2 flex flex-col gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Khóa chat từng thành viên</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedChat.participants.map((name) => {
                          const locked = (selectedChat.lockedParticipants ?? []).includes(name);
                          return (
                            <button
                              key={name}
                              type="button"
                              title={locked ? `Mở khóa gửi tin cho ${name}` : `Khóa gửi tin cho ${name}`}
                              onClick={() => toggleParticipantLock(name)}
                              className={`inline-flex items-center gap-1 pl-2 pr-2 py-1 rounded-lg border text-[11px] font-semibold max-w-full text-left transition-colors ${
                                locked
                                  ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100/80'
                                  : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span className="truncate max-w-[140px]" title={name}>
                                {name}
                              </span>
                              <span
                                className={`p-1 rounded-md shrink-0 pointer-events-none ${
                                  locked ? 'text-amber-700' : 'text-slate-500'
                                }`}
                                aria-hidden
                              >
                                {locked ? <Unlock size={14} /> : <Lock size={14} />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-start">
                  <button
                    type="button"
                    onClick={handleGlobalLockToggle}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      selectedChat.isLocked
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {selectedChat.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                    {selectedChat.isLocked ? 'Mở khóa' : 'Khóa chat'}
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="px-6 py-3 border-b border-slate-50 flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Tags:</span>
                {ALL_TAGS.map((tag) => {
                  const colors = TAG_COLORS[tag];
                  const isActive = selectedChat.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleToggleTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${isActive ? `${colors.bg} ${colors.border} ${colors.text}` : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedChat.messages.map((msg) => {
                  const senderLocked = (selectedChat.lockedParticipants ?? []).includes(msg.sender);
                  const sensitiveHits = scanMessageForSensitive(msg.text, sensitiveSettings);
                  const hasSensitive = sensitiveHits.length > 0;
                  return (
                    <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${msg.isAdmin ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm relative ${
                            msg.isAdmin
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-slate-100 text-slate-900 rounded-bl-md'
                          } ${senderLocked ? 'ring-2 ring-amber-400/80 ring-offset-1' : ''} ${
                            hasSensitive ? 'ring-2 ring-rose-400/90 ring-offset-1' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                            <p className="text-xs font-bold opacity-60">{msg.sender}</p>
                            {hasSensitive && (
                              <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
                                <ShieldAlert size={10} /> Nhạy cảm
                              </span>
                            )}
                            {senderLocked && (
                              <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded-md">
                                <Lock size={10} /> Khóa gửi
                              </span>
                            )}
                          </div>
                          <p>{msg.text}</p>
                          {hasSensitive && (
                            <p className="text-[10px] mt-2 opacity-80 font-semibold">
                              Khớp: {sensitiveHits.map(h => h.label).join(', ')}
                            </p>
                          )}
                        </div>
                        <p className={`text-[10px] text-slate-400 mt-1 ${msg.isAdmin ? 'text-right' : 'text-left'}`}>{msg.time}</p>
                      </div>
                    </div>
                  );
                })}
                {selectedChat.messages.length === 0 && (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    Chưa có tin nhắn nào
                  </div>
                )}
              </div>

              {/* Notes: danh sách cuộn riêng, ô nhập luôn nằm ngoài vùng cuộn để không bị che */}
              <div className="px-6 py-3 border-t border-slate-50 shrink-0 flex flex-col gap-2 min-h-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
                  Ghi chú ({selectedChat.notes.length})
                </p>
                <div className="max-h-[min(200px,28vh)] overflow-y-auto space-y-2 pr-0.5 min-h-0">
                  {selectedChat.notes.map((note) => (
                    <div key={note.id} className="bg-amber-50/50 border border-amber-100 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-amber-700">{note.author}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-amber-400">{note.time}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-amber-400 hover:text-amber-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-amber-800">{note.text}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 shrink-0 pt-1 border-t border-slate-100">
                  <input
                    type="text"
                    placeholder="Thêm ghi chú..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddNote}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shrink-0"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Chọn một hội thoại để xem chi tiết
            </div>
          )}
        </div>
      </div>
      )}
    </motion.div>
  );
}
