import { useState } from "react";
import { FileText, Bold, Italic, Underline, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TextEditorProps {
  content: string;
  onContentChange: (content: string) => void;
}

export function TextEditor({ content, onContentChange }: TextEditorProps) {
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [font, setFont] = useState("Georgia");
  const [fontSize, setFontSize] = useState("16");

  const handleExport = () => {
    // Create a simple text file for now
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "biographie.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-panel">
        <div className="flex items-center gap-1 text-sm font-medium text-foreground mr-4">
          <FileText className="w-4 h-4" />
          <span>Texte</span>
        </div>

        {/* Formatting buttons */}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", isBold && "bg-secondary")}
          onClick={() => setIsBold(!isBold)}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", isItalic && "bg-secondary")}
          onClick={() => setIsItalic(!isItalic)}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", isUnderline && "bg-secondary")}
          onClick={() => setIsUnderline(!isUnderline)}
        >
          <Underline className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Font selector */}
        <Select value={font} onValueChange={setFont}>
          <SelectTrigger className="w-28 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Georgia">Georgia</SelectItem>
            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Helvetica">Helvetica</SelectItem>
          </SelectContent>
        </Select>

        {/* Font size */}
        <Select value={fontSize} onValueChange={setFontSize}>
          <SelectTrigger className="w-20 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12 px</SelectItem>
            <SelectItem value="14">14 px</SelectItem>
            <SelectItem value="16">16 px</SelectItem>
            <SelectItem value="18">18 px</SelectItem>
            <SelectItem value="20">20 px</SelectItem>
            <SelectItem value="24">24 px</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {/* Export button */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2"
          onClick={handleExport}
        >
          <Download className="w-4 h-4" />
          <span>Exporter (.docx)</span>
        </Button>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto p-8 bg-secondary/30">
        <div className="max-w-3xl mx-auto bg-editor rounded-lg shadow-lg shadow-editor-shadow/20 min-h-[800px]">
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className={cn(
              "w-full h-full min-h-[800px] p-12 bg-transparent resize-none focus:outline-none",
              "text-foreground leading-relaxed"
            )}
            style={{
              fontFamily: font,
              fontSize: `${fontSize}px`,
              fontWeight: isBold ? "bold" : "normal",
              fontStyle: isItalic ? "italic" : "normal",
              textDecoration: isUnderline ? "underline" : "none",
            }}
            placeholder="Commencez à écrire votre biographie..."
          />
        </div>
      </div>
    </div>
  );
}
