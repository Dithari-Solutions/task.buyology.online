'use client';

import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import type { UserSummary } from '@/lib/types';

/* ------------------------------------------------------------------ button */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20 disabled:bg-brand-300',
  secondary: 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50 hover:border-ink-300',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-[15px] gap-2',
  icon: 'h-9 w-9 justify-center',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-60 active:scale-[.98]',
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ inputs */

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-[13px] font-medium text-ink-700">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-ink-400">{hint}</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

const CONTROL =
  'w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 ' +
  'transition-colors focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 ' +
  'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, 'h-10 py-2', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, 'min-h-[96px] py-2.5 leading-relaxed', className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        CONTROL,
        'h-10 cursor-pointer appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke-width=\'2\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'m19.5 8.25-7.5 7.5-7.5-7.5\'/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ display */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-xl border border-ink-200/80 bg-white shadow-card', className)}>{children}</div>
  );
}

export function Badge({
  children,
  className,
  dot,
}: {
  children: ReactNode;
  className?: string;
  dot?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-0.5 text-[11px] font-semibold',
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />}
      {children}
    </span>
  );
}

const AVATAR_SIZES = { xs: 'h-5 w-5 text-[9px]', sm: 'h-6 w-6 text-[10px]', md: 'h-8 w-8 text-[11px]', lg: 'h-10 w-10 text-sm', xl: 'h-14 w-14 text-lg' };

export function Avatar({
  user,
  size = 'md',
  className,
  ring,
}: {
  user?: Pick<UserSummary, 'fullName' | 'initials' | 'avatarColor'> | null;
  size?: keyof typeof AVATAR_SIZES;
  className?: string;
  ring?: boolean;
}) {
  if (!user) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full border border-dashed border-ink-300 text-ink-400',
          AVATAR_SIZES[size],
          className,
        )}
        title="Unassigned"
      >
        ?
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase text-white',
        ring && 'ring-2 ring-white',
        AVATAR_SIZES[size],
        className,
      )}
      style={{ backgroundColor: user.avatarColor || '#402f75' }}
      title={user.fullName}
    >
      {user.initials}
    </span>
  );
}

export function AvatarGroup({ users, max = 4 }: { users: UserSummary[]; max?: number }) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((user) => (
        <Avatar key={user.id} user={user} size="sm" ring />
      ))}
      {rest > 0 && (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink-200 text-[10px] font-semibold text-ink-600 ring-2 ring-white">
          +{rest}
        </span>
      )}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-500', className)} />;
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-ink-400">
      <Spinner className="h-6 w-6" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 bg-white/60 px-6 py-14 text-center', className)}>
      {icon && <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icon}</div>}
      <h3 className="text-[15px] font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-ink-100', className)} />;
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-ink-100', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
