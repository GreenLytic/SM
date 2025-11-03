import { v4 as uuidv4 } from 'uuid';
import { insert, update, deleteRecord, findById, findAll, findOne, executeQuery } from '../lib/dbService';
import { saveDatabase } from '../lib/database';

export interface Producer {
  id: string;
  name: string;
  code: string;
  phone?: string;
  email?: string;
  address?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  totalProduction?: number;
  qualityScore?: number;
  paymentStatus?: 'pending' | 'partial' | 'completed';
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity?: number;
  currentStock?: number;
  latitude?: number;
  longitude?: number;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Stock {
  id: string;
  stockNumber: string;
  producerId?: string;
  collectionId?: string;
  warehouseId?: string;
  quantity: number;
  qualityGrade?: 'A' | 'B' | 'C' | 'Rejected';
  moistureContent?: number;
  defectsCount?: number;
  pricePerKg?: number;
  totalPrice?: number;
  paymentStatus?: 'pending' | 'partial' | 'completed';
  deliveryStatus?: 'in_warehouse' | 'reserved' | 'partially_delivered' | 'delivered' | 'archived';
  entryDate?: string;
  isGroup?: boolean;
  parentStockId?: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Collection {
  id: string;
  producerId?: string;
  collectionDate?: string;
  quantity: number;
  qualityGrade?: 'A' | 'B' | 'C' | 'Rejected';
  moistureContent?: number;
  defectsCount?: number;
  notes?: string;
  collectorId?: string;
  status?: 'pending' | 'approved' | 'rejected';
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Delivery {
  id: string;
  deliveryNumber: string;
  clientName: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  deliveryDate: string;
  driverId?: string;
  vehicleInfo?: string;
  totalQuantity?: number;
  status?: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  notes?: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: 'admin' | 'manager' | 'collector' | 'driver' | 'staff';
  userId?: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

class DataService {
  // Producers
  async getProducers(organizationId?: string): Promise<Producer[]> {
    if (organizationId) {
      return findAll('producers', 'organization_id = ?', [organizationId]);
    }
    return findAll('producers');
  }

  async getProducerById(id: string): Promise<Producer | null> {
    return findById('producers', id);
  }

  async createProducer(data: Omit<Producer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = uuidv4();
    insert('producers', {
      id,
      name: data.name,
      code: data.code,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      region: data.region || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      total_production: data.totalProduction || 0,
      quality_score: data.qualityScore || 0,
      payment_status: data.paymentStatus || 'pending',
      organization_id: data.organizationId || null
    });
    return id;
  }

  async updateProducer(id: string, data: Partial<Producer>): Promise<void> {
    const updates: Record<string, any> = {};
    if (data.name) updates.name = data.name;
    if (data.code) updates.code = data.code;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.email !== undefined) updates.email = data.email;
    if (data.address !== undefined) updates.address = data.address;
    if (data.region !== undefined) updates.region = data.region;
    if (data.latitude !== undefined) updates.latitude = data.latitude;
    if (data.longitude !== undefined) updates.longitude = data.longitude;
    if (data.totalProduction !== undefined) updates.total_production = data.totalProduction;
    if (data.qualityScore !== undefined) updates.quality_score = data.qualityScore;
    if (data.paymentStatus !== undefined) updates.payment_status = data.paymentStatus;

    update('producers', id, updates);
  }

  async deleteProducer(id: string): Promise<void> {
    deleteRecord('producers', id);
  }

  // Warehouses
  async getWarehouses(organizationId?: string): Promise<Warehouse[]> {
    if (organizationId) {
      return findAll('warehouses', 'organization_id = ?', [organizationId]);
    }
    return findAll('warehouses');
  }

  async getWarehouseById(id: string): Promise<Warehouse | null> {
    return findById('warehouses', id);
  }

  async createWarehouse(data: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = uuidv4();
    insert('warehouses', {
      id,
      name: data.name,
      location: data.location,
      capacity: data.capacity || 0,
      current_stock: data.currentStock || 0,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      organization_id: data.organizationId || null
    });
    return id;
  }

  async updateWarehouse(id: string, data: Partial<Warehouse>): Promise<void> {
    const updates: Record<string, any> = {};
    if (data.name) updates.name = data.name;
    if (data.location) updates.location = data.location;
    if (data.capacity !== undefined) updates.capacity = data.capacity;
    if (data.currentStock !== undefined) updates.current_stock = data.currentStock;
    if (data.latitude !== undefined) updates.latitude = data.latitude;
    if (data.longitude !== undefined) updates.longitude = data.longitude;

    update('warehouses', id, updates);
  }

  async deleteWarehouse(id: string): Promise<void> {
    deleteRecord('warehouses', id);
  }

  // Stock
  async getStock(organizationId?: string): Promise<Stock[]> {
    if (organizationId) {
      return findAll('stock', 'organization_id = ?', [organizationId]);
    }
    return findAll('stock');
  }

  async getStockById(id: string): Promise<Stock | null> {
    return findById('stock', id);
  }

  async createStock(data: Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = uuidv4();
    insert('stock', {
      id,
      stock_number: data.stockNumber,
      producer_id: data.producerId || null,
      collection_id: data.collectionId || null,
      warehouse_id: data.warehouseId || null,
      quantity: data.quantity,
      quality_grade: data.qualityGrade || null,
      moisture_content: data.moistureContent || null,
      defects_count: data.defectsCount || 0,
      price_per_kg: data.pricePerKg || null,
      total_price: data.totalPrice || null,
      payment_status: data.paymentStatus || 'pending',
      delivery_status: data.deliveryStatus || 'in_warehouse',
      entry_date: data.entryDate || new Date().toISOString(),
      is_group: data.isGroup ? 1 : 0,
      parent_stock_id: data.parentStockId || null,
      organization_id: data.organizationId || null
    });
    return id;
  }

  async updateStock(id: string, data: Partial<Stock>): Promise<void> {
    const updates: Record<string, any> = {};
    if (data.quantity !== undefined) updates.quantity = data.quantity;
    if (data.qualityGrade !== undefined) updates.quality_grade = data.qualityGrade;
    if (data.moistureContent !== undefined) updates.moisture_content = data.moistureContent;
    if (data.defectsCount !== undefined) updates.defects_count = data.defectsCount;
    if (data.pricePerKg !== undefined) updates.price_per_kg = data.pricePerKg;
    if (data.totalPrice !== undefined) updates.total_price = data.totalPrice;
    if (data.paymentStatus !== undefined) updates.payment_status = data.paymentStatus;
    if (data.deliveryStatus !== undefined) updates.delivery_status = data.deliveryStatus;
    if (data.warehouseId !== undefined) updates.warehouse_id = data.warehouseId;

    update('stock', id, updates);
  }

  async deleteStock(id: string): Promise<void> {
    deleteRecord('stock', id);
  }

  // Collections
  async getCollections(organizationId?: string): Promise<Collection[]> {
    if (organizationId) {
      return findAll('collections', 'organization_id = ?', [organizationId]);
    }
    return findAll('collections');
  }

  async getCollectionById(id: string): Promise<Collection | null> {
    return findById('collections', id);
  }

  async createCollection(data: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = uuidv4();
    insert('collections', {
      id,
      producer_id: data.producerId || null,
      collection_date: data.collectionDate || new Date().toISOString(),
      quantity: data.quantity,
      quality_grade: data.qualityGrade || null,
      moisture_content: data.moistureContent || null,
      defects_count: data.defectsCount || 0,
      notes: data.notes || null,
      collector_id: data.collectorId || null,
      status: data.status || 'pending',
      organization_id: data.organizationId || null
    });
    return id;
  }

  async updateCollection(id: string, data: Partial<Collection>): Promise<void> {
    const updates: Record<string, any> = {};
    if (data.quantity !== undefined) updates.quantity = data.quantity;
    if (data.qualityGrade !== undefined) updates.quality_grade = data.qualityGrade;
    if (data.moistureContent !== undefined) updates.moisture_content = data.moistureContent;
    if (data.defectsCount !== undefined) updates.defects_count = data.defectsCount;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.status !== undefined) updates.status = data.status;

    update('collections', id, updates);
  }

  async deleteCollection(id: string): Promise<void> {
    deleteRecord('collections', id);
  }

  // Deliveries
  async getDeliveries(organizationId?: string): Promise<Delivery[]> {
    if (organizationId) {
      return findAll('deliveries', 'organization_id = ?', [organizationId]);
    }
    return findAll('deliveries');
  }

  async getDeliveryById(id: string): Promise<Delivery | null> {
    return findById('deliveries', id);
  }

  async createDelivery(data: Omit<Delivery, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = uuidv4();
    insert('deliveries', {
      id,
      delivery_number: data.deliveryNumber,
      client_name: data.clientName,
      client_address: data.clientAddress || null,
      client_phone: data.clientPhone || null,
      client_email: data.clientEmail || null,
      delivery_date: data.deliveryDate,
      driver_id: data.driverId || null,
      vehicle_info: data.vehicleInfo || null,
      total_quantity: data.totalQuantity || 0,
      status: data.status || 'pending',
      notes: data.notes || null,
      organization_id: data.organizationId || null
    });
    return id;
  }

  async updateDelivery(id: string, data: Partial<Delivery>): Promise<void> {
    const updates: Record<string, any> = {};
    if (data.clientName) updates.client_name = data.clientName;
    if (data.clientAddress !== undefined) updates.client_address = data.clientAddress;
    if (data.clientPhone !== undefined) updates.client_phone = data.clientPhone;
    if (data.deliveryDate) updates.delivery_date = data.deliveryDate;
    if (data.driverId !== undefined) updates.driver_id = data.driverId;
    if (data.totalQuantity !== undefined) updates.total_quantity = data.totalQuantity;
    if (data.status !== undefined) updates.status = data.status;
    if (data.notes !== undefined) updates.notes = data.notes;

    update('deliveries', id, updates);
  }

  async deleteDelivery(id: string): Promise<void> {
    deleteRecord('deliveries', id);
  }

  // Employees
  async getEmployees(organizationId?: string): Promise<Employee[]> {
    if (organizationId) {
      return findAll('employees', 'organization_id = ?', [organizationId]);
    }
    return findAll('employees');
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    return findById('employees', id);
  }

  async createEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = uuidv4();
    insert('employees', {
      id,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      role: data.role || 'staff',
      user_id: data.userId || null,
      organization_id: data.organizationId || null
    });
    return id;
  }

  async updateEmployee(id: string, data: Partial<Employee>): Promise<void> {
    const updates: Record<string, any> = {};
    if (data.name) updates.name = data.name;
    if (data.email !== undefined) updates.email = data.email;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.role !== undefined) updates.role = data.role;

    update('employees', id, updates);
  }

  async deleteEmployee(id: string): Promise<void> {
    deleteRecord('employees', id);
  }
}

export const dataService = new DataService();
