import React, { useState, useEffect } from 'react';
import { addDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CollectionRoute, RouteStop } from '../../types/route';
import { Collection } from '../../types/collection';
import { StockEntry } from '../../types/stock';
import { Producer } from '../../types/producer';
import { PriceSettings } from '../../types/finance';
import { InvoiceService } from '../InvoiceService';
import { Truck, Save, AlertTriangle, Users, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { calculateGrade } from '../../utils/qualityGrading';

interface RouteCompletionFormProps {
  onClose: () => void;
  onSubmit: (stops: RouteStop[]) => Promise<void>;
  route: CollectionRoute;
  producers: Producer[];
}

export default function RouteCompletionForm({ onClose, onSubmit, route, producers }: RouteCompletionFormProps) {
  const [stops, setStops] = useState<RouteStop[]>(route.stops);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priceSettings, setPriceSettings] = useState<PriceSettings | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPriceSettings = async () => {
      try {
        setIsLoading(true);
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
        } else {
          console.warn('No active price settings found');
        }
      } catch (error) {
        console.error('Error fetching price settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriceSettings();
  }, []);

  const validateStops = () => {
    const errors: string[] = [];
    let hasInvalidStop = false;

    stops.forEach((stop, index) => {
      if (stop.status !== 'completed' && stop.status !== 'cancelled') {
        errors.push(`L'arrêt ${index + 1} doit être soit complété soit annulé`);
        hasInvalidStop = true;
        return;
      }

      if (stop.status === 'completed') {
        if (!stop.estimatedQuantity || stop.estimatedQuantity <= 0) {
          errors.push(`L'arrêt ${index + 1} nécessite une quantité valide`);
          hasInvalidStop = true;
        }
        if (!stop.humidity || stop.humidity < 0 || stop.humidity > 100) {
          errors.push(`L'arrêt ${index + 1} nécessite un taux d'humidité valide (0-100%)`);
          hasInvalidStop = true;
        }
        if (!stop.bagCount || stop.bagCount <= 0) {
          errors.push(`L'arrêt ${index + 1} nécessite un nombre de sacs valide`);
          hasInvalidStop = true;
        }
      }
      
      // For cancelled stops, we only need a reason
      if (stop.status === 'cancelled' && (!stop.notes || stop.notes.trim() === '')) {
        errors.push(`L'arrêt ${index + 1} nécessite une raison d'annulation`);
        hasInvalidStop = true;
      }
    });

    setValidationErrors(errors);
    return !hasInvalidStop;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateStops()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Process completed stops
      for (const stop of stops.filter(s => s.status === 'completed')) {
        if (!stop.estimatedQuantity || !stop.humidity) continue;
        
        // Calculate stock value based on price settings
        const { pricePerTon, totalCost } = calculateStockValue(stop.estimatedQuantity, stop.quality || 'A');

        // Create collection
        const collectionData: Omit<Collection, 'id'> = {
          producerId: stop.producerId,
          date: new Date(),
          quantity: stop.estimatedQuantity,
          quality: 'A', // Default value, will be updated based on quality assessment
          humidity: stop.humidity,
          notes: stop.notes || '',
          employeeIds: route.participants || [],
          routeId: route.id, // Link collection to route
          bagCount: stop.bagCount || 0,
          processedToStock: false
        };

        // Perform quality assessment if we have the data
        if (stop.mouldyBeans !== undefined && 
            stop.flatBeans !== undefined && 
            stop.germinatedBeans !== undefined && 
            stop.insectDamagedBeans !== undefined && 
            stop.foreignMatter !== undefined) {
          
          const qualityResult = calculateGrade({
            mouldyBeans: stop.mouldyBeans,
            flatBeans: stop.flatBeans,
            violetBeans: stop.violetBeans || 0,
            germinatedBeans: stop.germinatedBeans,
            insectDamagedBeans: stop.insectDamagedBeans,
            foreignMatter: stop.foreignMatter,
            humidity: stop.humidity
          });
          
          collectionData.mouldyBeans = stop.mouldyBeans;
          collectionData.flatBeans = stop.flatBeans;
          collectionData.violetBeans = stop.violetBeans;
          collectionData.germinatedBeans = stop.germinatedBeans;
          collectionData.insectDamagedBeans = stop.insectDamagedBeans;
          collectionData.foreignMatter = stop.foreignMatter;
          collectionData.calculatedGrade = qualityResult.grade;
          collectionData.qualityNotes = qualityResult.comments;
          
          // Update quality based on calculated grade
          collectionData.quality = qualityResult.grade === 'Grade I' ? 'A' : 
                                  qualityResult.grade === 'Grade II' ? 'B' : 'C';
        }

        const collectionRef = await addDoc(collection(db, 'collections'), collectionData);

        // Generate stock number
        const stockNumber = `STK-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Calculate stock value if price settings are available
        let finalPricePerTon = 0;
        let finalTotalCost = 0;
        
        if (priceSettings) {
          const { pricePerTon: calculatedPricePerTon, totalCost: calculatedTotalCost } = 
            calculateStockValue(stop.estimatedQuantity, collectionData.quality);
          
          finalPricePerTon = calculatedPricePerTon;
          finalTotalCost = calculatedTotalCost;
        }

        // Create stock entry
        const stockData: Omit<StockEntry, 'id'> = {
          stockNumber,
          collections: [collectionRef.id],
          producerId: stop.producerId,
          warehouseId: '',
          date: new Date(),
          quantity: stop.estimatedQuantity,
          quality: collectionData.quality,
          humidity: stop.humidity,
          originalQuantity: stop.estimatedQuantity, // Stocker la quantité initiale
          originalBagCount: stop.bagCount || 0, // Stocker le nombre de sacs initial
          pricePerTon: finalPricePerTon,
          totalCost: finalPricePerTon * stop.estimatedQuantity, // prix/tonne * quantité initiale
          paymentStatus: 'pending',
          amountPaid: 0,
          notes: stop.notes || '',
          bagCount: stop.bagCount || 0
        };

        // Create stock and invoice
        const stockRef = await addDoc(collection(db, 'stocks'), stockData);
        
        // Create invoice for the stock
        await InvoiceService.createFromStock({ ...stockData, id: stockRef.id });
      }

      await onSubmit(stops);
      toast.success('Tournée terminée et collectes enregistrées');
      onClose();
    } catch (error) {
      console.error('Error completing route:', error);
      toast.error('Une erreur est survenue lors de la finalisation de la tournée');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateStockValue = (quantity: number, quality: 'A' | 'B' | 'C'): { pricePerTon: number; totalCost: number } => {
    if (!priceSettings) return { pricePerTon: 0, totalCost: 0 };

    // Calculate price per kg including quality premium and certification premiums
    const basePrice = priceSettings.basePrice;
    const qualityPremium = priceSettings.qualityPremiums[quality];
    const certificationPremiums = priceSettings.certifications.reduce(
      (sum, cert) => sum + cert.premium,
      0
    );

    // Total price per kg
    const pricePerKg = basePrice + qualityPremium + certificationPremiums;

    // Convert to price per ton
    const pricePerTon = pricePerKg * 1000;
    
    // Calculate total cost
    const totalCost = Math.round(pricePerTon * quantity);

    return { pricePerTon, totalCost };
  };

  const getProducerName = (producerId: string): string => {
    const producer = producers.find(p => p.id === producerId);
    return producer ? producer.fullName : 'Producteur inconnu';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F5E1E]"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
        <Truck className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          Finalisation de la tournée
        </h2>
      </div>

      {/* Participants section */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-medium text-blue-800">Intervenants</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 w-24">Chauffeur:</span>
            <span className="text-sm text-gray-900">{route.driver}</span>
          </div>
          {route.participants && route.participants.length > 0 && (
            <div className="flex items-start">
              <span className="text-sm font-medium text-gray-700 w-24">Accompagnants:</span>
              <div className="flex-1">
                {route.participants.map((participant, index) => (
                  <div key={index} className="text-sm text-gray-900">{participant}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="text-sm font-medium text-red-800">Erreurs de validation</h3>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-sm text-red-600">{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-6">
        {stops.map((stop, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-base font-medium text-gray-900">
                {getProducerName(stop.producerId)}
              </h3>
              <select
                value={stop.status}
                onChange={(e) => {
                  const newStatus = e.target.value as RouteStop['status'];
                  setStops(prev => prev.map((s, i) => 
                    i === index ? {
                      ...s,
                      status: newStatus,
                      ...(newStatus === 'cancelled' && {
                        estimatedQuantity: null,
                        quality: null,
                        humidity: null,
                        bagCount: null,
                        // Keep notes field for cancelled stops to store reason
                      })
                    } : s
                  ));
                }}
                className={`rounded-md border border-gray-300 px-3 py-1 text-sm ${
                  stop.status === 'cancelled' ? 'bg-red-50' : 
                  stop.status === 'completed' ? 'bg-green-50' : ''
                }`}
              >
                <option value="pending">En attente</option>
                <option value="completed">Complété</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>

            {stop.status === 'completed' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre de sacs
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={stop.bagCount || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setStops(prev => prev.map((s, i) => 
                        i === index ? { ...s, bagCount: value } : s
                      ));
                    }}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantité collectée (tonnes)
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={stop.estimatedQuantity || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setStops(prev => prev.map((s, i) => 
                        i === index ? { ...s, estimatedQuantity: value } : s
                      ));
                    }}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Humidité (%)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    value={stop.humidity || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setStops(prev => prev.map((s, i) => 
                        i === index ? { ...s, humidity: value } : s
                      ));
                    }}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Quality assessment fields */}
                <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Évaluation de la qualité</h4>
                    <span className="text-xs text-gray-500">Pourcentages du lot</span>
                  </div>
                  
                  {/* Quality assessment notification */}
                  {!stop.mouldyBeans && !stop.flatBeans && !stop.germinatedBeans && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 flex items-start gap-2">
                      <Info className="w-4 h-4 text-red-600 mt-0.5" />
                      <p className="text-xs text-red-700">
                        <span className="font-medium">Qualité non évaluée.</span> Veuillez remplir les champs d'évaluation pour obtenir un grade automatique.
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Fèves moisies (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={stop.mouldyBeans || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          setStops(prev => prev.map((s, i) => 
                            i === index ? { ...s, mouldyBeans: value } : s
                          ));
                        }}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Fèves plates/ardoisées (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={stop.flatBeans || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          setStops(prev => prev.map((s, i) => 
                            i === index ? { ...s, flatBeans: value } : s
                          ));
                        }}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Fèves violettes (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={stop.violetBeans || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          setStops(prev => prev.map((s, i) => 
                            i === index ? { ...s, violetBeans: value } : s
                          ));
                        }}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Fèves germées (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={stop.germinatedBeans || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          setStops(prev => prev.map((s, i) => 
                            i === index ? { ...s, germinatedBeans: value } : s
                          ));
                        }}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Fèves insectées (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={stop.insectDamagedBeans || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          setStops(prev => prev.map((s, i) => 
                            i === index ? { ...s, insectDamagedBeans: value } : s
                          ));
                        }}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Corps étrangers/débris (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={stop.foreignMatter || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          setStops(prev => prev.map((s, i) => 
                            i === index ? { ...s, foreignMatter: value } : s
                          ));
                        }}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    value={stop.notes || ''}
                    onChange={(e) => {
                      setStops(prev => prev.map((s, i) => 
                        i === index ? { ...s, notes: e.target.value } : s
                      ));
                    }}
                    rows={2}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {stop.status === 'cancelled' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Raison d'annulation
                </label>
                <textarea
                  required
                  value={stop.notes || ''}
                  onChange={(e) => {
                    setStops(prev => prev.map((s, i) => 
                      i === index ? { ...s, notes: e.target.value } : s
                    ));
                  }}
                  rows={2}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Traitement...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Terminer la tournée</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}