import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Eye, Heart, LayoutGrid, PenLine, Share2, User } from 'lucide-react';
import {
  findShareCategory,
  getSharePostLikeCount,
  getSharePostViewCount,
  hasUserLikedSharePost,
  listApprovedSharePosts,
  listShareCategories,
  listSharePostsByAuthor,
  recordSharePostView,
  resolveShareViewerKey,
  toggleSharePostLike,
  type SharePost,
} from '../storefront/storefrontShare';
import { StorefrontSharePostModal } from './StorefrontSharePostModal';
import { SharePostContent } from './SharePostContent';

export interface StorefrontSharePageProps {
  isLoggedIn?: boolean;
  userEmail?: string;
  userLogin?: string;
  userDisplayName?: string;
  userRole?: 'buyer' | 'seller' | 'reseller';
  onRequireLogin?: () => void;
  fixedHeaderOffset?: boolean;
}

function formatPostTime(ms: number): string {
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

function roleLabel(role: SharePost['authorRole']): string {
  if (role === 'seller') return 'Người bán';
  if (role === 'reseller') return 'Đại lý';
  return 'Khách hàng';
}

export function StorefrontSharePage({
  isLoggedIn = false,
  userEmail = '',
  userLogin = '',
  userDisplayName = '',
  userRole = 'buyer',
  onRequireLogin,
  fixedHeaderOffset = false,
}: StorefrontSharePageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [revision, setRevision] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const categories = useMemo(() => listShareCategories(), [revision]);
  const posts = useMemo(
    () => listApprovedSharePosts(selectedCategory),
    [selectedCategory, revision]
  );
  const selectedCategoryLabel = useMemo(() => {
    if (selectedCategory === 'all') return 'Tất cả';
    return findShareCategory(selectedCategory)?.name ?? 'Chuyên mục';
  }, [selectedCategory, categories]);
  const myPendingCount = useMemo(() => {
    if (!isLoggedIn || !userEmail) return 0;
    return listSharePostsByAuthor(userEmail).filter(p => p.status === 'pending').length;
  }, [isLoggedIn, userEmail, revision]);

  const refresh = useCallback(() => setRevision(v => v + 1), []);

  useEffect(() => {
    if (posts.length === 0) return;
    const viewerKey = resolveShareViewerKey(userEmail);
    let changed = false;
    for (const post of posts) {
      if (recordSharePostView(post.id, viewerKey)) changed = true;
    }
    if (changed) refresh();
  }, [posts, userEmail, refresh]);

  const handleLike = (postId: string) => {
    if (!isLoggedIn) {
      onRequireLogin?.();
      return;
    }
    const result = toggleSharePostLike(postId, userEmail);
    if (!result.ok) {
      setToast(result.error);
      window.setTimeout(() => setToast(null), 2500);
      return;
    }
    refresh();
  };

  const handleCompose = () => {
    if (!isLoggedIn) {
      onRequireLogin?.();
      return;
    }
    setModalOpen(true);
  };

  return (
    <div className={`min-h-screen bg-slate-100 ${fixedHeaderOffset ? 'pt-[6.75rem]' : ''}`}>
      <div className="border-b border-emerald-600/20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-3.5 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                <Share2 size={18} strokeWidth={2.25} />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold tracking-tight">Chia sẻ</h1>
                <p className="text-xs text-emerald-50/90 mt-0.5 truncate">
                  Cộng đồng chia sẻ kinh nghiệm MMO theo từng chuyên mục
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCompose}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-white text-emerald-700 hover:bg-emerald-50 shrink-0"
            >
              <PenLine size={16} />
              Đăng bài
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-5 sm:py-6">
        {isLoggedIn && myPendingCount > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-4">
            Bạn có <span className="font-bold">{myPendingCount}</span> bài đang chờ admin duyệt.
          </div>
        ) : null}

        <div className="flex flex-col lg:flex-row gap-5 items-start">
          <aside className="w-full lg:w-60 xl:w-64 shrink-0">
            <nav className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden lg:sticky lg:top-24">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center gap-2">
                <LayoutGrid size={16} className="text-emerald-600" />
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Chuyên mục</p>
              </div>
              <div className="p-2 max-h-[min(70vh,520px)] overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  Tất cả
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </nav>
          </aside>

          <main className="flex-1 min-w-0 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-800">{selectedCategoryLabel}</p>
              <p className="text-xs text-slate-500 tabular-nums">
                {posts.length.toLocaleString('vi-VN')} bài viết
              </p>
            </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-slate-600 text-sm">Chưa có bài viết nào trong chuyên mục này.</p>
            <button
              type="button"
              onClick={handleCompose}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
            >
              <PenLine size={15} />
              Trở thành người chia sẻ đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => {
              const category = findShareCategory(post.categoryId);
              const liked = hasUserLikedSharePost(post, userEmail);
              const likeCount = getSharePostLikeCount(post);
              const viewCount = getSharePostViewCount(post);
              return (
                <article
                  key={post.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <User size={15} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {post.authorDisplayName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {roleLabel(post.authorRole)} · @{post.authorLogin || post.authorEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {category ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                          {category.name}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {formatPostTime(post.createdAtMs)}
                      </span>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <h2 className="text-lg font-bold text-slate-900">{post.title}</h2>
                    <SharePostContent content={post.content} className="mt-2" />
                  </div>
                  <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200">
                      <Eye size={16} className="text-slate-500" />
                      {viewCount.toLocaleString('vi-VN')} người xem
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLike(post.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                        liked
                          ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                          : 'text-slate-600 bg-white border border-slate-200 hover:border-rose-200 hover:text-rose-600'
                      }`}
                    >
                      <Heart size={16} className={liked ? 'fill-current' : ''} />
                      {likeCount.toLocaleString('vi-VN')} tym
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
          </main>
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-[170] px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium shadow-lg shadow-emerald-100/80">
          {toast}
        </div>
      ) : null}

      <StorefrontSharePostModal
        open={modalOpen}
        authorEmail={userEmail}
        authorLogin={userLogin}
        authorDisplayName={userDisplayName}
        authorRole={userRole}
        onClose={() => setModalOpen(false)}
        onSubmitted={() => {
          refresh();
          setToast('Đã gửi bài — chờ admin duyệt.');
          window.setTimeout(() => setToast(null), 3000);
        }}
      />
    </div>
  );
}
