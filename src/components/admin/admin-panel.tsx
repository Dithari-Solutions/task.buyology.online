'use client';

import { ArrowUpRight, Layers, Network, ShieldCheck, SquareKanban, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { DiagramForm } from '@/components/architecture/diagram-form';
import { BoardForm } from '@/components/board/board-form';
import { PlatformForm } from '@/components/platform/platform-form';
import { UserForm } from '@/components/user/user-form';
import { Card } from '@/components/ui';
import { useDiagrams } from '@/lib/queries';
import { cn } from '@/lib/utils';

type Creating = 'user' | 'platform' | 'board' | 'diagram' | null;

const TONES = {
  brand: 'bg-brand-50 text-brand-600 group-hover:bg-brand-100',
  emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
  sky: 'bg-sky-50 text-sky-600 group-hover:bg-sky-100',
  violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-100',
};

function ActionTile({
  icon,
  label,
  description,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  tone: keyof typeof TONES;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-xl border border-ink-100 bg-white p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors', TONES[tone])}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-ink-900">{label}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-ink-500">{description}</span>
      </span>
    </button>
  );
}

function ManageLink({ href, icon, label, count }: { href: string; icon: React.ReactNode; label: string; count?: number }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 rounded-lg border border-ink-100 px-3 py-2 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
    >
      <span className="text-ink-400 transition-colors group-hover:text-brand-500">{icon}</span>
      <span className="text-[12.5px] font-medium text-ink-700">{label}</span>
      {typeof count === 'number' && (
        <span className="ml-auto rounded-md bg-ink-100 px-1.5 py-0.5 text-[11px] font-semibold text-ink-600">{count}</span>
      )}
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-ink-300 transition-colors group-hover:text-brand-500" />
    </Link>
  );
}

/**
 * Administrator-only shortcuts on the dashboard. Everything here also lives on its own
 * page - this is the "start here" panel so an admin never has to hunt for the entry point.
 */
export function AdminQuickActions({
  users,
  platforms,
  boards,
}: {
  users: number;
  platforms: number;
  boards: number;
}) {
  const [creating, setCreating] = useState<Creating>(null);
  const { data: diagrams = [] } = useDiagrams();

  return (
    <>
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-ink-900">Administration</h2>
            <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-brand-600">
              <ShieldCheck className="h-3 w-3" />
              Admin
            </span>
          </div>
          <span className="text-[12px] text-ink-400">Only administrators can see this</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ActionTile
            icon={<UserPlus className="h-[18px] w-[18px]" />}
            label="Add user"
            description="Create an account and e-mail the credentials"
            tone="brand"
            onClick={() => setCreating('user')}
          />
          <ActionTile
            icon={<Layers className="h-[18px] w-[18px]" />}
            label="New platform"
            description="Group boards under a department or product"
            tone="emerald"
            onClick={() => setCreating('platform')}
          />
          <ActionTile
            icon={<SquareKanban className="h-[18px] w-[18px]" />}
            label="New board"
            description="Columns, members and a task key prefix"
            tone="sky"
            onClick={() => setCreating('board')}
          />
          <ActionTile
            icon={<Network className="h-[18px] w-[18px]" />}
            label="New diagram"
            description="Document how a system fits together"
            tone="violet"
            onClick={() => setCreating('diagram')}
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <ManageLink href="/users" icon={<Users className="h-4 w-4" />} label="Manage users" count={users} />
          <ManageLink href="/platforms" icon={<Layers className="h-4 w-4" />} label="Manage platforms" count={platforms} />
          <ManageLink href="/boards" icon={<SquareKanban className="h-4 w-4" />} label="Manage boards" count={boards} />
          <ManageLink
            href="/architecture"
            icon={<Network className="h-4 w-4" />}
            label="Architecture"
            count={diagrams.length}
          />
        </div>
      </Card>

      <UserForm open={creating === 'user'} onClose={() => setCreating(null)} />
      <PlatformForm open={creating === 'platform'} onClose={() => setCreating(null)} />
      <BoardForm open={creating === 'board'} onClose={() => setCreating(null)} />
      <DiagramForm open={creating === 'diagram'} onClose={() => setCreating(null)} />
    </>
  );
}
