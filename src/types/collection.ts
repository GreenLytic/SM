import { Timestamp } from 'firebase/firestore';

export interface Collection {
  id?: string;
  producerId: string;
  date: Date;
  quantity: number;
  quality: 'A' | 'B' | 'C';
  humidity: number;
  notes?: string;
  employeeIds: string[];
  routeId?: string; // Added field to link collection to route
  bagCount?: number; // Added field for number of bags
  processedToStock?: boolean; // Flag to track if collection has been processed to stock
  stockId?: string; // Reference to the stock created from this collection
  
  // Quality assessment fields
  mouldyBeans?: number; // Percentage of mouldy beans
  flatBeans?: number; // Percentage of flat/slate beans
  violetBeans?: number; // Percentage of violet beans (included in flat)
  germinatedBeans?: number; // Percentage of germinated beans
  insectDamagedBeans?: number; // Percentage of insect-damaged beans
  foreignMatter?: number; // Percentage of foreign matter/debris
  calculatedGrade?: 'Grade I' | 'Grade II' | 'Refusé'; // Automatically calculated grade
  qualityNotes?: string; // Notes about quality assessment
}

export interface CollectionStats {
  totalQuantity: number;
  averageQuality: string;
}