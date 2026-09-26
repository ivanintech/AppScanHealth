import * as Icons from "lucide-react";

export interface SupplementInProtocol {
  name: string;
  dosage: string;
  timing: string;
  rationale: string;
  ean: string;
}

export interface Protocol {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  coverImage: string;
  difficulty: string;
  duration: string;
  supplements: SupplementInProtocol[];
  content: string;
}

