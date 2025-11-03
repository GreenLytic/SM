import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { Budget } from '../types/finance';

export const calculateNetAssets = async (): Promise<number> => {
  try {
    // Fetch stocks value
    const stocksQuery = query(collection(db, 'stocks'));
    const stocksSnapshot = await getDocs(stocksQuery);
    const stockValue = stocksSnapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (data.totalCost || 0);
    }, 0);

    // Fetch current budget investments (working capital)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;

    const budgetsQuery = query(
      collection(db, 'budgets'),
      where('year', '==', currentYear),
      where('quarter', '==', currentQuarter)
    );
    const budgetsSnapshot = await getDocs(budgetsQuery);
    const workingCapital = budgetsSnapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (data.investments ?? []).reduce((invSum: number, inv: any) => invSum + (inv.amount || 0), 0);
    }, 0);

    // Fetch completed deliveries
    const deliveriesQuery = query(
      collection(db, 'deliveryOrders'),
      where('status', '==', 'completed')
    );
    const deliveriesSnapshot = await getDocs(deliveriesQuery);
    
    let totalSales = 0;
    let profits = 0;
    let losses = 0;

    deliveriesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const costs = data.costs || {};
      totalSales += costs.sellingPrice || 0;
      
      const profit = costs.profit || 0;
      if (profit >= 0) {
        profits += profit;
      } else {
        losses += Math.abs(profit);
      }
    });

    // Calculate net assets
    const netAssets = workingCapital - stockValue + totalSales + profits - losses;

    // Update current budget with actual revenue and profit
    if (budgetsSnapshot.docs.length > 0) {
      const currentBudget = budgetsSnapshot.docs[0].data() as Budget;
      if (currentBudget.id) {
        await updateDoc(doc(db, 'budgets', currentBudget.id), {
          actualRevenue: netAssets,
          actualProfit: profits - losses
        });
      }
    }

    return netAssets;
  } catch (error) {
    console.error('Error calculating net assets:', error);
    return 0;
  }
};

export const updateStockValue = async (): Promise<number> => {
  try {
    console.log('Starting stock value update...');
    // Fetch active price settings
    const priceQuery = query(
      collection(db, 'priceSettings'),
      where('status', '==', 'active')
    );
    const priceSnapshot = await getDocs(priceQuery);
    
    if (priceSnapshot.empty) {
      console.warn('No active price settings found');
      return 0;
    }
    
    const priceSettings = priceSnapshot.docs[0].data();
    console.log('Found active price settings:', priceSettings);
    
    // Fetch stocks value
    const stocksQuery = query(collection(db, 'stocks'));
    const stocksSnapshot = await getDocs(stocksQuery);
    console.log(`Processing ${stocksSnapshot.docs.length} stocks`);
    
    let stockValue = 0;
    
    // Update each stock with correct pricing if price settings exist
    if (priceSettings) {
      for (const stockDoc of stocksSnapshot.docs) {
        const stockData = stockDoc.data();
        const stockId = stockDoc.id;
        
        // Skip stocks that have been combined into other stocks
        if (stockData.isCombined) {
          console.log(`Skipping combined stock ${stockId}`);
          continue;
        }
        
        // Calculate price per kg including all premiums
        const basePrice = priceSettings.basePrice;
        const qualityPremium = priceSettings.qualityPremiums[stockData.quality] || 0;
        const certificationPremiums = priceSettings.certifications.reduce(
          (sum, cert) => sum + (cert.premium || 0),
          0
        );
        
        // Total price per kg
        const pricePerKg = basePrice + qualityPremium + certificationPremiums;
        
        // Convert to price per ton
        const pricePerTon = Math.round(pricePerKg * 1000);
        
        // Calculate total cost based on original quantity
        const originalQuantity = stockData.originalQuantity || stockData.quantity;
        const totalCost = Math.round(pricePerTon * originalQuantity);
        
        console.log(`Stock ${stockId} price calculation:`, {
          basePrice,
          qualityPremium,
          certificationPremiums,
          pricePerKg,
          pricePerTon,
          currentQuantity: stockData.quantity,
          originalQuantity,
          totalCost
        });

        // Only log if values are changing significantly
        if (Math.abs(stockData.pricePerTon - pricePerTon) > 1 || Math.abs(stockData.totalCost - totalCost) > 1) {
          console.log(`Stock ${stockId}:`, {
            quality: stockData.quality,
            currentQuantity: stockData.quantity,
            originalQuantity: originalQuantity,
            basePrice,
            qualityPremium,
            certificationPremiums,
            pricePerKg,
            pricePerTon,
            totalCost,
            oldPricePerTon: stockData.pricePerTon,
            oldTotalCost: stockData.totalCost
          });
        }
        
        // Update stock with new values if they've changed
        if (stockData.pricePerTon !== pricePerTon || stockData.totalCost !== totalCost) {
          console.log(`Updating stock ${stockId} with new price values`);
          await updateDoc(doc(db, 'stocks', stockDoc.id), {
            pricePerTon,
            totalCost,
            // Recalculate payment status based on original quantity and total cost
            paymentStatus: (stockData.amountPaid || 0) >= totalCost ? 'completed' : 
                          (stockData.amountPaid || 0) > 0 ? 'partial' : 'pending'
          });
        }
        
        stockValue += totalCost;
      }
    } else {
      // If no price settings, just sum up the existing values
      stockValue = stocksSnapshot.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (data.totalCost || 0);
      }, 0);
    }
    
    console.log(`Total stock value: ${stockValue}`);
    
    // Update current budget with new stock value
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;

    const budgetsQuery = query(
      collection(db, 'budgets'),
      where('year', '==', currentYear),
      where('quarter', '==', currentQuarter),
      where('status', '==', 'active')
    );
    
    const budgetsSnapshot = await getDocs(budgetsQuery);
    if (budgetsSnapshot.docs.length > 0) {
      console.log('Updating budget with new stock value');
      const budgetDoc = budgetsSnapshot.docs[0];
      const budget = budgetDoc.data() as Budget;
      
      // Recalculate net assets
      await calculateNetAssets();
    }
    
    console.log('Stock value update completed');
    return stockValue;
  } catch (error) {
    console.error('Error updating stock value:', error);
    return 0;
  }
};