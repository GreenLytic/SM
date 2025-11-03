import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseSupabaseQueryOptions {
  table: string;
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  filter?: { column: string; operator: string; value: any }[];
  realtime?: boolean;
}

export function useSupabaseQuery<T>(options: UseSupabaseQueryOptions) {
  const { table, select = '*', orderBy, filter, realtime = false } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from(table).select(select);

      // Apply filters
      if (filter) {
        filter.forEach(f => {
          if (f.operator === 'eq') {
            query = query.eq(f.column, f.value);
          } else if (f.operator === 'gte') {
            query = query.gte(f.column, f.value);
          } else if (f.operator === 'lte') {
            query = query.lte(f.column, f.value);
          } else if (f.operator === 'like') {
            query = query.like(f.column, f.value);
          }
        });
      }

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      const { data: result, error: queryError } = await query;

      if (queryError) throw queryError;
      setData(result as T[]);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [table, select, JSON.stringify(orderBy), JSON.stringify(filter)]);

  useEffect(() => {
    fetchData();

    // Setup realtime subscription if enabled
    let channel: RealtimeChannel | null = null;
    if (realtime) {
      channel = supabase
        .channel(`${table}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table
          },
          () => {
            fetchData();
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchData, realtime, table]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}
