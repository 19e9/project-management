import type { ReactNode } from 'react';

export function BillingLedgerTable(props: {
  title: string;
  subtitle?: string;
  cols: string[];
  rows: { key: string; cells: string[]; action?: ReactNode }[];
  loading?: boolean;
}) {
  const hasAction = props.rows.some((r) => r.action);
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-ink-900/[0.06] dark:bg-ink-900/60 dark:ring-white/[0.08]">
      <header className="border-b border-ink-100 px-5 py-4 dark:border-white/[0.06]">
        <h3 className="text-sm font-semibold tracking-tight text-ink-900 dark:text-ink-50">
          {props.title}
        </h3>
        {props.subtitle && (
          <p className="mt-0.5 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
            {props.subtitle}
          </p>
        )}
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50/50 dark:bg-white/[0.03]">
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
              {props.cols.map((c) => (
                <th key={c} className="px-4 py-2.5 font-semibold">
                  {c}
                </th>
              ))}
              {hasAction ? <th className="px-4 py-2.5" /> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 dark:divide-white/[0.06]">
            {props.loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={props.cols.length + (hasAction ? 1 : 0)} className="px-4 py-2">
                    <div className="skeleton h-6 w-full dark:bg-ink-800" />
                  </td>
                </tr>
              ))}
            {!props.loading && props.rows.length === 0 && (
              <tr>
                <td
                  colSpan={props.cols.length + (hasAction ? 1 : 0)}
                  className="px-5 py-10 text-center text-sm text-ink-500 dark:text-ink-400"
                >
                  No rows in this view.
                </td>
              </tr>
            )}
            {!props.loading &&
              props.rows.map((r) => (
                <tr key={r.key} className="transition hover:bg-ink-50/60 dark:hover:bg-white/[0.03]">
                  {r.cells.map((c, i) => (
                    <td key={i} className="whitespace-nowrap px-4 py-2.5 text-ink-800 dark:text-ink-200">
                      {c}
                    </td>
                  ))}
                  {hasAction ? <td className="px-4 py-2.5 text-right">{r.action}</td> : null}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function BillingLedgerMini(props: { title: string; rows: { id: string; line: string }[] }) {
  return (
    <div>
      <div className="text-xs font-semibold text-ink-800 dark:text-ink-200">{props.title}</div>
      <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto text-xs text-ink-600 dark:text-ink-400">
        {props.rows.length === 0 && <li className="text-ink-400">No entries.</li>}
        {props.rows.map((r) => (
          <li key={r.id} className="border-b border-ink-100 py-1 dark:border-white/[0.06]">
            {r.line}
          </li>
        ))}
      </ul>
    </div>
  );
}
