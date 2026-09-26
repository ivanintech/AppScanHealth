import { Sun } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { motion } from "framer-motion";

export function ThemeToggle() {
  return (
    <Button variant="ghost" size="sm" className="w-9 h-9 px-0" disabled>
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <Sun className="h-4 w-4" />
      </motion.div>
      <span className="sr-only">Tema claro (fijo)</span>
    </Button>
  );
}
