import { ReactNode } from 'react';

export function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-7xl p-6 md:p-10">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
        <span className="rounded-full border border-gold px-4 py-1 text-sm text-gold">Allied Elite Financial</span>
      </header>
      {children}
    </main>
  );
}

export function Card({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 text-navy shadow-executive">
      <p className="text-sm uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  );
}
