/**
 * TipTap Rich Text Editor
 * Block-based editing with drag-drop, inline AI, media support.
 */

import React, { useEffect, useCallback } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Dropcursor from '@tiptap/extension-dropcursor';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { VicooIcon } from './VicooIcon';

const lowlight = createLowlight(common);

interface TipTapEditorProps {
  content: string;
  onChange: (html: string, text: string) => void;
  onAIAction?: (action: string, selectedText: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content, onChange, onAIAction, placeholder = '开始写点什么... 输入 / 唤起命令菜单', editable = true,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Use lowlight version
        dropcursor: false,
      }),
      Placeholder.configure({ placeholder }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Typography,
      Dropcursor.configure({ color: '#0df259', width: 3 }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getText());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none min-h-[400px] focus:outline-none px-1 py-2 text-ink dark:text-gray-100',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            uploadAndInsertImage(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) uploadAndInsertImage(file);
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML() && content !== editor.getText()) {
      // Only update if content is markdown/plain text (initial load)
      if (!content.startsWith('<')) {
        editor.commands.setContent(content || '');
      }
    }
  }, [content, editor]);

  const uploadAndInsertImage = useCallback(async (file: File) => {
    if (!editor) return;
    // Convert to base64 for now (in production: upload to server)
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        editor.chain().focus().setImage({ src: reader.result }).run();
      }
    };
    reader.readAsDataURL(file);
  }, [editor]);

  if (!editor) return null;

  const ToolBtn: React.FC<{ icon: string; active?: boolean; onClick: () => void; title?: string }> = ({ icon, active, onClick, title }) => (
    <button onClick={onClick} title={title}
      className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${active ? 'bg-primary/30 text-ink' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-ink dark:text-white'}`}>
      <VicooIcon name={icon} size={16} />
    </button>
  );

  return (
    <div className="tiptap-wrapper">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 mb-3 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur border-2 border-ink dark:border-gray-600 rounded-xl sticky top-0 z-20">
        <ToolBtn icon="format_bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="粗体" />
        <ToolBtn icon="format_italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="斜体" />
        <ToolBtn icon="strikethrough_s" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="删除线" />
        <ToolBtn icon="code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="行内代码" />
        <ToolBtn icon="highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="高亮" />

        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        <ToolBtn icon="format_list_bulleted" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="无序列表" />
        <ToolBtn icon="format_list_numbered" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="有序列表" />
        <ToolBtn icon="checklist" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} title="任务列表" />

        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        <ToolBtn icon="title" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="标题" />
        <ToolBtn icon="format_quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="引用" />
        <ToolBtn icon="code" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="代码块" />
        <ToolBtn icon="horizontal_rule" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="分隔线" />

        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        <ToolBtn icon="image" onClick={() => {
          const input = document.createElement('input');
          input.type = 'file'; input.accept = 'image/*';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) uploadAndInsertImage(file);
          };
          input.click();
        }} title="插入图片" />

        <ToolBtn icon="link" active={editor.isActive('link')} onClick={() => {
          const url = window.prompt('输入链接 URL:');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }} title="插入链接" />

        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        <ToolBtn icon="undo" onClick={() => editor.chain().focus().undo().run()} title="撤销" />
        <ToolBtn icon="redo" onClick={() => editor.chain().focus().redo().run()} title="重做" />

        {/* AI Writing Tools */}
        {onAIAction && (
          <>
            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />
            <button onClick={() => onAIAction('improve', editor.getText())}
              className="px-2 py-1 rounded text-xs font-bold bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              ✨ 润色
            </button>
            <button onClick={() => onAIAction('expand', editor.getText())}
              className="px-2 py-1 rounded text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              扩写
            </button>
            <button onClick={() => onAIAction('outline', editor.getText())}
              className="px-2 py-1 rounded text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              大纲
            </button>
          </>
        )}
      </div>

      {/* Bubble menu (appears on text selection) */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 150 }}
          className="bg-ink dark:bg-white text-white dark:text-ink rounded-xl shadow-lg px-2 py-1 flex gap-1">
          <button onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-2 py-1 rounded text-xs font-bold ${editor.isActive('bold') ? 'bg-white/20' : 'hover:bg-white/10'}`}>B</button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 rounded text-xs font-bold italic ${editor.isActive('italic') ? 'bg-white/20' : 'hover:bg-white/10'}`}>I</button>
          <button onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`px-2 py-1 rounded text-xs font-bold ${editor.isActive('highlight') ? 'bg-white/20' : 'hover:bg-white/10'}`}>H</button>
          <button onClick={() => {
            const url = window.prompt('链接:');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }} className="px-2 py-1 rounded text-xs font-bold hover:bg-white/10">🔗</button>
          {onAIAction && (
            <button onClick={() => {
              const sel = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);
              if (sel) onAIAction('improve', sel);
            }} className="px-2 py-1 rounded text-xs font-bold hover:bg-white/10">✨AI</button>
          )}
        </BubbleMenu>
      )}

      {/* Editor content */}
      <div className="border-2 border-ink/10 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-900 min-h-[400px]">
        <EditorContent editor={editor} />
      </div>

      {/* TipTap styles */}
      <style>{`
        .tiptap-wrapper .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .tiptap-wrapper .ProseMirror:focus { outline: none; }
        .tiptap-wrapper .ProseMirror img { max-width: 100%; border-radius: 0.75rem; margin: 1rem 0; border: 2px solid #e5e7eb; }
        .tiptap-wrapper .ProseMirror pre { background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 0.75rem; overflow-x: auto; }
        .tiptap-wrapper .ProseMirror code { background: #f3f4f6; padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-size: 0.9em; }
        .tiptap-wrapper .ProseMirror pre code { background: none; padding: 0; }
        .tiptap-wrapper .ProseMirror blockquote { border-left: 4px solid #0df259; padding-left: 1rem; margin-left: 0; color: #6b7280; }
        .tiptap-wrapper .ProseMirror mark { background-color: #fef08a; padding: 0.1rem 0.2rem; border-radius: 0.15rem; }
        .tiptap-wrapper .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; }
        .tiptap-wrapper .ProseMirror ul[data-type="taskList"] li label { margin-top: 0.25rem; }
        .tiptap-wrapper .ProseMirror hr { border: none; border-top: 3px solid #e5e7eb; margin: 1.5rem 0; }
        .tiptap-wrapper .ProseMirror a { color: #3b82f6; text-decoration: underline; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default TipTapEditor;
