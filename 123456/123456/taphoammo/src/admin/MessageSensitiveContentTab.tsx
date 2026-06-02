/**
 * Tab quản lý từ khóa / nội dung nhạy cảm trong chat.
 */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Trash2,
  ShieldAlert,
  Phone,
  Link2,
  MessageCircleWarning,
  ToggleLeft,
  ToggleRight,
  Search,
  AlertTriangle,
  Users,
} from 'lucide-react';
import type { Conversation } from './types';
import {
  type SensitiveFilterSettings,
  type SensitiveKeywordRule,
  type SensitiveRuleCategory,
  type BulkSimilarFlag,
  getSensitiveCategoryLabel,
  readSensitiveFilterSettings,
  writeSensitiveFilterSettings,
  scanMessageForSensitive,
  defaultSensitiveFilterSettings,
  detectBulkSimilarMessages,
  notifyAdminBulkSimilarFlags,
} from './chatSensitiveFilter';

type FlagListMode = 'all' | 'keyword' | 'bulk';

const CATEGORY_OPTIONS: { value: SensitiveRuleCategory; label: string }[] = [
  { value: 'phone', label: 'Số điện thoại' },
  { value: 'contact', label: 'Liên hệ' },
  { value: 'zalo_social', label: 'Zalo / MXH' },
  { value: 'external_web', label: 'Web / link' },
  { value: 'custom', label: 'Tùy chỉnh' },
  { value: 'obfuscation', label: 'Chơi chữ' },
];

export interface FlaggedChatMessage {
  chatId: string;
  chatLabel: string;
  messageId: string;
  sender: string;
  text: string;
  time: string;
  hits: ReturnType<typeof scanMessageForSensitive>;
}

function buildFlaggedMessages(
  chats: Conversation[],
  settings: SensitiveFilterSettings
): FlaggedChatMessage[] {
  const out: FlaggedChatMessage[] = [];
  for (const chat of chats) {
    const label = chat.participants.join(' · ');
    for (const msg of chat.messages) {
      const hits = scanMessageForSensitive(msg.text, settings);
      if (hits.length > 0) {
        out.push({
          chatId: chat.id,
          chatLabel: label,
          messageId: msg.id,
          sender: msg.sender,
          text: msg.text,
          time: msg.time,
          hits,
        });
      }
    }
  }
  return out;
}

