import { Injectable, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SitePage, SitePageDocument } from './schemas/site-page.schema';
import {
  SiteFooterConfig,
  SiteFooterConfigDocument,
  FooterColumnEmbed,
  NavShortcutEmbed,
} from './schemas/site-footer.schema';
import {
  CreateSitePageDto,
  PatchSitePageDto,
  ReplaceSiteFooterDto,
  FooterColumnDto,
  FooterLinkDto,
  NavShortcutDto,
} from './dto/cms.dto';

import { ensureSiteMediaDir } from './cms-upload.storage';

const RESERVED_SLUGS = new Set([
  '',
  'api',
  'login',
  'register',
  'logout',
  'pricing',
  'dashboard',
  'admin',
  'app',
  'auth',
  'public',
  'static',
  'assets',
  'docs',
]);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const DEFAULT_FOOTER_TAGLINE =
  'Plan, schedule and ship faster. PlanForge brings Gantt, WBS and the Critical Path Method into one calm, modern workspace.';
const DEFAULT_SECONDARY_CTA_LABEL = 'See pricing →';
const DEFAULT_SECONDARY_CTA_HREF = '/#pricing';

export interface PublicSitePageSummary {
  slug: string;
  title: string;
}

export interface PublicSitePageDetail extends PublicSitePageSummary {
  body: string;
}

export interface PublicNavLink extends PublicSitePageSummary {
  navSortOrder: number;
}

export interface PublicFooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface PublicNavShortcut {
  label: string;
  href: string;
}

@Injectable()
export class CmsService implements OnModuleInit {
  constructor(
    @InjectModel(SitePage.name) private readonly pages: Model<SitePageDocument>,
    @InjectModel(SiteFooterConfig.name)
    private readonly footerCfg: Model<SiteFooterConfigDocument>,
  ) {}

  async onModuleInit() {
    ensureSiteMediaDir();
    await this.ensureDefaultFooter();
  }

  normalizeSlug(raw: string): string {
    return raw.trim().toLowerCase();
  }

  assertSlug(slug: string) {
    const s = this.normalizeSlug(slug);
    if (!SLUG_RE.test(s)) {
      throw new BadRequestException(
        'Slug must be lowercase letters, numbers, single dashes between segments.',
      );
    }
    if (RESERVED_SLUGS.has(s)) {
      throw new BadRequestException(`Slug "${s}" is reserved for the application.`);
    }
    return s;
  }

  private normalizeFooterColumns(dtos: FooterColumnDto[]): FooterColumnEmbed[] {
    return dtos.map((col, ci) => {
      const links = (col.links ?? []).map((l: FooterLinkDto, li: number) => ({
        label: (l.label ?? '').trim(),
        href: (l.href ?? '').trim(),
        sortOrder: l.sortOrder ?? li,
        isActive: l.isActive !== false,
      }));
      return {
        title: (col.title ?? '').trim() || 'Untitled',
        sortOrder: col.sortOrder ?? ci,
        isActive: col.isActive !== false,
        links,
      };
    });
  }

  private normalizeNavShortcuts(dtos: NavShortcutDto[]): NavShortcutEmbed[] {
    return dtos.map((l, i) => ({
      label: (l.label ?? '').trim(),
      href: (l.href ?? '').trim(),
      sortOrder: l.sortOrder ?? i,
      isActive: l.isActive !== false,
    }));
  }

  private defaultFooterColumns(): FooterColumnEmbed[] {
    return [
      {
        title: 'Product',
        sortOrder: 0,
        isActive: true,
        links: [
          { label: 'Features', href: '/#features', sortOrder: 0, isActive: true },
          { label: 'How it works', href: '/#how', sortOrder: 1, isActive: true },
          { label: 'Pricing', href: '/#pricing', sortOrder: 2, isActive: true },
          { label: 'Customers', href: '/#proof', sortOrder: 3, isActive: true },
        ],
      },
      {
        title: 'Company',
        sortOrder: 1,
        isActive: true,
        links: [
          { label: 'About', href: '#', sortOrder: 0, isActive: true },
          { label: 'Careers', href: '#', sortOrder: 1, isActive: true },
          { label: 'Contact', href: '#', sortOrder: 2, isActive: true },
        ],
      },
      {
        title: 'Resources',
        sortOrder: 2,
        isActive: true,
        links: [
          { label: 'Documentation', href: '#', sortOrder: 0, isActive: true },
          { label: 'API reference', href: '#', sortOrder: 1, isActive: true },
          { label: 'Status', href: '#', sortOrder: 2, isActive: true },
        ],
      },
      {
        title: 'Legal',
        sortOrder: 3,
        isActive: true,
        links: [
          { label: 'Privacy', href: '#', sortOrder: 0, isActive: true },
          { label: 'Terms', href: '#', sortOrder: 1, isActive: true },
          { label: 'Security', href: '#', sortOrder: 2, isActive: true },
        ],
      },
    ];
  }

