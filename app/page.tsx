import Link from 'next/link';
import { Shell } from '@/components/ui';

export default function Home() {
  return (
    <Shell title="AEF Reporting Dashboard">
      <div className="grid gap-4 md:grid-cols-2">
        {['/login', '/dashboard/client', '/dashboard/admin', '/upload', '/campaigns', '/settings'].map((href) => (
          <Link key={href} href={href} className="rounded-xl border border-gold/40 bg-white/5 p-5 text-lg text-white hover:bg-white/10">
            {href}
          </Link>
        ))}
      </div>
    </Shell>
  );
}
