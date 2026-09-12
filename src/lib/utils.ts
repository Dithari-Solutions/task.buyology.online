import clsx, { type ClassValue } from 'clsx';
import { format, formatDistanceToNowStrict, isToday, isTomorrow, parseISO } from 'date-fns';
import type { ColumnCategory, Priority, Role, TaskType } from './types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(value?: string | null, pattern = 'd MMM yyyy') {
  if (!value) return '—';
  try {
    return format(parseISO(value), pattern);
  } catch {
    return '—';
  }
}

export function formatDateTime(value?: string | null) {
  return formatDate(value, 'd MMM yyyy, HH:mm');
}

export function fromNow(value?: string | null) {
  if (!value) return '';
  try {
    return `${formatDistanceToNowStrict(parseISO(value))} ago`;
  } catch {
    return '';
  }
}

export function dueLabel(value?: string | null) {
  if (!value) return null;
  try {
    const date = parseISO(value);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'd MMM');
  } catch {
    return null;
  }
}

export const PRIORITY_META: Record<Priority, { label: string; color: string; dot: string; bar: string }> = {
  HIGHEST: { label: 'Highest', color: 'text-rose-700 bg-rose-50 border-rose-200', dot: 'bg-rose-500', bar: 'bg-rose-500' },
  HIGH: { label: 'High', color: 'text-orange-700 bg-orange-50 border-orange-200', dot: 'bg-orange-500', bar: 'bg-orange-500' },
  MEDIUM: { label: 'Medium', color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  LOW: { label: 'Low', color: 'text-sky-700 bg-sky-50 border-sky-200', dot: 'bg-sky-500', bar: 'bg-sky-500' },
  LOWEST: { label: 'Lowest', color: 'text-slate-600 bg-slate-100 border-slate-200', dot: 'bg-slate-400', bar: 'bg-slate-400' },
};

export const TYPE_META: Record<TaskType, { label: string; color: string; glyph: string }> = {
  TASK: { label: 'Task', color: 'bg-sky-100 text-sky-700', glyph: '✓' },
  BUG: { label: 'Bug', color: 'bg-rose-100 text-rose-700', glyph: '!' },
  STORY: { label: 'Story', color: 'bg-emerald-100 text-emerald-700', glyph: '◆' },
  EPIC: { label: 'Epic', color: 'bg-violet-100 text-violet-700', glyph: '⚡' },
  IMPROVEMENT: { label: 'Improvement', color: 'bg-amber-100 text-amber-700', glyph: '↑' },
};

export const CATEGORY_META: Record<ColumnCategory, { label: string; color: string }> = {
  TODO: { label: 'To do', color: 'bg-slate-100 text-slate-600' },
  IN_PROGRESS: { label: 'In progress', color: 'bg-brand-100 text-brand-700' },
  DONE: { label: 'Done', color: 'bg-emerald-100 text-emerald-700' },
};

export const ROLE_META: Record<Role, { label: string; color: string }> = {
  ADMIN: { label: 'Administrator', color: 'bg-brand-100 text-brand-700' },
  MANAGER: { label: 'Manager', color: 'bg-sky-100 text-sky-700' },
  MEMBER: { label: 'Member', color: 'bg-slate-100 text-slate-600' },
};

export const PRIORITIES: Priority[] = ['HIGHEST', 'HIGH', 'MEDIUM', 'LOW', 'LOWEST'];
export const TASK_TYPES: TaskType[] = ['TASK', 'STORY', 'BUG', 'IMPROVEMENT', 'EPIC'];
export const CATEGORIES: ColumnCategory[] = ['TODO', 'IN_PROGRESS', 'DONE'];
export const ROLES: Role[] = ['ADMIN', 'MANAGER', 'MEMBER'];

export const BOARD_COLORS = [
  '#402f75', '#ffbe12', '#665991', '#0ea5e9',
  '#14b8a6', '#10b981', '#f97316', '#ef4444',
  '#ec4899', '#64748b',
];

export function progress(done: number, total: number) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

export function titleCase(value?: string | null) {
  if (!value) return '';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
