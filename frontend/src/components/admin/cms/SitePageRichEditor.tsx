import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { StarterKit } from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { CMS_BODY_HTML_CLASS } from '../../../features/cms/cmsHtmlClasses';
import { uploadSitePageMedia } from '../../../features/cms/uploadSiteMedia';
import { FontSize } from './fontSizeExtension';

const FONT_SIZES = ['14px', '16px', '18px', '20px', '24px', '30px', '36px'] as const;

type ViewMode = 'edit' | 'preview' | 'split';

function TbBtn({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'rounded-lg border px-2 py-1.5 text-xs font-semibold transition disabled:opacity-40',
        active
          ? 'border-brand-500 bg-brand-50 text-brand-900'
          : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
      )}
    >
      {children}
    </button>
  );
}

function TbSep() {
  return <span className="mx-0.5 hidden h-6 w-px bg-ink-200 sm:inline-block" aria-hidden />;
}

function setLink(editor: Editor) {
  const prev = editor.getAttributes('link').href as string | undefined;
  const url = window.prompt('Bağlantı URL’si', prev?.startsWith('http') ? prev : 'https://');
  if (url === null) return;
  const trimmed = url.trim();
  if (trimmed === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
}

function insertImageFromFile(editor: Editor) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp,image/gif';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const src = await uploadSitePageMedia(file);
      editor.chain().focus().setImage({ src }).run();
    } catch {
      window.alert('Görsel yüklenemedi. Oturum ve API adresini kontrol edin.');
    }
  };
  input.click();
}

function insertImageFromUrl(editor: Editor) {
  const url = window.prompt('Görsel URL’si', 'https://');
  if (url === null) return;
  const trimmed = url.trim();
  if (!trimmed) return;
  editor.chain().focus().setImage({ src: trimmed }).run();
}

function PreviewPane({ html }: { html: string }) {
  return (
    <div className="overflow-auto border-t border-ink-200 bg-ink-50/30 p-4 lg:border-t-0 lg:border-l">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
        HTML önizleme
      </p>
      <div
        className={CMS_BODY_HTML_CLASS}
        dangerouslySetInnerHTML={{
          __html: html.trim() ? html : '<p class="text-ink-400">Boş içerik</p>',
        }}
      />
    </div>
  );
}

