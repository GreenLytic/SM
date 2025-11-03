import React, { useState, useEffect } from 'react';
import { StockEntry } from '../../types/stock';
import { format } from 'date-fns';
import { Layers, Check, Info, Search, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface StockGroupFormProps {
  onClose: () => void;
  onSubmit: (name: string, notes?: string) => Promise<void>;
  selectedStocks: StockEntry[];
  availableStocks: StockEntry[];
  producerNames: Record<string, string>;
}

export default function StockGroupForm({
  onClose,
  onSubmit,
  selectedStocks,
  availableStocks,
  producerNames
}: StockGroupFormProps) {
  const [groupName, setGroupName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stocksToAdd, setStocksToAdd] = useState<StockEntry[]>([]);

  // Generate a suggested name for the group
  useEffect(() => {
    if (selectedStocks.length >= 2) {
      const today = format(new Date(), 'yyyyMMdd');
      const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
      setGroupName(`LOT-${today}-${randomPart}`);
    } else {
      setGroupName('');
    }
  }, [selectedStocks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const allSelectedStocks = [...selectedStocks, ...stocksToAdd];

    if (allSelectedStocks.length < 2) {
      toast.error('Veuillez sélectionner au moins deux stocks');
      return;
    }

    if (!groupName.trim()) {
      toast.error('Veuillez entrer un nom pour le lot');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(groupName, notes);
      onClose();
    } catch (error) {
      console.error('Error creating stock group:', error);
      toast.error('Erreur lors de la création du lot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStock = (stock: StockEntry) => {
    if (stocksToAdd.some(s => s.id === stock.id) || selectedStocks.some(s => s.id === stock.id)) {
      return;
    }
    setStocksToAdd([...stocksToAdd, stock]);
  };

  const handleRemoveStock = (stockId: string) => {
    setStocksToAdd(stocksToAdd.filter(s => s.id !== stockId));
  };

  // Filter available stocks based on search query
  const filteredStocks = availableStocks.filter(stock => {
    // Exclude stocks that are already selected or added
    if (selectedStocks.some(s => s.id === stock.id) || stocksToAdd.some(s => s.id === stock.id)) {
      return false;
    }
    
    // Exclude stocks that are already in a group
    if (stock.isGrouped) {
      return false;
    }
    
    // Search filter
    const producerName = producerNames[stock.producerId] || '';
    const stockNumberMatch = stock.stockNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const producerMatch = producerName.toLowerCase().includes(searchQuery.toLowerCase());
    return stockNumberMatch || producerMatch;
  });

  // Calculate totals
  const allStocks = [...selectedStocks, ...stocksToAdd];
  const totalQuantity = allStocks.reduce((sum, stock) => sum + stock.quantity, 0);
  const totalBags = allStocks.reduce((sum, stock) => sum + (stock.bagCount || 0), 0);
  const uniqueProducers = [...new Set(allStocks.map(stock => stock.producerId))];
  const uniqueWarehouses = [...new Set(allStocks.map(stock => stock.warehouseId).filter(Boolean))];

  const getGradeColor = (quality: string) => {
    switch (quality) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-yellow-100 text-yellow-800';
      case 'C': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
        <Layers className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          Créer un lot combiné
        </h2>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Regroupement visuel de stocks</p>
            <p className="text-xs text-blue-700 mt-1">
              Ce regroupement est uniquement visuel et n'affecte pas les données réelles des stocks.
              Les stocks individuels restent inchangés et disponibles pour toutes les opérations habituelles.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom du lot
        </label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Entrez un nom pour le lot combiné"
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optionnel)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Informations supplémentaires sur ce lot..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* Add more stocks section */}
      {selectedStocks.length === 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ajouter des stocks au lot
          </label>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par n° stock ou producteur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredStocks.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Aucun stock disponible
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredStocks.slice(0, 10).map((stock) => (
                  <div key={stock.id} className="p-3 hover:bg-gray-50 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">Stock #{stock.stockNumber}</p>
                      <p className="text-sm text-gray-500">{producerNames[stock.producerId]}</p>
                      <p className="text-sm text-gray-500">{stock.quantity.toFixed(2)} tonnes • {stock.bagCount || 0} sacs</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddStock(stock)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Résumé du lot</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-blue-700">Stocks</p>
            <p className="text-lg font-semibold text-blue-900">{allStocks.length}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Producteurs</p>
            <p className="text-lg font-semibold text-blue-900">{uniqueProducers.length}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Quantité totale</p>
            <p className="text-lg font-semibold text-blue-900">{totalQuantity.toFixed(2)} tonnes</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Nombre de sacs</p>
            <p className="text-lg font-semibold text-blue-900">{totalBags}</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Stocks sélectionnés</h4>
        <div className="max-h-64 overflow-y-auto pr-2 border border-gray-200 rounded-lg">
          <div className="space-y-2 p-2">
            {allStocks.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Aucun stock sélectionné
              </div>
            ) : (
              allStocks.map((stock) => (
                <div key={stock.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Stock #{stock.stockNumber}</p>
                      <p className="text-xs text-gray-500">{producerNames[stock.producerId]}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{stock.quantity.toFixed(2)} tonnes</p>
                      <p className="text-xs text-gray-500">{stock.bagCount || 0} sacs</p>
                    </div>
                    {stocksToAdd.some(s => s.id === stock.id) && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStock(stock.id!)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting || allStocks.length < 2 || !groupName.trim()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Création...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Créer le lot</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}