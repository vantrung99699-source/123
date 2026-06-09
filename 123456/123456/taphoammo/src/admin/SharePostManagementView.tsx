import { useMemo, useState } from 'react';
import { Check, Eye, Heart, Plus, Search, Tag, Trash2, X } from 'lucide-react';
import {
  approveSharePost,
  createShareCategory,
  deleteShareCategory,
  findShareCategory,
  listAllSharePosts,
  listShareCategories,
  rejectSharePost,
  revokeSharePostApproval,
  type SharePost,
} from '../storefront/storefrontShare';
import { SharePostContent } from '../components/SharePostContent';

type PostTabId = 'pending' | 'approved' | 'rejected';
type PanelTabId = 'posts' | 'categories';

function formatTime(ms: number): string {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SharePostManagementView({ onDataChange }: { onDataChange?: () => void }) {
  const [panelTab, setPanelTab] = useState<PanelTabId>('posts');
  const [postTab, setPostTab] = useState<PostTabId>('pending');
  const [search, setSearch] = useState('');
  const [revision, setRevision] = useState(0);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [actionHint, setActionHint] = useState<string | null>(null);

  const refresh = () => {
    setRevision(v => v + 1);
    onDataChange?.();
  };

  const categories = useMemo(() => listShareCategories(), [revision]);
  const posts = useMemo(() => listAllSharePosts(), [revision]);

  const visiblePosts = useMemo(() => {
    const source = posts.filter(p => p.status === postTab);
    const q = search.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.authorDisplayName.toLowerCase().includes(q) ||
        p.authorEmail.toLowerCase().includes(q)
    );
  }, [posts, postTab, search]);

  const pendingCount = posts.filter(p => p.status === 'pending').length;

  const handleApprove = (post: SharePost) => {
    if (post.status !== 'pending') return;
    approveSharePost(post.id);
    refresh();
    setActionHint(`Đã duyệt bài "${post.title}".`);
  };

  const handleReject = (post: SharePost) => {
    if (post.status !== 'pending') return;
    rejectSharePost(post.id);
    refresh();
    setActionHint(`Đã từ chối bài "${post.title}".`);
  };

  const handleRevoke = (post: SharePost) => {
    if (post.status !== 'approved') return;
    revokeSharePostApproval(post.id);
    refresh();
    setActionHint(`Đã hủy duyệt bài "${post.title}" — chuyển về chờ duyệt.`);
  };

  const handleAddCategory = () => {
    setCategoryError('');
    const result = createShareCategory(newCategoryName);
    if (!result.ok) {
      setCategoryError(result.error);
      return;
    }
    setNewCategoryName('');
    refresh();
    setActionHint(`Đã thêm chuyên mục "${result.category.name}".`);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (!window.confirm(`Xóa chuyên mục "${name}"?`)) return;
    const ok = deleteShareCategory(id);
    if (!ok) {
      setCategoryError('Không thể xóa — chuyên mục mặc định hoặc đang có bài viết.');
      return;
    }
    setCategoryError('');
    refresh();
    setActionHint(`Đã xóa chuyên mục "${name}".`);
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chia sẻ bài viết</h1>
          <p className="text-sm text-slate-600 mt-1">
            Duyệt bài đăng của khách hàng / người bán và quản lý chuyên mục.
          </p>
        </div>
        {pendingCount > 0 ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            {pendingCount} bài chờ duyệt
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPanelTab('posts')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
            panelTab === 'posts'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200'
          }`}
        >
          Duyệt bài viết
        </button>
        <button
          type="button"
          onClick={() => setPanelTab('categories')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
            panelTab === 'categories'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200'
          }`}
        >
          Chuyên mục
        </button>
      </div>

      {actionHint ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {actionHint}
        </div>
      ) : null}

      {panelTab === 'posts' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {(['pending', 'approved', 'rejected'] as PostTabId[]).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPostTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                    postTab === tab
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {tab === 'pending' ? 'Chờ duyệt' : tab === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                </button>
              ))}
            </div>
            <div className="relative max-w-xs w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm tiêu đề, tác giả..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            {visiblePosts.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                Không có bài viết trong tab này.
              </div>
            ) : (
              visiblePosts.map(post => {
                const category = findShareCategory(post.categoryId);
                return (
                  <div
                    key={post.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                          <span className="font-semibold text-slate-700">{post.authorDisplayName}</span>
                          <span>·</span>
                          <span>{post.authorEmail}</span>
                          {category ? (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                              {category.name}
                            </span>
                          ) : null}
                          <span>·</span>
                          <span>{formatTime(post.createdAtMs)}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{post.title}</h3>
                        <SharePostContent content={post.content} className="mt-2" />
                        {post.status === 'approved' ? (
                          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-semibold">
                            <p className="inline-flex items-center gap-1.5 text-slate-600">
                              <Eye size={13} />
                              {post.viewedBy.length.toLocaleString('vi-VN')} người xem
                            </p>
                            <p className="inline-flex items-center gap-1.5 text-rose-600">
                              <Heart size={13} className="fill-current" />
                              {post.likedBy.length.toLocaleString('vi-VN')} tym
                            </p>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {post.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(post)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Check size={14} />
                              Duyệt
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(post)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700"
                            >
                              <X size={14} />
                              Từ chối
                            </button>
                          </>
                        ) : null}
                        {post.status === 'approved' ? (
                          <button
                            type="button"
                            onClick={() => handleRevoke(post)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200"
                          >
                            Hủy duyệt
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Thêm chuyên mục mới</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Tên chuyên mục"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus size={16} />
                Thêm
              </button>
            </div>
            {categoryError ? <p className="text-sm text-red-600 mt-2">{categoryError}</p> : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              Danh sách chuyên mục
            </div>
            <div className="divide-y divide-slate-100">
              {categories.map(cat => (
                <div key={cat.id} className="px-5 py-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <Tag size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{cat.name}</p>
                      <p className="text-xs text-slate-500">
                        {cat.isDefault ? 'Mặc định' : 'Tùy chỉnh'} · ID: {cat.id}
                      </p>
                    </div>
                  </div>
                  {!cat.isDefault ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100"
                    >
                      <Trash2 size={14} />
                      Xóa
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Không xóa</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