export function SitePageRichEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}) {
  const [mode, setMode] = useState<ViewMode>('edit');
  const skipExternalSync = useRef(false);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: {},
        orderedList: {},
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { class: 'text-brand-700 underline' },
        },
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg border border-ink-200 my-4',
        },
      }),
      TableKit.configure({
        table: {
          resizable: false,
          HTMLAttributes: { class: 'cms-table border-collapse w-full my-4 text-sm' },
        },
        tableHeader: {
          HTMLAttributes: {
            class: 'border border-ink-200 bg-ink-50 px-2 py-1.5 font-semibold text-left',
          },
        },
        tableCell: {
          HTMLAttributes: {
            class: 'border border-ink-200 px-2 py-1.5 align-top',
          },
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      FontSize,
      Placeholder.configure({
        placeholder: 'İçeriği buradan oluşturun…',
        emptyEditorClass: 'opacity-40',
      }),
    ],
    [],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: value || '',
    editable: !disabled,
    editorProps: {
      attributes: {
        class:
          'tiptap-editor prose-editor min-h-[280px] px-3 py-2 text-sm text-ink-900 focus:outline-none',
      },
    },
    onUpdate: ({ editor: ed }) => {
      skipExternalSync.current = true;
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;
    if (skipExternalSync.current) {
      skipExternalSync.current = false;
      return;
    }
    const cur = editor.getHTML();
    const next = value || '';
    if (cur === next) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [value, editor]);

  const run = useCallback(
    (fn: (ed: Editor) => void) => {
      if (!editor || disabled) return;
      fn(editor);
    },
    [editor, disabled],
  );

  const busyToolbar = !editor || disabled;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-ink-200 bg-ink-50/40 p-2">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
          Görünüm
        </span>
        {(['edit', 'preview', 'split'] as const).map((m) => (
          <button
            key={m}
            type="button"
            disabled={disabled}
            onClick={() => setMode(m)}
            className={clsx(
              'rounded-lg px-2 py-1 text-xs font-medium capitalize transition',
              mode === m
                ? 'bg-white text-ink-900 shadow-sm ring-1 ring-ink-200'
                : 'text-ink-600 hover:bg-white/80',
            )}
          >
            {m === 'edit' ? 'Düzenle' : m === 'preview' ? 'Önizleme' : 'Bölünmüş'}
          </button>
        ))}
      </div>

      {mode === 'preview' ? (
        <div className="rounded-xl border border-ink-200 bg-white">
          <PreviewPane html={value} />
        </div>
      ) : (
        <div
          className={clsx(
            'rounded-xl border border-ink-200 bg-white',
            mode === 'split' && 'lg:grid lg:grid-cols-2',
          )}
        >
          <div className="p-2">
            <div className="mb-2 flex flex-wrap gap-1 border-b border-ink-100 pb-2">
              <TbBtn
                title="Kalın"
                active={editor?.isActive('bold')}
                disabled={busyToolbar}
                onClick={() => run((ed) => ed.chain().focus().toggleBold().run())}
              >
                B
              </TbBtn>
              <TbBtn
                title="İtalik"
                active={editor?.isActive('italic')}
                disabled={busyToolbar}
                onClick={() => run((ed) => ed.chain().focus().toggleItalic().run())}
              >
                I
              </TbBtn>
              <TbBtn
                title="Altı çizili"
                active={editor?.isActive('underline')}
                disabled={busyToolbar}
                onClick={() => run((ed) => ed.chain().focus().toggleUnderline().run())}
              >
                U
              </TbBtn>
              <TbSep />
              <TbBtn
                title="Paragraf"
                disabled={busyToolbar}
                onClick={() => run((ed) => ed.chain().focus().setParagraph().run())}
              >
                P
              </TbBtn>
              <TbBtn
                title="Başlık 1"
                active={editor?.isActive('heading', { level: 1 })}
                disabled={busyToolbar}
                onClick={() => run((ed) => ed.chain().focus().toggleHeading({ level: 1 }).run())}
              >
                H1
              </TbBtn>
              <TbBtn
                title="Başlık 2"
                active={editor?.isActive('heading', { level: 2 })}
                disabled={busyToolbar}
                onClick={() => run((ed) => ed.chain().focus().toggleHeading({ level: 2 }).run())}
              >
                H2
              </TbBtn>
              <TbBtn
                title="Başlık 3"
                active={editor?.isActive('heading', { level: 3 })}
                disabled={busyToolbar}
                onClick={() => run((ed) => ed.chain().focus().toggleHeading({ level: 3 }).run())}
              >
                H3
              </TbBtn>
              <TbSep />
              <select
                className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-800"
                disabled={busyToolbar}
                aria-label="Yazı boyutu"
                value={
                  (editor?.getAttributes('textStyle').fontSize as string | undefined) ?? ''
                }
                onChange={(e) => {
                  const v = e.target.value;
                  run((ed) => {
                    if (!v) ed.chain().focus().unsetFontSize().run();
                    else ed.chain().focus().setFontSize(v).run();
                  });
                }}
              >
                <option value="">Boyut</option>
                {FONT_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <TbSep />
              <TbBtn
                title="Madde işaretli liste"
                disabled={busyToolbar}
                onClick={() => run((ed) => ed.chain().focus().toggleBulletList().run())}
              >
                • Liste
              </TbBtn>
              <TbBtn
                title="Numaralı liste"
                disabled={busyToolbar}
                onClick={() => run((ed) => ed.chain().focus().toggleOrderedList().run())}
              >
                1. Liste
              </TbBtn>
              <TbSep />
              <TbBtn title="Bağlantı" disabled={busyToolbar} onClick={() => run((ed) => setLink(ed))}>
                Link
              </TbBtn>
              <TbBtn
                title="Görsel yükle"
                disabled={busyToolbar}
                onClick={() => run((ed) => insertImageFromFile(ed))}
              >
                Resim↑
              </TbBtn>
              <TbBtn
                title="Görsel URL"
                disabled={busyToolbar}
                onClick={() => run((ed) => insertImageFromUrl(ed))}
              >
                Resim🔗
              </TbBtn>
              <TbSep />
              <TbBtn
                title="Tablo ekle"
                disabled={busyToolbar}
                onClick={() =>
                  run((ed) =>
                    ed.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
                  )
                }
              >
                Tablo+
              </TbBtn>
              <TbBtn
                title="Tabloyu sil"
                disabled={busyToolbar}
                onClick={() => run((ed) => ed.chain().focus().deleteTable().run())}
              >
                Tablo−
              </TbBtn>
              <TbSep />
              <TbBtn
                title="Alıntı"
                active={editor?.isActive('blockquote')}
                disabled={busyToolbar}
                onClick={() => run((ed) => ed.chain().focus().toggleBlockquote().run())}
              >
                “ ”
              </TbBtn>
              <TbBtn
                title="Kod bloğu"
                active={editor?.isActive('codeBlock')}
                disabled={busyToolbar}
                onClick={() => run((ed) => ed.chain().focus().toggleCodeBlock().run())}
              >
                {'</>'}
              </TbBtn>
              <TbSep />
              <TbBtn
                title="Sola hizala"
                disabled={busyToolbar}
                onClick={() => run((ed) => ed.chain().focus().setTextAlign('left').run())}
              >
                ⬅
              </TbBtn>
              <TbBtn
                title="Ortala"
                disabled={busyToolbar}
                onClick={() => run((ed) => ed.chain().focus().setTextAlign('center').run())}
              >
                ↔
              </TbBtn>
              <TbBtn
                title="Sağa hizala"
                disabled={busyToolbar}
                onClick={() => run((ed) => ed.chain().focus().setTextAlign('right').run())}
              >
                ➡
              </TbBtn>
              <TbSep />
              <TbBtn
                title="Geri al"
                disabled={busyToolbar || !editor?.can().undo()}
                onClick={() => run((ed) => ed.chain().focus().undo().run())}
              >
                ↺
              </TbBtn>
              <TbBtn
                title="Yinele"
                disabled={busyToolbar || !editor?.can().redo()}
                onClick={() => run((ed) => ed.chain().focus().redo().run())}
              >
                ↻
              </TbBtn>
            </div>
            <EditorContent editor={editor} />
          </div>
          {mode === 'split' && <PreviewPane html={value} />}
        </div>
      )}

      <details className="rounded-xl border border-dashed border-ink-200 bg-white px-3 py-2 text-xs text-ink-600">
        <summary className="cursor-pointer select-none font-medium text-ink-700">
          Ham HTML (yedek / gelişmiş)
        </summary>
        <p className="mt-1 text-[11px] text-ink-500">
          Burada yaptığınız değişiklikler editörle senkronize edilir.
        </p>
        <textarea
          className="input mt-2 min-h-[120px] font-mono text-[11px] leading-relaxed"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      </details>
    </div>
  );
}
