import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Search, User, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  biographyTitle: string;
  onSearchClick?: () => void;
}

export function Header({ biographyTitle, onSearchClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-panel">
      <div className="flex items-center gap-3 text-sm">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-primary" />
        </button>
        <nav className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Mes biographies
          </button>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className="font-medium text-foreground">{biographyTitle}</span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {onSearchClick && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 text-muted-foreground"
            onClick={onSearchClick}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-xs">Rechercher</span>
            <kbd className="ml-2 text-[10px] bg-secondary px-1.5 py-0.5 rounded">⌘K</kbd>
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <User className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
