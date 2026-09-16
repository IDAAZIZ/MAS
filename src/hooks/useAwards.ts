import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { localDB, isSupabaseConfigured } from '@/lib/localStore';
import type { Award } from '@/lib/types';
import toast from 'react-hot-toast';

export function useAwards() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['awards'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return localDB.getAwards();
      }
      try {
        const { data, error } = await supabase.from('awards').select('*').order('sort_order');
        if (error) throw error;
        return (data || []) as Award[];
      } catch {
        return localDB.getAwards();
      }
    },
  });

  const create = useMutation({
    mutationFn: async (input: { name: string; description?: string; max_candidates?: number }) => {
      if (!isSupabaseConfigured()) {
        localDB.createAward(input);
        return;
      }
      try {
        const maxOrder = (query.data || []).reduce((max, a) => Math.max(max, a.sort_order), 0);
        const { error } = await supabase.from('awards').insert({ ...input, sort_order: maxOrder + 1 });
        if (error) throw error;
      } catch {
        localDB.createAward(input);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['awards'] }); toast.success('Kategori berjaya ditambah.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; description?: string; is_active?: boolean; max_candidates?: number; sort_order?: number }) => {
      if (!isSupabaseConfigured()) {
        localDB.updateAward(id, input);
        return;
      }
      try {
        const { error } = await supabase.from('awards').update(input).eq('id', id);
        if (error) throw error;
      } catch {
        localDB.updateAward(id, input);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['awards'] }); toast.success('Kategori berjaya dikemas kini.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured()) {
        localDB.deleteAward(id);
        return;
      }
      try {
        const { error } = await supabase.from('awards').delete().eq('id', id);
        if (error) throw error;
      } catch {
        localDB.deleteAward(id);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['awards'] }); toast.success('Kategori berjaya dipadam.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, create, update, remove };
}
