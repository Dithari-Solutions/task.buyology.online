'use client';

import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiError } from '@/lib/api';
import {
  useAddBoardMembers,
  useDeleteBoard,
  useDeleteColumn,
  useReorderColumns,
  useDirectory,
  useRemoveBoardMember,
  useSaveColumn,
} from '@/lib/queries';
import type { BoardDetail, ColumnCategory } from '@/lib/types';
import { CATEGORIES, CATEGORY_META, cn } from '@/lib/utils';
import { Avatar, Badge, Button, Field, Input, Select } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/ui/overlays';

export function BoardSettings({
  board,
  open,
  onClose,
  onEditBoard,
}: {
  board: BoardDetail;
  open: boolean;
  onClose: () => void;
  onEditBoard: () => void;
}) {
  const router = useRouter();
  const { data: directory = [] } = useDirectory();

  const saveColumn = useSaveColumn(board.boardKey);
  const deleteColumn = useDeleteColumn(board.boardKey);
  const reorderColumns = useReorderColumns(board.boardKey);
  const addMembers = useAddBoardMembers(board.boardKey);
  const removeMember = useRemoveBoardMember(board.boardKey);
  const deleteBoard = useDeleteBoard();

  const [columnName, setColumnName] = useState('');
  const [columnCategory, setColumnCategory] = useState<ColumnCategory>('TODO');
  const [columnWip, setColumnWip] = useState('');
  const [editingColumn, setEditingColumn] = useState<number | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftCategory, setDraftCategory] = useState<ColumnCategory>('TODO');
  const [draftWip, setDraftWip] = useState('');
  const [memberId, setMemberId] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const candidates = directory.filter((person) => !board.members.some((member) => member.id === person.id));

  async function addColumn() {
    if (!columnName.trim()) return;
    try {
      await saveColumn.mutateAsync({
        boardId: board.id,
        payload: {
          name: columnName.trim(),
          category: columnCategory,
          wipLimit: columnWip ? Number(columnWip) : null,
        },
      });
      setColumnName('');
      setColumnWip('');
      toast.success('Column added');
    } catch (error) {
      toast.error(apiError(error, 'The column could not be added.'));
    }
  }

  async function saveColumnEdit(columnId: number) {
    if (!draftName.trim()) return;
    try {
      await saveColumn.mutateAsync({
        boardId: board.id,
        columnId,
        payload: {
          name: draftName.trim(),
          category: draftCategory,
          wipLimit: draftWip ? Number(draftWip) : null,
        },
      });
      setEditingColumn(null);
      toast.success('Column updated');
    } catch (error) {
      toast.error(apiError(error, 'The column could not be updated.'));
    }
  }

  /** Columns are ordered by the array we send, so a move is a swap plus a save. */
  async function moveColumn(index: number, direction: -1 | 1) {
    const ids = board.columns.map((column) => column.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await reorderColumns.mutateAsync({ boardId: board.id, columnIds: ids });
    } catch (error) {
      toast.error(apiError(error, 'The columns could not be reordered.'));
    }
  }

  async function removeColumn(columnId: number) {
    try {
      await deleteColumn.mutateAsync(columnId);
      toast.success('Column removed');
    } catch (error) {
      toast.error(apiError(error, 'The column could not be removed.'));
    }
  }

  async function addMember() {
    if (!memberId) return;
    try {
      await addMembers.mutateAsync({ boardId: board.id, userIds: [Number(memberId)] });
      setMemberId('');
      toast.success('Member added');
    } catch (error) {
      toast.error(apiError(error, 'The member could not be added.'));
    }
  }

  async function removeBoard() {
    try {
      await deleteBoard.mutateAsync(board.id);
      toast.success('Board deleted');
      router.push('/boards');
    } catch (error) {
      toast.error(apiError(error, 'The board could not be deleted.'));
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Board settings" description={board.name} size="lg">
        <div className="space-y-7">
          {/* general */}
          <section>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-semibold text-ink-900">General</h3>
                <p className="text-[12.5px] text-ink-500">
                  {board.platform?.name} · key <span className="font-mono">{board.boardKey}</span>
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={onEditBoard}>
                Edit details
              </Button>
            </div>
          </section>

          {/* columns */}
          <section>
            <h3 className="mb-2 text-[13px] font-semibold text-ink-900">Columns</h3>
            <ul className="divide-y divide-ink-100 rounded-lg border border-ink-200">
              {board.columns.map((column, index) => (
                <li key={column.id} className="px-3 py-2.5">
                  {editingColumn === column.id ? (
                    <div className="grid gap-2 sm:grid-cols-[1fr_150px_90px_auto]">
                      <Input
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        placeholder="Column name"
                        autoFocus
                      />
                      <Select
                        value={draftCategory}
                        onChange={(event) => setDraftCategory(event.target.value as ColumnCategory)}
                      >
                        <option value="TODO">To do</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="DONE">Done</option>
                      </Select>
                      <Input
                        value={draftWip}
                        onChange={(event) => setDraftWip(event.target.value)}
                        placeholder="WIP"
                        type="number"
                        min={0}
                      />
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" loading={saveColumn.isPending} onClick={() => saveColumnEdit(column.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingColumn(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="flex flex-col">
                        <button
                          onClick={() => moveColumn(index, -1)}
                          disabled={index === 0 || reorderColumns.isPending}
                          className="text-ink-300 transition-colors hover:text-brand-500 disabled:opacity-30"
                          aria-label={`Move ${column.name} left`}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => moveColumn(index, 1)}
                          disabled={index === board.columns.length - 1 || reorderColumns.isPending}
                          className="text-ink-300 transition-colors hover:text-brand-500 disabled:opacity-30"
                          aria-label={`Move ${column.name} right`}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </span>
                      <span className="text-[13px] font-medium text-ink-800">{column.name}</span>
                      <Badge className={CATEGORY_META[column.category].color}>
                        {CATEGORY_META[column.category].label}
                      </Badge>
                      {column.wipLimit != null && (
                        <span className="text-[11.5px] text-ink-400">WIP {column.wipLimit}</span>
                      )}
                      <span className="ml-auto text-[11.5px] text-ink-400">{column.taskCount} tasks</span>
                      <button
                        onClick={() => {
                          setEditingColumn(column.id);
                          setDraftName(column.name);
                          setDraftCategory(column.category);
                          setDraftWip(column.wipLimit != null ? String(column.wipLimit) : '');
                        }}
                        className="rounded p-1 text-ink-300 transition-colors hover:bg-ink-100 hover:text-ink-700"
                        aria-label={`Edit ${column.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeColumn(column.id)}
                        className="rounded p-1 text-ink-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                        aria-label={`Delete ${column.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_150px_100px_auto]">
              <Input
                value={columnName}
                onChange={(event) => setColumnName(event.target.value)}
                placeholder="New column name"
              />
              <Select value={columnCategory} onChange={(event) => setColumnCategory(event.target.value as ColumnCategory)}>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_META[category].label}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                min={0}
                value={columnWip}
                onChange={(event) => setColumnWip(event.target.value)}
                placeholder="WIP"
              />
              <Button onClick={addColumn} loading={saveColumn.isPending} disabled={!columnName.trim()}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </section>

          {/* members */}
          <section>
            <h3 className="mb-2 text-[13px] font-semibold text-ink-900">Members</h3>
            <ul className="divide-y divide-ink-100 rounded-lg border border-ink-200">
              {board.members.map((member) => (
                <li key={member.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Avatar user={member} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink-800">{member.fullName}</p>
                    <p className="truncate text-[11.5px] text-ink-400">{member.email}</p>
                  </div>
                  {board.lead?.id === member.id && (
                    <Badge className="bg-brand-50 text-brand-700">Lead</Badge>
                  )}
                  <button
                    onClick={() => removeMember.mutate({ boardId: board.id, userId: member.id })}
                    className="ml-auto rounded p-1 text-ink-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                    aria-label={`Remove ${member.fullName}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
              {board.members.length === 0 && (
                <li className="px-3 py-4 text-center text-[13px] text-ink-400">No members yet.</li>
              )}
            </ul>

            <div className="mt-3 flex gap-2">
              <Select value={memberId} onChange={(event) => setMemberId(event.target.value)} className="flex-1">
                <option value="">Add a person…</option>
                {candidates.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.fullName} — {person.email}
                  </option>
                ))}
              </Select>
              <Button onClick={addMember} loading={addMembers.isPending} disabled={!memberId}>
                <UserPlus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </section>

          {/* danger */}
          <section className={cn('rounded-lg border border-rose-200 bg-rose-50/60 p-3.5')}>
            <h3 className="text-[13px] font-semibold text-rose-800">Delete this board</h3>
            <p className="mt-0.5 text-[12.5px] text-rose-700/80">
              Every task, comment and history entry on this board is removed permanently.
            </p>
            <Button variant="danger" size="sm" className="mt-3" onClick={() => setConfirmingDelete(true)}>
              <Trash2 className="h-4 w-4" />
              Delete board
            </Button>
          </section>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={removeBoard}
        loading={deleteBoard.isPending}
        title={`Delete ${board.name}?`}
        message={`All ${board.taskCount} task(s) on this board, together with their comments and history, will be permanently deleted.`}
        confirmLabel="Delete board"
      />
    </>
  );
}
