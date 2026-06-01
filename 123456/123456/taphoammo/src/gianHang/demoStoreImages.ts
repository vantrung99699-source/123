/** Ảnh gian hàng mặc định cho gian demo (URL công khai icons8). */
export function demoStoreImageForGian(opts: {
  iconName?: string;
  platform?: string;
  classificationCategory?: string;
}): string {
  const icon = (opts.iconName || '').toLowerCase();
  if (icon.includes('facebook')) return 'https://img.icons8.com/color/480/facebook-new.png';
  if (icon.includes('instagram')) return 'https://img.icons8.com/fluency/480/instagram-new.png';
  if (icon.includes('music') || icon.includes('tiktok')) return 'https://img.icons8.com/color/480/tiktok.png';
  if (icon.includes('twitter')) return 'https://img.icons8.com/color/480/twitterx.png';
  if (icon.includes('chrome') || icon.includes('gmail')) return 'https://img.icons8.com/color/480/gmail-new.png';
  if (icon.includes('globe')) return 'https://img.icons8.com/color/480/meta.png';
  if (icon.includes('youtube')) return 'https://img.icons8.com/color/480/youtube-play.png';
  if (icon.includes('telegram')) return 'https://img.icons8.com/color/480/telegram-app.png';
  if (icon.includes('zalo')) return 'https://img.icons8.com/color/480/zalo.png';
  if (icon.includes('code') || icon.includes('tool')) return 'https://img.icons8.com/color/480/source-code.png';

  const p = `${opts.platform || ''} ${opts.classificationCategory || ''}`.toLowerCase();
  if (p.includes('tiktok')) return 'https://img.icons8.com/color/480/tiktok.png';
  if (p.includes('facebook') || /\bfb\b/.test(p)) return 'https://img.icons8.com/color/480/facebook-new.png';
  if (p.includes('instagram')) return 'https://img.icons8.com/fluency/480/instagram-new.png';
  if (p.includes('twitter')) return 'https://img.icons8.com/color/480/twitterx.png';
  if (p.includes('gmail') || p.includes('mail')) return 'https://img.icons8.com/color/480/gmail-new.png';
  if (p.includes('tăng tương tác') || p.includes('quảng cáo')) {
    return 'https://img.icons8.com/color/480/meta.png';
  }

  return 'https://img.icons8.com/fluency/480/shop.png';
}
