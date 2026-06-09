import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import {
  findStorefrontToolByPage,
  type StorefrontToolPageId,
} from '../storefront/storefrontTools';
import {
  demoCheckFacebookLive,
  extractFacebookUid,
  generateTotpCode,
  parseUidList,
  processCutFilterMerge,
  type CutFilterMergeCutMode,
  type FbLiveCheckRow,
} from '../storefront/storefrontToolUtils';

export interface StorefrontToolPageProps {
  pageId: StorefrontToolPageId;
  fixedHeaderOffset?: boolean;
}

export function StorefrontToolPage({ pageId, fixedHeaderOffset = false }: StorefrontToolPageProps) {
  const tool = findStorefrontToolByPage(pageId);
  const Icon = tool.icon;

  return (
    <div className={`min-h-screen bg-slate-100 ${fixedHeaderOffset ? 'pt-[6.75rem]' : ''}`}>
      <div className="border-b border-cyan-600/20 bg-gradient-to-r from-cyan-600 to-sky-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-3.5 sm:py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <Icon size={18} strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-100/80 leading-none">
                Công cụ
              </p>
              <h1 className="text-base sm:text-lg font-bold tracking-tight mt-0.5 truncate">{tool.label}</h1>
              <p className="text-xs text-sky-50/90 mt-0.5 truncate sm:whitespace-normal sm:line-clamp-1">
                {tool.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-5 sm:py-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6">
            {pageId === 'tools-check-live-fb' && <CheckLiveFbPanel />}
            {pageId === 'tools-2fa' && <TwoFaPanel />}
            {pageId === 'tools-cut-filter-merge' && <CutFilterMergePanel />}
            {pageId === 'tools-get-uid-fb' && <GetUidFbPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckLiveFbPanel() {
  const [input, setInput] = useState('');
  const [rows, setRows] = useState<FbLiveCheckRow[]>([]);

  const handleCheck = () => {
    const items = parseUidList(input);
    setRows(
      items.map(item => {
        const uid = /^\d{8,20}$/.test(item) ? item : extractFacebookUid(item);
        if (!uid) return { input: item, uid: null, status: 'invalid' as const };
        return { input: item, uid, status: demoCheckFacebookLive(uid) };
      })
    );
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Danh sách UID / link (mỗi dòng một mục)</span>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={6}
          placeholder={'100012345678901\nhttps://www.facebook.com/profile.php?id=100012345678901'}
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        />
      </label>
      <button
        type="button"
        onClick={handleCheck}
        className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-700 transition-colors"
      >
        Kiểm tra
      </button>
      {rows.length > 0 && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Đầu vào</th>
                <th className="text-left px-4 py-2 font-semibold">UID</th>
                <th className="text-left px-4 py-2 font-semibold">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={`${row.input}-${i}`} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-700 break-all">{row.input}</td>
                  <td className="px-4 py-2 font-mono text-slate-800">{row.uid ?? '—'}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-slate-500">
        Demo mô phỏng kết quả trên trình duyệt. Kết nối API Facebook thật sẽ được bổ sung sau.
      </p>
    </div>
  );
}

interface TwoFaResultRow {
  index: number;
  secret: string;
  code: string | null;
}

function countTextLines(text: string): number {
  if (!text) return 0;
  return text.split(/\r?\n/).length;
}

function TwoFaPanel() {
  const [secrets, setSecrets] = useState('');
  const [rows, setRows] = useState<TwoFaResultRow[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const secretLines = useMemo(
    () => secrets.split(/\r?\n/).map(line => line.trim()).filter(Boolean),
    [secrets]
  );
  const secretLineCount = useMemo(() => countTextLines(secrets), [secrets]);
  const remaining = useMemo(() => 30 - (Math.floor(Date.now() / 1000) % 30), [tick]);

  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (secretLines.length === 0) {
        if (!cancelled) setRows([]);
        return;
      }
      const nextRows = await Promise.all(
        secretLines.map(async (secret, index) => ({
          index: index + 1,
          secret,
          code: await generateTotpCode(secret),
        }))
      );
      if (!cancelled) setRows(nextRows);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [secretLines, tick]);

  const copyText = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(current => (current === key ? null : current)), 2000);
    } catch {
      setCopiedKey(null);
    }
  }, []);

  const copyAllCodes = useCallback(() => {
    const text = rows
      .filter(row => row.code)
      .map(row => row.code)
      .join('\n');
    if (!text) return;
    void copyText('all', text);
  }, [copyText, rows]);

  return (
    <div className="space-y-4 max-w-2xl">
      <label className="block">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-800">Secret key (Base32, mỗi dòng một key)</span>
          <span className="text-xs font-semibold text-slate-500 tabular-nums">
            {secretLineCount.toLocaleString('vi-VN')} dòng
          </span>
        </div>
        <textarea
          value={secrets}
          onChange={e => setSecrets(e.target.value)}
          rows={6}
          placeholder={'JBSWY3DPEHPK3PXP\nSECRETKEY2...\nSECRETKEY3...'}
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        />
      </label>

      {rows.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wide">
              Mã hiện tại · làm mới sau {remaining}s
            </p>
            <button
              type="button"
              onClick={copyAllCodes}
              disabled={!rows.some(row => row.code)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-800 bg-cyan-100 hover:bg-cyan-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copiedKey === 'all' ? <Check size={14} /> : <Copy size={14} />}
              Copy tất cả
            </button>
          </div>
          <div className="space-y-2">
            {rows.map(row => (
              <div
                key={`${row.index}-${row.secret}`}
                className="rounded-2xl bg-cyan-50 border border-cyan-100 px-4 py-3 sm:px-5 sm:py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-cyan-700">Dòng {row.index}</p>
                    <p className="text-xs font-mono text-slate-500 truncate mt-0.5" title={row.secret}>
                      {row.secret}
                    </p>
                    {row.code ? (
                      <p className="text-2xl sm:text-3xl font-black tracking-[0.25em] text-cyan-900 mt-2 tabular-nums">
                        {row.code}
                      </p>
                    ) : (
                      <p className="text-sm text-red-600 mt-2">Secret key không hợp lệ (Base32).</p>
                    )}
                  </div>
                  {row.code ? (
                    <button
                      type="button"
                      onClick={() => void copyText(`row-${row.index}`, row.code!)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-cyan-800 bg-white border border-cyan-200 hover:bg-cyan-100 transition-colors shrink-0"
                      aria-label={`Copy mã dòng ${row.index}`}
                    >
                      {copiedKey === `row-${row.index}` ? <Check size={14} /> : <Copy size={14} />}
                      Copy
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="text-xs text-slate-500">
        Tương thích chuẩn TOTP (Google Authenticator, Authy). Không lưu secret trên máy chủ.
      </p>
    </div>
  );
}

function CutFilterMergePanel() {
  const [input, setInput] = useState('');
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [cutEnabled, setCutEnabled] = useState(true);
  const [cutDelimiter, setCutDelimiter] = useState('|');
  const [cutMode, setCutMode] = useState<CutFilterMergeCutMode>('value');
  const [cutTarget, setCutTarget] = useState('');
  const [output, setOutput] = useState('');
  const inputLineCount = useMemo(() => countTextLines(input), [input]);
  const outputLineCount = useMemo(() => countTextLines(output), [output]);

  const handleProcess = () => {
    setOutput(
      processCutFilterMerge(input, {
        removeEmpty,
        removeDuplicates,
        cutEnabled,
        cutDelimiter,
        cutMode,
        cutTarget,
      })
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <label className="block">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-800">Danh sách đầu vào</span>
            <span className="text-xs font-semibold text-slate-500 tabular-nums">
              {inputLineCount.toLocaleString('vi-VN')} dòng
            </span>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={10}
            placeholder={'user1|pass1|mail1\nuser2|pass2|mail2'}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          />
        </label>
        <div className="flex flex-wrap gap-4 text-sm text-slate-700">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={removeEmpty}
              onChange={e => setRemoveEmpty(e.target.checked)}
              className="rounded border-slate-300 text-cyan-600"
            />
            Bỏ dòng trống
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={removeDuplicates}
              onChange={e => setRemoveDuplicates(e.target.checked)}
              className="rounded border-slate-300 text-cyan-600"
            />
            Lọc trùng
          </label>
        </div>
        <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-4 space-y-3">
          <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={cutEnabled}
              onChange={e => setCutEnabled(e.target.checked)}
              className="rounded border-slate-300 text-cyan-600"
            />
            Cắt theo ký tự phân tách
          </label>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tách từng dòng theo ký tự bạn chọn, bỏ phần khớp, rồi ghép lại. VD:{' '}
            <span className="font-mono text-slate-800">123|12|234</span> cắt{' '}
            <span className="font-mono text-slate-800">12</span> với{' '}
            <span className="font-mono text-slate-800">|</span> →{' '}
            <span className="font-mono text-slate-800">123|234</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="cut-filter-delimiter" className="text-xs font-semibold text-slate-700">
                Ký tự phân tách
              </label>
              <input
                id="cut-filter-delimiter"
                type="text"
                value={cutDelimiter}
                onChange={e => setCutDelimiter(e.target.value)}
                disabled={!cutEnabled}
                placeholder="VD: |"
                className="mt-1.5 block h-10 w-full rounded-xl border border-slate-200 box-border px-3 text-sm font-mono leading-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
            <div>
              <label htmlFor="cut-filter-target" className="text-xs font-semibold text-slate-700">
                {cutMode === 'value' ? 'Giá trị cần cắt' : 'Cột cần cắt'}
              </label>
              <input
                id="cut-filter-target"
                type="text"
                value={cutTarget}
                onChange={e => setCutTarget(e.target.value)}
                disabled={!cutEnabled}
                placeholder={cutMode === 'value' ? 'VD: 12' : 'VD: 2 hoặc 2,3,5'}
                className="mt-1.5 block h-10 w-full rounded-xl border border-slate-200 box-border px-3 text-sm font-mono leading-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:bg-slate-100 disabled:text-slate-400"
              />
              {cutMode === 'column' && cutEnabled ? (
                <p className="text-[11px] text-slate-500 mt-1 pointer-events-none select-none">
                  Nhập một hoặc nhiều cột, cách nhau bởi dấu phẩy. VD: <span className="font-mono">2,4</span>
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-700">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="cut-mode"
                checked={cutMode === 'value'}
                onChange={() => setCutMode('value')}
                disabled={!cutEnabled}
                className="text-cyan-600"
              />
              Cắt theo giá trị
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="cut-mode"
                checked={cutMode === 'column'}
                onChange={() => setCutMode('column')}
                disabled={!cutEnabled}
                className="text-cyan-600"
              />
              Cắt theo cột
            </label>
          </div>
        </div>
        <button
          type="button"
          onClick={handleProcess}
          className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-700 transition-colors"
        >
          Xử lý
        </button>
      </div>
      <label className="block">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-800">Kết quả</span>
          <span className="text-xs font-semibold text-slate-500 tabular-nums">
            {outputLineCount.toLocaleString('vi-VN')} dòng
          </span>
        </div>
        <textarea
          readOnly
          value={output}
          rows={14}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono text-slate-800 focus:outline-none"
        />
      </label>
    </div>
  );
}

function GetUidFbPanel() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<{ line: string; uid: string | null }[]>([]);

  const handleExtract = () => {
    const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    setResults(lines.map(line => ({ line, uid: extractFacebookUid(line) })));
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Link hoặc chuỗi Facebook (mỗi dòng một mục)</span>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={6}
          placeholder={'https://www.facebook.com/profile.php?id=100012345678901\n100012345678901'}
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        />
      </label>
      <button
        type="button"
        onClick={handleExtract}
        className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-700 transition-colors"
      >
        Trích UID
      </button>
      {results.length > 0 && (
        <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
          {results.map((row, i) => (
            <div key={`${row.line}-${i}`} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-slate-600 break-all flex-1">{row.line}</span>
              <span className="font-mono text-sm font-bold text-cyan-800 shrink-0">
                {row.uid ?? 'Không nhận diện được'}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-500">
        Hỗ trợ UID thuần và link dạng profile.php?id=… Link username dạng facebook.com/username cần tra cứu thêm.
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: 'live' | 'die' | 'invalid' }) {
  if (status === 'live') {
    return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Live</span>;
  }
  if (status === 'die') {
    return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">Die</span>;
  }
  return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Không hợp lệ</span>;
}
