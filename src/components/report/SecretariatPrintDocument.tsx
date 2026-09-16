import React from 'react';

export interface SecretariatPrintItem {
  id: string;
  candidate_name: string;
  staff_number?: string | null;
  division: string;
  average_score: number | string;
  category_name: string;
  is_mgmt_approved: boolean;
  is_director_approved?: boolean;
}

interface SecretariatPrintDocumentProps {
  title?: string;
  year?: number | string;
  items: SecretariatPrintItem[];
  showDirectorApproval?: boolean;
  managementSigner?: string;
  directorSigner?: string;
}

export default function SecretariatPrintDocument({
  title = 'SENARAI PERAKUAN & KELULUSAN ANUGERAH APRESIASI STAF KKBDA',
  year = '2026',
  items,
  showDirectorApproval = false,
  managementSigner = 'WAN NORHASHIMAH BINTI WAN HUSIN',
  directorSigner = 'PENGARAH KOLEJ KOMUNITI BANDAR DARULAMAN',
}: SecretariatPrintDocumentProps) {
  const currentDate = new Date().toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('ms-MY', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="secretariat-print-container font-sans text-black p-6 bg-white">
      {/* Header Rasmi Kolej Komuniti */}
      <div className="border-b-2 border-black pb-4 mb-6 text-center">
        <div className="text-center mb-2">
          <h2 className="text-xl font-extrabold tracking-wide uppercase text-gray-900">
            KOLEJ KOMUNITI BANDAR DARULAMAN
          </h2>
          <h3 className="text-sm font-semibold uppercase text-gray-700">
            KEMENTERIAN PENDIDIKAN TINGGI
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">
            SISTEM e-APRESIASI STAF (SESI TAHUN {year})
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-300">
          <h1 className="text-base font-bold uppercase tracking-wider text-black">
            {title}
          </h1>
          <p className="text-xs text-gray-700 mt-0.5 italic">
            Dokumen Rasmi Perakuan & Kelulusan Untuk Tindakan Urus Setia Jawatankuasa Anugerah (UJK)
          </p>
          <div className="flex justify-between items-center text-[11px] text-gray-600 mt-2 px-1">
            <span>Tarikh Cetakan: <strong>{currentDate} ({currentTime})</strong></span>
            <span>Jumlah Rekod Calon: <strong>{items.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Jadual Calon Rasmi */}
      <table className="w-full text-left border-collapse border border-black mb-8 text-xs">
        <thead>
          <tr className="bg-gray-100 text-black uppercase font-bold border-b border-black">
            <th className="border border-black px-3 py-2.5 text-center w-10">Bil</th>
            <th className="border border-black px-3 py-2.5 text-left">Kategori Anugerah</th>
            <th className="border border-black px-3 py-2.5 text-left">Nama Calon</th>
            <th className="border border-black px-3 py-2.5 text-center w-20">Bahagian</th>
            <th className="border border-black px-3 py-2.5 text-center w-24">Markah Purata</th>
            <th className="border border-black px-3 py-2.5 text-center w-28">Pengesahan (TPA/TPP)</th>
            {showDirectorApproval && (
              <th className="border border-black px-3 py-2.5 text-center w-28">Kelulusan Pengarah</th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={showDirectorApproval ? 7 : 6} className="border border-black px-4 py-6 text-center text-gray-500">
                Tiada calon direkodkan dalam senarai tapisan semasa.
              </td>
            </tr>
          ) : (
            items.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-black px-3 py-2 text-center font-bold">
                  {index + 1}
                </td>
                <td className="border border-black px-3 py-2 font-semibold text-gray-900">
                  {item.category_name}
                </td>
                <td className="border border-black px-3 py-2">
                  <div className="font-bold text-gray-900">{item.candidate_name}</div>
                  {item.staff_number && (
                    <div className="text-[10px] text-gray-600">No. Staf: {item.staff_number}</div>
                  )}
                </td>
                <td className="border border-black px-3 py-2 text-center font-medium">
                  {item.division}
                </td>
                <td className="border border-black px-3 py-2 text-center font-mono font-bold text-gray-900">
                  {Number(item.average_score).toFixed(2)}
                </td>
                <td className="border border-black px-3 py-2 text-center">
                  {item.is_mgmt_approved ? (
                    <span className="font-bold text-black border border-black px-2 py-0.5 rounded text-[11px] bg-gray-100">
                      DISAHKAN
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                {showDirectorApproval && (
                  <td className="border border-black px-3 py-2 text-center">
                    {item.is_director_approved ? (
                      <span className="font-extrabold text-black border-2 border-black px-2 py-0.5 rounded text-[11px] bg-gray-200">
                        DILULUSKAN
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Ruangan Pengesahan Bertulis & Tandatangan (Signature Blocks) */}
      <div className="mt-8 pt-4 border-t border-gray-400 text-xs page-break-inside-avoid">
        <h4 className="font-bold uppercase text-black mb-4 text-center text-sm">
          PERAKUAN, KELULUSAN DAN PENERIMAAN DOKUMEN
        </h4>

        <div className="grid grid-cols-3 gap-4">
          {/* Ruangan 1: Pengurusan (TPA/TPP) */}
          <div className="border border-black p-3.5 rounded flex flex-col justify-between h-44 bg-gray-50/50">
            <div>
              <p className="font-bold uppercase text-gray-900 text-[11px]">1. Disahkan Oleh (Pengurusan):</p>
              <p className="text-[10px] text-gray-600">TPA / TPP KKBDA</p>
            </div>
            <div className="space-y-0.5 text-[11px]">
              <div className="border-b border-black pb-1 mb-1.5">
                <span className="text-gray-400 text-[10px]">Tandatangan:</span>
              </div>
              <p className="font-bold uppercase text-gray-900">{managementSigner}</p>
              <p className="text-[10px] text-gray-600">Timbalan Pengarah Akademik / Pengurusan</p>
              <p className="text-[10px] text-gray-500">Tarikh: .......................................</p>
            </div>
          </div>

          {/* Ruangan 2: Pengarah */}
          <div className="border-2 border-black p-3.5 rounded flex flex-col justify-between h-44 bg-gray-100/60">
            <div>
              <p className="font-extrabold uppercase text-gray-900 text-[11px]">2. Diluluskan Oleh (Pengarah):</p>
              <p className="text-[10px] text-gray-600">Kuasa Muktamad Anugerah</p>
            </div>
            <div className="space-y-0.5 text-[11px]">
              <div className="border-b-2 border-black pb-1 mb-1.5">
                <span className="text-gray-400 text-[10px]">Tandatangan:</span>
              </div>
              <p className="font-extrabold uppercase text-gray-900">{directorSigner}</p>
              <p className="text-[10px] text-gray-700 font-semibold">Pengarah Kolej Komuniti Bandar Darulaman</p>
              <p className="text-[10px] text-gray-500">Tarikh: .......................................</p>
            </div>
          </div>

          {/* Ruangan 3: Urus Setia */}
          <div className="border border-black p-3.5 rounded flex flex-col justify-between h-44 bg-gray-50/50">
            <div>
              <p className="font-bold uppercase text-gray-900 text-[11px]">3. Diterima Oleh (Urus Setia):</p>
              <p className="text-[10px] text-gray-600">Urus Setia Jawatankuasa Anugerah</p>
            </div>
            <div className="space-y-0.5 text-[11px]">
              <div className="border-b border-black pb-1 mb-1.5">
                <span className="text-gray-400 text-[10px]">Tandatangan:</span>
              </div>
              <p className="font-bold text-gray-700 italic">Nama: .....................................................</p>
              <p className="text-[10px] text-gray-600">Pegawai Urus Setia / UJK</p>
              <p className="text-[10px] text-gray-500">Tarikh Terima: .......................................</p>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-[10px] text-gray-500">
          Dokumen ini dijana secara digital oleh Sistem e-APRESIASI KKBDA untuk tujuan rekod rasmi dan tindakan lanjut Urus Setia.
        </div>
      </div>
    </div>
  );
}