function ToggleRow({
  label,
  desc,
  on,
  onToggle,
}: {
  label: string;
  desc: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 text-left transition-colors"
    >
      <span className={`mt-0.5 shrink-0 ${on ? 'text-emerald-600' : 'text-slate-300'}`}>
        {on ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-sm font-bold text-slate-800 block">{label}</span>
        <span className="text-xs text-slate-500">{desc}</span>
      </span>
    </button>
  );
}

export interface MessageSensitiveContentTabProps {
  chats: Conversation[];
  onOpenConversation?: (chatId: string) => void;
  onSettingsChange?: (settings: SensitiveFilterSettings) => void;
}

export function MessageSensitiveContentTab({
  chats,
  onOpenConversation,
  onSettingsChange,
}: MessageSensitiveContentTabProps) {
  const [settings, setSettings] = useState<SensitiveFilterSettings>(() =>
    readSensitiveFilterSettings()
  );
  const [newPhrase, setNewPhrase] = useState('');
  const [newCategory, setNewCategory] = useState<SensitiveRuleCategory>('custom');
  const [flagSearch, setFlagSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Tất cả');
  const [listMode, setListMode] = useState<FlagListMode>('all');

  const persist = (next: SensitiveFilterSettings) => {
    setSettings(next);
    writeSensitiveFilterSettings(next);
    onSettingsChange?.(next);
  };

  const flagged = useMemo(() => buildFlaggedMessages(chats, settings), [chats, settings]);

  const bulkFlags = useMemo(
    () => detectBulkSimilarMessages(chats, settings),
    [chats, settings]
  );

  useEffect(() => {
    notifyAdminBulkSimilarFlags(bulkFlags, settings);
  }, [bulkFlags, settings.notifyAdminOnBulkSimilar, settings.detectBulkSimilar]);

  const filteredBulk = useMemo(() => {
    const q = flagSearch.toLowerCase().trim();
    return bulkFlags.filter(row => {
      if (!q) return true;
      return (
        row.sender.toLowerCase().includes(q) ||
        row.templateText.toLowerCase().includes(q) ||
        row.recipients.some(
          r =>
            r.recipient.toLowerCase().includes(q) ||
            r.text.toLowerCase().includes(q) ||
            r.chatLabel.toLowerCase().includes(q)
        )
      );
    });
  }, [bulkFlags, flagSearch]);

  const filteredFlagged = useMemo(() => {
    const q = flagSearch.toLowerCase().trim();
    return flagged.filter(row => {
      if (categoryFilter !== 'Tất cả' && !row.hits.some(h => h.category === categoryFilter)) {
        return false;
      }
      if (!q) return true;
      return (
        row.text.toLowerCase().includes(q) ||
        row.sender.toLowerCase().includes(q) ||
        row.chatLabel.toLowerCase().includes(q) ||
        row.hits.some(h => h.matchedText.toLowerCase().includes(q) || h.label.toLowerCase().includes(q))
      );
    });
  }, [flagged, flagSearch, categoryFilter]);

  const enabledKeywordCount = settings.customKeywords.filter(k => k.enabled).length;

  const handleAddKeyword = () => {
    const phrase = newPhrase.trim();
    if (!phrase) return;
    const rule: SensitiveKeywordRule = {
      id: `kw-${Date.now()}`,
      phrase,
      category: newCategory,
      enabled: true,
    };
    persist({
      ...settings,
      customKeywords: [rule, ...settings.customKeywords],
    });
    setNewPhrase('');
  };

  const handleRemoveKeyword = (id: string) => {
    persist({
      ...settings,
      customKeywords: settings.customKeywords.filter(k => k.id !== id),
    });
  };

  const handleToggleKeyword = (id: string) => {
    persist({
      ...settings,
      customKeywords: settings.customKeywords.map(k =>
        k.id === id ? { ...k, enabled: !k.enabled } : k
      ),
    });
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Khôi phục danh sách từ khóa mặc định? Các từ bạn tự thêm vẫn được giữ nếu trùng id.')) {
      return;
    }
    const defaults = defaultSensitiveFilterSettings();
    const merged = [
      ...defaults.customKeywords,
      ...settings.customKeywords.filter(k => !defaults.customKeywords.some(d => d.id === k.id)),
    ];
    persist({
      ...settings,
      customKeywords: merged.length ? merged : defaults.customKeywords,
    });
  };

  return (
    <div className="flex gap-6 flex-1 min-h-0">
      <div className="w-[380px] shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="text-rose-600" size={20} />
            <h3 className="font-bold text-slate-900">Quy tắc tự động</h3>
          </div>
          <div className="space-y-2">
            <ToggleRow
              label="Phát hiện số điện thoại"
              desc="Số VN: 0x…, +84, số rời từng chữ số"
              on={settings.detectPhone}
              onToggle={() => persist({ ...settings, detectPhone: !settings.detectPhone })}
            />
            <ToggleRow
              label="Phát hiện link / website"
              desc="http, www, domain .com / .vn…"
              on={settings.detectUrls}
              onToggle={() => persist({ ...settings, detectUrls: !settings.detectUrls })}
            />
            <ToggleRow
              label="Phát hiện chơi chữ"
              desc="z.a.l.o, s d t, liên hệ cách chữ, leet"
              on={settings.detectObfuscation}
              onToggle={() =>
                persist({ ...settings, detectObfuscation: !settings.detectObfuscation })
              }
            />
            <ToggleRow
              label="Spam cùng nội dung (đa người)"
              desc="1 tài khoản nhắn gần giống cho nhiều người — chỉ đổi vài ký tự"
              on={settings.detectBulkSimilar}
              onToggle={() =>
                persist({ ...settings, detectBulkSimilar: !settings.detectBulkSimilar })
              }
            />
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="text-orange-600" size={18} />
            <h3 className="font-bold text-slate-900 text-sm">Cài đặt spam đa người</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            VD: nhắn 2 hoặc 3 người cùng nội dung (lệch vài chữ) → báo admin.
          </p>
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-bold text-slate-600">Số người nhận tối thiểu</span>
              <input
                type="number"
                min={2}
                max={50}
                disabled={!settings.detectBulkSimilar}
                value={settings.bulkSimilarMinRecipients}
                onChange={e =>
                  persist({
                    ...settings,
                    bulkSimilarMinRecipients: Math.min(
                      50,
                      Math.max(2, Number(e.target.value) || 2)
                    ),
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold disabled:opacity-50"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-bold text-slate-600">
                Độ giống nội dung (%)
              </span>
              <input
                type="number"
                min={50}
                max={99}
                disabled={!settings.detectBulkSimilar}
                value={Math.round(settings.bulkSimilarThreshold * 100)}
                onChange={e =>
                  persist({
                    ...settings,
                    bulkSimilarThreshold: Math.min(
                      0.99,
                      Math.max(0.5, (Number(e.target.value) || 85) / 100)
                    ),
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold disabled:opacity-50"
              />
              <span className="text-[10px] text-slate-400">85% = chỉ khác vài ký tự</span>
            </label>
            <ToggleRow
              label="Thông báo admin khi phát hiện"
              desc="Mỗi cụm spam chỉ báo một lần trong phiên làm việc"
              on={settings.notifyAdminOnBulkSimilar}
              onToggle={() =>
                persist({
                  ...settings,
                  notifyAdminOnBulkSimilar: !settings.notifyAdminOnBulkSimilar,
                })
              }
            />
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm">
              Từ khóa đã cài ({enabledKeywordCount} bật)
            </h3>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-[10px] font-bold text-blue-600 hover:underline"
            >
              Mặc định
            </button>
          </div>

          <div className="flex gap-2 mb-3 shrink-0">
            <input
              type="text"
              value={newPhrase}
              onChange={e => setNewPhrase(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
              placeholder="Thêm từ khóa…"
              className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as SensitiveRuleCategory)}
              className="max-w-[110px] text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-xl px-2 outline-none"
            >
              {CATEGORY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddKeyword}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shrink-0"
              title="Thêm"
            >
              <Plus size={16} />
            </button>
          </div>

          <ul className="flex-1 overflow-y-auto space-y-1.5 min-h-0 max-h-[320px]">
            {settings.customKeywords.map(rule => (
              <li
                key={rule.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
                  rule.enabled
                    ? 'bg-slate-50 border-slate-100'
                    : 'bg-white border-slate-50 opacity-60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggleKeyword(rule.id)}
                  className={rule.enabled ? 'text-emerald-600' : 'text-slate-300'}
                  aria-label={rule.enabled ? 'Tắt' : 'Bật'}
                >
                  {rule.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
                <span className="flex-1 min-w-0 font-bold text-slate-800 truncate" title={rule.phrase}>
                  {rule.phrase}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">
                  {getSensitiveCategoryLabel(rule.category).split(' ')[0]}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(rule.id)}
                  className="text-slate-400 hover:text-rose-600 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col min-w-0 min-h-0">
        <div className="p-5 border-b border-slate-100 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <MessageCircleWarning size={18} className="text-amber-600" />
                Tin nhắn vi phạm / nghi ngờ
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                SĐT, Zalo, link, chơi chữ và spam cùng nội dung gửi nhiều người
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100">
                Từ khóa: {filteredFlagged.length}/{flagged.length}
              </span>
              <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100">
                Spam đa người: {filteredBulk.length}/{bulkFlags.length}
              </span>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl mb-3 w-fit">
            {(
              [
                ['all', 'Tất cả'],
                ['keyword', 'Từ khóa / SĐT'],
                ['bulk', 'Spam đa người'],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setListMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  listMode === mode ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={flagSearch}
                onChange={e => setFlagSearch(e.target.value)}
                placeholder="Tìm nội dung, người gửi, hội thoại…"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            {listMode !== 'bulk' ? (
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
              >
                <option value="Tất cả">Mọi loại vi phạm</option>
                {CATEGORY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {listMode === 'bulk' ? (
            filteredBulk.length === 0 ? (
              <EmptyFlagState bulk />
            ) : (
              <BulkSimilarTable
                rows={filteredBulk}
                onOpenConversation={onOpenConversation}
              />
            )
          ) : null}

          {listMode === 'keyword' ? (
            filteredFlagged.length === 0 ? (
              <EmptyFlagState />
            ) : (
              <KeywordFlagTable
                rows={filteredFlagged}
                onOpenConversation={onOpenConversation}
              />
            )
          ) : null}

          {listMode === 'all' ? (
            filteredFlagged.length === 0 && filteredBulk.length === 0 ? (
              <EmptyFlagState />
            ) : (
              <>
                {filteredBulk.length > 0 ? (
                  <div className="border-b border-slate-100">
                    <p className="px-4 py-2 text-[10px] font-bold text-orange-600 uppercase bg-orange-50/50">
                      Spam cùng nội dung — đa người
                    </p>
                    <BulkSimilarTable
                      rows={filteredBulk}
                      onOpenConversation={onOpenConversation}
                      compact
                    />
                  </div>
                ) : null}
                {filteredFlagged.length > 0 ? (
                  <>
                    {filteredBulk.length > 0 ? (
                      <p className="px-4 py-2 text-[10px] font-bold text-rose-600 uppercase bg-rose-50/30">
                        Từ khóa / SĐT / link
                      </p>
                    ) : null}
                    <KeywordFlagTable
                      rows={filteredFlagged}
                      onOpenConversation={onOpenConversation}
                    />
                  </>
                ) : null}
              </>
            )
          ) : null}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 shrink-0 flex flex-wrap gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Phone size={12} /> SĐT / hotline
          </span>
          <span className="flex items-center gap-1">
            <MessageCircleWarning size={12} /> Zalo, Telegram, liên hệ
          </span>
          <span className="flex items-center gap-1">
            <Link2 size={12} /> Link website ngoài sàn
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} /> Cùng nội dung → nhiều người
          </span>
        </div>
      </section>
    </div>
  );
}

function EmptyFlagState({ bulk }: { bulk?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-slate-400 px-6 text-center">
      <ShieldAlert size={40} className="mb-3 opacity-30" />
      <p className="text-sm font-medium">
        {bulk ? 'Không phát hiện spam đa người.' : 'Không có tin nhắn khớp quy tắc hiện tại.'}
      </p>
      <p className="text-xs mt-1">
        {bulk
          ? 'Giảm số người tối thiểu hoặc độ giống % bên trái để nhạy hơn.'
          : 'Bật thêm quy tắc hoặc thêm từ khóa bên trái.'}
      </p>
    </div>
  );
}

function BulkSimilarTable({
  rows,
  onOpenConversation,
  compact,
}: {
  rows: BulkSimilarFlag[];
  onOpenConversation?: (chatId: string) => void;
  compact?: boolean;
}) {
  return (
    <table className="w-full text-left">
      <thead className="sticky top-0 bg-orange-50/90 z-10">
        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <th className="px-4 py-3">Tài khoản gửi</th>
          <th className="px-4 py-3">Số người nhận</th>
          <th className="px-4 py-3 min-w-[180px]">Mẫu tin</th>
          <th className="px-4 py-3">Chi tiết</th>
          {!compact ? <th className="px-4 py-3 w-24" /> : null}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {rows.map(row => (
          <motion.tr
            key={row.id}
            layout
            className="hover:bg-orange-50/40 transition-colors"
          >
            <td className="px-4 py-3 align-top text-xs font-bold text-slate-800">{row.sender}</td>
            <td className="px-4 py-3 align-top">
              <span className="inline-flex px-2 py-0.5 rounded-lg bg-orange-100 text-orange-800 text-xs font-black">
                {row.recipientCount} người
              </span>
              <p className="text-[10px] text-slate-500 mt-1">
                ~{Math.round(row.avgSimilarity * 100)}% giống
              </p>
            </td>
            <td className="px-4 py-3 align-top text-xs text-slate-700 line-clamp-2">
              {row.templateText}
            </td>
            <td className="px-4 py-3 align-top">
              <ul className="space-y-1.5 max-h-32 overflow-y-auto">
                {row.recipients.map(r => (
                  <li key={`${r.chatId}-${r.messageId}`} className="text-[10px] text-slate-600">
                    <span className="font-bold text-slate-800">{r.recipient}</span>
                    <span className="text-slate-400"> · {Math.round(r.similarity * 100)}%</span>
                    <p className="line-clamp-1 text-slate-500">{r.text}</p>
                  </li>
                ))}
              </ul>
            </td>
            {!compact ? (
              <td className="px-4 py-3 align-top">
                {onOpenConversation && row.recipients[0] ? (
                  <button
                    type="button"
                    onClick={() => onOpenConversation(row.recipients[0].chatId)}
                    className="text-[10px] font-bold text-blue-600 hover:underline whitespace-nowrap"
                  >
                    Mở chat
                  </button>
                ) : null}
              </td>
            ) : null}
          </motion.tr>
        ))}
      </tbody>
    </table>
  );
}

function KeywordFlagTable({
  rows,
  onOpenConversation,
}: {
  rows: FlaggedChatMessage[];
  onOpenConversation?: (chatId: string) => void;
}) {
  return (
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-50/95 z-10">
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Hội thoại</th>
                  <th className="px-4 py-3">Người gửi</th>
                  <th className="px-4 py-3 min-w-[200px]">Nội dung</th>
                  <th className="px-4 py-3">Khớp</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map(row => (
                  <motion.tr
                    key={`${row.chatId}-${row.messageId}`}
                    layout
                    className="hover:bg-amber-50/30 transition-colors"
                  >
                    <td className="px-4 py-3 align-top">
                      <p className="text-xs font-bold text-slate-800 line-clamp-2">{row.chatLabel}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{row.chatId}</p>
                    </td>
                    <td className="px-4 py-3 align-top text-xs font-bold text-slate-700">{row.sender}</td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-xs text-slate-700 line-clamp-3 whitespace-pre-wrap">{row.text}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{row.time}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-1">
                        {row.hits.map((h, i) => (
                          <span
                            key={`${h.ruleId}-${i}`}
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-bold"
                            title={h.matchedText}
                          >
                            <AlertTriangle size={10} />
                            {h.label}
                            <span className="text-rose-500 font-mono ml-0.5 max-w-[80px] truncate">
                              «{h.matchedText}»
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {onOpenConversation ? (
                        <button
                          type="button"
                          onClick={() => onOpenConversation(row.chatId)}
                          className="text-[10px] font-bold text-blue-600 hover:underline whitespace-nowrap"
                        >
                          Mở chat
                        </button>
                      ) : null}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
  );
}
