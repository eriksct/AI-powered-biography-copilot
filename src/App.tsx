import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { supabaseConfigured } from "@/lib/supabase";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Project from "./pages/Project";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function SetupScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Biograph</h1>
          <p className="text-muted-foreground">Configuration requise</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <p className="text-sm text-foreground">
            Pour lancer l'application, configurez vos variables d'environnement Supabase dans le fichier{' '}
            <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code> :
          </p>
          <pre className="bg-secondary rounded-lg p-4 text-xs font-mono overflow-x-auto text-foreground">
{`VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon`}
          </pre>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Étapes :</strong></p>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>Créez un projet sur <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com</a></li>
              <li>Exécutez <code className="bg-secondary px-1 py-0.5 rounded text-xs font-mono">supabase/schema.sql</code> dans l'éditeur SQL</li>
              <li>Copiez l'URL et la clé anon depuis les paramètres du projet</li>
              <li>Mettez à jour <code className="bg-secondary px-1 py-0.5 rounded text-xs font-mono">.env.local</code> et relancez le serveur</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

const App = () => {
  if (!supabaseConfigured) {
    return (
      <TooltipProvider>
        <SetupScreen />
      </TooltipProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/auth"
                element={
                  <AuthRoute>
                    <Auth />
                  </AuthRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/project/:projectId"
                element={
                  <ProtectedRoute>
                    <Project />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
