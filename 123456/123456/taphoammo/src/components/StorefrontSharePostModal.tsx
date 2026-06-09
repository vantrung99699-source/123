import { useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { createSharePost, listShareCategories } from '../storefront/storefrontShare';
import { SharePostRichEditor } from './SharePostRichEditor';
import { sanitizeSharePostHtml } from './SharePostContent';

export interface StorefrontSharePostModalProps {
  open: boolean;
  authorEmail: string;
  authorLogin: string;
  authorDisplayName: string;
  authorRole: 'buyer' | 'seller' | 'reseller';
  onClose: () => void;
  onSubmitted: () => void;
}

export function StorefrontSharePostModal({
  open,
  authorEmail,
  authorLogin,
  authorDisplayName,
  authorRole,
  onClose,
  onSubmitted,
}: StorefrontSharePostModalProps) {
  const categories = useMemo(() => listShareCategories(), [open]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const effectiveCategoryId = categoryId || categories[0]?.id || '';

  if (!open) return null;

  const handleSubmit = () => {
    setError('');
    setSubmitting(true);
    const sanitizedContent = sanitizeSharePostHtml(content);
    if (!sanitizedContent.replace(/<[^>]+>/g, '').trim() && !sanitizedContent.includes('<img')) {
      setSubmitting(false);
      setError('Nội dung không được để trống.');
      return;
    }
    const result = createSharePost({
      title,
      content: sanitizedContent,
      categoryId: effectiveCategoryId,
      authorEmail,
      authorLogin,
      authorDisplayName,
      authorRole,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setTitle('');
    setContent('');
    setCategoryId('');
    onSubmitted();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-post-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 id="share-post-modal-title" className="text-lg font-bold text-slate-900">
            Đăng bài chia sẻ
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Chuyên mục</span>
            <select
              value={effectiveCategoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Tiêu đề</span>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài viết"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </label>
          <div>
            <span className="text-sm font-semibold text-slate-800">Nội dung</span>
            <div className="mt-2">
              <SharePostRichEditor value={content} onChange={setContent} />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Bài viết sẽ được gửi chờ admin duyệt trước khi hiển thị công khai.
          </p>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            Gửi duyệt
          </button>
        </div>
      </div>
    </div>
  );
}
