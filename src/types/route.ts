export interface CollectionRoute {
  id?: string;
  name: string;
  date: Date;
  startTime: string;
  endTime?: string;
  driver: string;
  participants?: string[]; // Liste des accompagnants
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  stops: RouteStop[];
  notes?: string;
  completedAt?: Date;
  startLocation?: string;
  endLocation?: string;
  useCooperativeAsStart?: boolean;
  useCooperativeAsEnd?: boolean;
}

export interface RouteStop {
  producerId: string;
  location: string;
  status: 'pending' | 'completed' | 'cancelled';
  estimatedTime?: string;
  estimatedQuantity?: number;
  quality?: 'A' | 'B' | 'C';
  humidity?: number;
  notes?: string;
  bagCount?: number; // Added field for number of bags
  
  // Quality assessment fields
  mouldyBeans?: number;
  flatBeans?: number;
  violetBeans?: number;
  germinatedBeans?: number;
  insectDamagedBeans?: number;
  foreignMatter?: number;
}