  private defaultTopNavLinks(): NavShortcutEmbed[] {
    return [
      { label: 'Features', href: '/#features', sortOrder: 0, isActive: true },
      { label: 'How it works', href: '/#how', sortOrder: 1, isActive: true },
      { label: 'Pricing', href: '/#pricing', sortOrder: 2, isActive: true },
      { label: 'Customers', href: '/#proof', sortOrder: 3, isActive: true },
    ];
  }

  async ensureDefaultFooter() {
    const existing = await this.footerCfg.findOne({ configKey: 'default' }).lean();
    const defaultsCols = this.defaultFooterColumns();
    const defaultsNav = this.defaultTopNavLinks();

    if (!existing) {
      await this.footerCfg.findOneAndUpdate(
        { configKey: 'default' },
        {
          $setOnInsert: {
            configKey: 'default',
            footerTagline: DEFAULT_FOOTER_TAGLINE,
            secondaryCtaLabel: DEFAULT_SECONDARY_CTA_LABEL,
            secondaryCtaHref: DEFAULT_SECONDARY_CTA_HREF,
            columns: defaultsCols,
            topNavLinks: defaultsNav,
          },
        },
        { upsert: true, new: true },
      );
      return;
    }

    const patch: Record<string, unknown> = {};
    if (!existing.columns?.length) patch.columns = defaultsCols;
    if (!existing.topNavLinks?.length) patch.topNavLinks = defaultsNav;

    const ex = existing as SiteFooterConfig & {
      footerTagline?: string;
      secondaryCtaLabel?: string;
      secondaryCtaHref?: string;
    };
    if (ex.footerTagline == null) patch.footerTagline = DEFAULT_FOOTER_TAGLINE;
    if (ex.secondaryCtaLabel == null) patch.secondaryCtaLabel = DEFAULT_SECONDARY_CTA_LABEL;
    if (ex.secondaryCtaHref == null) patch.secondaryCtaHref = DEFAULT_SECONDARY_CTA_HREF;

    if (Object.keys(patch).length === 0) return;

    await this.footerCfg.findOneAndUpdate({ configKey: 'default' }, { $set: patch }, { new: true });
  }

  /** ─── Admin pages ─────────────────────────────────────────────── */

  async adminListPages(): Promise<
    Array<{
      id: string;
      slug: string;
      title: string;
      body: string;
      isActive: boolean;
      showInNav: boolean;
      navSortOrder: number;
      createdAt: string;
      updatedAt: string;
    }>
  > {
    const rows = await this.pages.find().sort({ slug: 1 }).lean();
    return rows.map((r) => ({
      id: String(r._id),
      slug: r.slug,
      title: r.title,
      body: r.body ?? '',
      isActive: r.isActive,
      showInNav: r.showInNav,
      navSortOrder: r.navSortOrder ?? 0,
      createdAt: r.createdAt?.toISOString?.() ?? new Date(0).toISOString(),
      updatedAt: r.updatedAt?.toISOString?.() ?? new Date(0).toISOString(),
    }));
  }

  async adminCreatePage(dto: CreateSitePageDto) {
    const slug = this.assertSlug(dto.slug);
    const dup = await this.pages.exists({ slug });
    if (dup) throw new BadRequestException(`Slug "${slug}" already exists.`);

    const doc = await this.pages.create({
      slug,
      title: dto.title.trim(),
      body: dto.body ?? '',
      isActive: dto.isActive !== false,
      showInNav: !!dto.showInNav,
      navSortOrder: dto.navSortOrder ?? 0,
    });
    return this.serializeAdminPage(doc);
  }

  async adminPatchPage(id: string, dto: PatchSitePageDto) {
    const doc = await this.pages.findById(id);
    if (!doc) throw new NotFoundException('Page not found');

    if (dto.slug !== undefined) {
      const slug = this.assertSlug(dto.slug);
      if (slug !== doc.slug) {
        const dup = await this.pages.exists({ slug });
        if (dup) throw new BadRequestException(`Slug "${slug}" already exists.`);
        doc.slug = slug;
      }
    }
    if (dto.title !== undefined) doc.title = dto.title.trim();
    if (dto.body !== undefined) doc.body = dto.body;
    if (dto.isActive !== undefined) doc.isActive = dto.isActive;
    if (dto.showInNav !== undefined) doc.showInNav = dto.showInNav;
    if (dto.navSortOrder !== undefined) doc.navSortOrder = dto.navSortOrder;

    await doc.save();
    return this.serializeAdminPage(doc);
  }

  async adminDeletePage(id: string) {
    const res = await this.pages.deleteOne({ _id: id });
    if (res.deletedCount === 0) throw new NotFoundException('Page not found');
    return { ok: true };
  }

