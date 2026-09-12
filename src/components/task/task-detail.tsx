'use client';

import {
  CalendarClock,
  Clock,
  Eye,
  Hash,
  Pencil,
  Send,
  Trash2,
  UserCircle2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  useAddComment,
  useBoard,
  useComments,
  useDeleteComment,
  useUpdateComment,
  useDeleteTask,
  useTask,
  useTaskActivity,
  useUpdateTask,
} from '@/lib/queries';
import type { TaskDetail } from '@/lib/types';
import { CATEGORY_META, PRIORITY_META, TYPE_META, cn, formatDate, formatDateTime, fromNow, titleCase } from '@/lib/utils';
import { Avatar, Badge, Button, PageLoader, Select, Textarea } from '@/components/ui';
import { ConfirmDialog, Drawer } from '@/components/ui/overlays';
import { TaskForm } from './task-form';

function MetaRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 flex h-5 w-5 items-center justify-center text-ink-400">{icon}</span>
      <span className="w-24 shrink-0 pt-0.5 text-[12.5px] text-ink-500">{label}</span>
      <div className="min-w-0 flex-1 text-[13px] text-ink-800">{children}</div>
    </div>
  );
}

export function TaskDetailPanel({
  taskKey,
  onClose,
  onDeleted,
}: {
  taskKey: string;
  onClose?: () => void;
  onDeleted?: () => void;
}) {
  const { user, isAdmin } = useAuth();
  const { data: task, isLoading } = useTask(taskKey);
  const { data: board } = useBoard(task?.boardKey ?? '');
  const { data: comments = [] } = useComments(task?.id);
  const { data: activity = [] } = useTaskActivity(task?.id);

  const addComment = useAddComment(task?.id);
  const deleteComment = useDeleteComment(task?.id);
  const updateComment = useUpdateComment(task?.id);
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();

  const [body, setBody] = useState('');
  const [editing, setEditing] = useState(false);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [tab, setTab] = useState<'comments' | 'history'>('comments');

  if (isLoading || !task) {
    return <PageLoader label="Loading task…" />;
  }

  const type = TYPE_META[task.type];
  const priority = PRIORITY_META[task.priority];

  async function submitComment() {
    const value = body.trim();
    if (!value) return;
    try {
      await addComment.mutateAsync(value);
      setBody('');
    } catch (error) {
      toast.error(apiError(error, 'The comment could not be posted.'));
    }
  }

  async function changeColumn(columnId: number) {
    if (!task) return;
    try {
      await updateTask.mutateAsync({
        id: task.id,
        payload: {
          title: task.title,
          description: task.description ?? undefined,
          type: task.type,
          priority: task.priority,
          columnId,
          assigneeId: task.assignee?.id ?? null,
          startDate: task.startDate ?? null,
          dueDate: task.dueDate ?? null,
          storyPoints: task.storyPoints ?? null,
          estimateHours: task.estimateHours ?? null,
          labels: task.labels,
          watcherIds: task.watchers.map((watcher) => watcher.id),
        },
      });
      toast.success('Status updated');
    } catch (error) {
      toast.error(apiError(error, 'The status could not be changed.'));
    }
  }

  async function removeTask() {
    if (!task) return;
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success(`${task.taskKey} deleted`);
      setConfirming(false);
      onDeleted?.();
      onClose?.();
    } catch (error) {
      toast.error(apiError(error, 'The task could not be deleted.'));
    }
  }

  return (
    <>
      {/* header */}
      <div className="flex items-start gap-3 border-b border-ink-100 px-6 py-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold', type.color)}>
              {type.glyph}
            </span>
            <Link
              href={`/boards/${task.boardKey}`}
              className="font-mono text-[12px] font-semibold text-brand-600 hover:underline"
            >
              {task.taskKey}
            </Link>
            <span className="text-[12px] text-ink-400">in {task.boardName}</span>
            <Badge className={cn('ml-1', CATEGORY_META[task.category].color)}>{task.columnName}</Badge>
          </div>
          <h2 className="mt-2 text-[19px] font-semibold leading-snug tracking-[-0.015em] text-ink-900">
            {task.title}
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label="Edit task">
            <Pencil className="h-4 w-4" />
          </Button>
          {(isAdmin || task.reporter?.id === user?.id) && (
            <Button variant="ghost" size="icon" onClick={() => setConfirming(true)} aria-label="Delete task">
              <Trash2 className="h-4 w-4 text-rose-500" />
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid gap-6 px-6 py-5 lg:grid-cols-[1fr_260px]">
          {/* main */}
          <div className="min-w-0 space-y-6">
            <section>
              <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-400">Description</h3>
              {task.description ? (
                <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-700">{task.description}</p>
              ) : (
                <p className="text-[13.5px] italic text-ink-400">No description yet.</p>
              )}
            </section>

            {task.labels.length > 0 && (
              <section className="flex flex-wrap gap-1.5">
                {task.labels.map((label) => (
                  <span key={label} className="rounded-md bg-ink-100 px-2 py-1 text-[11px] font-medium text-ink-600">
                    {label}
                  </span>
                ))}
              </section>
            )}

            <section>
              <div className="mb-3 flex items-center gap-4 border-b border-ink-100">
                {(['comments', 'history'] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => setTab(value)}
                    className={cn(
                      '-mb-px border-b-2 px-0.5 pb-2 text-[13px] font-medium transition-colors',
                      tab === value
                        ? 'border-brand-600 text-brand-700'
                        : 'border-transparent text-ink-500 hover:text-ink-800',
                    )}
                  >
                    {value === 'comments' ? `Comments (${comments.length})` : 'History'}
                  </button>
                ))}
              </div>

              {tab === 'comments' ? (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Avatar user={user} size="md" />
                    <div className="flex-1">
                      <Textarea
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        placeholder="Write a comment… watchers and the assignee get an e-mail."
                        rows={3}
                        onKeyDown={(event) => {
                          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') void submitComment();
                        }}
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-ink-400">⌘ + Enter to send</span>
                        <Button size="sm" onClick={submitComment} loading={addComment.isPending} disabled={!body.trim()}>
                          <Send className="h-3.5 w-3.5" />
                          Comment
                        </Button>
                      </div>
                    </div>
                  </div>

                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar user={comment.author} size="md" />
                      <div className="min-w-0 flex-1 rounded-xl bg-ink-50 px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-ink-900">{comment.author.fullName}</span>
                          <span className="text-[11px] text-ink-400">{fromNow(comment.createdAt)}</span>
                          {comment.edited && <span className="text-[11px] text-ink-400">· edited</span>}
                          {(comment.author.id === user?.id || isAdmin) && editingComment !== comment.id && (
                            <span className="ml-auto flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingComment(comment.id);
                                  setCommentDraft(comment.body);
                                }}
                                className="text-ink-300 transition-colors hover:text-brand-500"
                                aria-label="Edit comment"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => deleteComment.mutate(comment.id)}
                                className="text-ink-300 transition-colors hover:text-rose-500"
                                aria-label="Delete comment"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          )}
                        </div>
                        {editingComment === comment.id ? (
                          <div className="mt-1.5">
                            <Textarea
                              value={commentDraft}
                              onChange={(event) => setCommentDraft(event.target.value)}
                              rows={3}
                              autoFocus
                            />
                            <div className="mt-2 flex items-center gap-2">
                              <Button
                                size="sm"
                                loading={updateComment.isPending}
                                disabled={!commentDraft.trim()}
                                onClick={async () => {
                                  try {
                                    await updateComment.mutateAsync({ commentId: comment.id, body: commentDraft });
                                    setEditingComment(null);
                                  } catch (error) {
                                    toast.error(apiError(error, 'The comment could not be saved.'));
                                  }
                                }}
                              >
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingComment(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-700">
                            {comment.body}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {comments.length === 0 && (
                    <p className="py-4 text-center text-[13px] text-ink-400">No comments yet.</p>
                  )}
                </div>
              ) : (
                <ol className="space-y-3">
                  {activity.map((entry) => (
                    <li key={entry.id} className="flex gap-3">
                      <Avatar user={entry.actor} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-ink-700">
                          <span className="font-medium text-ink-900">{entry.actor?.fullName ?? 'Someone'}</span>{' '}
                          {entry.type === 'TASK_CREATED' && 'created this task'}
                          {entry.type === 'TASK_MOVED' && (
                            <>
                              moved it from <span className="font-medium">{entry.oldValue}</span> to{' '}
                              <span className="font-medium">{entry.newValue}</span>
                            </>
                          )}
                          {entry.type === 'TASK_ASSIGNED' && (
                            <>
                              assigned it to <span className="font-medium">{entry.newValue}</span>
                            </>
                          )}
                          {entry.type === 'TASK_UNASSIGNED' && 'removed the assignee'}
                          {entry.type === 'COMMENT_ADDED' && 'commented'}
                          {entry.type === 'TASK_UPDATED' && (
                            <>
                              changed <span className="font-medium">{titleCase(entry.field)}</span>
                              {entry.oldValue && entry.newValue && (
                                <>
                                  {' '}from <span className="font-medium">{entry.oldValue}</span> to{' '}
                                  <span className="font-medium">{entry.newValue}</span>
                                </>
                              )}
                            </>
                          )}
                        </p>
                        <p className="text-[11px] text-ink-400">{formatDateTime(entry.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                  {activity.length === 0 && <p className="text-[13px] text-ink-400">No history yet.</p>}
                </ol>
              )}
            </section>
          </div>

          {/* sidebar */}
          <aside className="space-y-4">
            <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-400">Status</p>
              <Select
                value={String(task.columnId)}
                onChange={(event) => changeColumn(Number(event.target.value))}
                disabled={updateTask.isPending}
              >
                {(board?.columns ?? []).map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="divide-y divide-ink-100 rounded-xl border border-ink-200 px-3 py-1">
              <MetaRow icon={<UserCircle2 className="h-4 w-4" />} label="Assignee">
                {task.assignee ? (
                  <span className="flex items-center gap-2">
                    <Avatar user={task.assignee} size="xs" />
                    {task.assignee.fullName}
                  </span>
                ) : (
                  <span className="text-ink-400">Unassigned</span>
                )}
              </MetaRow>
              <MetaRow icon={<UserCircle2 className="h-4 w-4" />} label="Reporter">
                {task.reporter ? (
                  <span className="flex items-center gap-2">
                    <Avatar user={task.reporter} size="xs" />
                    {task.reporter.fullName}
                  </span>
                ) : (
                  <span className="text-ink-400">—</span>
                )}
              </MetaRow>
              <MetaRow icon={<Hash className="h-4 w-4" />} label="Priority">
                <Badge className={priority.color} dot={priority.dot}>
                  {priority.label}
                </Badge>
              </MetaRow>
              <MetaRow icon={<CalendarClock className="h-4 w-4" />} label="Due date">
                <span className={cn(task.overdue && 'font-medium text-rose-600')}>
                  {formatDate(task.dueDate)}
                  {task.overdue && ' · overdue'}
                </span>
              </MetaRow>
              <MetaRow icon={<CalendarClock className="h-4 w-4" />} label="Start date">
                {formatDate(task.startDate)}
              </MetaRow>
              <MetaRow icon={<Hash className="h-4 w-4" />} label="Story points">
                {task.storyPoints ?? '—'}
              </MetaRow>
              <MetaRow icon={<Clock className="h-4 w-4" />} label="Estimate">
                {task.estimateHours != null ? `${task.estimateHours} h` : '—'}
              </MetaRow>
              <MetaRow icon={<Eye className="h-4 w-4" />} label="Watchers">
                {task.watchers.length === 0 ? (
                  <span className="text-ink-400">None</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {task.watchers.map((watcher) => (
                      <span key={watcher.id} className="flex items-center gap-1.5 text-[12.5px]">
                        <Avatar user={watcher} size="xs" />
                        {watcher.fullName}
                      </span>
                    ))}
                  </div>
                )}
              </MetaRow>
            </div>

            <p className="px-1 text-[11.5px] leading-relaxed text-ink-400">
              Created {formatDateTime(task.createdAt)}
              <br />
              Updated {fromNow(task.updatedAt)}
            </p>
          </aside>
        </div>
      </div>

      {board && (
        <TaskForm
          open={editing}
          onClose={() => setEditing(false)}
          boardId={task.boardId}
          columns={board.columns}
          members={board.members}
          task={task}
        />
      )}

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={removeTask}
        loading={deleteTask.isPending}
        title={`Delete ${task.taskKey}?`}
        message="The task, its comments and its history will be permanently removed. This cannot be undone."
      />
    </>
  );
}

export function TaskDrawer({
  taskKey,
  open,
  onClose,
}: {
  taskKey: string | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer open={open && Boolean(taskKey)} onClose={onClose} width="max-w-4xl">
      {taskKey && <TaskDetailPanel taskKey={taskKey} onClose={onClose} onDeleted={onClose} />}
    </Drawer>
  );
}
