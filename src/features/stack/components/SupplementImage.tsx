import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface SupplementImageProps {
  imageUrl: string | null | undefined;
  supplementName: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export const SupplementImage: React.FC<SupplementImageProps> = ({
  imageUrl,
  supplementName,
  className = "w-12 h-12 rounded-lg object-cover",
  fallbackIcon
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Función para validar si la URL es segura y local
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    
    // Rechazar URLs externas problemáticas
    if (url.includes('iherb.com') || url.includes('http')) {
      console.warn(`External image URL detected for ${supplementName}:`, url);
      return false;
    }
    
    // Aceptar solo rutas locales
    return url.startsWith('/assets/');
  };

  const validImageUrl = isValidImageUrl(imageUrl);

  if (!validImageUrl || imageError) {
    return (
      <div className={`${className} bg-primary/10 flex items-center justify-center`}>
        {fallbackIcon || <Package className="w-6 h-6 text-primary" />}
      </div>
    );
  }

  return (
    <div className="relative">
      {!imageLoaded && (
        <div className={`${className} bg-muted animate-pulse flex items-center justify-center`}>
          <Package className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <img
        src={imageUrl!}
        alt={supplementName}
        className={`${className} ${!imageLoaded ? 'hidden' : ''}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          console.log('Image failed to load:', imageUrl);
          setImageError(true);
        }}
      />
    </div>
  );
};

