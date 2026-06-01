/** Đánh giá mẫu trên trang sản phẩm (tab Reviews) — dùng chung modal đơn đã mua. */
export const SAMPLE_CATALOG_REVIEWS = [
  {
    user: 'Nguyễn V***n',
    rating: 5,
    time: '2 giờ trước',
    comment: 'Hàng chất lượng, giao nhanh, seller nhiệt tình. Sẽ quay lại mua tiếp!',
  },
  {
    user: 'Trần T***g',
    rating: 4,
    time: '5 giờ trước',
    comment: 'Acc dùng ổn, login vào được ngay. Bảo hành nhanh.',
  },
  {
    user: 'Lê H***a',
    rating: 5,
    time: '1 ngày trước',
    comment: 'Mua lần thứ 3, lần nào cũng ok. Shop uy tín, giá rẻ nhất thị trường.',
  },
] as const;

export const DEFAULT_CATALOG_RATING = 4.9;
export const DEFAULT_CATALOG_REVIEW_COUNT = 999;
