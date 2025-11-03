import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { StockReservation } from '../../types/delivery';
import { stockChannelService } from '../websocket/stockChannel';
import { toast } from 'react-hot-toast';

export class StockReservationService {
  private static RESERVATION_DURATION = 30 * 60 * 1000; // 30 minutes

  // Reserve a stock or lot
  static async reserve(
    itemId: string, 
    type: 'stock' | 'lot', 
    quantity: number, 
    userId: string = 'current-user'
  ): Promise<string | null> {
    try {
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + this.RESERVATION_DURATION);

      const reservationData: Omit<StockReservation, 'id'> = {
        itemId,
        type,
        userId,
        quantity,
        reservedAt: new Date(),
        expiresAt,
        confirmed: false
      };

      const reservationRef = await addDoc(collection(db, 'stockReservations'), reservationData);
      
      // Emit WebSocket event
      stockChannelService.emitReservation(itemId, type, quantity, userId);
      
      return reservationRef.id;
    } catch (error) {
      console.error('Error reserving stock:', error);
      toast.error('Erreur lors de la réservation du stock');
      return null;
    }
  }

  // Release a reservation
  static async release(itemId: string, type: 'stock' | 'lot', userId: string = 'current-user'): Promise<void> {
    try {
      const reservationsQuery = query(
        collection(db, 'stockReservations'),
        where('itemId', '==', itemId),
        where('type', '==', type),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(reservationsQuery);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Emit WebSocket event
      stockChannelService.emitRelease(itemId, type, userId);
    } catch (error) {
      console.error('Error releasing reservation:', error);
    }
  }

  // Confirm a reservation (link to delivery order)
  static async confirm(reservationId: string, deliveryOrderId: string): Promise<void> {
    try {
      // Check if the reservation document exists before updating
      const reservationRef = doc(db, 'stockReservations', reservationId);
      const reservationDoc = await getDoc(reservationRef);
      
      if (!reservationDoc.exists()) {
        console.warn(`Reservation ${reservationId} no longer exists, skipping confirmation`);
        return;
      }

      await updateDoc(reservationRef, {
        deliveryOrderId,
        confirmed: true,
        confirmedAt: new Date()
      });
    } catch (error) {
      console.error('Error confirming reservation:', error);
      throw error;
    }
  }

  // Get active reservations
  static async getActiveReservations(): Promise<StockReservation[]> {
    try {
      const now = new Date();
      const reservationsQuery = query(
        collection(db, 'stockReservations'),
        where('expiresAt', '>', now)
      );

      const snapshot = await getDocs(reservationsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        reservedAt: doc.data().reservedAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
        confirmedAt: doc.data().confirmedAt?.toDate()
      })) as StockReservation[];
    } catch (error) {
      console.error('Error fetching reservations:', error);
      return [];
    }
  }

  // Listen to reservations in real-time
  static subscribeToReservations(callback: (reservations: StockReservation[]) => void): () => void {
    const now = new Date();
    const reservationsQuery = query(
      collection(db, 'stockReservations'),
      where('expiresAt', '>', now)
    );

    return onSnapshot(reservationsQuery, (snapshot) => {
      const reservations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        reservedAt: doc.data().reservedAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
        confirmedAt: doc.data().confirmedAt?.toDate()
      })) as StockReservation[];

      callback(reservations);
    });
  }

  // Force clear all reservations (for debugging/recovery)
  static async forceCleanupAllReservations(): Promise<void> {
    try {
      console.log('🧹 Force cleaning all reservations...');
      
      const allReservationsQuery = query(collection(db, 'stockReservations'));
      const snapshot = await getDocs(allReservationsQuery);
      
      console.log(`Found ${snapshot.docs.length} reservations to delete`);
      
      const deletePromises = snapshot.docs.map(doc => {
        console.log('Deleting reservation:', doc.id, doc.data());
        return deleteDoc(doc.ref);
      });
      
      await Promise.all(deletePromises);
      
      console.log(`✅ Deleted ${snapshot.docs.length} reservations`);
      
      // Emit events for all deleted reservations
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        stockChannelService.emitRelease(data.itemId, data.type, data.userId);
      });
      
    } catch (error) {
      console.error('Error force cleaning reservations:', error);
      throw error;
    }
  }

  // Clean up expired reservations
  static async cleanupExpiredReservations(): Promise<void> {
    try {
      const now = new Date();
      const expiredQuery = query(
        collection(db, 'stockReservations'),
        where('expiresAt', '<=', now)
      );

      const snapshot = await getDocs(expiredQuery);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      if (snapshot.docs.length > 0) {
        console.log(`🧹 Nettoyé ${snapshot.docs.length} réservations expirées`);
        
        // Émettre un événement pour rafraîchir les interfaces
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          stockChannelService.emitRelease(data.itemId, data.type, data.userId);
        });
      }
    } catch (error) {
      console.error('Error cleaning up expired reservations:', error);
    }
  }
}