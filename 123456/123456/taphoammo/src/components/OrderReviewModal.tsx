import { X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Order, OrderBuyerReview } from '../ordersTypes';
import { ProductReviewsContent } from './ProductReviewsContent';

export interface OrderReviewModalProps {
  order: Order | null;
  buyerDisplayName: string;
  onClose: () => void;
  onSubmitReview: (orderId: string, review: OrderBuyerReview) => void;
}

export function OrderReviewModal({
  order,
  buyerDisplayName,
  onClose,
  onSubmitReview,
}: OrderReviewModalProps) {
  return (
    <AnimatePresence>
      {order && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 w-full max-w-2xl max-h-[min(90vh,820px)] overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Star size={20} className="fill-amber-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-900">Đánh giá đơn hàng</h3>
                  <p className="text-xs text-gray-500 font-medium truncate">
                    Mã đơn: <span className="font-mono font-bold text-gray-700">{order.id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-gray-600 border border-transparent hover:border-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto overscroll-y-contain flex-1 min-h-0">
              <ProductReviewsContent
                productName={order.productName}
                showCatalogReviews={false}
                buyerReview={order.buyerReview}
                buyerName={buyerDisplayName}
                onSubmitReview={
                  order.buyerReview
                    ? undefined
                    : (rating, comment) => {
                        onSubmitReview(order.id, {
                          rating,
                          comment: comment.trim(),
                          createdAtMs: Date.now(),
                        });
                      }
                }
              />
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
