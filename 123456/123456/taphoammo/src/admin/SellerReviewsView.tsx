import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Filter,
  Search,
  ChevronDown,
  Calendar,
  Facebook,
  Music,
  Globe,
  Folder,
  Package,
  Users,
  Star,
  X,
  MessageSquare,
} from 'lucide-react';
import type { Category } from '../gianHang/types';
import type { Order } from '../ordersTypes';
import { buildSellerReviewRowsFromOrders, type SellerReviewRow } from '../gianHang/orderBuyerReviews';

export interface SellerReviewsViewProps {
  orders: Order[];
  categories: Category[];
  focusOrderId?: string | null;
  onGianHangClick?: (adminGianHangId: string) => void;
  onOrderClick?: (orderId: string) => void;
  onSaveSellerReply?: (orderId: string, reply: string) => void;
  /** Mở trang nhắn tin với khách của đơn. */
  onMessageBuyer?: (orderId: string) => void;
}

function ReviewReplyModal({
  review,
  onClose,
  onSave,
}: {
  review: SellerReviewRow;
  onClose: () => void;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(review.reply || '');

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Trả lời đánh giá</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Đơn {review.orderId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-white hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
            <p className="text-[10px] font-bold text-amber-800 uppercase mb-1">Khách đánh giá</p>
            <div className="flex items-center gap-2 mb-2">
              <Star size={12} className="text-amber-500 fill-amber-400" />
              <span className="text-sm font-bold text-slate-800">{review.rating}/5</span>
              <span className="text-xs text-slate-500">· {review.buyer}</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{review.comment}</p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Nội dung trả lời
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Cảm ơn bạn đã mua hàng..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => {
              const trimmed = text.trim();
              if (!trimmed) return;
              onSave(trimmed);
            }}
            disabled={!text.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            Gửi trả lời
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function SellerReviewsView({
  orders,
  categories,
  focusOrderId,
  onGianHangClick,
  onOrderClick,
  onSaveSellerReply,
  onMessageBuyer,
}: SellerReviewsViewProps) {
  const [search, setSearch] = useState('');
  const [starFilter, setStarFilter] = useState('Tất cả');
  const [replyTarget, setReplyTarget] = useState<SellerReviewRow | null>(null);

  const reviews = useMemo(
    () => buildSellerReviewRowsFromOrders(orders, categories),
    [orders, categories]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      if (starFilter !== 'Tất cả') {
        const want = parseInt(starFilter, 10);
        if (!Number.isNaN(want) && r.rating !== want) return false;
      }
      if (!q) return true;
      const hay = [r.orderId, r.buyer, r.storeName, r.productName, r.comment, r.reply]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [reviews, search, starFilter]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={starFilter}
            onChange={(e) => setStarFilter(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none cursor-pointer"
          >
            <option value="Tất cả">Tất cả</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
          <ChevronDown
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            size={16}
          />
        </div>
        <div className="relative flex-1 max-w-md group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
            size={18}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm mã đơn, tên người mua, gian hàng, sản phẩm..."
            className="w-full pl-11 pr-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none shadow-sm"
          />
        </div>
        <p className="text-sm font-semibold text-slate-500 w-full sm:w-auto">
          {filtered.length} đánh giá từ khách (đồng bộ từ đơn đã mua)
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 w-32">
                  Thao tác
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200">
                  MÃ ĐƠN / NGÀY MUA
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 min-w-[450px]">
                  GIAN HÀNG / SẢN PHẨM
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 min-w-[250px]">
                  COMMENT
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 min-w-[250px]">
                  TRẢ LỜI
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 w-16 text-center">
                  SAO
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display">
                  NGƯỜI MUA
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-500">
                    Chưa có đánh giá nào từ khách. Đánh giá xuất hiện sau khi khách chấm sao trên đơn Hoàn thành / Tạm
                    giữ tiền.
                  </td>
                </tr>
              ) : (
                filtered.map((review) => {
                  const isFocused = focusOrderId === review.orderId;
                  const platformKey = review.platform.toLowerCase();
                  return (
                    <tr
                      key={review.orderId}
                      className={`hover:bg-slate-50/50 transition-colors group ${
                        isFocused ? 'bg-amber-50/80 ring-1 ring-inset ring-amber-200' : ''
                      }`}
                    >
                      <td className="py-4 px-4 border-r border-slate-100">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => onMessageBuyer?.(review.orderId)}
                            disabled={!onMessageBuyer}
                            className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all w-fit disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Nhắn tin với khách"
                          >
                            <MessageSquare size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setReplyTarget(review)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap text-left"
                          >
                            {review.reply ? 'Sửa trả lời' : 'Trả lời'}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4 border-r border-slate-100">
                        <div className="flex flex-col gap-1">
                          <span
                            role={onOrderClick ? 'button' : undefined}
                            tabIndex={onOrderClick ? 0 : undefined}
                            onClick={() => onOrderClick?.(review.orderId)}
                            onKeyDown={(e) => e.key === 'Enter' && onOrderClick?.(review.orderId)}
                            className={`text-sm font-bold text-blue-600 font-mono tracking-tight ${
                              onOrderClick ? 'hover:underline cursor-pointer' : ''
                            }`}
                          >
                            {review.orderId}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                            <Calendar size={13} className="text-slate-500" />
                            {review.date}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 border-r border-slate-100">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                              {platformKey.includes('facebook') ? (
                                <Facebook size={14} />
                              ) : platformKey.includes('tiktok') ? (
                                <Music size={14} />
                              ) : platformKey.includes('google') ? (
                                <Globe size={14} />
                              ) : (
                                <Folder size={14} />
                              )}
                            </div>
                            {review.adminGianHangId && onGianHangClick ? (
                              <button
                                type="button"
                                onClick={() => onGianHangClick(review.adminGianHangId!)}
                                className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer transition-colors uppercase tracking-wider truncate block text-left"
                              >
                                {review.storeName}
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider truncate block">
                                {review.storeName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0 border border-blue-100/50">
                              <Package size={14} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[13px] font-bold text-slate-800 leading-tight block line-clamp-2">
                                {review.productName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 border-r border-slate-100">
                        <p className="text-xs text-slate-600 line-clamp-3 max-w-xs leading-relaxed">{review.comment}</p>
                      </td>
                      <td className="py-4 px-4 border-r border-slate-100">
                        <p
                          className={`text-xs line-clamp-3 max-w-xs leading-relaxed ${
                            review.reply ? 'text-slate-700' : 'text-slate-400 italic'
                          }`}
                        >
                          {review.reply || 'Chưa trả lời'}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-xs font-bold text-slate-900 border-r border-slate-100 text-center">
                        <span className="inline-flex items-center gap-0.5">
                          <Star size={12} className="text-amber-500 fill-amber-400" />
                          {review.rating}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-bold text-slate-900 inline-flex items-center gap-1">
                          <Users size={12} className="text-slate-400" />
                          {review.buyer}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {replyTarget && onSaveSellerReply && (
          <ReviewReplyModal
            review={replyTarget}
            onClose={() => setReplyTarget(null)}
            onSave={(text) => {
              onSaveSellerReply(replyTarget.orderId, text);
              setReplyTarget(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
