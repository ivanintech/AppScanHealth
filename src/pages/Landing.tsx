import React, { useState, useRef } from "react";
import { Button } from "@/shared/components/ui/button";
import { HeartPulse } from "lucide-react";

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const Landing = ({ onGetStarted, onLogin }: LandingProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleGetStarted = () => {
    if (buttonRef.current) {
      const buttonTop = buttonRef.current.getBoundingClientRect().top;
      const distance = buttonTop / 4;
      setTranslateY(-distance);
    }
    
    setIsAnimating(true);

    // Retraso de 0,5s antes de mostrar "Enhorabuena"
    setTimeout(() => {
      setShowCongrats(true);
    }, 500);

    // Luego ejecuta onGetStarted tras 5s (desde el inicio)
    setTimeout(() => {
      onGetStarted();
    }, 5000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between items-center bg-white relative px-8 overflow-hidden">
      {/* Contenedor central: logo + título */}
      <div
        className={`flex-1 flex flex-col items-center justify-center mt-auto mb-auto transition-all duration-500`}
        style={{ transform: `translateY(${isAnimating ? translateY : 0}px)` }}
      >
        <div className="w-28 h-28 flex items-center justify-center rounded-full bg-emerald-500 shadow-lg">
          <HeartPulse className="w-20 h-20 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="font-bold text-emerald-500 text-4xl tracking-tight mt-6 text-center">
          Scan Health
        </h1>
      </div>

      {/* 👇 Nuevo bloque fijo en el centro */}
      {showCongrats && (
        <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in pointer-events-none">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Enhorabuena</h2>
          <p className="text-lg text-gray-600 text-center">
            ¡Estás de camino a un estilo de vida más saludable!
          </p>
        </div>
      )}

      {/* Botones CTA con animación */}
      <div className="w-full pb-12">
        <Button
          ref={buttonRef}
          onClick={handleGetStarted}
          className={`w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-xl border-0 h-14 text-xl transition-all duration-500 ${isAnimating ? "opacity-0 translate-y-10 pointer-events-none" : "opacity-100 translate-y-0"
            }`}
        >
          Empieza
        </Button>
        <div
          className={`text-center pt-4 pb-6 transition-all duration-500 ${isAnimating ? "opacity-0 translate-y-10 pointer-events-none" : "opacity-100 translate-y-0"
            }`}
        >
          <button
            onClick={onLogin}
            className="text-gray-600 font-medium hover:text-emerald-600 transition-colors text-base"
          >
            ¿Ya tienes una cuenta?{" "}
            <span className="font-bold text-emerald-600">Inicia sesión</span>
          </button>
        </div>
      </div>
    </div>

  );
};
