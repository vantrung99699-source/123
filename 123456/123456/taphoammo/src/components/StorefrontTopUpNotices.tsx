import type { StorefrontTopUpNotice } from '../admin/adminStorefrontTopUpNotices';

function variantClasses(variant: StorefrontTopUpNotice['variant']): string {
  switch (variant) {
    case 'warning':
      return 'bg-amber-50 border-amber-200 text-amber-950';
    case 'success':
      return 'bg-emerald-50 border-emerald-200 text-emerald-950';
    default:
      return 'bg-sky-50 border-sky-200 text-sky-950';
  }
}

export interface StorefrontTopUpNoticesProps {
  notices: StorefrontTopUpNotice[];
}

export function StorefrontTopUpNotices({ notices }: StorefrontTopUpNoticesProps) {
  if (!notices.length) return null;

  return (
    <div className="space-y-3 mb-6">
      {notices.map(notice => (
        <div
          key={notice.id}
          className={`rounded-xl border px-4 py-3.5 shadow-sm ${variantClasses(notice.variant)}`}
          role="note"
        >
          {notice.title.trim() ? (
            <p className="text-sm font-bold mb-1.5">{notice.title}</p>
          ) : null}
          <div
            className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1"
            dangerouslySetInnerHTML={{ __html: notice.content }}
          />
        </div>
      ))}
    </div>
  );
}
