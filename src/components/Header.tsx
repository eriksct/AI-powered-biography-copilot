import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Search, User, LogOut, ChevronRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HeaderProps {
  breadcrumbs: BreadcrumbItem[];
  onSearchClick?: () => void;
}

export function Header({ breadcrumbs, onSearchClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-panel">
      <div className="flex items-center gap-3 text-sm min-w-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer shrink-0"
        >
          <BookOpen className="w-4 h-4 text-primary" />
        </button>
        <nav className="flex items-center gap-2 min-w-0">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span key={index} className="flex items-center gap-2 min-w-0">
                {index > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                {item.href && !isLast ? (
                  <button
                    onClick={() => navigate(item.href!)}
                    className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
                    title={item.label}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="font-medium text-foreground truncate max-w-[200px]" title={item.label}>
                    {item.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 shrink-0">
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
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Réglages
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
