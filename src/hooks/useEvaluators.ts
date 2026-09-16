import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { localDB, isSupabaseConfigured } from '@/lib/localStore';
import type { Evaluator, EvaluatorAssignment } from '@/lib/types';
import toast from 'react-hot-toast';

export function useEvaluators() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['evaluators'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return localDB.getEvaluators();
      }
      try {
        const { data, error } = await supabase.from('evaluators').select('*').order('name');
        if (error) throw error;
        return (data || []) as Evaluator[];
      } catch {
        return localDB.getEvaluators();
      }
    },
  });

  const create = useMutation({
    mutationFn: async (input: { name: string; email: string; position?: string; phone?: string }) => {
      if (!isSupabaseConfigured()) {
        localDB.createEvaluator(input);
        return;
      }
      try {
        const { error } = await supabase.from('evaluators').insert(input);
        if (error) throw error;
      } catch {
        localDB.createEvaluator(input);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['evaluators'] }); toast.success('Panel berjaya ditambah.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; email?: string; position?: string; phone?: string; is_active?: boolean }) => {
      if (!isSupabaseConfigured()) {
        localDB.updateEvaluator(id, input);
        return;
      }
      try {
        const { error } = await supabase.from('evaluators').update(input).eq('id', id);
        if (error) throw error;
      } catch {
        localDB.updateEvaluator(id, input);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['evaluators'] }); toast.success('Panel berjaya dikemas kini.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured()) {
        localDB.deleteEvaluator(id);
        return;
      }
      try {
        const { error } = await supabase.from('evaluators').delete().eq('id', id);
        if (error) throw error;
      } catch {
        localDB.deleteEvaluator(id);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['evaluators'] }); toast.success('Panel berjaya dipadam.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, create, update, remove };
}

export function useAssignments(awardId: string, yearId: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['assignments', awardId, yearId],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return localDB.getAssignments(awardId, yearId);
      }
      try {
        const { data, error } = await supabase
          .from('evaluator_assignments')
          .select('*, evaluator:evaluators(*)')
          .eq('award_id', awardId)
          .eq('award_year_id', yearId);
        if (error) throw error;
        return (data || []) as (EvaluatorAssignment & { evaluator: Evaluator })[];
      } catch {
        return localDB.getAssignments(awardId, yearId);
      }
    },
    enabled: !!awardId && !!yearId,
  });

  const assign = useMutation({
    mutationFn: async (evaluatorId: string) => {
      if (!isSupabaseConfigured()) {
        localDB.assignEvaluator(awardId, yearId, evaluatorId);
        return;
      }
      try {
        const { error } = await supabase.from('evaluator_assignments').insert({
          evaluator_id: evaluatorId, award_id: awardId, award_year_id: yearId,
        });
        if (error) throw error;
      } catch {
        localDB.assignEvaluator(awardId, yearId, evaluatorId);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assignments', awardId, yearId] }); toast.success('Panel berjaya ditugaskan.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const unassign = useMutation({
    mutationFn: async (evaluatorId: string) => {
      if (!isSupabaseConfigured()) {
        localDB.unassignEvaluator(awardId, yearId, evaluatorId);
        return;
      }
      try {
        const { error } = await supabase.from('evaluator_assignments')
          .delete()
          .eq('evaluator_id', evaluatorId)
          .eq('award_id', awardId)
          .eq('award_year_id', yearId);
        if (error) throw error;
      } catch {
        localDB.unassignEvaluator(awardId, yearId, evaluatorId);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assignments', awardId, yearId] }); toast.success('Tugasan panel dikeluarkan.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setDivision = useMutation({
    mutationFn: async ({ evaluatorId, division }: { evaluatorId: string; division: string }) => {
      if (!isSupabaseConfigured()) {
        localDB.setAssignmentDivision(awardId, yearId, evaluatorId, division);
        return;
      }
      try {
        const { error } = await supabase
          .from('evaluator_assignments')
          .update({ division })
          .eq('evaluator_id', evaluatorId)
          .eq('award_id', awardId)
          .eq('award_year_id', yearId);
        if (error) throw error;
      } catch {
        localDB.setAssignmentDivision(awardId, yearId, evaluatorId, division);
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['assignments', awardId, yearId] });
      toast.success(`Bahagian ditugaskan kepada: ${vars.division}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, assign, unassign, setDivision };
}
