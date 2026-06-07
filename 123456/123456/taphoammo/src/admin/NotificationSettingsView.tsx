/**
 * Thông báo người dùng — quản lý popup storefront.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bell,
  Bold,
  Check,
  ChevronLeft,
  Clock,
  Code,
  Eraser,
  Home,
  Image,
  Italic,
  Link2,
  Megaphone,
  Pencil,
  Plus,
  Quote,
  Strikethrough,
  Table,
  Trash2,
  Underline,
  Wallet,
} from 'lucide-react';
import {
  createStorefrontTopUpNotice,
  deleteStorefrontTopUpNotice,
  listStorefrontTopUpNotices,
  toggleStorefrontTopUpNotice,
  topUpNoticeVariantLabel,
  updateStorefrontTopUpNotice,
  type StorefrontTopUpNotice,
  type StorefrontTopUpNoticeVariant,
} from './adminStorefrontTopUpNotices';
import {
  buildPopupScheduleLabel,
  createStorefrontPopupNotification,
  deleteStorefrontPopupNotification,
  listStorefrontPopupNotifications,
  pageTargetLabel,
  stripHtmlPreview,
  toggleStorefrontPopupNotification,
  updateStorefrontPopupNotification,
  type StorefrontPopupExpirationMode,
  type StorefrontPopupNotification,
  type StorefrontPopupPageTarget,
} from './adminStorefrontPopupNotifications';
import {
  readStorefrontNotificationSettings,
  writeStorefrontNotificationSettings,
  type AdminStorefrontNotificationSettings,
} from './adminStorefrontNotificationSettings';

type PopupFormState = {
  title: string;
  content: string;
  htmlMode: boolean;
  pageTarget: StorefrontPopupPageTarget;
  autoCloseEnabled: boolean;
  autoCloseHours: number;
  expirationMode: StorefrontPopupExpirationMode;
  expirationDurationHours: number;
  expirationAt: string;
  buttonLabel: string;
  oncePerSession: boolean;
  enabled: boolean;
};

const EMPTY_FORM: PopupFormState = {
  title: '',
  content: '',
  htmlMode: false,
  pageTarget: 'home',
  autoCloseEnabled: false,
  autoCloseHours: 24,
  expirationMode: 'never',
  expirationDurationHours: 24,
  expirationAt: '',
  buttonLabel: 'Đã hiểu',
  oncePerSession: true,
  enabled: true,
};

function toDatetimeLocalValue(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

function itemToForm(item: StorefrontPopupNotification): PopupFormState {
  return {
    title: item.title,
    content: item.content,
    htmlMode: /<[a-z][\s\S]*>/i.test(item.content),
    pageTarget: 'home',
    autoCloseEnabled: item.autoCloseEnabled,
    autoCloseHours: item.autoCloseHours,
    expirationMode: item.expirationMode,
    expirationDurationHours: item.expirationDurationHours,
    expirationAt: toDatetimeLocalValue(item.expirationAtIso),
    buttonLabel: item.buttonLabel,
    oncePerSession: item.oncePerSession,
    enabled: item.enabled,
  };
}

function formToPayload(form: PopupFormState) {
  const expirationAtIso = fromDatetimeLocalValue(form.expirationAt);
  return {
    title: form.title,
    content: form.content,
    enabled: form.enabled,
    pageTarget: form.pageTarget,
    expirationMode: form.expirationMode,
    expirationDurationHours: form.expirationDurationHours,
    expirationAtIso,
    scheduleLabel: buildPopupScheduleLabel({
      expirationMode: form.expirationMode,
      expirationDurationHours: form.expirationDurationHours,
      expirationAtIso,
    }),
    autoCloseEnabled: form.autoCloseEnabled,
    autoCloseHours: form.autoCloseHours,
    buttonLabel: form.buttonLabel,
    oncePerSession: form.oncePerSession,
  };
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function ToolbarButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="w-8 h-8 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-colors"
    >
      {children}
    </button>
  );
}

function PopupNotificationForm({
  editing,
  initial,
  onBack,
  onSaved,
}: {
  editing: StorefrontPopupNotification | null;
  initial: PopupFormState;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PopupFormState>(initial);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  useEffect(() => {
    if (form.htmlMode || !editorRef.current) return;
    if (editorRef.current.innerHTML !== form.content) {
      editorRef.current.innerHTML = form.content;
    }
  }, [form.htmlMode, initial]);

  const execFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setForm(f => ({ ...f, content: editorRef.current?.innerHTML ?? '' }));
    }
  };

  const syncEditorContent = () => {
    if (editorRef.current) {
      setForm(f => ({ ...f, content: editorRef.current?.innerHTML ?? '' }));
    }
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    const payload = formToPayload(form);
    if (editing) {
      updateStorefrontPopupNotification(editing.id, payload);
    } else {
      createStorefrontPopupNotification(payload);
    }
    onSaved();
    onBack();
  };

  const expirationOptions: {
    id: StorefrontPopupExpirationMode;
    title: string;
    desc: string;
  }[] = [
    {
      id: 'never',
      title: 'Không bao giờ',
      desc: 'Thông báo sẽ không tự động hết hạn',
    },
    {
      id: 'duration',
      title: 'Sau một khoảng thời gian',
      desc: 'Thông báo sẽ hết hạn sau số giờ được chỉ định',
    },
    {
      id: 'datetime',
      title: 'Ngày cụ thể',
      desc: 'Thông báo sẽ hết hạn vào một ngày và giờ cụ thể',
    },
  ];

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-700 transition-colors"
      >
        <ChevronLeft size={16} />
        Quay lại danh sách
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {editing ? 'Sửa thông báo popup' : 'Thêm thông báo popup'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">Cấu hình nội dung và thời gian hiển thị thông báo</p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-bold text-slate-800">Tiêu đề</span>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Nhập tiêu đề thông báo"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
          />
        </label>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-slate-800">Nội dung</span>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
              <span>HTML</span>
              <ToggleSwitch
                checked={form.htmlMode}
                onChange={v => {
                  if (!v && editorRef.current) {
                    editorRef.current.innerHTML = form.content;
                  }
                  setForm(f => ({ ...f, htmlMode: v }));
                }}
              />
            </label>
          </div>

          {form.htmlMode ? (
            <textarea
              rows={10}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Nhập nội dung thông báo"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 resize-y min-h-[220px]"
            />
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
              <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-slate-100 bg-slate-50/80">
                <ToolbarButton title="In đậm" onClick={() => execFormat('bold')}>
                  <Bold size={15} />
                </ToolbarButton>
                <ToolbarButton title="In nghiêng" onClick={() => execFormat('italic')}>
                  <Italic size={15} />
                </ToolbarButton>
                <ToolbarButton title="Gạch chân" onClick={() => execFormat('underline')}>
                  <Underline size={15} />
                </ToolbarButton>
                <ToolbarButton title="Gạch ngang" onClick={() => execFormat('strikeThrough')}>
                  <Strikethrough size={15} />
                </ToolbarButton>
                <span className="w-px h-6 bg-slate-200 mx-1" />
                <ToolbarButton title="Căn trái" onClick={() => execFormat('justifyLeft')}>
                  <AlignLeft size={15} />
                </ToolbarButton>
                <ToolbarButton title="Căn giữa" onClick={() => execFormat('justifyCenter')}>
                  <AlignCenter size={15} />
                </ToolbarButton>
                <ToolbarButton title="Căn phải" onClick={() => execFormat('justifyRight')}>
                  <AlignRight size={15} />
                </ToolbarButton>
                <span className="w-px h-6 bg-slate-200 mx-1" />
                <ToolbarButton title="Trích dẫn" onClick={() => execFormat('formatBlock', 'blockquote')}>
                  <Quote size={15} />
                </ToolbarButton>
                <ToolbarButton title="Mã" onClick={() => execFormat('formatBlock', 'pre')}>
                  <Code size={15} />
                </ToolbarButton>
                <ToolbarButton
                  title="Liên kết"
                  onClick={() => {
                    const url = window.prompt('Nhập URL');
                    if (url) execFormat('createLink', url);
                  }}
                >
                  <Link2 size={15} />
                </ToolbarButton>
                <ToolbarButton
                  title="Hình ảnh"
                  onClick={() => {
                    const url = window.prompt('Nhập URL hình ảnh');
                    if (url) execFormat('insertImage', url);
                  }}
                >
                  <Image size={15} />
                </ToolbarButton>
                <ToolbarButton title="Bảng" onClick={() => execFormat('insertHorizontalRule')}>
                  <Table size={15} />
                </ToolbarButton>
                <ToolbarButton title="Xóa định dạng" onClick={() => execFormat('removeFormat')}>
                  <Eraser size={15} />
                </ToolbarButton>
              </div>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={syncEditorContent}
                onBlur={syncEditorContent}
                data-placeholder="Nhập nội dung thông báo"
                className="min-h-[220px] px-4 py-3 text-sm text-slate-700 leading-relaxed outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
              />
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-4 py-1">
          <div>
            <p className="text-sm font-bold text-slate-800">Tự động đóng thông báo</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
              Khi được bật, thông báo sẽ tự động đóng sau số giờ được chỉ định
            </p>
            {form.autoCloseEnabled && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={form.autoCloseHours}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      autoCloseHours: Math.max(1, Number(e.target.value) || 1),
                    }))
                  }
                  className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
                <span className="text-sm text-slate-600">giờ</span>
              </div>
            )}
          </div>
          <ToggleSwitch
            checked={form.autoCloseEnabled}
            onChange={v => setForm(f => ({ ...f, autoCloseEnabled: v }))}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-800">Hết hạn thông báo</p>
          <div className="space-y-2">
            {expirationOptions.map(opt => {
              const selected = form.expirationMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, expirationMode: opt.id }))}
                  className={`w-full text-left rounded-xl border px-4 py-3.5 flex items-center gap-3 transition-colors ${
                    selected
                      ? 'border-blue-300 bg-blue-50/70'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      selected ? 'border-blue-600' : 'border-slate-300'
                    }`}
                  >
                    {selected ? <span className="w-2 h-2 rounded-full bg-blue-600" /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold ${selected ? 'text-blue-800' : 'text-slate-800'}`}>
                      {opt.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                    {selected && opt.id === 'duration' && (
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={8760}
                          value={form.expirationDurationHours}
                          onClick={e => e.stopPropagation()}
                          onChange={e =>
                            setForm(f => ({
                              ...f,
                              expirationDurationHours: Math.max(1, Number(e.target.value) || 1),
                            }))
                          }
                          className="w-20 px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm"
                        />
                        <span className="text-sm text-slate-600">giờ</span>
                      </div>
                    )}
                    {selected && opt.id === 'datetime' && (
                      <input
                        type="datetime-local"
                        value={form.expirationAt}
                        onClick={e => e.stopPropagation()}
                        onChange={e => setForm(f => ({ ...f, expirationAt: e.target.value }))}
                        className="mt-3 px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm"
                      />
                    )}
                  </div>
                  {selected ? <Check size={18} className="text-blue-600 shrink-0" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        <label className="block space-y-2 pt-2 border-t border-slate-100">
          <span className="text-sm font-bold text-slate-800">Nút xác nhận</span>
          <input
            type="text"
            value={form.buttonLabel}
            onChange={e => setForm(f => ({ ...f, buttonLabel: e.target.value }))}
            className="w-full max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <p className="text-[11px] text-slate-500">Popup chỉ hiển thị tại trang chủ.</p>
        </label>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <ToggleSwitch
              checked={form.enabled}
              onChange={v => setForm(f => ({ ...f, enabled: v }))}
            />
            <span className="text-sm font-bold text-slate-800">Bật thông báo</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!form.title.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {editing ? 'Cập nhật' : 'Tạo popup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type TopUpFormState = {
  title: string;
  content: string;
  htmlMode: boolean;
  variant: StorefrontTopUpNoticeVariant;
  enabled: boolean;
};

const EMPTY_TOPUP_FORM: TopUpFormState = {
  title: '',
  content: '',
  htmlMode: false,
  variant: 'info',
  enabled: true,
};

function itemToTopUpForm(item: StorefrontTopUpNotice): TopUpFormState {
  return {
    title: item.title,
    content: item.content,
    htmlMode: /<[a-z][\s\S]*>/i.test(item.content),
    variant: item.variant,
    enabled: item.enabled,
  };
}

function formToTopUpPayload(form: TopUpFormState) {
  return {
    title: form.title,
    content: form.content,
    enabled: form.enabled,
    variant: form.variant,
  };
}

function TopUpNoticeForm({
  editing,
  initial,
  onBack,
  onSaved,
}: {
  editing: StorefrontTopUpNotice | null;
  initial: TopUpFormState;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<TopUpFormState>(initial);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  useEffect(() => {
    if (form.htmlMode || !editorRef.current) return;
    if (editorRef.current.innerHTML !== form.content) {
      editorRef.current.innerHTML = form.content;
    }
  }, [form.htmlMode, initial]);

  const syncEditorContent = () => {
    if (editorRef.current) {
      setForm(f => ({ ...f, content: editorRef.current?.innerHTML ?? '' }));
    }
  };

  const handleSubmit = () => {
    if (!form.title.trim() && !form.content.trim()) return;
    const payload = formToTopUpPayload(form);
    if (editing) {
      updateStorefrontTopUpNotice(editing.id, payload);
    } else {
      createStorefrontTopUpNotice(payload);
    }
    onSaved();
    onBack();
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
      >
        <ChevronLeft size={16} />
        Quay lại danh sách
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {editing ? 'Sửa thông báo nạp tiền' : 'Thêm thông báo nạp tiền'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Banner hiển thị inline trên trang Nạp tiền — không phải popup.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-bold text-slate-800">Tiêu đề (tùy chọn)</span>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Có thể để trống"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </label>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-slate-800">Nội dung</span>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
              <span>HTML</span>
              <ToggleSwitch
                checked={form.htmlMode}
                onChange={v => setForm(f => ({ ...f, htmlMode: v }))}
              />
            </label>
          </div>
          {form.htmlMode ? (
            <textarea
              rows={8}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Nhập nội dung thông báo"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-500/20 resize-y min-h-[180px]"
            />
          ) : (
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={syncEditorContent}
              onBlur={syncEditorContent}
              data-placeholder="Nhập nội dung thông báo"
              className="min-h-[180px] px-4 py-3 rounded-xl border border-slate-200 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500/20 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
            />
          )}
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-bold text-slate-800">Kiểu hiển thị</span>
          <select
            value={form.variant}
            onChange={e =>
              setForm(f => ({ ...f, variant: e.target.value as StorefrontTopUpNoticeVariant }))
            }
            className="w-full max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="info">Thông tin (xanh)</option>
            <option value="warning">Cảnh báo (vàng)</option>
            <option value="success">Thành công (xanh lá)</option>
          </select>
        </label>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <label className="flex items-center gap-3 cursor-pointer">
            <ToggleSwitch checked={form.enabled} onChange={v => setForm(f => ({ ...f, enabled: v }))} />
            <span className="text-sm font-bold text-slate-800">Bật thông báo</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!form.title.trim() && !form.content.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              {editing ? 'Cập nhật' : 'Tạo thông báo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationSettingsView() {
  const [popups, setPopups] = useState<StorefrontPopupNotification[]>(() =>
    listStorefrontPopupNotifications()
  );
  const [topUpNotices, setTopUpNotices] = useState<StorefrontTopUpNotice[]>(() =>
    listStorefrontTopUpNotices()
  );
  const [viewMode, setViewMode] = useState<'list' | 'popup-form' | 'topup-form'>('list');
  const [editing, setEditing] = useState<StorefrontPopupNotification | null>(null);
  const [editingTopUp, setEditingTopUp] = useState<StorefrontTopUpNotice | null>(null);
  const [extraSettings, setExtraSettings] = useState<AdminStorefrontNotificationSettings>(() =>
    readStorefrontNotificationSettings()
  );
  const [showExtra, setShowExtra] = useState(false);

  const reload = useCallback(() => {
    setPopups(listStorefrontPopupNotifications());
    setTopUpNotices(listStorefrontTopUpNotices());
  }, []);

  const openCreatePopup = () => {
    setEditing(null);
    setEditingTopUp(null);
    setViewMode('popup-form');
  };

  const openCreateTopUp = () => {
    setEditing(null);
    setEditingTopUp(null);
    setViewMode('topup-form');
  };

  const openEditPopup = (item: StorefrontPopupNotification) => {
    setEditing(item);
    setEditingTopUp(null);
    setViewMode('popup-form');
  };

  const openEditTopUp = (item: StorefrontTopUpNotice) => {
    setEditingTopUp(item);
    setEditing(null);
    setViewMode('topup-form');
  };

  const editorInitial: PopupFormState = editing ? itemToForm(editing) : EMPTY_FORM;
  const topUpEditorInitial: TopUpFormState = editingTopUp
    ? itemToTopUpForm(editingTopUp)
    : EMPTY_TOPUP_FORM;

  const handleDeletePopup = (id: string) => {
    if (!window.confirm('Xóa thông báo popup này?')) return;
    deleteStorefrontPopupNotification(id);
    reload();
  };

  const handleDeleteTopUp = (id: string) => {
    if (!window.confirm('Xóa thông báo nạp tiền này?')) return;
    deleteStorefrontTopUpNotice(id);
    reload();
  };

  const saveExtraSettings = () => {
    writeStorefrontNotificationSettings(extraSettings);
    setExtraSettings(readStorefrontNotificationSettings());
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-100/60">
      <div className="max-w-4xl mx-auto space-y-5">
        {viewMode === 'popup-form' ? (
          <PopupNotificationForm
            editing={editing}
            initial={editorInitial}
            onBack={() => {
              setViewMode('list');
              setEditing(null);
            }}
            onSaved={reload}
          />
        ) : viewMode === 'topup-form' ? (
          <TopUpNoticeForm
            editing={editingTopUp}
            initial={topUpEditorInitial}
            onBack={() => {
              setViewMode('list');
              setEditingTopUp(null);
            }}
            onSaved={reload}
          />
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tương Tác &amp; Thông Báo</h1>
              <p className="text-sm text-slate-500 mt-1">Quản lý thông báo và tương tác người dùng</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openCreatePopup}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
              >
                <Plus size={16} />
                Thông báo popup
              </button>
              <button
                type="button"
                onClick={openCreateTopUp}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              >
                <Plus size={16} />
                Thông báo nạp tiền
              </button>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-800 mb-2">Popup trang chủ</h2>
            </div>
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {popups.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"
                  >
                    <Bell size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm font-semibold text-slate-600">Chưa có thông báo popup</p>
                    <p className="text-xs text-slate-400 mt-1">Bấm «Thông báo popup» để tạo mới.</p>
                  </motion.div>
                ) : (
                  popups.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-center gap-4 px-4 py-4 rounded-xl bg-white border border-slate-200/80 shadow-sm"
                    >
                      <div className="w-11 h-11 shrink-0 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <Bell size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold text-slate-900 truncate">{item.title}</p>
                        <p className="text-xs text-slate-500 mt-1 font-mono truncate" title={item.content}>
                          {stripHtmlPreview(item.content, 160) || '<p>…</p>'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            <Home size={11} />
                            {pageTargetLabel(item.pageTarget)}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-100">
                            <Clock size={11} />
                            {item.scheduleLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <ToggleSwitch
                          checked={item.enabled}
                          onChange={v => {
                            toggleStorefrontPopupNotification(item.id, v);
                            reload();
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => openEditPopup(item)}
                          className="w-9 h-9 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors"
                          aria-label="Sửa"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePopup(item.id)}
                          className="w-9 h-9 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                          aria-label="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="pt-6">
              <h2 className="text-sm font-bold text-slate-800 mb-2">Banner trang nạp tiền</h2>
              <p className="text-xs text-slate-500 mb-3">
                Hiển thị inline trên trang Nạp tiền — không dùng popup.
              </p>
            </div>
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {topUpNotices.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl border border-dashed border-emerald-200 bg-white px-6 py-10 text-center"
                  >
                    <Wallet size={28} className="mx-auto text-emerald-300 mb-3" />
                    <p className="text-sm font-semibold text-slate-600">Chưa có thông báo nạp tiền</p>
                    <p className="text-xs text-slate-400 mt-1">Bấm «Thông báo nạp tiền» để tạo banner.</p>
                  </motion.div>
                ) : (
                  topUpNotices.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 px-4 py-4 rounded-xl bg-white border border-emerald-100 shadow-sm"
                    >
                      <div className="w-11 h-11 shrink-0 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                        <Wallet size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[15px] font-bold truncate ${
                            item.title.trim() ? 'text-slate-900' : 'text-slate-400 italic'
                          }`}
                        >
                          {item.title.trim() || 'Không có tiêu đề'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 truncate" title={item.content}>
                          {stripHtmlPreview(item.content, 160)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <Wallet size={11} />
                            Trang nạp tiền
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {topUpNoticeVariantLabel(item.variant)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <ToggleSwitch
                          checked={item.enabled}
                          onChange={v => {
                            toggleStorefrontTopUpNotice(item.id, v);
                            reload();
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => openEditTopUp(item)}
                          className="w-9 h-9 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-colors"
                          aria-label="Sửa"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTopUp(item.id)}
                          className="w-9 h-9 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                          aria-label="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => setShowExtra(v => !v)}
                className="text-sm font-semibold text-slate-600 hover:text-blue-700"
              >
                {showExtra ? '▾ Ẩn' : '▸ Hiện'} cài đặt marquee
              </button>
              {showExtra ? (
                <div className="mt-4 space-y-4">
                  <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/80">
                      <Megaphone size={16} className="text-red-500" />
                      <h2 className="text-sm font-bold text-slate-800">Thanh chữ chạy</h2>
                    </div>
                    <div className="p-5 space-y-3">
                      <label className="flex items-center justify-between gap-4">
                        <span className="text-sm font-bold text-slate-800">Bật marquee</span>
                        <ToggleSwitch
                          checked={extraSettings.marqueeEnabled}
                          onChange={v => setExtraSettings(s => ({ ...s, marqueeEnabled: v }))}
                        />
                      </label>
                      <textarea
                        rows={2}
                        value={extraSettings.marqueeText}
                        onChange={e => setExtraSettings(s => ({ ...s, marqueeText: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-y"
                      />
                    </div>
                  </section>
                  <button
                    type="button"
                    onClick={saveExtraSettings}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Lưu marquee
                  </button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
