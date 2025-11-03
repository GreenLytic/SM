export interface StockEntry {
  id?: string;
  stockNumber: string;
  collections: string[];
  producerId: string;
  warehouseId: string;
  date: Date;
  quantity: number;
  quality: 'A' | 'B' | 'C';
  humidity: number;
  pricePerTon: number;
  totalCost: number;
  paymentStatus: 'pending' | 'partial' | 'completed';
  status?: 'available' | 'assigned' | 'delivered' | 'partially_delivered' | 'combined' | 'monitored';
  amountPaid: number;
  notes?: string;
  lotId?: string;
  lastDryingConfirmation?: Date;
  lastNotification?: Date;
  bagCount?: number;
  collectionGrade?: string;
  deliveredAt?: Date;
  deliveredQuantity?: number;
  originalQuantity: number; // Quantité initiale de la collecte
  originalBagCount: number; // Nombre de sacs initial de la collecte
  
  // Fields for stock grouping
  isGrouped?: boolean;
  groupId?: string;
  
  // Fields for stock combination
  isCombined?: boolean;
  combinedIntoStock?: string;
  multipleProducers?: boolean;
  producerInfo?: Array<{
    producerId: string;
    quantity: number;
    bagCount: number;
    stockIds: string[];
  }>;
  
  // Quality assessment fields
  mouldyBeans?: number;
  flatBeans?: number;
  violetBeans?: number;
  germinatedBeans?: number;
  insectDamagedBeans?: number;
  foreignMatter?: number;
  calculatedGrade?: 'Grade I' | 'Grade II' | 'Refusé';
  qualityNotes?: string;
  evaluatedAt?: Date; 
}

export interface StockGroup {
  id?: string;
  name: string;
  stockIds: string[]; 
  totalQuantity: number;
  remainingQuantity?: number;
  deliveredQuantity?: number;
  totalBags: number;
  remainingBags?: number;
  deliveredBags?: number;
  warehouseIds: string[];
  producerIds: string[];
  createdAt: Date;
  notes?: string;
  archived?: boolean;
  archivedAt?: Date;
  deleted?: boolean;
  status?: 'available' | 'partially_delivered' | 'delivered';
  locked?: boolean;
  updatedAt?: Date;
}

export interface StockStats {
  totalQuantity: number;
  totalValue: number;
}