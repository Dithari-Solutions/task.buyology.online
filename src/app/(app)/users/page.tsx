'use client';

import { KeyRound, Pencil, Plus, Search, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Topbar } from '@/components/layout/topbar';
import { CredentialsPanel, UserForm } from '@/components/user/user-form';
import { Avatar, Badge, Button, Card, EmptyState, Input, PageLoader, Select } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/ui/overlays';
import { apiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useDeleteUser, useResetUserPassword, useSetUserActive, useUsers } from '@/lib/queries';
import type { Role, User } from '@/lib/types';
import { ROLES, ROLE_META, cn, formatDate, fromNow } from '@/lib/utils';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(0);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string; emailSent: boolean } | null>(null);

  const { data, isLoading } = useUsers({
    search,
    role: (role || null) as Role | null,
    active: status === '' ? null : status === 'active',
    page,
    size: 20,
  });

  const setActive = useSetUserActive();
  const resetPassword = useResetUserPassword();
  const deleteUser = useDeleteUser();

  async function toggleActive(target: User) {
    try {
      await setActive.mutateAsync({ id: target.id, active: !target.active });
      toast.success(target.active ? 'Account deactivated' : 'Account activated');
    } catch (error) {
      toast.error(apiError(error, 'The status could not be changed.'));
    }
  }

  async function issueNewPassword(target: User) {
    try {
      const response = await resetPassword.mutateAsync(target.id);
      setCredentials({
        email: response.email,
        password: response.temporaryPassword,
        emailSent: response.emailSent,
      });
    } catch (error) {
      toast.error(apiError(error, 'The password could not be reset.'));
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteUser.mutateAsync(deleting.id);
      toast.success('User deleted');
      setDeleting(null);
    } catch (error) {
      toast.error(apiError(error, 'The user could not be deleted.'));
    }
  }

  return (
    <>
      <Topbar
        title="Users"
        subtitle="Accounts are created here — there is no public sign-up"
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            New user
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-[1200px] space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                placeholder="Search by name or e-mail…"
                className="pl-9"
              />
            </div>
            <Select value={role} onChange={(event) => { setRole(event.target.value); setPage(0); }} className="w-full sm:w-48">
              <option value="">All roles</option>
              {ROLES.map((value) => (
                <option key={value} value={value}>
                  {ROLE_META[value].label}
                </option>
              ))}
            </Select>
            <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }} className="w-full sm:w-44">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
            </Select>
          </div>

          {isLoading ? (
            <PageLoader />
          ) : !data || data.content.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No users found"
              description="Adjust the filters, or create the first account."
              action={
                <Button onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" />
                  New user
                </Button>
              }
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-ink-100 bg-ink-50/60 text-[11.5px] uppercase tracking-[0.06em] text-ink-500">
                      <th className="px-5 py-3 font-semibold">Person</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Department</th>
                      <th className="px-4 py-3 font-semibold">Last seen</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-50">
                    {data.content.map((person) => (
                      <tr key={person.id} className={cn('transition-colors hover:bg-ink-50/50', !person.active && 'opacity-60')}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar user={person} size="md" />
                            <div className="min-w-0">
                              <p className="truncate text-[13.5px] font-medium text-ink-900">
                                {person.fullName}
                                {person.id === currentUser?.id && (
                                  <span className="ml-2 text-[11px] font-normal text-ink-400">you</span>
                                )}
                              </p>
                              <p className="truncate text-[12px] text-ink-500">{person.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={ROLE_META[person.role].color}>{ROLE_META[person.role].label}</Badge>
                          {!person.active && <Badge className="ml-1.5 bg-ink-100 text-ink-500">Inactive</Badge>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[13px] text-ink-700">{person.department || '—'}</p>
                          <p className="text-[11.5px] text-ink-400">{person.title || ''}</p>
                        </td>
                        <td className="px-4 py-3 text-[12.5px] text-ink-500">
                          {person.lastLoginAt ? fromNow(person.lastLoginAt) : `Added ${formatDate(person.createdAt)}`}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              onClick={() => setEditing(person)}
                              className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
                              aria-label="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => issueNewPassword(person)}
                              className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
                              aria-label="Reset password"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => toggleActive(person)}
                              disabled={person.id === currentUser?.id}
                              className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 disabled:opacity-30"
                              aria-label={person.active ? 'Deactivate' : 'Activate'}
                            >
                              {person.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => setDeleting(person)}
                              disabled={person.id === currentUser?.id}
                              className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-ink-100 px-5 py-3">
                  <p className="text-[12.5px] text-ink-500">
                    {data.totalElements} users · page {data.page + 1} of {data.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={data.page === 0}
                      onClick={() => setPage((value) => Math.max(0, value - 1))}
                    >
                      Previous
                    </Button>
                    <Button variant="secondary" size="sm" disabled={data.last} onClick={() => setPage((value) => value + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      <UserForm open={creating} onClose={() => setCreating(false)} />
      <UserForm open={Boolean(editing)} onClose={() => setEditing(null)} user={editing} />

      <Modal
        open={Boolean(credentials)}
        onClose={() => setCredentials(null)}
        title="New password issued"
        size="md"
        footer={<Button onClick={() => setCredentials(null)}>Done</Button>}
      >
        {credentials && (
          <CredentialsPanel
            email={credentials.email}
            password={credentials.password}
            emailSent={credentials.emailSent}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteUser.isPending}
        title={`Delete ${deleting?.fullName ?? 'user'}?`}
        message="Their comments are removed and they are detached from every board. Accounts with assigned tasks cannot be deleted — deactivate them instead."
        confirmLabel="Delete user"
      />
    </>
  );
}
