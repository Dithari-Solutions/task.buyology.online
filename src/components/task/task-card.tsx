'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarClock, MessageSquare } from 'lucide-react';
import type { TaskCard as TaskCardType } from '@/lib/types';
import { PRIORITY_META, TYPE_META, cn, dueLabel } from '@/lib/utils';
import { Avatar } from '@/components/ui';

export function TaskCardView({
  task,
  onClick,
  dragging,
  className,
}: {
  task: TaskCardType;
  onClick?: () => void;
  dragging?: boolean;
  className?: string;
}) {
  const type = TYPE_META[task.type];
  const priority = PRIORITY_META[task.priority];
  const due = dueLabel(task.dueDate);

  return (
    <div
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-xl border border-ink-200/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,.04)]',
        'transition-all duration-150 hover:-translate-y-px hover:border-brand-300 hover:shadow-[0_6px_16px_-8px_rgba(15,23,42,.25)]',
        dragging && 'rotate-1 opacity-90 shadow-pop ring-2 ring-brand-400',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold',
            type.color,
          )}
          title={type.label}
        >
          {type.glyph}
        </span>
        <p className="flex-1 text-[13.5px] font-medium leading-snug text-ink-900 line-clamp-3">{task.title}</p>
      </div>

      {task.labels?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-500"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-[11px] font-semibold tracking-tight text-ink-400">{task.taskKey}</span>
        <span className={cn('h-1.5 w-1.5 rounded-full', priority.dot)} title={`${priority.label} priority`} />

        {due && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-medium',
              task.overdue ? 'bg-rose-50 text-rose-600' : 'bg-ink-100 text-ink-500',
            )}
          >
            <CalendarClock className="h-3 w-3" />
            {due}
          </span>
        )}

        {task.commentCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[10.5px] text-ink-400">
            <MessageSquare className="h-3 w-3" />
            {task.commentCount}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          {task.storyPoints != null && (
            <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-600">
              {task.storyPoints}
            </span>
          )}
          <Avatar user={task.assignee} size="sm" />
        </div>
      </div>
    </div>
  );
}

export function SortableTaskCard({ task, onClick }: { task: TaskCardType; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `task-${task.id}`,
    data: { type: 'task', task },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && 'opacity-40')}
      {...attributes}
      {...listeners}
    >
      <TaskCardView task={task} onClick={onClick} />
    </div>
  );
}
