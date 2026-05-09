'use client';
import { useState } from 'react';
import Papa from 'papaparse';
import { Shell } from '@/components/ui';

export default function UploadPage() {
  const [rows, setRows] = useState(0);
  return (
    <Shell title="CSV Upload">
      <div className="rounded-2xl bg-white p-6 text-navy shadow-executive">
        <input type="file" accept=".csv" onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          Papa.parse(file, { header: true, complete: (result) => setRows(result.data.length) });
        }} />
        <p className="mt-4 text-sm text-slate-600">Rows parsed: {rows}</p>
      </div>
    </Shell>
  );
}
