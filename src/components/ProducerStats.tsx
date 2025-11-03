import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Producer } from '../types/producer';
import { Collection } from '../types/collection';
import { StockEntry } from '../types/stock';
import { calculateProducerPerformance, rankProducers, getBadgeColor } from '../utils/producerRanking';
import { Users, Award, TrendingUp, Scale } from 'lucide-react';

interface ProducerStatsProps {
  producers: Producer[];
}

export default function ProducerStats({ producers }: ProducerStatsProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [stocks, setStocks] = useState<StockEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch collections
        const collectionsQuery = query(collection(db, 'collections'));
        const collectionsSnapshot = await getDocs(collectionsQuery);
        const collectionsData = collectionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate()
        })) as Collection[];
        setCollections(collectionsData);

        // Fetch stocks
        const stocksQuery = query(collection(db, 'stocks'));
        const stocksSnapshot = await getDocs(stocksQuery);
        const stocksData = stocksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate()
        })) as StockEntry[];
        setStocks(stocksData);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Calculate performance metrics
  const performances = producers.map(producer => 
    calculateProducerPerformance(producer, collections, stocks)
  );
  const rankedProducers = rankProducers(performances);

  // Calculate summary statistics
  const activeProducers = producers.filter(p => p.status === 'active');
  const totalArea = producers.reduce((sum, p) => sum + p.cultivatedArea, 0);
  const totalEstimatedProduction = producers.reduce((sum, p) => sum + p.estimatedProduction, 0);
  const totalActualProduction = collections.reduce((sum, c) => sum + c.quantity, 0);

  // Calculate badge distribution
  const badgeDistribution = {
    elite: rankedProducers.filter(p => p.badge === 'elite').length,
    premium: rankedProducers.filter(p => p.badge === 'premium').length,
    standard: rankedProducers.filter(p => p.badge === 'standard').length,
    new: rankedProducers.filter(p => p.badge === 'new').length
  };

  return (
    <div className="space-y-6 p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-card p-4 flex items-center gap-4">
          <div className="text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Producteurs actifs</p>
            <p className="text-2xl font-semibold text-gray-900">
              {activeProducers.length} <span className="text-sm text-gray-500">/ {producers.length}</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4 flex items-center gap-4">
          <div className="text-success">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Surface totale</p>
            <p className="text-2xl font-semibold text-gray-900">
              {totalArea} <span className="text-sm text-gray-500">ha</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4 flex items-center gap-4">
          <div className="text-warning">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Production réalisée</p>
            <p className="text-2xl font-semibold text-gray-900">
              {totalActualProduction.toFixed(1)} <span className="text-sm text-gray-500">tonnes</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4 flex items-center gap-4">
          <div className="text-info">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Score moyen</p>
            <p className="text-2xl font-semibold text-gray-900">
              {Math.round(rankedProducers.reduce((sum, p) => sum + p.score, 0) / rankedProducers.length)}
            </p>
          </div>
        </div>
      </div>

      {/* Performance Distribution */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Distribution des performances</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(badgeDistribution).map(([badge, count]) => (
            <div key={badge} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeColor(badge)}`}>
                  {badge.charAt(0).toUpperCase() + badge.slice(1)}
                </span>
                <span className="text-lg font-semibold text-gray-900">{count}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    badge === 'elite' ? 'bg-indigo-500' :
                    badge === 'premium' ? 'bg-emerald-500' :
                    badge === 'standard' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}
                  style={{ width: `${(count / producers.length) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {((count / producers.length) * 100).toFixed(1)}% des producteurs
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performances</h3>
        <div className="space-y-4">
          {rankedProducers.slice(0, 5).map((producer) => (
            <div key={producer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-gray-400">#{producer.rank}</span>
                <div>
                  <p className="font-medium text-gray-900">{producer.fullName}</p>
                  <p className="text-sm text-gray-500">
                    {producer.totalCollections} livraisons · {producer.totalWeight.toFixed(1)} tonnes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeColor(producer.badge)}`}>
                  {producer.badge.charAt(0).toUpperCase() + producer.badge.slice(1)}
                </span>
                <span className="text-lg font-semibold text-gray-900">{Math.round(producer.score)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}