  private serializeAdminPage(doc: SitePageDocument) {
    return {
      id: String(doc._id),
      slug: doc.slug,
      title: doc.title,
      body: doc.body ?? '',
      isActive: doc.isActive,
      showInNav: doc.showInNav,
      navSortOrder: doc.navSortOrder ?? 0,
      createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  /** ─── Public ────────────────────────────────────────────────────── */

  async publicListPages(): Promise<{ pages: PublicSitePageSummary[] }> {
    const rows = await this.pages
      .find({ isActive: true })
      .sort({ slug: 1 })
      .select({ slug: 1, title: 1 })
      .lean();
    return {
      pages: rows.map((r) => ({ slug: r.slug, title: r.title })),
    };
  }

  async publicNavLinks(): Promise<{ nav: PublicNavLink[] }> {
    const rows = await this.pages
      .find({ isActive: true, showInNav: true })
      .sort({ navSortOrder: 1, slug: 1 })
      .select({ slug: 1, title: 1, navSortOrder: 1 })
      .lean();
    return {
      nav: rows.map((r) => ({
        slug: r.slug,
        title: r.title,
        navSortOrder: r.navSortOrder ?? 0,
      })),
    };
  }

  async publicPageBySlug(slug: string): Promise<PublicSitePageDetail> {
    const s = this.normalizeSlug(slug);
    if (!SLUG_RE.test(s) || RESERVED_SLUGS.has(s)) {
      throw new NotFoundException('Page not found');
    }
    const r = await this.pages.findOne({ slug: s, isActive: true }).lean();
    if (!r) throw new NotFoundException('Page not found');
    return { slug: r.slug, title: r.title, body: r.body ?? '' };
  }

  async publicFooter(): Promise<{
    footerTagline: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    columns: PublicFooterColumn[];
    topNavLinks: PublicNavShortcut[];
  }> {
    await this.ensureDefaultFooter();
    const doc = await this.footerCfg.findOne({ configKey: 'default' }).lean();
    const cols = (doc?.columns ?? [])
      .filter((c) => c.isActive)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const topNav = (doc?.topNavLinks ?? [])
      .filter((l) => l.isActive)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((l) => ({ label: l.label, href: l.href }));

    const docTyped = doc as SiteFooterConfig & {
      footerTagline?: string;
      secondaryCtaLabel?: string;
      secondaryCtaHref?: string;
    };

    return {
      footerTagline: docTyped?.footerTagline ?? DEFAULT_FOOTER_TAGLINE,
      secondaryCtaLabel: docTyped?.secondaryCtaLabel ?? DEFAULT_SECONDARY_CTA_LABEL,
      secondaryCtaHref: docTyped?.secondaryCtaHref ?? DEFAULT_SECONDARY_CTA_HREF,
      columns: cols.map((c) => ({
        title: c.title,
        links: (c.links ?? [])
          .filter((l) => l.isActive)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((l) => ({ label: l.label, href: l.href })),
      })),
      topNavLinks: topNav,
    };
  }

  /** ─── Admin footer ──────────────────────────────────────────────── */

  async adminGetFooter(): Promise<{
    footerTagline: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    columns: FooterColumnEmbed[];
    topNavLinks: NavShortcutEmbed[];
  }> {
    await this.ensureDefaultFooter();
    const doc = await this.footerCfg.findOne({ configKey: 'default' }).lean();
    const cols = [...(doc?.columns ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const nav = [...(doc?.topNavLinks ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const docTyped = doc as SiteFooterConfig & {
      footerTagline?: string;
      secondaryCtaLabel?: string;
      secondaryCtaHref?: string;
    };
    return {
      footerTagline: docTyped?.footerTagline ?? DEFAULT_FOOTER_TAGLINE,
      secondaryCtaLabel: docTyped?.secondaryCtaLabel ?? DEFAULT_SECONDARY_CTA_LABEL,
      secondaryCtaHref: docTyped?.secondaryCtaHref ?? DEFAULT_SECONDARY_CTA_HREF,
      columns: cols,
      topNavLinks: nav,
    };
  }

  async adminReplaceFooter(dto: ReplaceSiteFooterDto) {
    const columns = this.normalizeFooterColumns(dto.columns ?? []);
    columns.sort((a, b) => a.sortOrder - b.sortOrder);
    const topNavLinks = this.normalizeNavShortcuts(dto.topNavLinks ?? []);
    topNavLinks.sort((a, b) => a.sortOrder - b.sortOrder);

    await this.footerCfg.findOneAndUpdate(
      { configKey: 'default' },
      {
        $set: {
          footerTagline: (dto.footerTagline ?? '').trim() || DEFAULT_FOOTER_TAGLINE,
          secondaryCtaLabel: (dto.secondaryCtaLabel ?? '').trim() || DEFAULT_SECONDARY_CTA_LABEL,
          secondaryCtaHref: (dto.secondaryCtaHref ?? '').trim() || DEFAULT_SECONDARY_CTA_HREF,
          columns,
          topNavLinks,
        },
      },
      { upsert: true, new: true },
    );
    return this.adminGetFooter();
  }
}
