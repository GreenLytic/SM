import React, { useState, useEffect } from 'react';
import { Collection } from '../types/collection';
import { format } from 'date-fns';
import { Package, Plus, Check, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { updateStockValue } from '../services/financeService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PriceSettings } from '../types/finance';
import { InvoiceService } from './InvoiceService';

interface StockCreationFormProps {
  onClose: () => void;
  onSubmit: (selectedCollections: Collection[]) => Promise<void>;
  collections: Collection[];
  producerName: (id: string) => string;
}

export default function StockCreationForm({
  onClose,
  onSubmit,
  collections,
  producerName
}: StockCreationFormProps) {
  const [selectedCollections, setSelectedCollections] = useState<Collection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupByProducer, setGroupByProducer] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceSettings, setPriceSettings] = useState<PriceSettings | null>(null);

  useEffect(() => {
    const fetchPriceSettings = async () => {
      try {
        const priceQuery = query(
          collection(db, 'priceSettings'),
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(priceQuery);
        if (!snapshot.empty) {
          setPriceSettings({
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data(),
            effectiveDate: snapshot.docs[0].data().effectiveDate?.toDate()
          } as PriceSettings);
        }
      } catch (error) {
        console.error('Error fetching price settings:', error);
      }
    };

    fetchPriceSettings();
  }, []);

  const calculateStockValue = (quantity: number, quality: 'A' | 'B' | 'C'): { pricePerTon: number; totalCost: number } => {
    if (!priceSettings) return { pricePerTon: 0, totalCost: 0 };

    // Calculate price per kg including all premiums
    const basePrice = priceSettings.basePrice;
    const qualityPremium = priceSettings.qualityPremiums[quality];
    const certificationPremiums = priceSettings.certifications.reduce(
      (sum, cert) => sum + cert.premium,
      0
    );

    // Total price per kg
    const pricePerKg = basePrice + qualityPremium + certificationPremiums;
    
    // Convert to price per ton
    const pricePerTon = Math.round(pricePerKg * 1000);
    
    // Calculate total cost
    const totalCost = Math.round(pricePerTon * quantity);
    
    console.log('Price calculation:', {
      basePrice,
      qualityPremium,
      certificationPremiums,
      pricePerKg,
      pricePerTon,
      quantity,
      totalCost
    });

    return { pricePerTon, totalCost };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (selectedCollections.length === 0) {
      toast.error('Veuillez sélectionner au moins une collection disponible');
      return;
    }

    if (selectedCollections.length === 0) {
      toast.error('Veuillez sélectionner au moins une collection');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Group collections by producer
      const collectionsByProducer: Record<string, Collection[]> = {};
      selectedCollections.forEach(collection => {
        if (!collectionsByProducer[collection.producerId]) {
          collectionsByProducer[collection.producerId] = [];
        }
        collectionsByProducer[collection.producerId].push(collection);
      });

      // Create a stock for each producer
      for (const [producerId, collections] of Object.entries(collectionsByProducer)) {
        // Calculate total quantity and average humidity
        const totalQuantity = collections.reduce((sum, col) => sum + col.quantity, 0);
        const avgHumidity = collections.reduce((sum, col) => sum + col.humidity, 0) / collections.length;
        const totalBags = collections.reduce((sum, col) => sum + (col.bagCount || 0), 0);
        
        // Determine quality (use the best quality among collections)
        const qualityPriority = { 'A': 3, 'B': 2, 'C': 1 };
        const bestQuality = collections.reduce((best, col) => {
          return qualityPriority[col.quality] > qualityPriority[best] ? col.quality : best;
        }, 'C' as 'A' | 'B' | 'C');

        // Calculate stock value based on price settings
        const { pricePerTon, totalCost } = calculateStockValue(totalQuantity, bestQuality);

        // Generate stock number
        const stockNumber = `STK-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        // Create stock entry
        const stockData = {
          stockNumber,
          collections: collections.map(c => c.id!),
          producerId,
          warehouseId: '',
          date: new Date(),
          quantity: totalQuantity,
          quality: bestQuality,
          humidity: avgHumidity,
          originalQuantity: totalQuantity, // Stocker la quantité initiale
          originalBagCount: totalBags, // Stocker le nombre de sacs initial
          pricePerTon,
          totalCost: pricePerTon * totalQuantity, // prix/tonne * quantité initiale
          paymentStatus: 'pending',
          amountPaid: 0,
          notes: collections.map(c => c.notes).filter(Boolean).join(' | '),
          bagCount: collections.reduce((sum, col) => sum + (col.bagCount || 0), 0)
        };

        // Add to stocks collection
        const stockRef = await addDoc(collection(db, 'stocks'), stockData);
        
        // Create invoice for the stock
        await InvoiceService.createFromStock({ ...stockData, id: stockRef.id });
        
        // Update collections to mark them as processed
        for (const col of collections) {
          await updateDoc(doc(db, 'collections', col.id!), {
            processedToStock: true,
            stockId: stockRef.id
          });
        }
      }
      
      // Update financial data after stock creation
      await updateStockValue();
      
      // Ensure invoices are created for all stocks
      await InvoiceService.ensureInvoicesForAllStocks();
      
      toast.success('Stock(s) créé(s) avec succès');
      onClose();
    } catch (error) {
      console.error('Error creating stock:', error);
      toast.error('Erreur lors de la création du stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollectionToggle = (collection: Collection) => {
    if (selectedCollections.find(c => c.id === collection.id)) {
      setSelectedCollections(prev => prev.filter(c => c.id !== collection.id));
    } else {
      setSelectedCollections(prev => [...prev, collection]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCollections.length === filteredCollections.length) {
      setSelectedCollections([]);
    } else {
      setSelectedCollections(filteredCollections);
    }
  };

  const totalQuantity = selectedCollections.reduce((sum, col) => sum + col.quantity, 0);
  const averageHumidity = selectedCollections.length > 0
    ? selectedCollections.reduce((sum, col) => sum + col.humidity, 0) / selectedCollections.length
    : 0;
  const totalBags = selectedCollections.reduce((sum, col) => sum + (col.bagCount || 0), 0);

  // Filter collections based on search query
  // Make sure we're only working with collections that haven't been processed to stock yet
  const availableCollections = collections.filter(c => !c.processedToStock);
  
  const filteredCollections = availableCollections.filter(collection => {
    const producer = producerName(collection.producerId);
    return (
      producer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      format(collection.date, 'dd/MM/yyyy').includes(searchQuery)
    );
  });

  // Group collections by producer if needed
  const groupedCollections = groupByProducer 
    ? filteredCollections.reduce((groups, collection) => { 
        const producerId = collection.producerId;
        if (!groups[producerId]) {
          groups[producerId] = [];
        }
        groups[producerId].push(collection);
        return groups;
      }, {} as Record<string, Collection[]>)
    : null;

  const getGradeColor = (grade?: string) => {
    if (!grade) return '';
    
    switch (grade) {
      case 'Grade I': return 'bg-green-100 text-green-800';
      case 'Grade II': return 'bg-yellow-100 text-yellow-800';
      case 'Refusé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (availableCollections.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
          <Package className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            Créer un stock
          </h2>
        </div>

        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucune collection disponible pour créer un stock</p>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
        <Package className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          Créer un stock
        </h2>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Comment créer un stock</p>
            <p className="text-xs text-blue-700 mt-1">
              Sélectionnez une ou plusieurs collections pour créer un stock. Si vous sélectionnez des collections de différents producteurs, un stock sera créé pour chaque producteur.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="group-by-producer"
                checked={groupByProducer}
                onChange={() => setGroupByProducer(!groupByProducer)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="group-by-producer" className="text-sm text-gray-700">
                Grouper par producteur
              </label>
            </div>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedCollections.length === filteredCollections.length ? 'Désélectionner tout' : 'Sélectionner tout'}
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto pr-2 border border-gray-200 rounded-lg">
          {groupByProducer && groupedCollections ? (
            // Grouped by producer
            Object.entries(groupedCollections).map(([producerId, producerCollections]) => (
              <div key={producerId} className="border-b border-gray-200 last:border-b-0">
                <div className="bg-gray-50 p-3 font-medium text-gray-900">
                  {producerName(producerId)} ({producerCollections.length} collections)
                </div>
                <div className="space-y-2 p-2">
                  {producerCollections.map((collection) => (
                    <label
                      key={collection.id}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedCollections.some(c => c.id === collection.id)
                          ? 'bg-blue-50 hover:bg-blue-100'
                          : 'bg-white hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCollections.some(c => c.id === collection.id)}
                        onChange={() => handleCollectionToggle(collection)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            Collection du {format(collection.date, 'dd/MM/yyyy')}
                          </span>
                          <span className="text-sm text-gray-500">
                            {collection.quantity} tonnes
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm text-gray-500">
                            {collection.bagCount || 'N/A'} sacs
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                              collection.quality === 'A'
                                ? 'bg-green-100 text-green-700'
                                : collection.quality === 'B'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              Qualité {collection.quality}
                            </span>
                            {collection.calculatedGrade && (
                              <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getGradeColor(collection.calculatedGrade)}`}>
                                {collection.calculatedGrade}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Flat list
            <div className="space-y-2 p-2">
              {filteredCollections.map((collection) => (
                <label
                  key={collection.id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedCollections.some(c => c.id === collection.id)
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'bg-white hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCollections.some(c => c.id === collection.id)}
                    onChange={() => handleCollectionToggle(collection)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {producerName(collection.producerId)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {format(collection.date, 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-sm text-gray-500">
                        {collection.quantity} tonnes • {collection.bagCount || 'N/A'} sacs
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                          collection.quality === 'A'
                            ? 'bg-green-100 text-green-700'
                            : collection.quality === 'B'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          Qualité {collection.quality}
                        </span>
                        {collection.calculatedGrade && (
                          <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getGradeColor(collection.calculatedGrade)}`}>
                            {collection.calculatedGrade}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {selectedCollections.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Résumé du stock</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-blue-700">Collections</p>
                <p className="text-lg font-semibold text-blue-900">{selectedCollections.length}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Quantité totale</p>
                <p className="text-lg font-semibold text-blue-900">{totalQuantity.toFixed(2)} tonnes</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Nombre de sacs</p>
                <p className="text-lg font-semibold text-blue-900">{totalBags}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Humidité moyenne</p>
                <p className="text-lg font-semibold text-blue-900">{averageHumidity.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}
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
          disabled={isSubmitting || selectedCollections.length === 0}
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
              <span>Créer le stock</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}