// WebSocket service for real-time stock updates
export interface StockUpdateEvent {
  type: 'stockUpdate' | 'lotUpdate' | 'reservationUpdate';
  data: {
    itemId: string;
    itemType: 'stock' | 'lot';
    action: 'reserved' | 'released' | 'updated' | 'delivered';
    quantity?: number;
    remainingQuantity?: number;
    status?: string;
    userId?: string;
    timestamp: Date;
  };
}

class StockChannelService {
  private listeners: Set<(event: StockUpdateEvent) => void> = new Set();

  // Subscribe to stock updates
  subscribe(callback: (event: StockUpdateEvent) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Emit stock update event
  emit(event: StockUpdateEvent): void {
    // Use custom event for browser-based real-time updates
    const customEvent = new CustomEvent('stockUpdate', {
      detail: event
    });
    
    window.dispatchEvent(customEvent);
    
    // Also notify direct listeners
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in stock update listener:', error);
      }
    });
  }

  // Emit stock reservation event
  emitReservation(itemId: string, itemType: 'stock' | 'lot', quantity: number, userId: string): void {
    this.emit({
      type: 'reservationUpdate',
      data: {
        itemId,
        itemType,
        action: 'reserved',
        quantity,
        userId,
        timestamp: new Date()
      }
    });
  }

  // Emit stock release event
  emitRelease(itemId: string, itemType: 'stock' | 'lot', userId: string): void {
    this.emit({
      type: 'reservationUpdate',
      data: {
        itemId,
        itemType,
        action: 'released',
        userId,
        timestamp: new Date()
      }
    });
  }

  // Emit stock quantity update
  emitQuantityUpdate(itemId: string, itemType: 'stock' | 'lot', remainingQuantity: number, status: string): void {
    this.emit({
      type: 'stockUpdate',
      data: {
        itemId,
        itemType,
        action: 'updated',
        remainingQuantity,
        status,
        timestamp: new Date()
      }
    });
  }

  // Emit delivery completion
  emitDeliveryComplete(itemId: string, itemType: 'stock' | 'lot'): void {
    this.emit({
      type: 'stockUpdate',
      data: {
        itemId,
        itemType,
        action: 'delivered',
        timestamp: new Date()
      }
    });
  }
}

export const stockChannelService = new StockChannelService();