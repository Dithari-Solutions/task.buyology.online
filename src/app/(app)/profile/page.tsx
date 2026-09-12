'use client';

import { KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Topbar } from '@/components/layout/topbar';
import { Avatar, Badge, Button, Card, Field, Input, Select } from '@/components/ui';
import { apiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useChangePassword, useUpdateProfile } from '@/lib/queries';
import { ROLE_META, formatDateTime } from '@/lib/utils';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setTitle(user.title ?? '');
    setDepartment(user.department ?? '');
    setPhone(user.phone ?? '');
    setEmailNotifications(user.emailNotifications);
  }, [user]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    try {
      await updateProfile.mutateAsync({
        fullName: fullName.trim(),
        title: title.trim() || undefined,
        department: department.trim() || undefined,
        phone: phone.trim() || undefined,
        emailNotifications,
      });
      await refresh();
      toast.success('Profile updated');
    } catch (error) {
      toast.error(apiError(error, 'The profile could not be saved.'));
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('The new passwords do not match.');
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refresh();
      toast.success('Password changed');
    } catch (error) {
      toast.error(apiError(error, 'The password could not be changed.'));
    }
  }

  return (
    <>
      <Topbar title="Profile" subtitle="Your account and notification preferences" />

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-[900px] space-y-6">
          {user?.mustChangePassword && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-[13px] font-semibold text-amber-900">Set your own password</p>
                <p className="text-[12.5px] text-amber-800/80">
                  You are still using the temporary password that was issued for you.
                </p>
              </div>
            </div>
          )}

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Avatar user={user} size="xl" />
              <div className="min-w-0">
                <h2 className="truncate text-[19px] font-semibold tracking-[-0.015em] text-ink-900">
                  {user?.fullName}
                </h2>
                <p className="flex items-center gap-1.5 text-[13px] text-ink-500">
                  <Mail className="h-3.5 w-3.5" />
                  {user?.email}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {user && <Badge className={ROLE_META[user.role].color}>{ROLE_META[user.role].label}</Badge>}
                  {user?.lastLoginAt && (
                    <span className="text-[11.5px] text-ink-400">
                      Last sign-in {formatDateTime(user.lastLoginAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-[15px] font-semibold text-ink-900">Personal details</h3>
            <form onSubmit={saveProfile} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required>
                  <Input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
                </Field>
                <Field label="Job title">
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} />
                </Field>
                <Field label="Department">
                  <Input value={department} onChange={(event) => setDepartment(event.target.value)} />
                </Field>
                <Field label="Phone">
                  <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
                </Field>
              </div>

              <Field label="E-mail notifications" hint="Assignments, comments, status changes and deadline reminders">
                <Select
                  value={emailNotifications ? 'true' : 'false'}
                  onChange={(event) => setEmailNotifications(event.target.value === 'true')}
                >
                  <option value="true">Send me e-mail</option>
                  <option value="false">In-app notifications only</option>
                </Select>
              </Field>

              <div className="flex justify-end">
                <Button type="submit" loading={updateProfile.isPending}>
                  Save changes
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold text-ink-900">
              <KeyRound className="h-4 w-4 text-ink-400" />
              Change password
            </h3>
            <form onSubmit={savePassword} className="mt-4 space-y-4">
              <Field label="Current password" required>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="New password" required hint="At least 8 characters">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </Field>
                <Field label="Repeat new password" required>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={changePassword.isPending}>
                  Update password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
