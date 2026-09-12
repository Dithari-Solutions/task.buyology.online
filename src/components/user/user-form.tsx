'use client';

import { Copy, Check } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { apiError } from '@/lib/api';
import { useCreateUser, useUpdateUser } from '@/lib/queries';
import type { Role, User } from '@/lib/types';
import { ROLES, ROLE_META } from '@/lib/utils';
import { Button, Field, Input, Select } from '@/components/ui';
import { Modal } from '@/components/ui/overlays';

export function CredentialsPanel({
  email,
  password,
  emailSent,
}: {
  email: string;
  password: string;
  emailSent: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
      <p className="text-[13px] font-semibold text-emerald-900">
        {emailSent ? 'Account created — the credentials were e-mailed.' : 'Account created'}
      </p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-emerald-800/80">
        {emailSent
          ? 'A copy is shown here in case the message does not arrive.'
          : 'E-mail sending is disabled on the server, so share these credentials manually.'}
      </p>
      <div className="mt-3 space-y-1.5 rounded-lg bg-white px-3 py-2.5 font-mono text-[12.5px]">
        <p>
          <span className="text-ink-400">e-mail: </span>
          {email}
        </p>
        <p className="flex items-center gap-2">
          <span className="text-ink-400">password: </span>
          <span className="font-semibold">{password}</span>
          <button
            onClick={() => {
              void navigator.clipboard?.writeText(password);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="ml-auto rounded p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
            aria-label="Copy password"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </p>
      </div>
    </div>
  );
}

export function UserForm({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user?: User | null;
}) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const saving = createUser.isPending || updateUser.isPending;

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('MEMBER');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [active, setActive] = useState(true);
  const [created, setCreated] = useState<{ email: string; password: string; emailSent: boolean } | null>(null);

  useEffect(() => {
    if (!open) return;
    setCreated(null);
    if (user) {
      setEmail(user.email);
      setFullName(user.fullName);
      setRole(user.role);
      setTitle(user.title ?? '');
      setDepartment(user.department ?? '');
      setPhone(user.phone ?? '');
      setActive(user.active);
    } else {
      setEmail('');
      setFullName('');
      setRole('MEMBER');
      setTitle('');
      setDepartment('');
      setPhone('');
      setPassword('');
      setActive(true);
    }
  }, [open, user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      if (user) {
        await updateUser.mutateAsync({
          id: user.id,
          payload: {
            fullName: fullName.trim(),
            role,
            title: title.trim() || undefined,
            department: department.trim() || undefined,
            phone: phone.trim() || undefined,
            active,
          },
        });
        toast.success('User updated');
        onClose();
      } else {
        const response = await createUser.mutateAsync({
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          role,
          title: title.trim() || undefined,
          department: department.trim() || undefined,
          phone: phone.trim() || undefined,
          password: password.trim() || undefined,
        });
        setCreated({
          email: response.user.email,
          password: response.temporaryPassword,
          emailSent: response.emailSent,
        });
      }
    } catch (error) {
      toast.error(apiError(error, 'The user could not be saved.'));
    }
  }

  if (created) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="User created"
        size="md"
        footer={<Button onClick={onClose}>Done</Button>}
      >
        <CredentialsPanel email={created.email} password={created.password} emailSent={created.emailSent} />
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? 'Edit user' : 'New user'}
      description={user ? undefined : 'Leave the password empty to generate a secure one and e-mail it.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button form="user-form" type="submit" loading={saving}>
            {user ? 'Save changes' : 'Create user'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name" required>
          <Input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Nigar Aliyeva"
            required
            autoFocus
          />
        </Field>

        <Field label="University e-mail" required>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name.surname@buyology.online"
            disabled={Boolean(user)}
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role" required>
            <Select value={role} onChange={(event) => setRole(event.target.value as Role)}>
              {ROLES.map((value) => (
                <option key={value} value={value}>
                  {ROLE_META[value].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={active ? 'true' : 'false'}
              onChange={(event) => setActive(event.target.value === 'true')}
              disabled={!user}
            >
              <option value="true">Active</option>
              <option value="false">Deactivated</option>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job title">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Senior Lecturer" />
          </Field>
          <Field label="Department">
            <Input
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              placeholder="Computer Engineering"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+994 12 000 00 00" />
          </Field>
          {!user && (
            <Field label="Password" hint="Optional — generated when empty">
              <Input
                type="text"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Auto-generate"
                minLength={8}
              />
            </Field>
          )}
        </div>
      </form>
    </Modal>
  );
}
