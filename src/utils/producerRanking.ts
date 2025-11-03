import { Collection } from '../types/collection';
import { StockEntry } from '../types/stock';
import { Producer } from '../types/producer';

export interface ProducerPerformance {
  id: string;
  fullName: string;
  totalCollections: number;
  totalWeight: number;
  averageQuality: number;
  totalValue: number;
  score: number;
  rank?: number;
  badge: 'elite' | 'premium' | 'standard' | 'new';
}

export const calculateProducerPerformance = (
  producer: Producer,
  collections: Collection[],
  stocks: StockEntry[]
): ProducerPerformance => {
  // Filter collections and stocks for this producer
  const producerCollections = collections.filter(c => c.producerId === producer.id);
  const producerStocks = stocks.filter(s => s.producerId === producer.id);

  // Calculate base metrics
  const totalCollections = producerCollections.length;
  const totalWeight = producerCollections.reduce((sum, col) => sum + col.quantity, 0);
  
  // Calculate quality score (A=3, B=2, C=1)
  const qualityPoints = producerCollections.reduce((sum, col) => {
    switch (col.quality) {
      case 'A': return sum + 3;
      case 'B': return sum + 2;
      case 'C': return sum + 1;
      default: return sum;
    }
  }, 0);
  
  const averageQuality = totalCollections > 0 ? qualityPoints / totalCollections : 0;

  // Calculate total value from stocks
  const totalValue = producerStocks.reduce((sum, stock) => sum + stock.totalCost, 0);

  // Calculate overall score (max 100 points)
  const weightScore = Math.min((totalWeight / producer.estimatedProduction) * 30, 30); // Max 30 points for volume
  const qualityScore = (averageQuality / 3) * 40; // Max 40 points for quality
  const regularityScore = Math.min((totalCollections / 12) * 20, 20); // Max 20 points for regularity (12 collections per year)
  const valueScore = Math.min((totalValue / 1000000) * 10, 10); // Max 10 points for value (1M = max points)

  const score = weightScore + qualityScore + regularityScore + valueScore;

  // Determine badge based on score
  let badge: 'elite' | 'premium' | 'standard' | 'new';
  if (score >= 80) badge = 'elite';
  else if (score >= 60) badge = 'premium';
  else if (score >= 30) badge = 'standard';
  else badge = 'new';

  return {
    id: producer.id!,
    fullName: producer.fullName,
    totalCollections,
    totalWeight,
    averageQuality,
    totalValue,
    score,
    badge
  };
};

export const rankProducers = (performances: ProducerPerformance[]): ProducerPerformance[] => {
  // Sort by score in descending order and assign ranks
  return performances
    .sort((a, b) => b.score - a.score)
    .map((perf, index) => ({
      ...perf,
      rank: index + 1
    }));
};

export const getPerformanceColor = (score: number): string => {
  if (score >= 80) return 'text-indigo-600';
  if (score >= 60) return 'text-emerald-600';
  if (score >= 30) return 'text-blue-600';
  return 'text-gray-600';
};

export const getBadgeColor = (badge: string): string => {
  switch (badge) {
    case 'elite': return 'bg-indigo-100 text-indigo-800';
    case 'premium': return 'bg-emerald-100 text-emerald-800';
    case 'standard': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};