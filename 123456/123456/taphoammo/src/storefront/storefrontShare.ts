/**
 * Chia sẻ bài viết storefront — demo localStorage.
 */

export type SharePostStatus = 'pending' | 'approved' | 'rejected';

export interface ShareCategory {
  id: string;
  name: string;
  isDefault: boolean;
  sortOrder: number;
  createdAtMs: number;
}

export interface SharePost {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  authorEmail: string;
  authorLogin: string;
  authorDisplayName: string;
  authorRole: 'buyer' | 'seller' | 'reseller';
  status: SharePostStatus;
  likedBy: string[];
  viewedBy: string[];
  createdAtMs: number;
  updatedAtMs: number;
  reviewedAtMs?: number;
}

const CATEGORIES_KEY = 'taphoammo_share_categories_v1';
const POSTS_KEY = 'taphoammo_share_posts_v1';

const REMOVED_DEFAULT_CATEGORY_IDS = new Set(['share-cat-ready-content']);

const DEFAULT_CATEGORIES: ShareCategory[] = [
  { id: 'share-cat-facebook', name: 'Facebook', isDefault: true, sortOrder: 1, createdAtMs: 0 },
  { id: 'share-cat-tiktok', name: 'TikTok', isDefault: true, sortOrder: 2, createdAtMs: 0 },
  { id: 'share-cat-zalo', name: 'Zalo', isDefault: true, sortOrder: 3, createdAtMs: 0 },
  { id: 'share-cat-youtube', name: 'YouTube', isDefault: true, sortOrder: 4, createdAtMs: 0 },
  { id: 'share-cat-shopee', name: 'Shopee', isDefault: true, sortOrder: 5, createdAtMs: 0 },
  { id: 'share-cat-telegram', name: 'Telegram', isDefault: true, sortOrder: 6, createdAtMs: 0 },
  { id: 'share-cat-blockchain', name: 'Blockchain', isDefault: true, sortOrder: 7, createdAtMs: 0 },
  { id: 'share-cat-marketing', name: 'Marketing', isDefault: true, sortOrder: 8, createdAtMs: 0 },
  { id: 'share-cat-mmo-tips', name: 'Mẹo MMO', isDefault: true, sortOrder: 9, createdAtMs: 0 },
  { id: 'share-cat-other', name: 'Nội dung khác', isDefault: true, sortOrder: 10, createdAtMs: 0 },
];

function sortCategories(list: ShareCategory[]): ShareCategory[] {
  return [...list].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'vi')
  );
}

function applyCategoryCatalog(list: ShareCategory[]): ShareCategory[] {
  migrateRemovedCategoryPosts();

  const filtered = list.filter(category => !REMOVED_DEFAULT_CATEGORY_IDS.has(category.id));
  const byId = new Map(filtered.map(category => [category.id, category]));
  let changed = filtered.length !== list.length;

  for (const category of DEFAULT_CATEGORIES) {
    const existing = byId.get(category.id);
    if (!existing) {
      byId.set(category.id, category);
      changed = true;
      continue;
    }
    if (
      existing.isDefault &&
      (existing.sortOrder !== category.sortOrder || existing.name !== category.name)
    ) {
      byId.set(category.id, { ...existing, sortOrder: category.sortOrder, name: category.name });
      changed = true;
    }
  }

  const merged = sortCategories([...byId.values()]);
  if (changed) writeCategories(merged);
  return merged;
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCategory(raw: unknown): ShareCategory | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<ShareCategory>;
  if (typeof r.id !== 'string' || !r.id.trim()) return null;
  if (typeof r.name !== 'string' || !r.name.trim()) return null;
  return {
    id: r.id.trim(),
    name: r.name.trim(),
    isDefault: r.isDefault === true,
    sortOrder: typeof r.sortOrder === 'number' ? r.sortOrder : 99,
    createdAtMs:
      typeof r.createdAtMs === 'number' && Number.isFinite(r.createdAtMs) ? r.createdAtMs : Date.now(),
  };
}

