import { useState } from 'react';

export interface WbsNode {
  id: string;
  title: string;
  wbsCode?: string | null;
  status: string;
  progressPct: number;
  startDate: string;
  endDate: string;
  durationDays: number;
  children: WbsNode[];
}

export function WbsTree({
  nodes,
  criticalIds = [],
  depth = 0,
  onReparent,
}: {
  nodes: WbsNode[];
  criticalIds?: string[];
  depth?: number;
  onReparent?: (taskId: string, newParentId: string | null) => void;
}) {
  return (
    <div className={depth === 0 ? 'space-y-2' : ''}>
      {depth === 0 && onReparent && (
        <RootDropZone onDropRoot={(taskId) => onReparent(taskId, null)} />
      )}
      <ul className={depth === 0 ? '' : 'ml-5 border-l border-slate-200 pl-3'}>
        {nodes.map((n) => (
          <WbsRow key={n.id} node={n} criticalIds={criticalIds} depth={depth} onReparent={onReparent} />
        ))}
      </ul>
    </div>
  );
}

function RootDropZone({ onDropRoot }: { onDropRoot: (taskId: string) => void }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData('wbs/taskId');
        if (id) onDropRoot(id);
      }}
      className={`rounded-xl border border-dashed px-4 py-2 text-center text-xs font-semibold transition ${
        over
          ? 'border-brand-500 bg-brand-50 text-brand-900'
          : 'border-ink-200 bg-white text-ink-500'
      }`}
    >
      Drop here to move a task to top level (no parent)
    </div>
  );
}

function WbsRow({
  node,
  criticalIds,
  depth,
  onReparent,
}: {
  node: WbsNode;
  criticalIds: string[];
  depth: number;
  onReparent?: (taskId: string, newParentId: string | null) => void;
}) {
  const [open, setOpen] = useState(true);
  const [over, setOver] = useState(false);
  const hasChildren = node.children?.length > 0;
  const isCritical = criticalIds.includes(node.id);
  const milestone = /^milestone\b/i.test(node.title.trim());

  return (
    <li className="py-1">
      <div
        className={`flex items-center gap-2 rounded-lg px-1 py-0.5 transition ${
          over && onReparent ? 'bg-brand-50 ring-1 ring-brand-200' : ''
        }`}
        onDragOver={(e) => {
          if (!onReparent) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          if (!onReparent) return;
          e.preventDefault();
          setOver(false);
          const draggedId = e.dataTransfer.getData('wbs/taskId');
          if (!draggedId || draggedId === node.id) return;
          onReparent(draggedId, node.id);
        }}
      >
        {onReparent && (
          <span
            draggable
            title="Drag to nest under another row"
            onDragStart={(e) => {
              e.dataTransfer.setData('wbs/taskId', node.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            className="cursor-grab text-ink-400 hover:text-ink-700 active:cursor-grabbing"
            aria-hidden
          >
            ::
          </span>
        )}
        {hasChildren ? (
          <button
            type="button"
            className="grid h-5 w-5 place-items-center rounded hover:bg-slate-100"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? '−' : '+'}
          </button>
        ) : (
          <span className="inline-block h-5 w-5" />
        )}
        {node.wbsCode && (
          <span className="font-mono text-xs text-slate-500">{node.wbsCode}</span>
        )}
        {milestone && <span className="text-amber-500" title="Milestone">◆</span>}
        <span className={isCritical ? 'font-semibold text-red-600' : ''}>{node.title}</span>
        <span className="ml-auto flex items-center gap-3 text-xs text-slate-500">
          <span>{node.durationDays}d</span>
          <span className={statusCls(node.status)}>{node.status}</span>
          {isCritical && <span className="badge bg-red-100 text-red-700">critical</span>}
        </span>
      </div>
      {open && hasChildren && (
        <WbsTree nodes={node.children} criticalIds={criticalIds} depth={depth + 1} onReparent={onReparent} />
      )}
    </li>
  );
}

function statusCls(status: string) {
  switch (status) {
    case 'done':
      return 'badge bg-green-100 text-green-700';
    case 'in_progress':
      return 'badge bg-blue-100 text-blue-700';
    case 'blocked':
      return 'badge bg-amber-100 text-amber-700';
    case 'cancelled':
      return 'badge bg-slate-100 text-slate-500';
    default:
      return 'badge bg-slate-100 text-slate-700';
  }
}
