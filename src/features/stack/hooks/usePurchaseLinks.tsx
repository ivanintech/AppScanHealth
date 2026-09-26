import { useState, useEffect, useCallback } from 'react';

interface PurchaseOption {
  name: string;
  url: string;
  logo: string;
  description: string;
  isAvailable: boolean;
  price?: string;
  rating?: number;
}

interface PurchaseLinksData {
  options: PurchaseOption[];
  loading: boolean;
  error: string | null;
}

export const usePurchaseLinks = (ean: string, productName: string) => {
  const [data, setData] = useState<PurchaseLinksData>({
    options: [],
    loading: false,
    error: null
  });

  const generatePurchaseLinks = useCallback(async (ean: string, productName: string) => {
    if (!ean || !productName) return;
    
    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Simular delay de búsqueda
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generar enlaces de compra basados en el EAN y nombre del producto
      const purchaseOptions: PurchaseOption[] = [
        {
          name: 'Amazon',
          url: `https://www.amazon.es/s?k=${encodeURIComponent(productName)}&i=drugstore`,
          logo: '🛒',
          description: 'Envío rápido y confiable',
          isAvailable: true,
          price: 'Desde €15.99',
          rating: 4.5
        },
        {
          name: 'iHerb',
          url: `https://es.iherb.com/search?kw=${encodeURIComponent(productName)}`,
          logo: '🌿',
          description: 'Suplementos naturales premium',
          isAvailable: true,
          price: 'Desde €12.99',
          rating: 4.7
        },
        {
          name: 'HSN Store',
          url: `https://www.hsnstore.com/buscar?q=${encodeURIComponent(productName)}`,
          logo: '💪',
          description: 'Especialistas en nutrición deportiva',
          isAvailable: true,
          price: 'Desde €18.99',
          rating: 4.3
        },
        {
          name: 'MyProtein',
          url: `https://www.myprotein.es/search?searchTerm=${encodeURIComponent(productName)}`,
          logo: '🥤',
          description: 'Proteínas y suplementos deportivos',
          isAvailable: true,
          price: 'Desde €14.99',
          rating: 4.4
        },
        {
          name: 'Google Shopping',
          url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(productName + ' suplemento')}`,
          logo: '🔍',
          description: 'Comparar precios en múltiples tiendas',
          isAvailable: true,
          price: 'Varios precios',
          rating: 4.2
        }
      ];

      // Simular que algunos productos no están disponibles en ciertas tiendas
      const availableOptions = purchaseOptions.map(option => ({
        ...option,
        isAvailable: Math.random() > 0.2 // 80% de probabilidad de estar disponible
      }));

      setData({
        options: availableOptions,
        loading: false,
        error: null
      });

    } catch (err) {
      setData({
        options: [],
        loading: false,
        error: 'Error al buscar opciones de compra'
      });
    }
  }, []);

  useEffect(() => {
    if (ean && productName) {
      generatePurchaseLinks(ean, productName);
    }
  }, [ean, productName, generatePurchaseLinks]);

  return {
    ...data,
    refetch: () => generatePurchaseLinks(ean, productName)
  };
};
