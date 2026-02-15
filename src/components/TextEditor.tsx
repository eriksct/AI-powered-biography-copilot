import { useEffect, useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { FileText, Bold, Italic, Underline as UnderlineIcon, Download, Heading1, Heading2, Heading3, List, ListOrdered, Undo, Redo, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDocument, useSaveDocument } from '@/hooks/useDocument';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

interface TextEditorProps {
  projectId: string;
}

export function TextEditor({ projectId }: TextEditorProps) {
  const { data: document, isLoading } = useDocument(projectId);
  const { save, isSaving } = useSaveDocument();
  const [initialized, setInitialized] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {
          depth: 100,
        },
      }),
      Placeholder.configure({
        placeholder: 'Commencez à écrire votre biographie...',
      }),
      Underline,
    ],
    editorProps: {
      attributes: {
        class: 'min-h-[800px] p-12 focus:outline-none text-foreground leading-relaxed',
        style: 'font-family: Georgia, serif; font-size: 16px;',
      },
    },
    onUpdate: ({ editor }) => {
      if (document?.id) {
        save(document.id, editor.getJSON());
      }
    },
  });

  // Load content from DB once
  useEffect(() => {
    if (editor && document && !initialized) {
      const content = document.content;
      if (content && Object.keys(content).length > 0) {
        editor.commands.setContent(content);
      }
      setInitialized(true);
    }
  }, [editor, document, initialized]);

  const handleExport = useCallback(async () => {
    if (!editor) return;

    const text = editor.getText();
    const lines = text.split('\n').filter((l) => l.trim());

    const doc = new Document({
      sections: [{
        children: lines.map((line) =>
          new Paragraph({
            children: [new TextRun({ text: line, size: 24, font: 'Georgia' })],
          })
        ),
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'biographie.docx');
  }, [editor]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-muted-foreground text-sm">Chargement de l'éditeur...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-panel">
        <div className="flex items-center gap-1 text-sm font-medium text-foreground mr-3">
          <FileText className="w-4 h-4" />
          <span>Texte</span>
        </div>

        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
        >
          <Redo className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Formatting */}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor?.isActive('bold') && 'bg-secondary')}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor?.isActive('italic') && 'bg-secondary')}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor?.isActive('underline') && 'bg-secondary')}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Headings */}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor?.isActive('heading', { level: 1 }) && 'bg-secondary')}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor?.isActive('heading', { level: 2 }) && 'bg-secondary')}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor?.isActive('heading', { level: 3 }) && 'bg-secondary')}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor?.isActive('bulletList') && 'bg-secondary')}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor?.isActive('orderedList') && 'bg-secondary')}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        <div className="flex-1" />

        {/* Save indicator */}
        {isSaving && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Sauvegarde...
          </span>
        )}

        {/* Export */}
        <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />
          <span>Exporter (.docx)</span>
        </Button>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto p-8 bg-secondary/30">
        <div className="max-w-3xl mx-auto bg-editor rounded-lg shadow-lg shadow-editor-shadow/20 min-h-[800px]">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
