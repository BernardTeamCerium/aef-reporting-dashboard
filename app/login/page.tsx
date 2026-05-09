'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Shell } from '@/components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');

  const handleLogin = async () => {
    await supabase.auth.signInWithOtp({ email });
    alert('Magic link sent.');
  };

  return (
    <Shell title="Login">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 text-navy shadow-executive">
        <label className="mb-2 block text-sm font-medium">Email</label>
        <input className="w-full rounded-md border p-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        <button onClick={handleLogin} className="mt-4 w-full rounded-md bg-navy px-4 py-2 font-medium text-white">Send magic link</button>
      </div>
    </Shell>
  );
}
