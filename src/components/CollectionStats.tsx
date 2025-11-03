import React from 'react';
import { Scale, PackageCheck } from 'lucide-react';
import { Collection } from '../types/collection';

interface CollectionStatsProps {
  collections: Collection[];
}

export default function CollectionStats({ collections }: CollectionStatsProps) {
  const totalCollections = collections.length;
  const totalTonnage = collections.reduce((sum, col) => sum + col.quantity, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-card p-4 flex items-center gap-4">
        <div className="text-primary">
          <PackageCheck className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Nombre de collectes</p>
          <p className="text-2xl font-semibold text-gray-900">{totalCollections}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card p-4 flex items-center gap-4">
        <div className="text-success">
          <Scale className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Tonnage total</p>
          <p className="text-2xl font-semibold text-gray-900">
            {totalTonnage.toFixed(2)} <span className="text-sm text-gray-500">tonnes</span>
          </p>
        </div>
      </div>
    </div>
  );
}