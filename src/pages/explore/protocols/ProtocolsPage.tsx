import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LoadingPage } from "@/shared/components/ui/ProfessionalLoading";
import { ArrowLeft, ChevronRight, Search, Filter, Star, Clock, Users, TrendingUp } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { ProtocolCard } from "@/pages/explore/protocols/ProtocolCard";
import { Protocol } from "@/shared/types/protocols";
import * as Icons from "lucide-react";

interface ProtocolGroup {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  protocols: Protocol[];
}

const ProtocolCardSkeleton = () => (
  <div className="space-y-2">
    <div className="animate-pulse bg-muted rounded-lg h-32 w-full"></div>
    <div className="animate-pulse bg-muted rounded h-4 w-3/4"></div>
    <div className="animate-pulse bg-muted rounded h-4 w-1/2"></div>
  </div>
);

const getColorClasses = (color: string) => {
  const colorMap = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };
  return colorMap[color as keyof typeof colorMap] || "bg-gray-50 border-gray-200 text-gray-700";
};

export const ProtocolsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [protocolGroups, setProtocolGroups] = useState<ProtocolGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const fetchProtocols = async () => {
      try {
        const response = await fetch('/data/protocols.json');
        const data = await response.json();
        
        // Usar directamente los grupos del JSON
        setProtocolGroups(data.groups || []);
      } catch (error) {
        console.error('Error loading protocols:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProtocols();
  }, []);

  const handleProtocolClick = (protocolId: string) => {
    navigate(`/protocol/${protocolId}`);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId);
  };

  // Filtrar protocolos basado en búsqueda y filtros
  const filteredProtocolGroups = protocolGroups.map(group => ({
    ...group,
    protocols: group.protocols.filter(protocol => {
      const matchesSearch = protocol.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           protocol.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           protocol.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDifficulty = selectedDifficulty === "all" || protocol.difficulty === selectedDifficulty;
      const matchesCategory = selectedCategory === "all" || protocol.category === selectedCategory;
      
      return matchesSearch && matchesDifficulty && matchesCategory;
    })
  })).filter(group => group.protocols.length > 0);

  // Obtener estadísticas
  const totalProtocols = protocolGroups.reduce((acc, group) => acc + group.protocols.length, 0);
  const totalSupplements = protocolGroups.reduce((acc, group) => 
    acc + group.protocols.reduce((sum, protocol) => sum + protocol.supplements.length, 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      <div className="max-w-md mx-auto">
        {/* Header mejorado */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => navigate('/explore')}
                 className="p-2"
               >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Protocolos</h1>
                <p className="text-sm text-muted-foreground">Planes de suplementación científicamente respaldados</p>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-primary">{totalProtocols}</div>
                <div className="text-xs text-muted-foreground">Protocolos</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-600">{totalSupplements}</div>
                <div className="text-xs text-muted-foreground">Suplementos</div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-600">{protocolGroups.length}</div>
                <div className="text-xs text-muted-foreground">Categorías</div>
              </div>
            </div>

            {/* Barra de búsqueda */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar protocolos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-border/50"
              />
            </div>

            {/* Filtros */}
            <div className="flex gap-2 mb-4">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">Todas las dificultades</option>
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">Todas las categorías</option>
                <option value="Fitness y Músculo">Fitness y Músculo</option>
                <option value="Salud y Bienestar">Salud y Bienestar</option>
                <option value="Descanso y Recuperación">Descanso y Recuperación</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Contenido principal */}
        <div className="p-4 space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg mb-2"></div>
              </div>
            ))
          ) : filteredProtocolGroups.length > 0 ? (
            filteredProtocolGroups.map((group, groupIndex) => {
            const IconComponent = Icons[group.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }> || Icons.BookOpen;
            const isExpanded = expandedGroup === group.id;
            
            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${getColorClasses(group.color)}`}
                  onClick={() => toggleGroup(group.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getColorClasses(group.color)}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{group.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{group.protocols.length} protocolos</span>
                        <ChevronRight 
                          className={`w-5 h-5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`} 
                        />
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {group.protocols.map((protocol, protocolIndex) => (
                          <motion.div
                            key={protocol.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: protocolIndex * 0.1 }}
                          >
                            <ProtocolCard 
                              protocol={protocol} 
                              onClick={() => handleProtocolClick(protocol.id)} 
                            />
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="mb-4">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron protocolos</h3>
              <p className="text-muted-foreground">Intenta ajustar los filtros o la búsqueda</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setSelectedDifficulty("all");
                setSelectedCategory("all");
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        )}
        </div>
      </div>
    </motion.div>
  );
};
