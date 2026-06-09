import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Strikethrough,
  Type,
  Underline,
} from 'lucide-react';
import { sanitizeSharePostHtml } from './SharePostContent';

export interface SharePostRichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
}

type ToolbarButton = {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  active?: boolean;
};

function exec(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function SharePostRichEditor({
  value,
  onChange,
  placeholder = 'Chia sẻ kinh nghiệm, tip, nội dung hữu ích...',
  minHeightClassName = 'min-h-[320px] h-[320px] max-h-[70vh] resize-y overflow-y-auto',
}: SharePostRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const syncFromEditor = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    onChange(sanitizeSharePostHtml(el.innerHTML));
  }, [onChange]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const next = value || '';
    if (el.innerHTML !== next) {
      el.innerHTML = next;
    }
  }, [value]);

  const wrapCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    exec(command, commandValue);
    syncFromEditor();
  };

  const applyFontSize = (size: string) => {
    editorRef.current?.focus();
    exec('fontSize', '4');
    const el = editorRef.current;
    if (!el) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;
    const span = document.createElement('span');
    span.style.fontSize = size;
    try {
      range.surroundContents(span);
    } catch {
      exec('insertHTML', `<span style="font-size:${size}">${range.toString()}</span>`);
    }
    syncFromEditor();
  };

  const insertLink = () => {
    const url = window.prompt('Nhập link (https://...)');
    if (!url?.trim()) return;
    wrapCommand('createLink', url.trim());
  };

  const handleImagePick = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      if (!src) return;
      editorRef.current?.focus();
      exec(
        'insertHTML',
        `<img src="${src}" alt="Ảnh đính kèm" class="share-post-inline-image" />`
      );
      syncFromEditor();
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    exec('insertText', text);
    syncFromEditor();
  };

  const toolbarGroups: ToolbarButton[][] = [
    [
      { id: 'bold', label: 'In đậm', icon: Bold, onClick: () => wrapCommand('bold') },
      { id: 'italic', label: 'In nghiêng', icon: Italic, onClick: () => wrapCommand('italic') },
      { id: 'underline', label: 'Gạch chân', icon: Underline, onClick: () => wrapCommand('underline') },
      {
        id: 'strike',
        label: 'Gạch ngang',
        icon: Strikethrough,
        onClick: () => wrapCommand('strikeThrough'),
      },
    ],
    [
      {
        id: 'size-lg',
        label: 'Chữ to',
        icon: Type,
        onClick: () => applyFontSize('1.25rem'),
      },
      {
        id: 'size-sm',
        label: 'Chữ nhỏ',
        icon: Type,
        onClick: () => applyFontSize('0.875rem'),
      },
      {
        id: 'h2',
        label: 'Tiêu đề lớn',
        icon: Heading2,
        onClick: () => wrapCommand('formatBlock', 'h2'),
      },
      {
        id: 'h3',
        label: 'Tiêu đề nhỏ',
        icon: Heading3,
        onClick: () => wrapCommand('formatBlock', 'h3'),
      },
    ],
    [
      {
        id: 'ul',
        label: 'Danh sách chấm',
        icon: List,
        onClick: () => wrapCommand('insertUnorderedList'),
      },
      {
        id: 'ol',
        label: 'Danh sách số',
        icon: ListOrdered,
        onClick: () => wrapCommand('insertOrderedList'),
      },
      { id: 'left', label: 'Căn trái', icon: AlignLeft, onClick: () => wrapCommand('justifyLeft') },
      {
        id: 'center',
        label: 'Căn giữa',
        icon: AlignCenter,
        onClick: () => wrapCommand('justifyCenter'),
      },
      {
        id: 'right',
        label: 'Căn phải',
        icon: AlignRight,
        onClick: () => wrapCommand('justifyRight'),
      },
    ],
    [
      { id: 'link', label: 'Chèn link', icon: Link2, onClick: insertLink },
      {
        id: 'image',
        label: 'Chèn ảnh',
        icon: ImagePlus,
        onClick: () => imageInputRef.current?.click(),
      },
    ],
  ];

  const showPlaceholder = !value.trim() && !focused;

  return (
    <div className="rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-emerald-500/30">
      <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-slate-100 bg-slate-50/90">
        {toolbarGroups.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="flex items-center gap-0.5">
            {group.map(btn => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  type="button"
                  title={btn.label}
                  aria-label={btn.label}
                  onMouseDown={event => event.preventDefault()}
                  onClick={btn.onClick}
                  className="p-2 rounded-lg text-slate-600 hover:bg-white hover:text-emerald-700 hover:shadow-sm transition-colors"
                >
                  <Icon size={16} />
                </button>
              );
            })}
            {groupIndex < toolbarGroups.length - 1 ? (
              <span className="w-px h-5 bg-slate-200 mx-1" aria-hidden />
            ) : null}
          </div>
        ))}
      </div>

      <div className="relative rounded-b-xl">
        {showPlaceholder ? (
          <p className="pointer-events-none absolute left-4 top-3 text-base text-slate-400">{placeholder}</p>
        ) : null}
        <div
          ref={editorRef}
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label="Nội dung bài viết"
          className={`share-post-content px-4 py-3 text-base text-slate-800 outline-none ${minHeightClassName}`}
          onInput={syncFromEditor}
          onBlur={() => {
            setFocused(false);
            syncFromEditor();
          }}
          onFocus={() => setFocused(true)}
          onPaste={handlePaste}
          suppressContentEditableWarning
        />
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          handleImagePick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
