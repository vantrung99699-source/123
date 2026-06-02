/**
 * Cài đặt chung — giới hạn gian hàng, mặt hàng, khiếu nại.
 */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  Store,
  Package,
  MessageSquareWarning,
  Save,
  RotateCcw,
  Plus,
  Trash2,
} from 'lucide-react';
import type { Category } from '../gianHang/types';
import type { Order } from '../ordersTypes';
import {
  type AdminGeneralSettings,
  type ComplaintExtraRule,
  type ComplaintExtraRuleKind,
  type ComplaintLimitExceededAction,
  type ComplaintLimitScope,
  SETTING_GIAN_HANG_MAX,
  SETTING_PRODUCT_MAX,
  SETTING_COMPLAINT_MAX,
  SETTING_NUMBER_MIN,
  COMPLAINT_EXTRA_RULE_KINDS,
  clampSettingNumber,
  createComplaintExtraRule,
  defaultAdminGeneralSettings,
  readAdminGeneralSettings,
  writeAdminGeneralSettings,
  normalizeAdminGeneralSettings,
  complaintScopeLabel,
  complaintActionLabel,
  complaintExtraRuleKindLabel,
  complaintExtraRuleKindHint,
} from './adminGeneralSettings';
import { summarizeLimitsUsage } from './adminGeneralSettingsPolicy';

export interface GeneralSettingsViewProps {
  categories?: Category[];
  orders?: Order[];
}

function SettingNumberInput({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  useEffect(() => setDraft(null), [value]);
  const display = draft ?? String(value);

  const commit = (raw: string) => {
    setDraft(null);
    const parsed = Number(raw.replace(/\s/g, ''));
    onChange(clampSettingNumber(parsed, min, max));
  };

  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      {hint ? <span className="text-xs text-slate-500 block">{hint}</span> : null}
      <input
        type="number"
        min={min}
        max={max}
        step={1}
        value={display}
        onChange={e => setDraft(e.target.value)}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit((e.target as HTMLInputElement).value);
          }
        }}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
      />
      <span className="text-[10px] text-slate-400 font-medium">
        Nhập từ {min.toLocaleString('vi-VN')} đến {max.toLocaleString('vi-VN')}
      </span>
    </label>
  );
}

function ComplaintExtraRuleCard({
  rule,
  defaultScope,
  defaultOnExceeded,
  onChange,
  onRemove,
}: {
  rule: ComplaintExtraRule;
  defaultScope: ComplaintLimitScope;
  defaultOnExceeded: ComplaintLimitExceededAction;
  onChange: (next: ComplaintExtraRule) => void;
  onRemove: () => void;
}) {
  const showLimitFields = rule.kind !== 'notify_each_complaint';

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 ${
        rule.enabled ? 'border-slate-200 bg-slate-50/80' : 'border-slate-100 bg-white opacity-70'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <input
            type="checkbox"
            checked={rule.enabled}
            onChange={e => onChange({ ...rule, enabled: e.target.checked })}
            className="mt-1 rounded border-slate-300"
          />
          <div>
            <p className="text-sm font-bold text-slate-800">{complaintExtraRuleKindLabel(rule.kind)}</p>
            <p className="text-xs text-slate-500 mt-0.5">{complaintExtraRuleKindHint(rule.kind)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
          title="Xóa điều kiện"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {showLimitFields ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-600">Số tối đa</span>
            <input
              type="number"
              min={SETTING_NUMBER_MIN}
              max={SETTING_COMPLAINT_MAX}
              value={rule.maxCount ?? 1}
              onChange={e =>
                onChange({
                  ...rule,
                  maxCount: clampSettingNumber(Number(e.target.value), 1, SETTING_COMPLAINT_MAX),
                })
              }
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold"
            />
          </label>
          {rule.kind === 'max_in_days' ? (
            <label className="block space-y-1">
              <span className="text-xs font-bold text-slate-600">Trong số ngày</span>
              <input
                type="number"
                min={1}
                max={365}
                value={rule.windowDays ?? 30}
                onChange={e =>
                  onChange({
                    ...rule,
                    windowDays: clampSettingNumber(Number(e.target.value), 1, 365),
                  })
                }
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold"
              />
            </label>
          ) : null}
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-xs font-bold text-slate-600">Phạm vi áp dụng</span>
            <select
              value={rule.scope ?? ''}
              onChange={e =>
                onChange({
                  ...rule,
                  scope:
                    e.target.value === ''
                      ? undefined
                      : (e.target.value as ComplaintLimitScope),
                })
              }
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold"
            >
              <option value="">Mặc định ({complaintScopeLabel(defaultScope)})</option>
              <option value="gian_hang">{complaintScopeLabel('gian_hang')}</option>
              <option value="mat_hang">{complaintScopeLabel('mat_hang')}</option>
            </select>
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-xs font-bold text-slate-600">Khi vượt điều kiện này</span>
            <select
              value={rule.onExceeded ?? ''}
              onChange={e =>
                onChange({
                  ...rule,
                  onExceeded:
                    e.target.value === ''
                      ? undefined
                      : (e.target.value as ComplaintLimitExceededAction),
                })
              }
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold"
            >
              <option value="">Mặc định ({complaintActionLabel(defaultOnExceeded)})</option>
              <option value="notify_admin">{complaintActionLabel('notify_admin')}</option>
              <option value="suspend_gian">{complaintActionLabel('suspend_gian')}</option>
              <option value="notify_and_suspend">{complaintActionLabel('notify_and_suspend')}</option>
            </select>
          </label>
        </div>
      ) : null}

      <label className="block space-y-1">
        <span className="text-xs font-bold text-slate-600">Ghi chú (tuỳ chọn)</span>
        <input
          type="text"
          value={rule.note ?? ''}
          onChange={e => onChange({ ...rule, note: e.target.value || undefined })}
          placeholder="VD: Gian VIP, sản phẩm số, đơn dịch vụ…"
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
        />
      </label>
    </div>
  );
}

