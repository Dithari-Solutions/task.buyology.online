'use client';

import {
  Activity as ActivityIcon,
  AlertTriangle,
  ArrowUpRight,
  CircleDot,
  Layers,
  ListChecks,
  SquareKanban,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AdminQuickActions } from '@/components/admin/admin-panel';
import { Topbar } from '@/components/layout/topbar';
import { TaskDrawer } from '@/components/task/task-detail';
import { Avatar, Badge, Card, PageLoader, ProgressBar } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useDashboard } from '@/lib/queries';
import { PRIORITY_META, TYPE_META, cn, dueLabel, fromNow, progress } from '@/lib/utils';

function StatCard({
  label,
  value,
  icon,
  tone = 'brand',
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: 'brand' | 'rose' | 'emerald' | 'sky';
  href?: string;
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    sky: 'bg-sky-50 text-sky-600',
  };

  const inner = (
    <Card className="group p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop">
      <div className="flex items-start justify-between">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', tones[tone])}>{icon}</span>
        {href && <ArrowUpRight className="h-4 w-4 text-ink-300 transition-colors group-hover:text-brand-500" />}
      </div>
      <p className="stat-value mt-3">{value}</p>
      <p className="mt-1 text-[12.5px] text-ink-500">{label}</p>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { data, isLoading } = useDashboard();
  const [openTask, setOpenTask] = useState<string | null>(null);

  const firstName = user?.fullName?.split(' ')[0] ?? '';
  const total = data ? data.todoCount + data.inProgressCount + data.doneCount : 0;

  return (
    <>
      <Topbar title="Dashboard" subtitle={`Welcome back, ${firstName} — here is where everything stands.`} />

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {isLoading || !data ? (
          <PageLoader />
        ) : (
          <div className="mx-auto max-w-[1400px] space-y-6">
            {/* stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="My open tasks" value={data.myOpenTasks} icon={<ListChecks className="h-[18px] w-[18px]" />} href="/my-tasks" />
              <StatCard
                label="My overdue tasks"
                value={data.myOverdueTasks}
                tone="rose"
                icon={<AlertTriangle className="h-[18px] w-[18px]" />}
                href="/my-tasks"
              />
              <StatCard label="Boards" value={data.totalBoards} tone="sky" icon={<SquareKanban className="h-[18px] w-[18px]" />} href="/boards" />
              {isAdmin ? (
                <StatCard label="Active users" value={data.totalUsers} tone="emerald" icon={<Users className="h-[18px] w-[18px]" />} href="/users" />
              ) : (
                <StatCard label="Platforms" value={data.totalPlatforms} tone="emerald" icon={<Layers className="h-[18px] w-[18px]" />} href="/platforms" />
              )}
            </div>

            {isAdmin && (
              <AdminQuickActions
                users={data.totalUsers}
                platforms={data.totalPlatforms}
                boards={data.totalBoards}
              />
            )}

            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              <div className="space-y-6">
                {/* workflow */}
                <Card className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold text-ink-900">Workflow overview</h2>
                    <span className="text-[12px] text-ink-400">{total} tasks in total</span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { label: 'To do', value: data.todoCount, color: 'bg-ink-400' },
                      { label: 'In progress', value: data.inProgressCount, color: 'bg-brand-500' },
                      { label: 'Done', value: data.doneCount, color: 'bg-emerald-500' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-ink-100 p-3">
                        <div className="flex items-center gap-2">
                          <span className={cn('h-2 w-2 rounded-full', item.color)} />
                          <span className="text-[12.5px] text-ink-500">{item.label}</span>
                        </div>
                        <p className="mt-1.5 text-[22px] font-semibold leading-none text-ink-900">{item.value}</p>
                        <ProgressBar value={progress(item.value, total)} className="mt-2.5" />
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 border-t border-ink-100 pt-4">
                    <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-400">
                      By priority
                    </p>
                    <div className="space-y-2">
                      {Object.entries(PRIORITY_META).map(([key, meta]) => {
                        const value = data.tasksByPriority[key] ?? 0;
                        return (
                          <div key={key} className="flex items-center gap-3">
                            <span className="w-16 text-[12px] text-ink-500">{meta.label}</span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                              <div
                                className={cn('h-full rounded-full transition-all duration-500', meta.bar)}
                                style={{ width: `${progress(value, total)}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-[12px] font-medium text-ink-600">{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>

                {/* my tasks */}
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
                    <h2 className="text-[15px] font-semibold text-ink-900">Assigned to me</h2>
                    <Link href="/my-tasks" className="text-[12.5px] font-medium text-brand-600 hover:text-brand-700">
                      View all
                    </Link>
                  </div>
                  {data.myTasks.length === 0 ? (
                    <p className="px-5 py-10 text-center text-[13px] text-ink-400">
                      Nothing assigned to you right now.
                    </p>
                  ) : (
                    <ul className="divide-y divide-ink-50">
                      {data.myTasks.map((task) => (
                        <li key={task.id}>
                          <button
                            onClick={() => setOpenTask(task.taskKey)}
                            className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-50/70"
                          >
                            <span
                              className={cn(
                                'flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold',
                                TYPE_META[task.type].color,
                              )}
                            >
                              {TYPE_META[task.type].glyph}
                            </span>
                            <span className="font-mono text-[11.5px] font-semibold text-ink-400">{task.taskKey}</span>
                            <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink-800">{task.title}</span>
                            {task.dueDate && (
                              <Badge className={task.overdue ? 'bg-rose-50 text-rose-600' : 'bg-ink-100 text-ink-500'}>
                                {dueLabel(task.dueDate)}
                              </Badge>
                            )}
                            <Badge className={PRIORITY_META[task.priority].color} dot={PRIORITY_META[task.priority].dot}>
                              {PRIORITY_META[task.priority].label}
                            </Badge>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                {/* boards */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold text-ink-900">Your boards</h2>
                    <Link href="/boards" className="text-[12.5px] font-medium text-brand-600 hover:text-brand-700">
                      All boards
                    </Link>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {data.boards.map((board) => (
                      <Link key={board.id} href={`/boards/${board.boardKey}`}>
                        <Card className="h-full p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-[4px]"
                              style={{ backgroundColor: board.color || '#402f75' }}
                            />
                            <p className="truncate text-[13.5px] font-semibold text-ink-900">{board.name}</p>
                          </div>
                          <p className="mt-1 text-[11.5px] uppercase tracking-wide text-ink-400">
                            {board.platformName} · {board.boardKey}
                          </p>
                          <ProgressBar value={progress(board.doneCount, board.taskCount)} className="mt-3" />
                          <p className="mt-2 text-[12px] text-ink-500">
                            {board.doneCount}/{board.taskCount} done · {board.memberCount} members
                          </p>
                        </Card>
                      </Link>
                    ))}
                    {data.boards.length === 0 && (
                      <p className="text-[13px] text-ink-400">No boards yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* right rail */}
              <div className="space-y-6">
                <Card className="overflow-hidden">
                  <div className="border-b border-ink-100 px-5 py-4">
                    <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink-900">
                      <CircleDot className="h-4 w-4 text-brand-500" />
                      Upcoming deadlines
                    </h2>
                  </div>
                  {data.upcomingDeadlines.length === 0 ? (
                    <p className="px-5 py-8 text-center text-[13px] text-ink-400">No deadlines in the next week.</p>
                  ) : (
                    <ul className="divide-y divide-ink-50">
                      {data.upcomingDeadlines.map((task) => (
                        <li key={task.id}>
                          <button
                            onClick={() => setOpenTask(task.taskKey)}
                            className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-50/70"
                          >
                            <Avatar user={task.assignee} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium text-ink-800">{task.title}</p>
                              <p className="mt-0.5 font-mono text-[11px] text-ink-400">{task.taskKey}</p>
                            </div>
                            <Badge className={task.overdue ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'}>
                              {dueLabel(task.dueDate)}
                            </Badge>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card className="overflow-hidden">
                  <div className="border-b border-ink-100 px-5 py-4">
                    <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink-900">
                      <ActivityIcon className="h-4 w-4 text-brand-500" />
                      Recent activity
                    </h2>
                  </div>
                  <ol className="max-h-[440px] space-y-4 overflow-y-auto px-5 py-4">
                    {data.recentActivity.map((entry) => (
                      <li key={entry.id} className="flex gap-3">
                        <Avatar user={entry.actor} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12.5px] leading-snug text-ink-600">
                            <span className="font-medium text-ink-900">{entry.actor?.fullName ?? 'Someone'}</span>{' '}
                            {entry.type === 'TASK_CREATED' && 'created'}
                            {entry.type === 'TASK_MOVED' && `moved to ${entry.newValue}`}
                            {entry.type === 'TASK_ASSIGNED' && `assigned ${entry.newValue} to`}
                            {entry.type === 'TASK_UNASSIGNED' && 'unassigned'}
                            {entry.type === 'COMMENT_ADDED' && 'commented on'}
                            {entry.type === 'TASK_UPDATED' && 'updated'}
                            {entry.type === 'TASK_DELETED' && 'deleted'}{' '}
                            {entry.taskKey && (
                              <button
                                onClick={() => entry.taskKey && setOpenTask(entry.taskKey)}
                                className="font-mono text-[11.5px] font-semibold text-brand-600 hover:underline"
                              >
                                {entry.taskKey}
                              </button>
                            )}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-400">{fromNow(entry.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                    {data.recentActivity.length === 0 && (
                      <p className="py-6 text-center text-[13px] text-ink-400">Nothing has happened yet.</p>
                    )}
                  </ol>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      <TaskDrawer taskKey={openTask} open={Boolean(openTask)} onClose={() => setOpenTask(null)} />
    </>
  );
}
