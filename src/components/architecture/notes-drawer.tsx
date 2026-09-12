'use client';

import { FileText } from 'lucide-react';
import { Avatar, Badge, Button, EmptyState } from '@/components/ui';
import { Drawer } from '@/components/ui/overlays';
import type { ArchNode, ArchNoteKind, ArchNoteStatus } from '@/lib/types';

const NOTE_KIND_LABEL: Record<ArchNoteKind, string> = {
  DECISION: 'Decisions',
  CONSTRAINT: 'Constraints',
  RISK: 'Risks',
  ASSUMPTION: 'Assumptions',
  NOTE: 'Notes',
};

const NOTE_STATUS_META: Record<ArchNoteStatus, { label: string; color: string }> = {
  PROPOSED: { label: 'Proposed', color: 'bg-amber-50 text-amber-700' },
  ACCEPTED: { label: 'Accepted', color: 'bg-emerald-50 text-emerald-700' },
  SUPERSEDED: { label: 'Superseded', color: 'bg-ink-100 text-ink-600' },
  REJECTED: { label: 'Rejected', color: 'bg-rose-50 text-rose-600' },
};

const ORDER: ArchNoteKind[] = ['DECISION', 'CONSTRAINT', 'RISK', 'ASSUMPTION', 'NOTE'];

/**
 * The decision log. A read-mostly list is exactly what a modal overlay is for, which is why
 * this uses Drawer while the editing inspector deliberately does not.
 */
export function NotesDrawer({
  open,
  onClose,
  nodes,
  onShowOnCanvas,
}: {
  open: boolean;
  onClose: () => void;
  nodes: ArchNode[];
  onShowOnCanvas: (node: ArchNode) => void;
}) {
  const notes = nodes.filter((node) => node.kind === 'NOTE' || (node.description ?? '').trim().length > 0);
  const grouped = ORDER.map((kind) => ({
    kind,
    items: notes.filter((node) => (node.kind === 'NOTE' ? (node.noteKind ?? 'NOTE') === kind : kind === 'NOTE')),
  })).filter((group) => group.items.length > 0);

  return (
    <Drawer open={open} onClose={onClose} width="max-w-xl">
      <div className="flex h-full flex-col">
        <div className="border-b border-ink-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-ink-900">Notes &amp; decisions</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-500">
            Every note on this diagram, plus any component that carries a description.
          </p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {grouped.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="Nothing recorded yet"
              description="Add a Note to the canvas, or describe a component, and it will appear here."
            />
          ) : (
            grouped.map((group) => (
              <section key={group.kind}>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                  {NOTE_KIND_LABEL[group.kind]}
                </h3>
                <div className="space-y-2.5">
                  {group.items.map((node) => (
                    <article key={node.id} className="rounded-xl border border-ink-100 p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-[13.5px] font-semibold text-ink-900">{node.name}</h4>
                        {node.noteStatus && (
                          <Badge className={NOTE_STATUS_META[node.noteStatus].color}>
                            {NOTE_STATUS_META[node.noteStatus].label}
                          </Badge>
                        )}
                      </div>

                      {node.description && (
                        <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-600">
                          {node.description}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-2 text-[11.5px] text-ink-400">
                        {node.author && (
                          <>
                            <Avatar user={node.author} size="sm" />
                            <span>{node.author.fullName}</span>
                          </>
                        )}
                        {node.decidedOn && <span>· {node.decidedOn}</span>}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto"
                          onClick={() => onShowOnCanvas(node)}
                        >
                          Show on canvas
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </Drawer>
  );
}
