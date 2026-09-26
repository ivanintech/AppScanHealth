import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Landing } from "./Landing";
import { Home } from "./home/Home";
import { Explore } from "./explore/Explore";
import { Profile } from "./profile/Profile";
import { ProductDetail } from "./explore/supplements/ProductDetail";
import { Scanner } from "../features/scanning/components/Scanner";
import { Programar } from "./Programar";
import SupplementStack from "../features/stack/components/SupplementStack";
import Auth from "./auth/Auth";
import { HowItWorks } from "./analysis/HowItWorks";
import { Navigation } from "@/shared/components/Navigation";
import { SmartOnboarding } from "@/features/onboarding/components/SmartOnboarding";
import { useAuth } from "@/shared/hooks/useAuth";
import { supabase } from "@/shared/supabase/client";
import { NotificationService } from "@/shared/components/NotificationService";
import { LoadingPage } from "@/shared/components/ui/ProfessionalLoading";
import { ROUTES } from "@/shared/config/routes";
// We will let App.tsx handle this route directly
// import { AchievementsPage } from "./AchievementsPage";

type Supplement = {
  ean: string;
  name: string;
  brand?: string;
  // Add other supplement properties as needed
};

const Index = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedSupplement, setSelectedSupplement] = useState<Supplement | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Determinar la vista actual basada en la ruta
  const getCurrentView = () => {
    const pathname = location.pathname;
    console.log("📍 getCurrentView - pathname:", pathname, "ROUTES.ONBOARDING:", ROUTES.ONBOARDING);
    
    if (pathname === ROUTES.LANDING) return "landing";
    if (pathname === ROUTES.AUTH) return "auth";
    if (pathname === ROUTES.ONBOARDING) {
      console.log("✅ Matched onboarding route");
      return "onboarding";
    }
    if (pathname === ROUTES.HOME_PAGE || pathname === ROUTES.HOME) return "home";
    if (pathname === ROUTES.EXPLORE) return "explore";
    if (pathname === ROUTES.PROFILE) return "you";
    if (pathname === ROUTES.PROGRAMAR) return "programar";
    if (pathname === ROUTES.STACK) return "stack";
    if (pathname === ROUTES.HOW_IT_WORKS) return "how-it-works";
    if (pathname.startsWith('/supplements/')) return "supplement-detail";
    if (pathname === '/scanner') return "scanner";
    
    console.log("⚠️ No route matched, returning default 'home'");
    return "home"; // default
  };

  const currentView = getCurrentView();
  const activeTab = currentView === "home" ? "home" : 
                   currentView === "explore" ? "explore" :
                   currentView === "stack" ? "stack" :
                   currentView === "you" ? "you" : "home";

  useEffect(() => {
    // Timeout para evitar carga infinita
    const timeout = setTimeout(() => {
      if (loading || checkingOnboarding) {
        console.log('⚠️ Loading timeout reached, forcing app to continue');
        setLoadingTimeout(true);
      }
    }, 10000); // 10 segundos

    return () => clearTimeout(timeout);
  }, [loading, checkingOnboarding]);

  useEffect(() => {
    // Solo redirigir a landing si no hay usuario y estamos en home
    if (!user && currentView === "home") {
      console.log("🔒 No user on home route, redirecting to landing");
      navigate(ROUTES.LANDING);
    }
  }, [user, currentView, location, navigate]);

  const handleGetStarted = () => {
    console.log("🚀 handleGetStarted called - going to onboarding");
    console.log("📍 Current pathname:", location.pathname);
    console.log("📍 Navigating to:", ROUTES.ONBOARDING);
    navigate(ROUTES.ONBOARDING);
  };

  const handleLogin = () => {
    navigate(ROUTES.AUTH);
  };

  const handleContinue = () => {
    navigate(ROUTES.HOME_PAGE);
  };

  const handleOnboardingComplete = () => {
    // Después del onboarding, ir a autenticación si no hay usuario
    if (!user) {
      navigate(ROUTES.AUTH);
    } else {
      // Verificar si se vino desde "Reiniciar análisis"
      const forceRestart = localStorage.getItem('force_onboarding_restart');
      if (forceRestart === 'true') {
        // Limpiar la bandera y navegar a análisis
        localStorage.removeItem('force_onboarding_restart');
        navigate('/analysis');
      } else {
        navigate(ROUTES.HOME_PAGE);
      }
    }
  };

  const handleOnboardingDismiss = () => {
    navigate(ROUTES.LANDING);
  };

  const handleTabChange = (tab: string) => {
    if (tab === "scan") {
      navigate('/scanner');
    } else if (tab === "programar") {
      navigate(ROUTES.PROGRAMAR);
    } else if (tab === "stack") {
      navigate(ROUTES.STACK);
    } else if (tab === "inicio") {
      navigate(ROUTES.HOME_PAGE);
    } else if (tab === "explore") {
      navigate(ROUTES.EXPLORE);
    } else if (tab === "you") {
      navigate(ROUTES.PROFILE);
    }
  };

  const handleBackToStack = () => {
    navigate(ROUTES.STACK);
  };

  const handleSupplementClick = (supplement: Supplement) => {
    if (supplement && supplement.ean) {
      navigate(ROUTES.SUPPLEMENT_DETAIL(supplement.ean));
    } else {
      console.error("Clicked on supplement with no EAN:", supplement);
      // Optionally, show a toast notification to the user
    }
  };

  const handleBackToExplore = () => {
    navigate(ROUTES.EXPLORE);
  };

  const handleScanComplete = (barcode: string) => {
    // TODO: Fetch supplement data from barcode and set selectedSupplement
    console.log('Scanned barcode:', barcode);
    // For now, just close the scanner
    navigate(ROUTES.HOME_PAGE);
  };

  const handleCloseScanner = () => {
    navigate(ROUTES.HOME_PAGE);
  };

  const renderCurrentView = () => {
    console.log("🎯 renderCurrentView called - currentView:", currentView, "user:", !!user, "loading:", loading);
    
    if ((loading || checkingOnboarding) && !loadingTimeout) {
      console.log("⏳ Showing loading page");
      return (
        <LoadingPage 
          title="Cargando aplicación"
          description="Preparando tu experiencia personalizada"
        />
      );
    }

    // Verificar autenticación - redirigir a landing si no hay usuario
    // PERO permitir onboarding sin usuario
    if (!user && !["landing", "auth", "onboarding"].includes(currentView)) {
      console.log("🔒 No user, redirecting to landing");
      return <Landing onGetStarted={handleGetStarted} onLogin={handleLogin} />;
    }

    switch (currentView) {
      case "landing":
        return <Landing onGetStarted={handleGetStarted} onLogin={handleLogin} />;
      case "auth":
        return <Auth />;
      case "onboarding":
        console.log("🎯 Rendering SmartOnboarding component");
        return <SmartOnboarding onComplete={handleOnboardingComplete} onDismiss={handleOnboardingDismiss} />;
      case "home":
        return <Home />;
      case "explore":
        return <Explore onSupplementClick={handleSupplementClick} />;
      case "you":
        return <Profile />;
      case "programar":
        return <Programar />;
      case "stack":
        return <SupplementStack onSupplementClick={handleSupplementClick} />;
      case "how-it-works":
        return <HowItWorks />;
      case "supplement-detail": {
        // This case is now handled by routing in App.tsx
        return null;
      }
      case "scanner":
        return <Scanner onClose={handleCloseScanner} onScanComplete={handleScanComplete} />;
      // case "achievements":
      //   return <AchievementsPage />;
      default:
        return <Home />;
    }
  };

  // Solo mostrar navegación si hay usuario autenticado Y no estamos en páginas especiales
  const showNavigation = user && !["landing", "auth", "onboarding", "scanner", "how-it-works"].includes(currentView);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-grow">
        <NotificationService>
          {renderCurrentView()}
        </NotificationService>
      </div>
      {showNavigation && (
        <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  );
};

export default Index;
