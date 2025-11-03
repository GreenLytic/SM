import { collection, addDoc, updateDoc, doc, getDoc, query, where, getDocs, limit, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Invoice, PaymentRecord } from '../types/invoice';
import { StockEntry } from '../types/stock'; 
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export class InvoiceService {
  static async createFromStock(stock: StockEntry): Promise<string | null> {
    try {
      console.log('Creating invoice from stock:', stock.stockNumber);
      
      // Skip invoice creation for combined stocks that were already processed
      if (stock.isCombined && stock.combinedIntoStock) {
        console.log('Skipping invoice creation for already combined stock:', stock.stockNumber);
        return null;
      }
      
      // Check if stock has necessary data for invoice
      if (!stock.pricePerTon || !stock.totalCost) {
        console.warn('Stock missing price data, cannot create invoice:', stock.stockNumber);
        return null;
      }
      
      // Check if invoice already exists for this stock
      const existingInvoiceQuery = query(
        collection(db, 'invoices'),
        where('stockId', '==', stock.id)
      );
      
      const existingInvoiceSnapshot = await getDocs(existingInvoiceQuery);
      
      if (!existingInvoiceSnapshot.empty) {
        console.log('Invoice already exists for stock:', stock.stockNumber);
        return existingInvoiceSnapshot.docs[0].id;
      }

      // Generate invoice number
      const today = new Date();
      const datePart = format(today, 'yyyyMMdd');
      const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const invoiceNumber = `FAC-${datePart}-${randomPart}`;

      // Set due date to 30 days from now
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      console.log('Creating invoice with data:', {
        stockNumber: stock.stockNumber,
        producerId: stock.producerId,
        quantity: stock.quantity,
        quality: stock.quality,
        pricePerTon: stock.pricePerTon,
        totalCost: stock.totalCost
      });
      
      // Create invoice data with proper Firestore Timestamps
      const invoiceData = {
        invoiceNumber,
        date: Timestamp.fromDate(today),
        dueDate: Timestamp.fromDate(dueDate),
        producerId: stock.producerId,
        stockId: stock.id!,
        stockNumber: stock.stockNumber,
        quantity: stock.originalQuantity || stock.quantity, // Quantité initiale pour la facture
        quality: stock.quality,
        basePrice: stock.pricePerTon / 1000, // Convert to price per kg
        qualityPremium: 0,
        certificationPremiums: 0,
        totalAmount: (stock.originalQuantity || stock.quantity) * (stock.pricePerTon || 0), // Prix basé sur quantité initiale
        amountPaid: stock.amountPaid || 0,
        paymentStatus: stock.paymentStatus || 'pending',
        paymentHistory: [],
        notes: stock.notes || ''
      };

      // Create new invoice
      const invoiceRef = await addDoc(collection(db, 'invoices'), invoiceData);
      console.log('Invoice created successfully:', invoiceRef.id);
      return invoiceRef.id;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  static async recordPayment(stockId: string, payment: PaymentRecord): Promise<void> {
    try {
      // Get stock to check if it's combined
      const stockRef = doc(db, 'stocks', stockId);
      const stockDoc = await getDoc(stockRef);
      
      if (!stockDoc.exists()) {
        throw new Error('Stock not found');
      }
      
      const stock = {
        id: stockDoc.id,
        ...stockDoc.data()
      } as StockEntry;
      
      // Skip payment recording for combined stocks
      if (stock.isCombined && stock.combinedIntoStock) {
        console.log('Skipping payment recording for combined stock:', stock.stockNumber);
        return;
      }
      
      // Check if stock has necessary data
      if (!stock.id) {
        throw new Error('Stock ID is missing');
      }
      
      // Update stock payment status first
      const newAmountPaid = (stock.amountPaid || 0) + payment.amount;
      const newPaymentStatus = newAmountPaid >= stock.totalCost ? 'completed' : 'partial';

      // Update stock with new payment info
      await updateDoc(stockRef, {
        amountPaid: newAmountPaid,
        paymentStatus: newPaymentStatus, 
        lastUpdated: Timestamp.fromDate(new Date()) // Add a timestamp to trigger Firestore listeners
      });

      // Find existing invoice
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('stockId', '==', stockId),
        limit(1) 
      );
      
      const invoiceSnapshot = await getDocs(invoicesQuery);
      
      if (invoiceSnapshot.empty) {
        // Create new invoice if none exists
        await this.createFromStock(stock);
        console.log('Created new invoice for payment');

        // Get the newly created invoice
        const retrySnapshot = await getDocs(invoicesQuery);
        if (retrySnapshot.empty) {
          throw new Error('Failed to create invoice');
        }
        
        await this.updateInvoicePayment(retrySnapshot.docs[0].ref, payment);
      } else {
        console.log('Updating existing invoice with payment');
        await this.updateInvoicePayment(invoiceSnapshot.docs[0].ref, payment);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }
  
  static async ensureInvoicesForAllStocks(): Promise<number> {
    try {
      console.log('Ensuring invoices exist for all stocks...');
      
      // Get all stocks that aren't combined into other stocks
      const stocksQuery = query(collection(db, 'stocks'));
      const stocksSnapshot = await getDocs(stocksQuery);
      console.log(`Found ${stocksSnapshot.docs.length} total stocks to check for invoices`);
      
      let createdCount = 0;
      let processedCount = 0;
      
      for (const stockDoc of stocksSnapshot.docs) {
        const stock = { id: stockDoc.id, ...stockDoc.data() } as StockEntry;
        processedCount++;
        
        // Skip if stock is combined into another stock
        if (stock.isCombined && stock.combinedIntoStock) {
          console.log(`Skipping combined stock ${stock.stockNumber}`);
          continue;
        }
        
        // Skip if stock doesn't have price data
        if (!stock.pricePerTon || !stock.totalCost) {
          console.log(`Stock ${stock.stockNumber} missing price data - updating stock value`);
          continue;
        }
        
        // Check if invoice exists
        const invoiceQuery = query(
          collection(db, 'invoices'),
          where('stockId', '==', stock.id)
        );
        
        const invoiceSnapshot = await getDocs(invoiceQuery);
        
        if (invoiceSnapshot.empty) {
          // Create invoice
          const invoiceId = await this.createFromStock(stock);
          if (invoiceId) {
            createdCount++;
          }
        }
      }
      
      console.log(`Processed ${processedCount} stocks, created ${createdCount} new invoices`);
      if (createdCount > 0) {
        toast.success(`${createdCount} nouvelles factures ont été générées`);
      }
      
      return createdCount;
    } catch (error) {
      console.error('Error ensuring invoices for stocks:', error);
      throw error;
    }
  }

  private static async updateInvoicePayment(invoiceRef: any, payment: PaymentRecord): Promise<void> {
    try {
      const invoiceDoc = await getDoc(invoiceRef);
      if (!invoiceDoc.exists()) {
        throw new Error('Invoice not found');
      } 

      const invoice = invoiceDoc.data();
      const newAmountPaid = (invoice.amountPaid || 0) + payment.amount;
      const newPaymentStatus = newAmountPaid >= invoice.totalAmount ? 'completed' : 'partial';

      // Prepare payment record with Timestamp
      const paymentRecord = {
        date: Timestamp.fromDate(payment.date),
        amount: payment.amount,
        method: payment.method,
        reference: payment.reference || '',
        notes: payment.notes || ''
      };

      // Update invoice with new payment info
      await updateDoc(invoiceRef, {
        amountPaid: newAmountPaid,
        paymentStatus: newPaymentStatus, 
        paymentHistory: arrayUnion(paymentRecord)
      });
    } catch (error) {
      console.error('Error updating invoice payment:', error);
      throw error;
    }
  }
}