import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Column { key: string; label: string; }

export function generatePDF(title: string, columns: Column[], data: Record<string, any>[]) {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dijana pada: ${new Date().toLocaleDateString('ms-MY')}`, 14, 28);

  autoTable(doc, {
    startY: 35,
    head: [columns.map((c) => c.label)],
    body: data.map((row) => columns.map((c) => String(row[c.key] ?? '-'))),
    styles: { fontSize: 8, font: 'helvetica' },
    headStyles: { fillColor: [10, 31, 68], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 246, 248] },
  });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

export function generateExcel(title: string, columns: Column[], data: Record<string, any>[]) {
  const wsData = [columns.map((c) => c.label), ...data.map((row) => columns.map((c) => row[c.key] ?? '-'))];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31));
  XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}.xlsx`);
}

export function generateCSV(columns: Column[], data: Record<string, any>[]) {
  const header = columns.map((c) => `"${c.label}"`).join(',');
  const rows = data.map((row) => columns.map((c) => `"${String(row[c.key] ?? '-').replace(/"/g, '""')}"`).join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'laporan.csv';
  a.click();
  URL.revokeObjectURL(url);
}
