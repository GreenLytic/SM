export interface Warehouse {
  id?: string;
  name: string;
  location: string;
  capacity: number; // Capacité en tonnes
  currentStock: number; // Stock actuel en tonnes
  status: 'active' | 'inactive';
  notes?: string;
}

export interface WarehouseStats {
  totalCapacity: number;
  totalCurrentStock: number;
  activeWarehouses: number;
}