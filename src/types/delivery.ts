import { Timestamp } from 'firebase/firestore';

export interface DeliveryOrder {
  id?: string;
  orderNumber: string;
  buyerName: string;
  deliveryDate: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  products: DeliveryProduct[];
  totalWeight: number;
  buyerWeight?: number;
  weightLoss?: number;
  deliveryAddress: string;
  vehicleInfo: string;
  driverInfo: string;
  notes?: string;
  trackingUpdates: TrackingUpdate[];
  costs?: DeliveryCosts;
  warehouseIds: string[];
  completedAt?: Date;
  destination?: 'San Pedro' | 'Abidjan' | 'Autre';
  partialDelivery?: boolean;
  qualityCertificateGenerated?: boolean;
  deliveryNoteGenerated?: boolean;
  proformaInvoiceGenerated?: boolean;
  logisticLabelGenerated?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DeliveryProduct {
  stockId: string;
  warehouseId: string;
  quantity: number;
  originalQuantity?: number;
  quality: 'A' | 'B' | 'C';
  lotId?: string;
  isPartial?: boolean;
  bagCount?: number;
  stockNumber?: string;
  reservedAt?: Date;
}

export interface TrackingUpdate {
  timestamp: Date;
  location: string;
  status: string;
  notes?: string;
  updatedBy?: string;
}

export interface DeliveryCosts {
  roadFees: number;
  fuelCost: number;
  vehicleRental: number;
  loadingCost: number;
  unloadingCost: number;
  otherCosts: number;
  notes?: string;
  totalCost: number;
  sellingPrice: number;
  profit: number;
  buyerReimbursement: number;
  pricePerKg?: number;
  purchaseCost?: number;
}

export interface StockReservation {
  id?: string;
  itemId: string; // stockId or lotId
  type: 'stock' | 'lot';
  userId: string;
  deliveryOrderId?: string;
  quantity: number;
  reservedAt: Date;
  expiresAt: Date;
  confirmed?: boolean;
  confirmedAt?: Date;
}

export interface Claim {
  id?: string;
  deliveryId: string;
  orderNumber: string;
  buyerName: string;
  date: Date;
  type: 'quality' | 'quantity' | 'delay' | 'damage' | 'other';
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  description: string;
  resolution?: string;
  attachments?: string[];
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  resolvedAt?: Date;
}