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
}: {
  nodes: WbsNode[];
  criticalIds?: string[];
  depth?: number;
}) {
  return (
    <ul className={depth === 0 ? '' : 'ml-5 border-l border-slate-200 pl-3'}>
      {nodes.map((n) => (
        <WbsRow key={n.id} node={n} criticalIds={criticalIds} depth={depth} />
      ))}
    </ul>
  );
}

function WbsRow({
  node,
  criticalIds,
  depth,
}: {
  node: WbsNode;
  criticalIds: string[];
  depth: number;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children?.length > 0;
  const isCritical = criticalIds.includes(node.id);
  return (
    <li className="py-1">
      <div className="flex items-center gap-2">
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
          <span className="font-mono text-xs text-slate-500">
            {node.wbsCode}
          </span>
        )}
        <span className={isCritical ? 'font-semibold text-red-600' : ''}>
          {node.title}
        </span>
        <span className="ml-auto flex items-center gap-3 text-xs text-slate-500">
          <span>{node.durationDays}d</span>
          <span className={statusCls(node.status)}>{node.status}</span>
          {isCritical && (
            <span className="badge bg-red-100 text-red-700">critical</span>
          )}
        </span>
      </div>
      {open && hasChildren && (
        <WbsTree nodes={node.children} criticalIds={criticalIds} depth={depth + 1} />
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
