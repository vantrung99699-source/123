import { useMemo } from 'react';

const ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'S',
  'H2',
  'H3',
  'UL',
  'OL',
  'LI',
  'A',
  'IMG',
  'BLOCKQUOTE',
  'SPAN',
  'DIV',
]);

export function sanitizeSharePostHtml(html: string): string {
  if (!html.trim()) return '';
  if (typeof window === 'undefined') return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walk = (node: Node) => {
    const children = [...node.childNodes];
    for (const child of children) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = child as HTMLElement;
      if (!ALLOWED_TAGS.has(el.tagName)) {
        el.replaceWith(...el.childNodes);
        continue;
      }
      [...el.attributes].forEach(attr => {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on')) el.removeAttribute(attr.name);
        if (el.tagName === 'A' && name !== 'href' && name !== 'target' && name !== 'rel') {
          el.removeAttribute(attr.name);
        }
        if (el.tagName === 'IMG' && name !== 'src' && name !== 'alt' && name !== 'class') {
          el.removeAttribute(attr.name);
        }
        if (el.tagName === 'SPAN' && name !== 'style') el.removeAttribute(attr.name);
        if (
          (el.tagName === 'P' || el.tagName === 'DIV' || el.tagName === 'BLOCKQUOTE') &&
          name !== 'class' &&
          name !== 'style'
        ) {
          el.removeAttribute(attr.name);
        }
      });
      if (el.tagName === 'A') {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
      if (el.tagName === 'IMG') {
        el.classList.add('share-post-inline-image');
      }
      walk(el);
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}

function isLikelyHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text);
}

export function plainTextToShareHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\n/g, '<br />');
}

export interface SharePostContentProps {
  content: string;
  className?: string;
}

export function SharePostContent({ content, className = '' }: SharePostContentProps) {
  const html = useMemo(() => {
    const source = isLikelyHtml(content) ? content : plainTextToShareHtml(content);
    return sanitizeSharePostHtml(source);
  }, [content]);

  if (!html) return null;

  return (
    <div
      className={`share-post-content text-sm text-slate-700 leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
