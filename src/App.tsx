import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CRMProvider, useCRM } from "@/contexts/CRMContext";
import LoginPage from "@/pages/LoginPage";
import FMDashboard from "@/pages/FMDashboard";
import BODashboard from "@/pages/BODashboard";
import TCDashboard from "@/pages/TCDashboard";
import BDMDashboard from "@/pages/BDMDashboard";
import BDODashboard from "@/pages/BDODashboard";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function CRMRouter() {
  const { currentUser, loading } = useCRM();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading CRM...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <LoginPage />;

  switch (currentUser.role) {
    case 'FM': return <FMDashboard />;
    case 'TC': return <TCDashboard />;
    case 'BDM': return <BDMDashboard />;
    case 'BO': return <BODashboard />;
    case 'BDO': return <BDODashboard />;
    default: return <LoginPage />;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CRMProvider>
        <CRMRouter />
      </CRMProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
