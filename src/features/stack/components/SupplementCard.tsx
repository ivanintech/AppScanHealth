import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/shared/components/ui/card';

interface SupplementCardProps {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  onClick: () => void;
}

const SupplementCard: React.FC<SupplementCardProps> = ({
  id,
  name,
  description,
  imageUrl,
  onClick
}) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-0">
          {/* Imagen del suplemento */}
          <div className="aspect-square bg-gray-50 rounded-t-lg overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.log('❌ Error cargando imagen:', imageUrl, 'para suplemento:', name);
                  // Si la imagen falla al cargar, mostrar el fallback
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
                onLoad={() => {
                  console.log('✅ Imagen cargada correctamente:', imageUrl, 'para suplemento:', name);
                }}
              />
            ) : (
              console.log('⚠️ No hay imageUrl para suplemento:', name)
            )}
            <div 
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"
              style={{ display: imageUrl ? 'none' : 'flex' }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          
          {/* Contenido de la tarjeta */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
              {name}
            </h3>
            {description && (
              <p className="text-gray-600 text-xs leading-relaxed line-clamp-3">
                {description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SupplementCard;
