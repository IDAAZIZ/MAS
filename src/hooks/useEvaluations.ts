import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { PanelCandidate, Evaluation, EvaluationScore } from '@/lib/types';
import { generateCandidateIdentifier } from '@/utils/formatters';
import toast from 'react-hot-toast';

export function usePanelCandidates(awardId: string, yearId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['panel-candidates', awardId, yearId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('panel_candidates')
        .select('*, evaluations:evaluations(*)')
        .eq('award_id', awardId)
        .eq('award_year_id', yearId)
        .eq('panel_id', user!.id)
        .order('created_at');
      if (error) throw error;
      return data as (PanelCandidate & { evaluations: Evaluation[] })[];
    },
    enabled: !!awardId && !!yearId && !!user,
  });

  const create = useMutation({
    mutationFn: async (input: { candidate_name: string; staff_number?: string; division: string; position?: string }) => {
      const { data, error } = await supabase.from('panel_candidates').insert({
        ...input,
        award_id: awardId,
        award_year_id: yearId,
        panel_id: user!.id,
        created_by: user!.id,
      }).select().single();
      if (error) throw error;
      // Create draft evaluation
      await supabase.from('evaluations').insert({
        panel_candidate_id: data.id,
        panel_id: user!.id,
        award_id: awardId,
        award_year_id: yearId,
        status: 'draft',
      });
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['panel-candidates', awardId, yearId] }); toast.success('Calon berjaya ditambah.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('panel_candidates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['panel-candidates', awardId, yearId] }); toast.success('Calon berjaya dipadam.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, create, remove };
}

export function useEvaluation(candidateId: string, awardId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['evaluation', candidateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*, scores:evaluation_scores(*, award_item:award_items(*))')
        .eq('panel_candidate_id', candidateId)
        .eq('panel_id', user!.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as (Evaluation & { scores: (EvaluationScore & { award_item: any })[] }) | null;
    },
    enabled: !!candidateId && !!user,
  });

  const saveScores = useMutation({
    mutationFn: async (scores: { evaluationId: string; items: { award_item_id: string; score: number; max_score: number }[] }) => {
      for (const item of scores.items) {
        const { error } = await supabase.from('evaluation_scores').upsert({
          evaluation_id: scores.evaluationId,
          award_item_id: item.award_item_id,
          score: item.score,
          max_score: item.max_score,
        }, { onConflict: 'evaluation_id,award_item_id' });
        if (error) throw error;
      }
      // Update total
      const total = scores.items.reduce((sum, i) => sum + (i.score || 0), 0);
      await supabase.from('evaluations').update({ total_score: total }).eq('id', scores.evaluationId);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['evaluation', candidateId] }); toast.success('Draf berjaya disimpan.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = useMutation({
    mutationFn: async (params: { evaluationId: string; totalScore: number; candidate: PanelCandidate }) => {
      const { error } = await supabase.from('evaluations').update({
        status: 'submitted',
        total_score: params.totalScore,
        submitted_at: new Date().toISOString(),
      }).eq('id', params.evaluationId);
      if (error) throw error;

      // Update candidate aggregate
      const identifier = generateCandidateIdentifier(params.candidate.staff_number, params.candidate.candidate_name, params.candidate.division);
      const { data: existing } = await supabase
        .from('candidate_aggregates')
        .select('*')
        .eq('award_id', awardId)
        .eq('award_year_id', params.candidate.award_year_id)
        .eq('candidate_identifier', identifier)
        .single();

      if (existing) {
        const scores = [...(existing.individual_scores || []), params.totalScore];
        const total = scores.reduce((s: number, v: number) => s + v, 0);
        await supabase.from('candidate_aggregates').update({
          score_count: scores.length,
          total_score: total,
          average_score: parseFloat((total / scores.length).toFixed(2)),
          individual_scores: scores,
          candidate_name: params.candidate.candidate_name,
          division: params.candidate.division,
        }).eq('id', existing.id);
      } else {
        await supabase.from('candidate_aggregates').insert({
          award_id: awardId,
          award_year_id: params.candidate.award_year_id,
          candidate_identifier: identifier,
          candidate_name: params.candidate.candidate_name,
          staff_number: params.candidate.staff_number,
          division: params.candidate.division,
          score_count: 1,
          total_score: params.totalScore,
          average_score: params.totalScore,
          individual_scores: [params.totalScore],
        });
      }

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        user_name: 'Panel',
        user_role: 'panel',
        action: 'Submit Penilaian',
        details: `${params.candidate.candidate_name} - ${params.totalScore}`,
        entity_type: 'evaluation',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluation', candidateId] });
      qc.invalidateQueries({ queryKey: ['panel-candidates'] });
      toast.success('Penilaian berjaya dihantar.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, saveScores, submit };
}
