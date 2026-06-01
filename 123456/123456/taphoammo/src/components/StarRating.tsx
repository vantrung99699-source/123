import { Star } from 'lucide-react';

export interface StarRatingProps {
  rating: number;
  size?: number;
}

export function StarRating({ rating, size = 11 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={size}
          className={
            star <= Math.floor(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-200 fill-gray-200'
          }
        />
      ))}
    </div>
  );
}

export interface InteractiveStarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  disabled?: boolean;
}

export function InteractiveStarRating({
  value,
  onChange,
  size = 22,
  disabled = false,
}: InteractiveStarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className="p-0.5 rounded hover:scale-110 transition-transform disabled:cursor-default"
          aria-label={`${star} sao`}
        >
          <Star
            size={size}
            className={
              star <= value
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 fill-gray-100'
            }
          />
        </button>
      ))}
    </div>
  );
}
