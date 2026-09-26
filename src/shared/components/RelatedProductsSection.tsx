import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Package, Star, ChevronRight, Award, Shield, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRelatedProducts } from '@/features/stack/hooks/useRelatedProducts';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatProductInfo, getBrandFromTags, getCategoryFromTags, getLabelsFromTags } from '@/shared/lib/utils';

interface RelatedProductsSectionProps {
  currentEan: string;
  currentCategories: string;
  currentProductName: string;
}

const ProductCard = ({ product, onClick }: { product: any; onClick: () => void }) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex-shrink-0 w-64 cursor-pointer"
    >
      <Card className="h-full hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Imagen del producto */}
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.product_name}
                className="w-14 h-14 rounded-lg object-cover border border-border flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center border border-border flex-shrink-0 ${product.image_url ? 'hidden' : ''}`}>
              <Package className="w-7 h-7 text-primary" />
            </div>

            {/* Información del producto */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                  {product.product_name}
                </h3>
                {product.calculated_score && (
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <Award className={`w-4 h-4 ${formatProductInfo(product).scoreColor}`} />
                    <span className={`text-xs font-medium ${formatProductInfo(product).scoreColor}`}>
                      {product.calculated_score}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    {getBrandFromTags(product.brands_tags)}
                  </span>
                  {/* {formatProductInfo(product).isSupplement && (
                    <Shield className="w-3 h-3 text-green-600" />
                  )} */}
                </div>

                {/* <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {getCategoryFromTags(product.categories_tags)}
                  </Badge>
                  {formatProductInfo(product).hasLabels && (
                    <Leaf className="w-3 h-3 text-green-600" />
                  )}
                </div> */}

                {/* {formatProductInfo(product).labels.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formatProductInfo(product).labels.slice(0, 2).map((label, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0.5">
                        {label}
                      </Badge>
                    ))}
                  </div>
                )} */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const LoadingSkeleton = () => (
  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="flex-shrink-0 w-64">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="w-14 h-14 rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-20" />
                <div className="flex gap-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ))}
  </div>
);

export const RelatedProductsSection: React.FC<RelatedProductsSectionProps> = ({
  currentEan,
  currentCategories,
  currentProductName
}) => {
  const navigate = useNavigate();
  const { data: relatedProducts, isLoading, error } = useRelatedProducts(currentEan, currentCategories, currentProductName);

  const handleProductClick = (ean: string) => {
    navigate(`/supplement/${ean}`);
  };

  const handleVerTodos = () => {
    navigate('/stack');
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Productos Relacionados</h3>
        </div>
        <LoadingSkeleton />
      </motion.div>
    );
  }

  if (error || !relatedProducts || relatedProducts.length === 0) {
    return null; // No mostrar la sección si no hay productos relacionados
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.9 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Productos Relacionados</h3>
        <Button variant="ghost" size="sm" className="text-primary" onClick={handleVerTodos}>
          Ver todos
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {relatedProducts.map((product) => (
          <ProductCard
            key={product.ean}
            product={product}
            onClick={() => handleProductClick(product.ean)}
          />
        ))}
      </div>
    </motion.div>
  );
};
