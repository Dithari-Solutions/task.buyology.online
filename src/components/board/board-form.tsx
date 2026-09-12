'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { apiError } from '@/lib/api';
import { useCreateBoard, useDirectory, usePlatforms, useUpdateBoard } from '@/lib/queries';
import type { BoardDetail, BoardSummary } from '@/lib/types';
import { BOARD_COLORS, cn } from '@/lib/utils';
import { Avatar, Button, Field, Input, Select, Textarea } from '@/components/ui';
import { Modal } from '@/components/ui/overlays';

export function BoardForm({
  open,
  onClose,
  board,
  defaultPlatformId,
}: {
  open: boolean;
  onClose: () => void;
  board?: BoardDetail | BoardSummary | null;
  defaultPlatformId?: number | null;
}) {
  const { data: platforms = [] } = usePlatforms();
  const { data: directory = [] } = useDirectory();
  const createBoard = useCreateBoard();
  const updateBoard = useUpdateBoard();
  const saving = createBoard.isPending || updateBoard.isPending;

  const [name, setName] = useState('');
  const [boardKey, setBoardKey] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(BOARD_COLORS[0]);
  const [platformId, setPlatformId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [memberIds, setMemberIds] = useState<number[]>([]);

  useEffect(() => {
    if (!open) return;
    if (board) {
      const detail = board as Partial<BoardDetail> & Partial<BoardSummary>;
      setName(board.name);
      setBoardKey(board.boardKey);
      setDescription(board.description ?? '');
      setColor(board.color || BOARD_COLORS[0]);
      const platform = detail.platform?.id ?? detail.platformId;
      setPlatformId(platform ? String(platform) : '');
      setLeadId(board.lead ? String(board.lead.id) : '');
      setMemberIds(detail.members ? detail.members.map((member) => member.id) : []);
    } else {
      setName('');
      setBoardKey('');
      setDescription('');
      setColor(BOARD_COLORS[0]);
      setPlatformId(defaultPlatformId ? String(defaultPlatformId) : String(platforms[0]?.id ?? ''));
      setLeadId('');
      setMemberIds([]);
    }
  }, [open, board, defaultPlatformId, platforms]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!platformId) {
      toast.error('Pick a platform first.');
      return;
    }

    try {
      if (board && 'id' in board) {
        await updateBoard.mutateAsync({
          id: board.id,
          payload: {
            name: name.trim(),
            description: description.trim() || undefined,
            color,
            platformId: Number(platformId),
            leadId: leadId ? Number(leadId) : null,
          },
        });
        toast.success('Board updated');
      } else {
        await createBoard.mutateAsync({
          name: name.trim(),
          boardKey: boardKey.trim().toUpperCase(),
          description: description.trim() || undefined,
          color,
          platformId: Number(platformId),
          leadId: leadId ? Number(leadId) : null,
          memberIds,
        });
        toast.success('Board created with the default kanban columns');
      }
      onClose();
    } catch (error) {
      toast.error(apiError(error, 'The board could not be saved.'));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={board ? 'Edit board' : 'New board'}
      description={
        board
          ? undefined
          : 'A board is created with Backlog, To Do, In Progress, In Review and Done columns.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button form="board-form" type="submit" loading={saving}>
            {board ? 'Save changes' : 'Create board'}
          </Button>
        </>
      }
    >
      <form id="board-form" onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Field label="Board name" required>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!board && !boardKey) {
                  const generated = event.target.value
                    .replace(/[^a-zA-Z ]/g, '')
                    .split(' ')
                    .filter(Boolean)
                    .map((word) => word[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 5);
                  setBoardKey(generated);
                }
              }}
              placeholder="Learning Management System"
              required
              autoFocus
            />
          </Field>
          <Field label="Key" required hint={board ? 'Fixed' : 'Used in task ids'}>
            <Input
              value={boardKey}
              onChange={(event) => setBoardKey(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="LMS"
              maxLength={10}
              disabled={Boolean(board)}
              required
              className="font-mono uppercase"
            />
          </Field>
        </div>

        <Field label="Description">
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is this board responsible for?"
            rows={3}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Platform" required>
            <Select value={platformId} onChange={(event) => setPlatformId(event.target.value)} required>
              <option value="">Select a platform…</option>
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name} ({platform.code})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Board lead">
            <Select value={leadId} onChange={(event) => setLeadId(event.target.value)}>
              <option value="">No lead</option>
              {directory.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.fullName}
                </option>
              ))}
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

        {!board && (
          <Field label="Members" hint="Members see the board in their sidebar">
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-ink-200 p-2">
              {directory.map((person) => {
                const checked = memberIds.includes(person.id);
                return (
                  <label
                    key={person.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] hover:bg-ink-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setMemberIds((previous) =>
                          checked ? previous.filter((id) => id !== person.id) : [...previous, person.id],
                        )
                      }
                      className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                    />
                    <Avatar user={person} size="xs" />
                    <span className="text-ink-800">{person.fullName}</span>
                    <span className="ml-auto text-[11px] text-ink-400">{person.email}</span>
                  </label>
                );
              })}
            </div>
          </Field>
        )}
      </form>
    </Modal>
  );
}