export function GeneralSettingsView({ categories = [], orders = [] }: GeneralSettingsViewProps) {
  const [settings, setSettings] = useState<AdminGeneralSettings>(() => readAdminGeneralSettings());
  const [savedFlash, setSavedFlash] = useState(false);
  const [addRuleOpen, setAddRuleOpen] = useState(false);

  const usage = useMemo(() => summarizeLimitsUsage(categories, orders), [categories, orders]);

  const persist = (next: AdminGeneralSettings) => {
    const normalized = normalizeAdminGeneralSettings(next);
    setSettings(normalized);
    writeAdminGeneralSettings(normalized);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  const handleSave = () => persist(settings);

  const handleReset = () => {
    if (!window.confirm('Khôi phục cài đặt mặc định?')) return;
    const def = defaultAdminGeneralSettings();
    persist(def);
    setSettings(def);
  };

  const addExtraRule = (kind: ComplaintExtraRuleKind) => {
    setSettings(s => ({
      ...s,
      complaintExtraRules: [...(s.complaintExtraRules ?? []), createComplaintExtraRule(kind)],
    }));
    setAddRuleOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 h-full overflow-y-auto"
    >
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Settings className="text-blue-600" size={26} />
            Cài đặt chung
          </h2>
          <p className="text-slate-500 text-sm max-w-2xl">
            Giới hạn tạo gian hàng, mặt hàng và khiếu nại. Nhập số trực tiếp; có thể thêm nhiều điều kiện
            khiếu nại / tranh chấp bổ sung.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Mặc định
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200"
          >
            <Save size={16} />
            Lưu cài đặt
          </button>
        </div>
      </header>

      {savedFlash ? (
        <p className="mb-4 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 w-fit">
          Đã lưu cài đặt.
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Gian hàng hệ thống</p>
          <p className="text-xl font-black text-slate-900 mt-1">{usage.gianHangCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Người bán (ước tính)</p>
          <p className="text-xl font-black text-slate-900 mt-1">{usage.sellerCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Gian vượt hạn mặt hàng</p>
          <p className="text-xl font-black text-amber-700 mt-1">{usage.overProductLimit}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Đơn khiếu nại / tranh chấp</p>
          <p className="text-xl font-black text-rose-700 mt-1">{usage.complaintOrders}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store className="text-blue-600" size={20} />
            <h3 className="font-bold text-slate-900">Giới hạn gian hàng & mặt hàng</h3>
          </div>
          <SettingNumberInput
            label="Số gian hàng tối đa / người bán"
            hint="Đếm theo tên đăng nhập / chủ shop trên từng gian hàng con."
            value={settings.maxGianHangPerSeller}
            min={SETTING_NUMBER_MIN}
            max={SETTING_GIAN_HANG_MAX}
            onChange={n => setSettings(s => ({ ...s, maxGianHangPerSeller: n }))}
          />
          <SettingNumberInput
            label="Số mặt hàng tối đa / gian hàng"
            hint="Không cho thêm mặt hàng mới khi đã đạt giới hạn."
            value={settings.maxProductsPerGianHang}
            min={SETTING_NUMBER_MIN}
            max={SETTING_PRODUCT_MAX}
            onChange={n => setSettings(s => ({ ...s, maxProductsPerGianHang: n }))}
          />
        </section>

        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MessageSquareWarning className="text-rose-600" size={20} />
            <h3 className="font-bold text-slate-900">Khiếu nại & tranh chấp</h3>
          </div>
          <SettingNumberInput
            label="Số lượng khiếu nại tối đa"
            hint="Đếm đơn có trạng thái Khiếu nại / Tranh chấp hoặc đã khiếu nại."
            value={settings.maxComplaintsPerScope}
            min={SETTING_NUMBER_MIN}
            max={SETTING_COMPLAINT_MAX}
            onChange={n => setSettings(s => ({ ...s, maxComplaintsPerScope: n }))}
          />
          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-slate-800">Áp dụng giới hạn theo</span>
            <select
              value={settings.complaintScope}
              onChange={e =>
                setSettings(s => ({
                  ...s,
                  complaintScope: e.target.value as ComplaintLimitScope,
                }))
              }
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="gian_hang">{complaintScopeLabel('gian_hang')}</option>
              <option value="mat_hang">{complaintScopeLabel('mat_hang')}</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-slate-800">Khi vượt giới hạn chính</span>
            <select
              value={settings.onComplaintLimitExceeded}
              onChange={e =>
                setSettings(s => ({
                  ...s,
                  onComplaintLimitExceeded: e.target.value as ComplaintLimitExceededAction,
                }))
              }
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="notify_admin">{complaintActionLabel('notify_admin')}</option>
              <option value="suspend_gian">{complaintActionLabel('suspend_gian')}</option>
              <option value="notify_and_suspend">{complaintActionLabel('notify_and_suspend')}</option>
            </select>
          </label>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-800">Điều kiện bổ sung</p>
                <p className="text-xs text-slate-500">
                  Thêm các trường hợp khác (theo ngày, theo trạng thái, thông báo từng lần…).
                </p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAddRuleOpen(v => !v)}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 flex items-center gap-1"
                >
                  <Plus size={14} />
                  Thêm điều kiện
                </button>
                {addRuleOpen ? (
                  <div className="absolute right-0 top-full mt-1 z-10 min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                    {COMPLAINT_EXTRA_RULE_KINDS.map(kind => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => addExtraRule(kind)}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        {complaintExtraRuleKindLabel(kind)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {(settings.complaintExtraRules ?? []).length === 0 ? (
              <p className="text-xs text-slate-400 italic">Chưa có điều kiện bổ sung.</p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {(settings.complaintExtraRules ?? []).map(rule => (
                  <ComplaintExtraRuleCard
                    key={rule.id}
                    rule={rule}
                    defaultScope={settings.complaintScope}
                    defaultOnExceeded={settings.onComplaintLimitExceeded}
                    onChange={next =>
                      setSettings(s => ({
                        ...s,
                        complaintExtraRules: (s.complaintExtraRules ?? []).map(r =>
                          r.id === rule.id ? next : r
                        ),
                      }))
                    }
                    onRemove={() =>
                      setSettings(s => ({
                        ...s,
                        complaintExtraRules: (s.complaintExtraRules ?? []).filter(
                          r => r.id !== rule.id
                        ),
                      }))
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs text-slate-600 space-y-2">
        <p className="font-bold text-slate-700 flex items-center gap-1">
          <Package size={14} /> Ghi chú
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Nhập số trực tiếp thay vì chọn từ danh sách cố định; giá trị được làm tròn khi lưu.</li>
          <li>Chặn tạo gian hàng / mặt hàng: thông báo popup cho người bán.</li>
          <li>Chặn khiếu nại mới khi đã đủ hạn mức hoặc vi phạm điều kiện bổ sung.</li>
          <li>Thông báo admin xuất hiện tại menu <b>Thông báo</b> trong Admin Panel.</li>
          <li>Tạm dừng gian: đổi trạng thái gian sang «Tạm ngưng» và khóa bật mặt hàng.</li>
        </ul>
      </section>
    </motion.div>
  );
}
