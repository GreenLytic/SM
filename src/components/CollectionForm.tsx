import React, { useState, useEffect } from 'react';
import { addDoc, collection, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Collection } from '../types/collection';
import { StockEntry } from '../types/stock';
import { Producer } from '../types/producer';
import { Employee } from '../types/employee';
import { toast } from 'react-hot-toast';
import { Truck, Users, FileText, AlertTriangle, ArrowRight, Info } from 'lucide-react';
import { useEmployees } from '../hooks/useEmployees';
import { updateStockValue } from '../services/financeService';
import { format } from 'date-fns';
import QualityAssessmentForm from './QualityAssessmentForm';
import { PriceSettings } from '../types/finance';

interface CollectionFormProps {
  onClose: () => void;
  currentCollection?: Collection | null;
  producers: Producer[];
}

export default function CollectionForm({ onClose, currentCollection, producers }: CollectionFormProps) {
  const { employees } = useEmployees();
  const activeEmployees = employees.filter(e => e.status === 'active');
  
  const [formData, setFormData] = useState<Omit<Collection, 'id'>>({
    producerId: '',
    date: new Date(),
    quantity: 0,
    quality: 'A',
    humidity: 0,
    notes: '',
    employeeIds: [],
    bagCount: 0,
    processedToStock: false,
    mouldyBeans: null,
    flatBeans: null,
    violetBeans: null,
    germinatedBeans: null,
    insectDamagedBeans: null,
    foreignMatter: null,
    calculatedGrade: null,
    qualityNotes: null
  });

  const [showEmployees, setShowEmployees] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQualityAssessment, setShowQualityAssessment] = useState(false);
  const [showQualityReminder, setShowQualityReminder] = useState(false);

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
    const pricePerTon = Math.round(pricePerKg * 1000);
    
    // Calculate total cost
    const totalCost = Math.round(pricePerTon * quantity);
    
    console.log('Collection price calculation:', {
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

  useEffect(() => {
    if (currentCollection) {
      setFormData({
        producerId: currentCollection.producerId,
        date: currentCollection.date,
        quantity: currentCollection.quantity,
        quality: currentCollection.quality,
        humidity: currentCollection.humidity,
        notes: currentCollection.notes || '',
        employeeIds: currentCollection.employeeIds || [],
        bagCount: currentCollection.bagCount || 0,
        processedToStock: currentCollection.processedToStock || false,
        mouldyBeans: currentCollection.mouldyBeans ?? null,
        flatBeans: currentCollection.flatBeans ?? null,
        violetBeans: currentCollection.violetBeans ?? null,
        germinatedBeans: currentCollection.germinatedBeans ?? null,
        insectDamagedBeans: currentCollection.insectDamagedBeans ?? null,
        foreignMatter: currentCollection.foreignMatter ?? null,
        calculatedGrade: currentCollection.calculatedGrade ?? null,
        qualityNotes: currentCollection.qualityNotes ?? null
      });
    }
  }, [currentCollection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If quality assessment hasn't been done, show reminder
    if (!formData.calculatedGrade && !showQualityReminder) {
      setShowQualityReminder(true);
      return;
      
      // Update financial data
      await updateStockValue();
    }
    
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      let collectionId: string;
      
      if (currentCollection?.id) {
        // Update existing collection
        await updateDoc(doc(db, 'collections', currentCollection.id), formData);
        collectionId = currentCollection.id;
        toast.success('Collecte mise à jour avec succès');
        
        // If this collection is linked to a stock, update the stock's quality data as well
        if (currentCollection.stockId) {
          await updateDoc(doc(db, 'stocks', currentCollection.stockId), {
            quality: formData.quality,
            humidity: formData.humidity,
            mouldyBeans: formData.mouldyBeans,
            flatBeans: formData.flatBeans,
            violetBeans: formData.violetBeans,
            germinatedBeans: formData.germinatedBeans,
            insectDamagedBeans: formData.insectDamagedBeans,
            foreignMatter: formData.foreignMatter,
            calculatedGrade: formData.calculatedGrade,
            qualityNotes: formData.qualityNotes
          });

          // If this collection is linked to a stock, update the stock's quality data as well
          if (collection.stockId) {
            await updateDoc(doc(db, 'stocks', collection.stockId), {
              quality: formData.quality,
              humidity: formData.humidity,
              mouldyBeans: formData.mouldyBeans,
              flatBeans: formData.flatBeans,
              violetBeans: formData.violetBeans,
              germinatedBeans: formData.germinatedBeans,
              insectDamagedBeans: formData.insectDamagedBeans,
              foreignMatter: formData.foreignMatter,
              calculatedGrade: formData.calculatedGrade,
              qualityNotes: formData.qualityNotes
            });
          } else {
            // Check if there are stocks that include this collection
            const stocksQuery = query(
              collection(db, 'stocks'), 
              where('collections', 'array-contains', collection.id)
            );
            const stocksSnapshot = await getDocs(stocksQuery);
            
            if (!stocksSnapshot.empty) {
              // Update each stock that contains this collection
              for (const stockDoc of stocksSnapshot.docs) {
                await updateDoc(doc(db, 'stocks', stockDoc.id), {
                  quality: formData.quality,
                  humidity: formData.humidity,
                  mouldyBeans: formData.mouldyBeans,
                  flatBeans: formData.flatBeans,
                  violetBeans: formData.violetBeans,
                  germinatedBeans: formData.germinatedBeans,
                  insectDamagedBeans: formData.insectDamagedBeans,
                  foreignMatter: formData.foreignMatter,
                  calculatedGrade: formData.calculatedGrade,
                  qualityNotes: formData.qualityNotes
                });
              }
            }
          }
        } else {
          // Check if there are stocks that include this collection
          const stocksQuery = query(
            collection(db, 'stocks'), 
            where('collections', 'array-contains', currentCollection.id)
          );
          const stocksSnapshot = await getDocs(stocksQuery);
          
          if (!stocksSnapshot.empty) {
            // Update each stock that contains this collection
            for (const stockDoc of stocksSnapshot.docs) {
              await updateDoc(doc(db, 'stocks', stockDoc.id), {
                quality: formData.quality,
                humidity: formData.humidity,
                mouldyBeans: formData.mouldyBeans,
                flatBeans: formData.flatBeans,
                violetBeans: formData.violetBeans,
                germinatedBeans: formData.germinatedBeans,
                insectDamagedBeans: formData.insectDamagedBeans,
                foreignMatter: formData.foreignMatter,
                calculatedGrade: formData.calculatedGrade,
                qualityNotes: formData.qualityNotes
              });
            }
          }
        }
      } else {
        // Create new collection
        const collectionRef = await addDoc(collection(db, 'collections'), {
          ...formData,
          processedToStock: false
        });
        collectionId = collectionRef.id;
        toast.success('Collecte ajoutée avec succès');
        
        // Automatically create stock entry for new collection
        await createStockFromCollection(collectionRef.id, formData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving collection:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const createStockFromCollection = async (collectionId: string, collectionData: Omit<Collection, 'id'>) => {
    try {
      // Generate stock number
      const stockNumber = `STK-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Calculate stock value based on price settings
      const { pricePerTon, totalCost } = calculateStockValue(collectionData.quantity, collectionData.quality);

      // Create stock entry
      const stockData: Omit<StockEntry, 'id'> = {
        stockNumber,
        collections: [collectionId],
        producerId: collectionData.producerId,
        warehouseId: '',
        date: new Date(),
        quantity: collectionData.quantity,
        quality: collectionData.quality,
        humidity: collectionData.humidity,
        originalQuantity: collectionData.quantity, // Stocker la quantité initiale
        originalBagCount: collectionData.bagCount || 0, // Stocker le nombre de sacs initial
        pricePerTon,
        totalCost: pricePerTon * collectionData.quantity, // prix/tonne * quantité initiale
        paymentStatus: 'pending',
        amountPaid: 0,
        notes: collectionData.notes || '',
        bagCount: collectionData.bagCount || 0,
        // Copy quality assessment data if available
        mouldyBeans: collectionData.mouldyBeans,
        flatBeans: collectionData.flatBeans,
        violetBeans: collectionData.violetBeans,
        germinatedBeans: collectionData.germinatedBeans,
        insectDamagedBeans: collectionData.insectDamagedBeans,
        foreignMatter: collectionData.foreignMatter,
        calculatedGrade: collectionData.calculatedGrade,
        qualityNotes: collectionData.qualityNotes
      };

      // Add to stocks collection
      const stockRef = await addDoc(collection(db, 'stocks'), stockData);
      
      // Update collection to mark it as processed and link to the stock
      await updateDoc(doc(db, 'collections', collectionId), {
        processedToStock: true,
        stockId: stockRef.id
      });
      
      toast.success('Stock créé automatiquement');
    } catch (error) {
      console.error('Error creating stock:', error);
      toast.error('Erreur lors de la création automatique du stock');
    }
  };

  const handleEmployeeToggle = (employeeId: string) => {
    setFormData(prev => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(employeeId)
        ? prev.employeeIds.filter(id => id !== employeeId)
        : [...prev.employeeIds, employeeId]
    }));
  };

  const handleQualityAssessmentSave = async (updatedData: Partial<Collection>) => {
    setFormData(prev => ({
      ...prev,
      ...updatedData,
      // Update quality based on calculated grade
      quality: updatedData.calculatedGrade === 'Grade I' ? 'A' : 
               updatedData.calculatedGrade === 'Grade II' ? 'B' : 'C'
    }));
    
    toast.success('Évaluation de qualité enregistrée');
    setShowQualityAssessment(false);
  };

  const proceedWithoutQualityAssessment = () => {
    setShowQualityReminder(false);
    // Continue with form submission
    handleFormSubmission();
  };

  const handleFormSubmission = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      let collectionId: string;
      
      if (currentCollection?.id) {
        // Update existing collection
        await updateDoc(doc(db, 'collections', currentCollection.id), formData);
        collectionId = currentCollection.id;
        toast.success('Collecte mise à jour avec succès');
      } else {
        // Create new collection
        const collectionRef = await addDoc(collection(db, 'collections'), {
          ...formData,
          processedToStock: false
        });
        collectionId = collectionRef.id;
        toast.success('Collecte ajoutée avec succès');
        
        // Automatically create stock entry for new collection
        await createStockFromCollection(collectionId, formData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving collection:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {showQualityAssessment ? (
        <QualityAssessmentForm<Collection>
          data={{...formData, id: currentCollection?.id} as Collection}
          onSave={handleQualityAssessmentSave}
          onClose={() => setShowQualityAssessment(false)}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
            <Truck className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              {currentCollection ? 'Modifier la collecte' : 'Nouvelle collecte'}
            </h2>
          </div>

          {/* Quality Assessment Reminder Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-800">Évaluation de la qualité</h3>
              <p className="text-sm text-blue-700 mt-1">
                L'évaluation de la qualité est une étape importante pour déterminer le grade du cacao.
                {formData.calculatedGrade ? (
                  <span className="font-medium"> Grade actuel: {formData.calculatedGrade}</span>
                ) : (
                  <span className="font-medium text-red-600"> Non évalué</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setShowQualityAssessment(true)}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                <FileText className="w-4 h-4" />
                {formData.calculatedGrade ? "Modifier l'évaluation" : "Évaluer maintenant"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Producteur</label>
              <select
                required
                value={formData.producerId}
                onChange={(e) => setFormData({...formData, producerId: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Sélectionner un producteur</option>
                {producers.map((producer) => (
                  <option key={producer.id} value={producer.id}>
                    {producer.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                required
                value={formData.date.toISOString().split('T')[0]}
                onChange={(e) => setFormData({...formData, date: new Date(e.target.value)})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre de sacs</label>
              <input
                type="number"
                required
                min="0"
                value={formData.bagCount}
                onChange={(e) => setFormData({...formData, bagCount: Number(e.target.value)})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Quantité (tonnes)</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Qualité</label>
                {!formData.calculatedGrade && (
                  <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Non évalué
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <select
                  disabled
                  value={formData.quality}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="A">Qualité A</option>
                  <option value="B">Qualité B</option>
                  <option value="C">Qualité C</option>
                </select>
                {formData.calculatedGrade && (
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    formData.calculatedGrade === 'Grade I' ? 'bg-green-100 text-green-800' :
                    formData.calculatedGrade === 'Grade II' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {formData.calculatedGrade}
                  </div>
                )}
              </div>
              {formData.calculatedGrade && (
                <p className="mt-1 text-xs text-gray-500">
                  {formData.qualityNotes}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Humidité (%)</label>
              <input
                type="number"
                required
                step="0.1"
                min="0"
                max="100"
                value={formData.humidity}
                onChange={(e) => setFormData({...formData, humidity: Number(e.target.value)})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {formData.humidity > 7.5 && (
                <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Taux d'humidité trop élevé. Séchage recommandé avant exportation.
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Employés participants
                  </div>
                </label>
                <button
                  type="button"
                  onClick={() => setShowEmployees(!showEmployees)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showEmployees ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              
              {showEmployees && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {activeEmployees.map((employee) => (
                    <label
                      key={employee.id}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.employeeIds.includes(employee.id!)
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.employeeIds.includes(employee.id!)}
                        onChange={() => handleEmployeeToggle(employee.id!)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                        <p className="text-xs text-gray-500">{employee.role}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
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
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>{currentCollection ? 'Mettre à jour' : 'Créer'}</span>
              )}
            </button>
          </div>

          {/* Quality Assessment Reminder Modal */}
          {showQualityReminder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-amber-500 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Évaluation de qualité manquante</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Aucune évaluation qualité n'a encore été effectuée pour cette collecte.
                      Vous pouvez la faire plus tard, mais elle est obligatoire avant toute utilisation du stock.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={proceedWithoutQualityAssessment}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Continuer sans évaluation
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQualityReminder(false);
                      setShowQualityAssessment(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Évaluer maintenant
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      )}
    </>
  );
}