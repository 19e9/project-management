import { useEffect, useState } from 'react';
import {
  AdminFooterColumn,
  AdminSiteFooterResponse,
  AdminSitePageRow,
  useAdminCreateSitePage,
  useAdminDeleteSitePage,
  useAdminPatchSitePage,
  useAdminReplaceSiteFooter,
  useAdminSiteFooter,
  useAdminSitePages,
} from '../../features/cms/hooks';

function cloneFooter(src: AdminSiteFooterResponse): AdminSiteFooterResponse {
  return {
    footerTagline: src.footerTagline,
    secondaryCtaLabel: src.secondaryCtaLabel,
    secondaryCtaHref: src.secondaryCtaHref,
    columns: src.columns.map((c) => ({
      ...c,
      links: c.links.map((l) => ({ ...l })),
    })),
    topNavLinks: src.topNavLinks.map((l) => ({ ...l })),
  };
}

export function MarketingCmsSections() {
  const pagesQ = useAdminSitePages();
  const footerQ = useAdminSiteFooter();
  const createPage = useAdminCreateSitePage();
  const patchPage = useAdminPatchSitePage();
  const deletePage = useAdminDeleteSitePage();
  const replaceFooter = useAdminReplaceSiteFooter();

  const [draftFooter, setDraftFooter] = useState<AdminSiteFooterResponse | null>(null);
  useEffect(() => {
    if (footerQ.data) setDraftFooter(cloneFooter(footerQ.data));
  }, [footerQ.data]);

  const [modal, setModal] = useState<
    | { mode: 'create' }
    | { mode: 'edit'; row: AdminSitePageRow }
    | null
  >(null);

  const busy =
    createPage.isPending ||
    patchPage.isPending ||
    deletePage.isPending ||
    replaceFooter.isPending ||
    pagesQ.isLoading ||
    footerQ.isLoading;

  return (
    <div className="space-y-8">
      <section className="card overflow-hidden">
        <header className="border-b border-ink-200 bg-ink-50/30 px-5 py-4">
          <h2 className="text-base font-semibold text-ink-900">Landing sayfaları</h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Slug tek segment olmalı (ör. <code className="rounded bg-ink-100 px-1">about</code> →{' '}
            <code className="rounded bg-ink-100 px-1">/about</code>). İçerik HTML olarak
            saklanır.
          </p>
        </header>
        <div className="overflow-x-auto px-2 py-3 sm:px-5">
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              className="btn-brand btn-sm"
              disabled={busy}
              onClick={() => setModal({ mode: 'create' })}
            >
              Yeni sayfa
            </button>
          </div>
          {pagesQ.isError && (
            <p className="px-3 py-2 text-sm text-rose-700">
              Sayfalar yüklenemedi. Oturum ve API adresini kontrol edin.
            </p>
          )}
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="pb-2 pr-3">Slug</th>
                <th className="pb-2 pr-3">Başlık</th>
                <th className="pb-2 pr-3">Menü</th>
                <th className="pb-2 pr-3">Sıra</th>
                <th className="pb-2 pr-3">Durum</th>
                <th className="pb-2 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {(pagesQ.data ?? []).map((row) => (
                <tr key={row.id}>
                  <td className="py-2.5 pr-3 font-mono text-xs text-ink-800">{row.slug}</td>
                  <td className="py-2.5 pr-3 font-medium text-ink-900">{row.title}</td>
                  <td className="py-2.5 pr-3 text-ink-700">{row.showInNav ? 'Evet' : 'Hayır'}</td>
                  <td className="py-2.5 pr-3 tabular-nums text-ink-700">{row.navSortOrder}</td>
                  <td className="py-2.5 pr-3">
                    {row.isActive ? (
                      <span className="badge bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-100">
                        Aktif
                      </span>
                    ) : (
                      <span className="badge bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-200">
                        Pasif
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      className="btn-ghost btn-sm mr-1"
                      disabled={busy}
                      onClick={() => setModal({ mode: 'edit', row })}
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                      disabled={busy}
                      onClick={() => {
                        if (confirm(`“${row.slug}” silinsin mi?`)) deletePage.mutate(row.id);
                      }}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card overflow-hidden">
        <header className="border-b border-ink-200 bg-ink-50/30 px-5 py-4">
          <h2 className="text-base font-semibold text-ink-900">Navbar ve footer</h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Üst menü kısayolları ve footer kolonları tek kayıtta tutulur. Kaydet tam içeriği
            değiştirir.
          </p>
        </header>
        <div className="space-y-8 px-5 py-5">
          {!draftFooter && footerQ.isLoading && (
            <div className="space-y-2">
              <div className="skeleton h-8 w-full" />
              <div className="skeleton h-8 w-full" />
            </div>
          )}
          {draftFooter && (
            <>
              <div className="grid gap-3 rounded-xl border border-ink-200 bg-ink-50/30 p-4">
                <label className="grid gap-1 text-xs text-ink-500">
                  Footer açıklaması (sol kolon)
                  <textarea
                    className="input min-h-[88px] text-sm"
                    value={draftFooter.footerTagline}
                    onChange={(e) =>
                      setDraftFooter({ ...draftFooter, footerTagline: e.target.value })
                    }
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs text-ink-500">
                    İkincil CTA etiketi
                    <input
                      className="input"
                      value={draftFooter.secondaryCtaLabel}
                      onChange={(e) =>
                        setDraftFooter({ ...draftFooter, secondaryCtaLabel: e.target.value })
                      }
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-ink-500">
                    İkincil CTA bağlantısı
                    <input
                      className="input font-mono text-xs"
                      value={draftFooter.secondaryCtaHref}
                      onChange={(e) =>
                        setDraftFooter({ ...draftFooter, secondaryCtaHref: e.target.value })
                      }
                    />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink-800">Üst navigasyon</h3>
                <p className="mt-1 text-xs text-ink-500">
                  Örn. <code className="rounded bg-ink-100 px-1">/#pricing</code> veya{' '}
                  <code className="rounded bg-ink-100 px-1">/about</code>
                </p>
                <div className="mt-3 space-y-2">
                  {draftFooter.topNavLinks.map((link, idx) => (
                    <div
                      key={`nav-${idx}`}
                      className="flex flex-wrap items-end gap-2 rounded-xl border border-ink-200 bg-white p-3"
                    >
                      <label className="grid flex-1 gap-1 text-xs text-ink-500">
                        Etiket
                        <input
                          className="input"
                          value={link.label}
                          onChange={(e) => {
                            const next = [...draftFooter.topNavLinks];
                            next[idx] = { ...next[idx], label: e.target.value };
                            setDraftFooter({ ...draftFooter, topNavLinks: next });
                          }}
                        />
                      </label>
                      <label className="grid min-w-[180px] flex-[2] gap-1 text-xs text-ink-500">
                        Href
                        <input
                          className="input font-mono text-xs"
                          value={link.href}
                          onChange={(e) => {
                            const next = [...draftFooter.topNavLinks];
                            next[idx] = { ...next[idx], href: e.target.value };
                            setDraftFooter({ ...draftFooter, topNavLinks: next });
                          }}
                        />
                      </label>
                      <label className="grid w-20 gap-1 text-xs text-ink-500">
                        Sıra
                        <input
                          type="number"
                          className="input tabular-nums"
                          value={link.sortOrder}
                          onChange={(e) => {
                            const next = [...draftFooter.topNavLinks];
                            next[idx] = { ...next[idx], sortOrder: Number(e.target.value) || 0 };
                            setDraftFooter({ ...draftFooter, topNavLinks: next });
                          }}
                        />
                      </label>
                      <label className="flex items-center gap-2 pb-2 text-xs text-ink-600">
                        <input
                          type="checkbox"
                          checked={link.isActive}
                          onChange={(e) => {
                            const next = [...draftFooter.topNavLinks];
                            next[idx] = { ...next[idx], isActive: e.target.checked };
                            setDraftFooter({ ...draftFooter, topNavLinks: next });
                          }}
                        />
                        Aktif
                      </label>
                      <button
                        type="button"
                        className="btn-ghost btn-sm text-rose-700"
                        onClick={() => {
                          const next = draftFooter.topNavLinks.filter((_, i) => i !== idx);
                          setDraftFooter({ ...draftFooter, topNavLinks: next });
                        }}
                      >
                        Kaldır
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() =>
                      setDraftFooter({
                        ...draftFooter,
                        topNavLinks: [
                          ...draftFooter.topNavLinks,
                          {
                            label: 'Yeni bağlantı',
                            href: '/',
                            sortOrder: draftFooter.topNavLinks.length,
                            isActive: true,
                          },
                        ],
                      })
                    }
                  >
                    Navbar bağlantısı ekle
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink-800">Footer kolonları</h3>
                <div className="mt-3 space-y-6">
                  {draftFooter.columns.map((col, ci) => (
                    <FooterColumnEditor
                      key={`col-${ci}`}
                      column={col}
                      onChange={(nextCol) => {
                        const cols = [...draftFooter.columns];
                        cols[ci] = nextCol;
                        setDraftFooter({ ...draftFooter, columns: cols });
                      }}
                      onRemove={() => {
                        const cols = draftFooter.columns.filter((_, i) => i !== ci);
                        setDraftFooter({ ...draftFooter, columns: cols });
                      }}
                    />
                  ))}
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() =>
                      setDraftFooter({
                        ...draftFooter,
                        columns: [
                          ...draftFooter.columns,
                          {
                            title: 'Yeni kolon',
                            sortOrder: draftFooter.columns.length,
                            isActive: true,
                            links: [],
                          },
                        ],
                      })
                    }
                  >
                    Kolon ekle
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-ink-100 pt-4">
                <button
                  type="button"
                  className="btn-brand"
                  disabled={busy}
                  onClick={() => replaceFooter.mutate(draftFooter)}
                >
                  Navbar & footer kaydet
                </button>
                {replaceFooter.isError && (
                  <span className="text-xs text-rose-700">Kayıt başarısız.</span>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {modal?.mode === 'create' && (
        <PageModal
          title="Yeni sayfa"
          busy={busy}
          initial={{
            slug: '',
            title: '',
            body: '',
            isActive: true,
            showInNav: false,
            navSortOrder: 0,
          }}
          onClose={() => setModal(null)}
          onSave={async (values) => {
            await createPage.mutateAsync(values);
            setModal(null);
          }}
        />
      )}
      {modal?.mode === 'edit' && (
        <PageModal
          title="Sayfayı düzenle"
          busy={busy}
          initial={{
            slug: modal.row.slug,
            title: modal.row.title,
            body: modal.row.body,
            isActive: modal.row.isActive,
            showInNav: modal.row.showInNav,
            navSortOrder: modal.row.navSortOrder,
          }}
          onClose={() => setModal(null)}
          onSave={async (values) => {
            await patchPage.mutateAsync({
              id: modal.row.id,
              patch: values,
            });
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function FooterColumnEditor({
  column,
  onChange,
  onRemove,
}: {
  column: AdminFooterColumn;
  onChange: (c: AdminFooterColumn) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50/20 p-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="grid flex-1 gap-1 text-xs text-ink-500">
          Kolon başlığı
          <input
            className="input"
            value={column.title}
            onChange={(e) => onChange({ ...column, title: e.target.value })}
          />
        </label>
        <label className="grid w-20 gap-1 text-xs text-ink-500">
          Sıra
          <input
            type="number"
            className="input tabular-nums"
            value={column.sortOrder}
            onChange={(e) => onChange({ ...column, sortOrder: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="flex items-center gap-2 pb-2 text-xs text-ink-600">
          <input
            type="checkbox"
            checked={column.isActive}
            onChange={(e) => onChange({ ...column, isActive: e.target.checked })}
          />
          Aktif
        </label>
        <button type="button" className="btn-ghost btn-sm text-rose-700" onClick={onRemove}>
          Kolonu sil
        </button>
      </div>
      <div className="mt-4 space-y-2 border-t border-ink-100 pt-4">
        <p className="text-xs font-medium text-ink-600">Bağlantılar</p>
        {column.links.map((link, li) => (
          <div
            key={`l-${li}`}
            className="flex flex-wrap items-end gap-2 rounded-lg border border-ink-100 bg-white p-2"
          >
            <label className="grid flex-1 gap-1 text-[11px] text-ink-500">
              Etiket
              <input
                className="input input-sm"
                value={link.label}
                onChange={(e) => {
                  const links = [...column.links];
                  links[li] = { ...links[li], label: e.target.value };
                  onChange({ ...column, links });
                }}
              />
            </label>
            <label className="grid min-w-[160px] flex-[2] gap-1 text-[11px] text-ink-500">
              Href
              <input
                className="input input-sm font-mono text-[11px]"
                value={link.href}
                onChange={(e) => {
                  const links = [...column.links];
                  links[li] = { ...links[li], href: e.target.value };
                  onChange({ ...column, links });
                }}
              />
            </label>
            <label className="grid w-16 gap-1 text-[11px] text-ink-500">
              Sıra
              <input
                type="number"
                className="input input-sm tabular-nums"
                value={link.sortOrder}
                onChange={(e) => {
                  const links = [...column.links];
                  links[li] = { ...links[li], sortOrder: Number(e.target.value) || 0 };
                  onChange({ ...column, links });
                }}
              />
            </label>
            <label className="flex items-center gap-2 pb-2 text-[11px] text-ink-600">
              <input
                type="checkbox"
                checked={link.isActive}
                onChange={(e) => {
                  const links = [...column.links];
                  links[li] = { ...links[li], isActive: e.target.checked };
                  onChange({ ...column, links });
                }}
              />
              Aktif
            </label>
            <button
              type="button"
              className="rounded px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-50"
              onClick={() => {
                const links = column.links.filter((_, i) => i !== li);
                onChange({ ...column, links });
              }}
            >
              Sil
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() =>
            onChange({
              ...column,
              links: [
                ...column.links,
                {
                  label: 'Link',
                  href: '#',
                  sortOrder: column.links.length,
                  isActive: true,
                },
              ],
            })
          }
        >
          Bağlantı ekle
        </button>
      </div>
    </div>
  );
}

function PageModal({
  title,
  initial,
  busy,
  onClose,
  onSave,
}: {
  title: string;
  initial: {
    slug: string;
    title: string;
    body: string;
    isActive: boolean;
    showInNav: boolean;
    navSortOrder: number;
  };
  busy: boolean;
  onClose: () => void;
  onSave: (v: {
    slug: string;
    title: string;
    body?: string;
    isActive?: boolean;
    showInNav?: boolean;
    navSortOrder?: number;
  }) => Promise<void>;
}) {
  const [slug, setSlug] = useState(initial.slug);
  const [pageTitle, setPageTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [isActive, setIsActive] = useState(initial.isActive);
  const [showInNav, setShowInNav] = useState(initial.showInNav);
  const [navSortOrder, setNavSortOrder] = useState(initial.navSortOrder);

  useEffect(() => {
    setSlug(initial.slug);
    setPageTitle(initial.title);
    setBody(initial.body);
    setIsActive(initial.isActive);
    setShowInNav(initial.showInNav);
    setNavSortOrder(initial.navSortOrder);
  }, [
    initial.slug,
    initial.title,
    initial.body,
    initial.isActive,
    initial.showInNav,
    initial.navSortOrder,
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5 shadow-xl"
        role="dialog"
        aria-labelledby="cms-page-title"
      >
        <h3 id="cms-page-title" className="text-lg font-semibold text-ink-900">
          {title}
        </h3>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-xs text-ink-500">
            Slug
            <input
              className="input font-mono text-sm"
              disabled={busy}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="about"
            />
          </label>
          <label className="grid gap-1 text-xs text-ink-500">
            Sayfa başlığı
            <input
              className="input"
              value={pageTitle}
              disabled={busy}
              onChange={(e) => setPageTitle(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-xs text-ink-500">
            İçerik (HTML)
            <textarea
              className="input min-h-[200px] font-mono text-xs leading-relaxed"
              value={body}
              disabled={busy}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={isActive}
                disabled={busy}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Aktif
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={showInNav}
                disabled={busy}
                onChange={(e) => setShowInNav(e.target.checked)}
              />
              Navbar’da göster (CMS sayfaları)
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              Menü sırası
              <input
                type="number"
                className="input w-24 tabular-nums"
                value={navSortOrder}
                disabled={busy}
                onChange={(e) => setNavSortOrder(Number(e.target.value) || 0)}
              />
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>
            İptal
          </button>
          <button
            type="button"
            className="btn-brand"
            disabled={busy || !slug.trim() || !pageTitle.trim()}
            onClick={() =>
              onSave({
                slug: slug.trim(),
                title: pageTitle.trim(),
                body,
                isActive,
                showInNav,
                navSortOrder,
              })
            }
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
