'use client';

import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { apiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Field, Input } from '@/components/ui';
import { BuyologyLogo, BuyologyMark, BuyologyWave } from '@/components/brand/logo';

const HIGHLIGHTS = [
  'Platforms, boards and columns managed centrally by administrators',
  'Drag-and-drop kanban with WIP limits, priorities and deadlines',
  'Automatic e-mail for assignments, moves, comments and due dates',
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      const next = searchParams.get('next');
      router.replace(next && next.startsWith('/') ? next : '/dashboard');
      router.refresh();
    } catch (err) {
      setError(apiError(err, 'Invalid e-mail or password.'));
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ---------------- brand panel ---------------- */}
      <section className="relative hidden overflow-hidden bg-brand-900 px-14 py-16 lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(980px 560px at 10% -8%, rgba(102,89,145,.85), transparent 64%), radial-gradient(680px 500px at 94% 106%, rgba(255,190,18,.18), transparent 62%)',
          }}
        />
        {/* the B-wave, oversized and barely there, as the panel's texture */}
        <BuyologyWave className="pointer-events-none absolute -bottom-4 -left-24 w-[150%] text-accent-500/[0.10]" />

        <div className="relative">
          <BuyologyLogo className="h-8 w-auto text-white" />
          <p className="mt-3 text-xs tracking-[0.02em] text-white/55">Task management</p>
        </div>

        <div className="relative max-w-lg">
          <h1 className="text-[42px] font-bold leading-[1.08] tracking-[-0.03em] text-white">
            Every project of the university,
            <span className="block text-accent-500">on one board.</span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-white/70">
            Plan, assign and track work across faculties and departments with a workflow your
            team already understands.
          </p>
          <ul className="mt-9 space-y-3.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/75">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-between gap-4">
          <p className="text-xs text-white/40">© {new Date().getFullYear()} Buyology</p>
          <p className="text-xs font-semibold tracking-[0.02em] text-accent-500">Buy the why</p>
        </div>
      </section>

      {/* ---------------- form panel ---------------- */}
      <section className="flex items-center justify-center bg-white px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-9 lg:hidden">
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600">
              <BuyologyMark className="h-7 w-7 text-white" />
            </span>
            <BuyologyLogo className="h-5 w-auto text-ink-900" />
          </div>

          <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-ink-900">Sign in</h2>
          <p className="mt-1.5 text-sm text-ink-500">
            Use the university account an administrator created for you.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Field label="University e-mail" required>
              <Input
                type="email"
                autoComplete="username"
                placeholder="name.surname@buyology.online"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoFocus
              />
            </Field>

            <Field label="Password" required>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 transition-colors hover:text-ink-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-[13px] text-rose-700">
                <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sign in
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs leading-relaxed text-ink-400">
            Forgot your password? Ask an administrator to issue a new one from the Users page.
          </p>
        </div>
      </section>
    </main>
  );
}
