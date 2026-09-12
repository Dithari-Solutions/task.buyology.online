'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { apiError } from '@/lib/api';
import { useDirectory, useSavePlatform } from '@/lib/queries';
import type { Platform } from '@/lib/types';
import { BOARD_COLORS, cn } from '@/lib/utils';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { Modal } from '@/components/ui/overlays';

export function PlatformForm({
  open,
  onClose,
  platform,
}: {
  open: boolean;
  onClose: () => void;
  platform?: Platform | null;
}) {
  const { data: directory = [] } = useDirectory();
  const savePlatform = useSavePlatform();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(BOARD_COLORS[0]);
  const [ownerId, setOwnerId] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (platform) {
      setName(platform.name);
      setCode(platform.code);
      setDescription(platform.description ?? '');
      setColor(platform.color || BOARD_COLORS[0]);
      setOwnerId(platform.owner ? String(platform.owner.id) : '');
      setActive(platform.active);
    } else {
      setName('');
      setCode('');
      setDescription('');
      setColor(BOARD_COLORS[0]);
      setOwnerId('');
      setActive(true);
    }
  }, [open, platform]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await savePlatform.mutateAsync({
        id: platform?.id,
        payload: {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim() || undefined,
          color,
          icon: platform?.icon ?? 'layers',
          ownerId: ownerId ? Number(ownerId) : null,
          active,
        },
      });
      toast.success(platform ? 'Platform updated' : 'Platform created');
      onClose();
    } catch (error) {
      toast.error(apiError(error, 'The platform could not be saved.'));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={platform ? 'Edit platform' : 'New platform'}
      description="Platforms group the boards of a faculty, department or product area."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={savePlatform.isPending}>
            Cancel
          </Button>
          <Button form="platform-form" type="submit" loading={savePlatform.isPending}>
            {platform ? 'Save changes' : 'Create platform'}
          </Button>
        </>
      }
    >
      <form id="platform-form" onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Field label="Name" required>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!platform && !code) {
                  setCode(event.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase());
                }
              }}
              placeholder="Education Platform"
              required
              autoFocus
            />
          </Field>
          <Field label="Code" required>
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
              placeholder="EDU"
              maxLength={20}
              required
              className="font-mono uppercase"
            />
          </Field>
        </div>

        <Field label="Description">
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What belongs to this platform?"
            rows={3}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Owner">
            <Select value={ownerId} onChange={(event) => setOwnerId(event.target.value)}>
              <option value="">No owner</option>
              {directory.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={active ? 'true' : 'false'} onChange={(event) => setActive(event.target.value === 'true')}>
              <option value="true">Active</option>
              <option value="false">Archived</option>
            </Select>
          </Field>
        </div>

        <Field label="Colour">
          <div className="flex flex-wrap gap-2">
            {BOARD_COLORS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setColor(value)}
                className={cn(
                  'h-7 w-7 rounded-lg transition-transform',
                  color === value ? 'scale-110 ring-2 ring-ink-900 ring-offset-2' : 'hover:scale-105',
                )}
                style={{ backgroundColor: value }}
                aria-label={`Colour ${value}`}
              />
            ))}
          </div>
        </Field>
      </form>
    </Modal>
  );
}
