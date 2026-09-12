'use client';

import { Pencil, Plus, Search, SquareKanban, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Topbar } from '@/components/layout/topbar';
import { BoardForm } from '@/components/board/board-form';
import { Badge, Button, Card, EmptyState, Input, PageLoader, ProgressBar, Select } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/overlays';
import { useAuth } from '@/lib/auth';
import { useBoards, useDeleteBoard, usePlatforms } from '@/lib/queries';
import type { BoardSummary } from '@/lib/types';
import { apiError } from '@/lib/api';
import { toast } from 'sonner';
import { progress } from '@/lib/utils';

export default function BoardsPage() {
  const { isAdmin } = useAuth();
  const [platformId, setPlatformId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BoardSummary | null>(null);
  const [deleting, setDeleting] = useState<BoardSummary | null>(null);
  const deleteBoard = useDeleteBoard();

  const { data: platforms = [] } = usePlatforms();
  const { data: boards, isLoading } = useBoards(platformId ? Number(platformId) : null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return boards ?? [];
    return (boards ?? []).filter(
      (board) =>
        board.name.toLowerCase().includes(term) ||
        board.boardKey.toLowerCase().includes(term) ||
        (board.platformName ?? '').toLowerCase().includes(term),
    );
  }, [boards, search]);

  return (
    <>
      <Topbar
        title="Boards"
        subtitle="Every kanban board across the university"
        actions={
          isAdmin ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              New board
            </Button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-[1400px] space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search boards…"
                className="pl-9"
              />
            </div>
            <Select
              value={platformId}
              onChange={(event) => setPlatformId(event.target.value)}
              className="w-full sm:w-56"
            >
              <option value="">All platforms</option>
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </Select>
          </div>

          {isLoading ? (
            <PageLoader />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<SquareKanban className="h-6 w-6" />}
              title="No boards found"
              description={
                isAdmin
                  ? 'Create the first board and it will show up here with the default kanban columns.'
                  : 'Ask an administrator to add you to a board.'
              }
              action={
                isAdmin ? (
                  <Button onClick={() => setCreating(true)}>
                    <Plus className="h-4 w-4" />
                    New board
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((board) => (
                <Link key={board.id} href={`/boards/${board.boardKey}`}>
                  <Card className="group h-full overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop">
                    <div className="h-1.5" style={{ backgroundColor: board.color || '#402f75' }} />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-[14.5px] font-semibold text-ink-900">{board.name}</h3>
                          <p className="mt-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                            {board.boardKey}
                          </p>
                        </div>
                        {board.platformName && (
                          <Badge
                            className="shrink-0 bg-ink-100 text-ink-600"
                            dot={undefined}
                          >
                            {board.platformName}
                          </Badge>
                        )}
                      </div>

                      {board.description && (
                        <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink-500">
                          {board.description}
                        </p>
                      )}

                      <ProgressBar value={progress(board.doneCount, board.taskCount)} className="mt-4" />
                      <div className="mt-2.5 flex items-center justify-between text-[12px] text-ink-500">
                        <span>
                          {board.doneCount}/{board.taskCount} done
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {board.memberCount}
                          </span>
                          {isAdmin && (
                            <span className="ml-1 flex items-center gap-0.5 border-l border-ink-100 pl-1.5">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setEditing(board);
                                }}
                                className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
                                aria-label={`Edit ${board.name}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setDeleting(board);
                                }}
                                className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                aria-label={`Delete ${board.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <BoardForm open={creating} onClose={() => setCreating(false)} defaultPlatformId={platformId ? Number(platformId) : null} />
      <BoardForm open={Boolean(editing)} onClose={() => setEditing(null)} board={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteBoard.mutateAsync(deleting.id);
            toast.success(`${deleting.name} deleted`);
            setDeleting(null);
          } catch (error) {
            toast.error(apiError(error, 'This board could not be deleted.'));
          }
        }}
        loading={deleteBoard.isPending}
        title={`Delete ${deleting?.name ?? 'board'}?`}
        message={`Every task, comment and activity record on ${deleting?.boardKey ?? 'this board'} is permanently removed. This cannot be undone.`}
        confirmLabel="Delete board"
      />
    </>
  );
}
