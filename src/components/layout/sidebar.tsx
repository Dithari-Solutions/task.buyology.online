'use client';

import {
  ChevronDown,
  Layers,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Network,
  Settings,
  SquareKanban,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useBoards } from '@/lib/queries';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';
import { BuyologyLogo } from '@/components/brand/logo';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/my-tasks', label: 'My tasks', icon: ListChecks },
  { href: '/boards', label: 'Boards', icon: SquareKanban },
  { href: '/platforms', label: 'Platforms', icon: Layers },
  { href: '/architecture', label: 'Architecture', icon: Network },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const { data: boards } = useBoards();
  const [boardsOpen, setBoardsOpen] = useState(true);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-full w-[260px] flex-col bg-brand-950 text-white">
      {/* brand - the approved white-on-American-Blue lock-up */}
      <div className="px-5 py-6">
        <Link href="/dashboard" onClick={onNavigate} className="block">
          <BuyologyLogo className="h-[26px] w-auto text-white" />
        </Link>
        <p className="mt-2 text-[11px] tracking-[0.02em] text-white/45">Task management</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4 scrollbar-none">
        <div className="space-y-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn('nav-link', isActive(item.href) && 'nav-link-active')}
            >
              <item.icon className="h-[17px] w-[17px]" strokeWidth={1.8} />
              {item.label}
            </Link>
          ))}
        </div>

        {/* boards */}
        <div>
          <button
            onClick={() => setBoardsOpen((value) => !value)}
            className="flex w-full items-center justify-between px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35 transition-colors hover:text-white/60"
          >
            Your boards
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !boardsOpen && '-rotate-90')} />
          </button>
          {boardsOpen && (
            <div className="space-y-0.5">
              {(boards ?? []).slice(0, 12).map((board) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.boardKey}`}
                  onClick={onNavigate}
                  className={cn('nav-link', pathname === `/boards/${board.boardKey}` && 'nav-link-active')}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: board.color || '#402f75' }}
                  />
                  <span className="truncate">{board.name}</span>
                  <span className="ml-auto text-[11px] font-normal text-white/35">{board.taskCount}</span>
                </Link>
              ))}
              {boards && boards.length === 0 && (
                <p className="px-3 py-2 text-[12px] text-white/35">No boards yet.</p>
              )}
            </div>
          )}
        </div>

        {isAdmin && (
          <div>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">
              Administration
            </p>
            <div className="space-y-0.5">
              <Link
                href="/users"
                onClick={onNavigate}
                className={cn('nav-link', isActive('/users') && 'nav-link-active')}
              >
                <Users className="h-[17px] w-[17px]" strokeWidth={1.8} />
                Users
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* user */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <Avatar user={user} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{user?.fullName}</p>
            <p className="truncate text-[11px] text-white/45">{user?.email}</p>
          </div>
        </div>
        <div className="mt-1 flex gap-1">
          <Link
            href="/profile"
            onClick={onNavigate}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Settings className="h-3.5 w-3.5" />
            Profile
          </Link>
          <button
            onClick={logout}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
