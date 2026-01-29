import { BookOpen, ChevronRight } from "lucide-react";

interface HeaderProps {
  biographyTitle: string;
}

export function Header({ biographyTitle }: HeaderProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-3 bg-panel border-b border-border">
      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
        <BookOpen className="w-4 h-4 text-primary" />
      </div>
      
      <nav className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
          Mes biographies
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-foreground">
          {biographyTitle}
        </span>
      </nav>
    </header>
  );
}
