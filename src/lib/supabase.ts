import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  if (error?.code === 'PGRST116') {
    return new Error('Aucune donnée trouvée');
  }
  if (error?.message?.includes('JWT')) {
    return new Error('Session expirée. Veuillez vous reconnecter.');
  }
  return new Error(error?.message || 'Une erreur est survenue');
};

// Type definitions for database tables
export interface Database {
  public: {
    Tables: {
      producers: {
        Row: {
          id: string;
          full_name: string;
          cni?: string;
          phone: string;
          email?: string;
          address?: string;
          cultivated_area: number;
          estimated_production: number;
          join_date: string;
          status: 'active' | 'inactive';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['producers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['producers']['Insert']>;
      };
      collections: {
        Row: {
          id: string;
          producer_id: string;
          date: string;
          quantity: number;
          quality: 'A' | 'B' | 'C';
          calculated_grade?: string;
          humidity?: number;
          fermentation?: number;
          defects?: number;
          status: string;
          stock_id?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['collections']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['collections']['Insert']>;
      };
      stock: {
        Row: {
          id: string;
          stock_number: string;
          producer_id: string;
          warehouse_id?: string;
          quantity: number;
          quality: 'A' | 'B' | 'C';
          humidity: number;
          entry_date: string;
          status: string;
          last_notification?: string;
          last_drying_confirmation?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['stock']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['stock']['Insert']>;
      };
      warehouses: {
        Row: {
          id: string;
          name: string;
          location: string;
          capacity: number;
          current_stock: number;
          manager?: string;
          phone?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['warehouses']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['warehouses']['Insert']>;
      };
      deliveries: {
        Row: {
          id: string;
          delivery_number: string;
          destination: string;
          status: string;
          departure_date?: string;
          arrival_date?: string;
          driver?: string;
          vehicle?: string;
          notes?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['deliveries']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['deliveries']['Insert']>;
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          producer_id: string;
          date: string;
          total_amount: number;
          status: 'pending' | 'paid' | 'cancelled';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
      };
    };
  };
}
