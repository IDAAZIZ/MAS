export function formatScore(score: number | null, maxScore: number): string {
  return score !== null ? `${score} / ${maxScore}` : `- / ${maxScore}`;
}

export function formatAverage(avg: number | null): string {
  return avg !== null ? avg.toFixed(2) : '-';
}

export function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(date: string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return `${d.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}`;
}

export function generateCandidateIdentifier(staffNumber: string | null | undefined, candidateName: string, division: string): string {
  if (staffNumber && staffNumber.trim()) return staffNumber.trim();
  return `${candidateName.toLowerCase().trim()}|${division.toLowerCase().trim()}`;
}
