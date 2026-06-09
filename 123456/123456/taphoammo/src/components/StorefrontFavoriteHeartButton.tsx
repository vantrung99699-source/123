import { Heart } from 'lucide-react';

export interface StorefrontFavoriteHeartButtonProps {
  active: boolean;
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
  size?: 'sm' | 'md';
  className?: string;
  title?: string;
}

export function StorefrontFavoriteHeartButton({
  active,
  onToggle,
  size = 'md',
  className = '',
  title,
}: StorefrontFavoriteHeartButtonProps) {
  const dim = size === 'sm' ? 15 : 18;
  const btnClass =
    size === 'sm'
      ? 'h-8 w-8'
      : 'h-9 w-9';

  return (
    <button
      type="button"
      onClick={onToggle}
      title={title ?? (active ? 'Bỏ yêu thích' : 'Thêm vào yêu thích')}
      aria-label={active ? 'Bỏ yêu thích gian hàng' : 'Thêm gian hàng vào yêu thích'}
      aria-pressed={active}
      className={`inline-flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-transform hover:scale-110 ${btnClass} ${className}`}
    >
      <Heart
        size={dim}
        className={active ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}
        strokeWidth={2}
      />
    </button>
  );
}