function normalizePost(raw: unknown): SharePost | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<SharePost>;
  if (typeof r.id !== 'string' || !r.id.trim()) return null;
  if (typeof r.title !== 'string' || !r.title.trim()) return null;
  if (typeof r.content !== 'string' || !r.content.trim()) return null;
  if (typeof r.categoryId !== 'string' || !r.categoryId.trim()) return null;
  if (typeof r.authorEmail !== 'string') return null;
  const status =
    r.status === 'pending' || r.status === 'approved' || r.status === 'rejected'
      ? r.status
      : 'pending';
  return {
    id: r.id.trim(),
    title: r.title.trim(),
    content: r.content.trim(),
    categoryId: r.categoryId.trim(),
    authorEmail: r.authorEmail.trim().toLowerCase(),
    authorLogin: typeof r.authorLogin === 'string' ? r.authorLogin.trim() : '',
    authorDisplayName:
      typeof r.authorDisplayName === 'string' ? r.authorDisplayName.trim() : 'Thành viên',
    authorRole:
      r.authorRole === 'seller' || r.authorRole === 'reseller' ? r.authorRole : 'buyer',
    status,
    likedBy: Array.isArray(r.likedBy)
      ? r.likedBy.filter((x): x is string => typeof x === 'string').map(x => x.trim().toLowerCase())
      : [],
    viewedBy: Array.isArray(r.viewedBy)
      ? r.viewedBy
          .filter((x): x is string => typeof x === 'string')
          .map(x => x.trim().toLowerCase())
      : [],
    createdAtMs:
      typeof r.createdAtMs === 'number' && Number.isFinite(r.createdAtMs) ? r.createdAtMs : Date.now(),
    updatedAtMs:
      typeof r.updatedAtMs === 'number' && Number.isFinite(r.updatedAtMs) ? r.updatedAtMs : Date.now(),
    reviewedAtMs:
      typeof r.reviewedAtMs === 'number' && Number.isFinite(r.reviewedAtMs) ? r.reviewedAtMs : undefined,
  };
}

function readCategories(): ShareCategory[] {
  if (typeof window === 'undefined') return [...DEFAULT_CATEGORIES];
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) {
      writeCategories(DEFAULT_CATEGORIES);
      return [...DEFAULT_CATEGORIES];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      writeCategories(DEFAULT_CATEGORIES);
      return [...DEFAULT_CATEGORIES];
    }
    const list = parsed
      .map(normalizeCategory)
      .filter((x): x is ShareCategory => x != null);
    if (list.length === 0) {
      writeCategories(DEFAULT_CATEGORIES);
      return [...DEFAULT_CATEGORIES];
    }
    return applyCategoryCatalog(list);
  } catch {
    return [...DEFAULT_CATEGORIES];
  }
}

function writeCategories(list: ShareCategory[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function readPosts(): SharePost[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizePost)
      .filter((x): x is SharePost => x != null)
      .sort((a, b) => b.createdAtMs - a.createdAtMs);
  } catch {
    return [];
  }
}

