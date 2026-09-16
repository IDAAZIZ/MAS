import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { localDB, isSupabaseConfigured } from '@/lib/localStore';
import type { AwardYear } from '@/lib/types';
import toast from 'react-hot-toast';

export function useAwardYears() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['award-years'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return localDB.getYears();
      }
      try {
        const { data, error } = await supabase
          .from('award_years')
          .select('*')
          .order('year', { ascending: false });
        if (error) throw error;
        return (data || []) as AwardYear[];
      } catch (err) {
        console.warn('Falling back to local storage for award years:', err);
        return localDB.getYears();
      }
    },
  });

  const create = useMutation({
    mutationFn: async (year: number) => {
      if (!isSupabaseConfigured()) {
        localDB.createYear(year);
        return;
      }
      try {
        const { error } = await supabase.from('award_years').insert({ year });
        if (error) throw error;
      } catch {
        localDB.createYear(year);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['award-years'] });
      toast.success('Tahun berjaya ditambah.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setActive = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured()) {
        localDB.setActiveYear(id);
        return;
      }
      try {
        await supabase.from('award_years').update({ is_active: false }).neq('id', id);
        const { error } = await supabase.from('award_years').update({ is_active: true }).eq('id', id);
        if (error) throw error;
      } catch {
        localDB.setActiveYear(id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['award-years'] });
      toast.success('Tahun aktif dikemas kini.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured()) {
        localDB.deleteYear(id);
        return;
      }
      try {
        const { error } = await supabase.from('award_years').delete().eq('id', id);
        if (error) throw error;
      } catch {
        localDB.deleteYear(id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['award-years'] });
      toast.success('Tahun berjaya dipadam.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, create, setActive, remove };
}
