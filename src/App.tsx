import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/shared/hooks/useAuth";
import { NotificationService } from "@/shared/components/NotificationService";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { useOnboardingDataMigration } from "@/shared/hooks/useOnboardingDataMigration";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AchievementsPage } from "./pages/home/AchievementsPage";
import { StackAnalysisPage } from "./pages/mistack/StackAnalysisPage";
import { ProtocolsPage } from "./pages/explore/protocols/ProtocolsPage";
import { ProtocolDetail } from "./pages/explore/protocols/ProtocolDetail";
import { ProductDetail } from "./pages/explore/supplements/ProductDetail";
import { AnalysisPage } from "./pages/analysis/AnalysisPage";
import { HowItWorks } from "./pages/analysis/HowItWorks";

const queryClient = new QueryClient();

// Componente wrapper para manejar la migración de datos
const AppContent = () => {
  useOnboardingDataMigration();
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<Index />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/stack-analysis" element={<StackAnalysisPage />} />
        <Route path="/protocols" element={<ProtocolsPage />} />
        <Route path="/protocols/:id" element={<ProtocolDetail />} />
        <Route path="/supplements/:ean" element={<ProductDetail />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="scanhealth-ui-theme">
      <AuthProvider>
        <TooltipProvider>
          <NotificationService>
            <Toaster />
            <Sonner />
            <AppContent />
          </NotificationService>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
