import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { CheckCircle2, User } from 'lucide-react';
import type { PanelCandidate } from '@/lib/types';

interface EvaluationSummaryProps {
  candidates: (PanelCandidate & { score?: number | null })[];
}

export default function EvaluationSummary({ candidates }: EvaluationSummaryProps) {
  if (candidates.length === 0) return null;

  return (
    <Card className="mt-8 border-2 border-green-500/20 bg-green-50/10">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <h4 className="font-bold text-navy text-base">Ringkasan Penilaian Calon Saya</h4>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs uppercase text-gray-400 font-semibold border-b border-gray-100 pb-2">
              <th className="text-left py-2">Calon</th>
              <th className="text-left py-2">Bahagian</th>
              <th className="text-center py-2">Markah</th>
              <th className="text-right py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {candidates.map((cand) => (
              <tr key={cand.id} className="hover:bg-gray-50/50">
                <td className="py-2.5 font-bold text-gray-900">{cand.candidate_name}</td>
                <td className="py-2.5 text-gray-600">{cand.division}</td>
                <td className="py-2.5 text-center font-mono font-bold text-navy">
                  {cand.score !== null && cand.score !== undefined ? `${cand.score} / 100` : '-'}
                </td>
                <td className="py-2.5 text-right">
                  <Badge variant="success">SELESAI</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
