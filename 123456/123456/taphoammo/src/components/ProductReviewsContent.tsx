import { useState } from 'react';
import type { OrderBuyerReview } from '../ordersTypes';
import { SAMPLE_CATALOG_REVIEWS, DEFAULT_CATALOG_RATING, DEFAULT_CATALOG_REVIEW_COUNT } from '../productReviewsData';
import { StarRating, InteractiveStarRating } from './StarRating';

function formatReviewDateMs(ms: number): string {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function maskBuyerName(name: string): string {
  const t = name.trim();
  if (t.length <= 2) return `${t}***`;
  return `${t.slice(0, 2)}***${t.slice(-1)}`;
}

export interface ProductReviewsContentProps {
  productName: string;
  catalogRating?: number;
  catalogReviewCount?: number;
  buyerReview?: OrderBuyerReview;
  buyerName?: string;
  onSubmitReview?: (rating: number, comment: string) => void;
  /** Tab sản phẩm: hiện đánh giá mẫu khách khác. Modal đơn đã mua: false. */
  showCatalogReviews?: boolean;
}

/** Nội dung tab Reviews (ProductDetailView) — dùng lại trong modal đánh giá đơn. */
export function ProductReviewsContent({
  productName,
  catalogRating = DEFAULT_CATALOG_RATING,
  catalogReviewCount = DEFAULT_CATALOG_REVIEW_COUNT,
  buyerReview,
  buyerName = 'Bạn',
  onSubmitReview,
  showCatalogReviews = true,
}: ProductReviewsContentProps) {
  const [draftRating, setDraftRating] = useState(buyerReview?.rating ?? 5);
  const [draftComment, setDraftComment] = useState(buyerReview?.comment ?? '');
  const hasSubmitted = Boolean(buyerReview);

  const handleSubmit = () => {
    const text = draftComment.trim();
    if (!text || draftRating < 1) return;
    onSubmitReview?.(draftRating, text);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-bold text-gray-900">
            {showCatalogReviews ? 'Đánh giá từ khách hàng' : 'Đánh giá đơn hàng của bạn'}
          </h3>
          <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-2">{productName}</p>
        </div>
        {showCatalogReviews && (
          <div className="flex items-center gap-2">
            <StarRating rating={catalogRating} size={16} />
            <span className="text-[14px] font-bold text-gray-800">{catalogRating}/5</span>
            <span className="text-[12px] text-gray-400">
              ({catalogReviewCount.toLocaleString('vi-VN')} đánh giá)
            </span>
          </div>
        )}
      </div>

      {hasSubmitted && buyerReview && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50/60 p-4">
          <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-2">
            Đánh giá của bạn cho đơn này
          </p>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white">
                {buyerName.trim().charAt(0).toUpperCase() || 'B'}
              </div>
              <span className="text-[12px] font-semibold text-gray-700">{maskBuyerName(buyerName)}</span>
              <StarRating rating={buyerReview.rating} size={10} />
            </div>
            <span className="text-[11px] text-gray-500">{formatReviewDateMs(buyerReview.createdAtMs)}</span>
          </div>
          <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">{buyerReview.comment}</p>
        </div>
      )}

      {!hasSubmitted && onSubmitReview && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <p className="text-[13px] font-bold text-gray-800">Viết đánh giá của bạn</p>
          <InteractiveStarRating value={draftRating} onChange={setDraftRating} />
          <textarea
            value={draftComment}
            onChange={e => setDraftComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm mua hàng (chất lượng, giao hàng, hỗ trợ)..."
            rows={4}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[13px] focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none resize-none"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!draftComment.trim()}
            className="px-5 py-2.5 bg-[#22c55e] text-white text-sm font-bold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Gửi đánh giá
          </button>
        </div>
      )}

      {showCatalogReviews && (
        <div className="space-y-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Đánh giá khác</p>
          {SAMPLE_CATALOG_REVIEWS.map((review, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-[10px] font-bold text-white">
                    {review.user[0]}
                  </div>
                  <span className="text-[12px] font-semibold text-gray-700">{review.user}</span>
                  <StarRating rating={review.rating} size={10} />
                </div>
                <span className="text-[11px] text-gray-400">{review.time}</span>
              </div>
              <p className="text-[12px] text-gray-600 leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      )}

      {!showCatalogReviews && !hasSubmitted && !onSubmitReview && (
        <p className="text-sm text-gray-500 text-center py-6">Chưa có đánh giá cho đơn này.</p>
      )}
    </div>
  );
}