function writePosts(list: SharePost[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(POSTS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function migrateRemovedCategoryPosts(): void {
  const posts = readPosts();
  let changed = false;
  const next = posts.map(post => {
    if (!REMOVED_DEFAULT_CATEGORY_IDS.has(post.categoryId)) return post;
    changed = true;
    return { ...post, categoryId: 'share-cat-other', updatedAtMs: Date.now() };
  });
  if (changed) writePosts(next);
}

export function listShareCategories(): ShareCategory[] {
  return readCategories();
}

export function findShareCategory(id: string): ShareCategory | undefined {
  return readCategories().find(c => c.id === id);
}

export function createShareCategory(
  name: string
): { ok: true; category: ShareCategory } | { ok: false; error: string } {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: 'Tên chuyên mục không được để trống.' };
  const list = readCategories();
  if (list.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
    return { ok: false, error: 'Chuyên mục đã tồn tại.' };
  }
  const next: ShareCategory = {
    id: newId('share-cat'),
    name: trimmed,
    isDefault: false,
    sortOrder: list.length + 1,
    createdAtMs: Date.now(),
  };
  writeCategories([...list, next]);
  return { ok: true, category: next };
}

export function deleteShareCategory(id: string): boolean {
  const list = readCategories();
  const target = list.find(c => c.id === id);
  if (!target || target.isDefault) return false;
  const posts = readPosts();
  if (posts.some(p => p.categoryId === id)) return false;
  writeCategories(list.filter(c => c.id !== id));
  return true;
}

export function listAllSharePosts(): SharePost[] {
  return readPosts();
}

export function listApprovedSharePosts(categoryId?: string | null): SharePost[] {
  return readPosts().filter(p => {
    if (p.status !== 'approved') return false;
    if (!categoryId || categoryId === 'all') return true;
    return p.categoryId === categoryId;
  });
}

export function listPendingSharePosts(): SharePost[] {
  return readPosts().filter(p => p.status === 'pending');
}

export function countPendingSharePosts(): number {
  return listPendingSharePosts().length;
}

export function listSharePostsByAuthor(email: string): SharePost[] {
  const key = email.trim().toLowerCase();
  return readPosts().filter(p => p.authorEmail === key);
}

export function createSharePost(input: {
  title: string;
  content: string;
  categoryId: string;
  authorEmail: string;
  authorLogin: string;
  authorDisplayName: string;
  authorRole: 'buyer' | 'seller' | 'reseller';
}): { ok: true; post: SharePost } | { ok: false; error: string } {
  const title = input.title.trim();
  const content = input.content.trim();
  if (!title) return { ok: false, error: 'Tiêu đề không được để trống.' };
  if (!content) return { ok: false, error: 'Nội dung không được để trống.' };
  if (!findShareCategory(input.categoryId)) {
    return { ok: false, error: 'Chuyên mục không hợp lệ.' };
  }
  const email = input.authorEmail.trim().toLowerCase();
  if (!email) return { ok: false, error: 'Vui lòng đăng nhập để đăng bài.' };

  const now = Date.now();
  const post: SharePost = {
    id: newId('share-post'),
    title,
    content,
    categoryId: input.categoryId,
    authorEmail: email,
    authorLogin: input.authorLogin.trim(),
    authorDisplayName: input.authorDisplayName.trim() || 'Thành viên',
    authorRole: input.authorRole,
    status: 'pending',
    likedBy: [],
    viewedBy: [],
    createdAtMs: now,
    updatedAtMs: now,
  };
  writePosts([post, ...readPosts()]);
  return { ok: true, post };
}

function updatePost(id: string, patch: Partial<SharePost>): SharePost | null {
  const list = readPosts();
  const index = list.findIndex(p => p.id === id);
  if (index < 0) return null;
  const next = { ...list[index], ...patch, updatedAtMs: Date.now() };
  list[index] = next;
  writePosts(list);
  return next;
}

export function approveSharePost(id: string): SharePost | null {
  return updatePost(id, { status: 'approved', reviewedAtMs: Date.now() });
}

export function rejectSharePost(id: string): SharePost | null {
  return updatePost(id, { status: 'rejected', reviewedAtMs: Date.now() });
}

export function revokeSharePostApproval(id: string): SharePost | null {
  return updatePost(id, { status: 'pending', reviewedAtMs: undefined });
}

export function toggleSharePostLike(
  postId: string,
  userEmail: string
): { ok: true; post: SharePost; liked: boolean } | { ok: false; error: string } {
  const email = userEmail.trim().toLowerCase();
  if (!email) return { ok: false, error: 'Vui lòng đăng nhập để thả tym.' };
  const list = readPosts();
  const index = list.findIndex(p => p.id === postId);
  if (index < 0) return { ok: false, error: 'Bài viết không tồn tại.' };
  const post = list[index];
  if (post.status !== 'approved') return { ok: false, error: 'Chỉ có thể tym bài đã duyệt.' };

  const liked = post.likedBy.includes(email);
  const likedBy = liked
    ? post.likedBy.filter(x => x !== email)
    : [...post.likedBy, email];
  const next = { ...post, likedBy, updatedAtMs: Date.now() };
  list[index] = next;
  writePosts(list);
  return { ok: true, post: next, liked: !liked };
}

export function hasUserLikedSharePost(post: SharePost, userEmail: string): boolean {
  const email = userEmail.trim().toLowerCase();
  if (!email) return false;
  return post.likedBy.includes(email);
}

export function getSharePostLikeCount(post: SharePost): number {
  return post.likedBy.length;
}

const GUEST_VIEWER_KEY = 'taphoammo_share_guest_viewer_v1';

export function resolveShareViewerKey(userEmail = ''): string {
  const email = userEmail.trim().toLowerCase();
  if (email) return email;
  if (typeof window === 'undefined') return 'guest-anonymous';
  try {
    let guestId = sessionStorage.getItem(GUEST_VIEWER_KEY);
    if (!guestId) {
      guestId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(GUEST_VIEWER_KEY, guestId);
    }
    return guestId.toLowerCase();
  } catch {
    return 'guest-anonymous';
  }
}

export function recordSharePostView(postId: string, viewerKey: string): boolean {
  const key = viewerKey.trim().toLowerCase();
  if (!key) return false;
  const list = readPosts();
  const index = list.findIndex(p => p.id === postId);
  if (index < 0) return false;
  const post = list[index];
  if (post.status !== 'approved') return false;
  if (post.viewedBy.includes(key)) return false;
  const next = {
    ...post,
    viewedBy: [...post.viewedBy, key],
    updatedAtMs: Date.now(),
  };
  list[index] = next;
  writePosts(list);
  return true;
}

export function getSharePostViewCount(post: SharePost): number {
  return post.viewedBy.length;
}
