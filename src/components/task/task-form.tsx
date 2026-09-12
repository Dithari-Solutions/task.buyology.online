'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { apiError } from '@/lib/api';
import { useCreateTask, useUpdateTask } from '@/lib/queries';
import type { BoardColumnDto, Priority, TaskDetail, TaskType, UserSummary } from '@/lib/types';
import { PRIORITIES, PRIORITY_META, TASK_TYPES, TYPE_META } from '@/lib/utils';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { Modal } from '@/components/ui/overlays';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  boardId: number;
  columns: BoardColumnDto[];
  members: UserSummary[];
  task?: TaskDetail | null;
  defaultColumnId?: number | null;
}

interface FormState {
  title: string;
  description: string;
  type: TaskType;
  priority: Priority;
  columnId: string;
  assigneeId: string;
  startDate: string;
  dueDate: string;
  storyPoints: string;
  estimateHours: string;
  labels: string;
  watcherIds: number[];
}

const EMPTY: FormState = {
  title: '',
  description: '',
  type: 'TASK',
  priority: 'MEDIUM',
  columnId: '',
  assigneeId: '',
  startDate: '',
  dueDate: '',
  storyPoints: '',
  estimateHours: '',
  labels: '',
  watcherIds: [],
};

export function TaskForm({ open, onClose, boardId, columns, members, task, defaultColumnId }: TaskFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const saving = createTask.isPending || updateTask.isPending;

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? '',
        type: task.type,
        priority: task.priority,
        columnId: String(task.columnId),
        assigneeId: task.assignee ? String(task.assignee.id) : '',
        startDate: task.startDate ?? '',
        dueDate: task.dueDate ?? '',
        storyPoints: task.storyPoints != null ? String(task.storyPoints) : '',
        estimateHours: task.estimateHours != null ? String(task.estimateHours) : '',
        labels: task.labels.join(', '),
        watcherIds: task.watchers.map((watcher) => watcher.id),
      });
    } else {
      setForm({
        ...EMPTY,
        columnId: String(defaultColumnId ?? columns[0]?.id ?? ''),
      });
    }
  }, [open, task, defaultColumnId, columns]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      priority: form.priority,
      columnId: form.columnId ? Number(form.columnId) : null,
      assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
      storyPoints: form.storyPoints ? Number(form.storyPoints) : null,
      estimateHours: form.estimateHours ? Number(form.estimateHours) : null,
      labels: form.labels
        .split(',')
        .map((label) => label.trim())
        .filter(Boolean),
      watcherIds: form.watcherIds,
    };

    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, payload });
        toast.success(`${task.taskKey} updated`);
      } else {
        const created = await createTask.mutateAsync({ ...payload, boardId });
        toast.success(`${created.taskKey} created`);
      }
      onClose();
    } catch (error) {
      toast.error(apiError(error, 'The task could not be saved.'));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? `Edit ${task.taskKey}` : 'Create task'}
      description={task ? undefined : 'Tasks are numbered automatically from the board key.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button form="task-form" type="submit" loading={saving}>
            {task ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={onSubmit} className="space-y-4">
        <Field label="Title" required>
          <Input
            value={form.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="What needs to be done?"
            maxLength={250}
            required
            autoFocus
          />
        </Field>

        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="Context, acceptance criteria, links…"
            rows={4}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Type">
            <Select value={form.type} onChange={(event) => update('type', event.target.value as TaskType)}>
              {TASK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_META[type].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={(event) => update('priority', event.target.value as Priority)}>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_META[priority].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Column">
            <Select value={form.columnId} onChange={(event) => update('columnId', event.target.value)}>
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Assignee">
            <Select value={form.assigneeId} onChange={(event) => update('assigneeId', event.target.value)}>
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Start date">
            <Input type="date" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} />
          </Field>
          <Field label="Due date">
            <Input type="date" value={form.dueDate} onChange={(event) => update('dueDate', event.target.value)} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Story points">
            <Input
              type="number"
              min={0}
              max={100}
              value={form.storyPoints}
              onChange={(event) => update('storyPoints', event.target.value)}
              placeholder="—"
            />
          </Field>
          <Field label="Estimate (hours)">
            <Input
              type="number"
              min={0}
              step={0.5}
              value={form.estimateHours}
              onChange={(event) => update('estimateHours', event.target.value)}
              placeholder="—"
            />
          </Field>
          <Field label="Labels" hint="Comma separated">
            <Input
              value={form.labels}
              onChange={(event) => update('labels', event.target.value)}
              placeholder="frontend, urgent"
            />
          </Field>
        </div>

        <Field label="Watchers" hint="They receive e-mail on comments and status changes">
          <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-ink-200 p-2">
            {members.length === 0 && <p className="px-1 py-1.5 text-[13px] text-ink-400">No board members yet.</p>}
            {members.map((member) => {
              const checked = form.watcherIds.includes(member.id);
              return (
                <label
                  key={member.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-ink-700 hover:bg-ink-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      update(
                        'watcherIds',
                        checked
                          ? form.watcherIds.filter((id) => id !== member.id)
                          : [...form.watcherIds, member.id],
                      )
                    }
                    className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  />
                  {member.fullName}
                  <span className="ml-auto text-[11px] text-ink-400">{member.email}</span>
                </label>
              );
            })}
          </div>
        </Field>
      </form>
    </Modal>
  );
}
