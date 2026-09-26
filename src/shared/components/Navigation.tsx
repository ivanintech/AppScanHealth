import React from "react";
import { Home, Search, Camera, Package, User, Sheet, SheetContent, SheetTrigger } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useLocation } from "react-router-dom";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavLinkProps {
  name: string;
  href: string;
  icon: any;
  isMobile?: boolean;
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const location = useLocation();
  const tabs = [
    { id: "inicio", icon: Home, label: "Inicio" },
    { id: "explore", icon: Search, label: "Explorar" },
    { id: "scan", icon: Camera, label: "", isCenter: true },
    { id: "stack", icon: Package, label: "Mi Stack" },
    { id: "you", icon: User, label: "Mi perfil" },
  ];

  const NavLink = ({ name, href, icon: Icon, isMobile }: NavLinkProps) => {
    const isActive = location.pathname === href;
    return (
      <Button
        variant="ghost"
        className={cn(
          "flex items-center gap-2 text-muted-foreground hover:text-foreground",
          isActive && "text-primary"
        )}
        onClick={() => onTabChange(name)}
      >
        <Icon className="w-5 h-5" />
        <span className="text-xs font-medium">{name}</span>
      </Button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50">
      <div className="flex items-center justify-around px-4 py-2 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          if (tab.isCenter) {
            return (
              <Button
                key={tab.id}
                variant="hero"
                size="icon"
                className="w-12 h-12 rounded-full"
                onClick={() => onTabChange(tab.id)}
              >
                <Icon className="w-6 h-6" />
              </Button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 transition-colors duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
