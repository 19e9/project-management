import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '../../lib/api-client';

/** Mirrors backend RESERVED_SLUGS — single-segment paths that are not CMS pages. */
export const CMS_RESERVED_SLUGS = new Set([
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

export function isCmsReservedSlug(slug: string): boolean {
  return CMS_RESERVED_SLUGS.has(slug.trim().toLowerCase());
}

export interface PublicSiteFooterResponse {
  footerTagline: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  columns: { title: string; links: { label: string; href: string }[] }[];
  topNavLinks: { label: string; href: string }[];
}

export interface PublicNavEntry {
  slug: string;
  title: string;
  navSortOrder: number;
}

export interface PublicSitePageDetail {
  slug: string;
  title: string;
  body: string;
}

export interface AdminSitePageRow {
  id: string;
  slug: string;
  title: string;
  body: string;
  isActive: boolean;
  showInNav: boolean;
  navSortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFooterColumn {
  title: string;
  sortOrder: number;
  isActive: boolean;
  links: { label: string; href: string; sortOrder: number; isActive: boolean }[];
}

export interface AdminNavShortcut {
  label: string;
  href: string;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminSiteFooterResponse {
  footerTagline: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  columns: AdminFooterColumn[];
  topNavLinks: AdminNavShortcut[];
}

export function usePublicSiteFooter() {
  return useQuery({
    queryKey: ['public', 'site-footer'],
    queryFn: async () => (await api.get<PublicSiteFooterResponse>('/public/site-footer')).data,
    staleTime: 60_000,
  });
}

export function usePublicSiteNav() {
  return useQuery({
    queryKey: ['public', 'site-nav'],
    queryFn: async () => (await api.get<{ nav: PublicNavEntry[] }>('/public/site-nav')).data,
    staleTime: 60_000,
  });
}

export function usePublicSitePage(slug: string | undefined) {
  const normalized = slug?.trim().toLowerCase() ?? '';
  const enabled = !!normalized && !isCmsReservedSlug(normalized);
  return useQuery({
    queryKey: ['public', 'site-page', normalized],
    queryFn: async () =>
      (await api.get<PublicSitePageDetail>(`/public/site-pages/${encodeURIComponent(normalized)}`)).data,
    enabled,
    retry: false,
  });
}

export function useAdminSitePages(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'site-pages'],
    queryFn: async () => (await api.get<AdminSitePageRow[]>('/admin/site-pages')).data,
    enabled,
  });
}

export function useAdminSiteFooter(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'site-footer'],
    queryFn: async () => (await api.get<AdminSiteFooterResponse>('/admin/site-footer')).data,
    enabled,
  });
}

export function useAdminCreateSitePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      slug: string;
      title: string;
      body?: string;
      isActive?: boolean;
      showInNav?: boolean;
      navSortOrder?: number;
    }) => (await api.post<AdminSitePageRow>('/admin/site-pages', body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'site-pages'] });
      qc.invalidateQueries({ queryKey: ['public', 'site-pages'] });
      qc.invalidateQueries({ queryKey: ['public', 'site-nav'] });
    },
  });
}

export function useAdminPatchSitePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      id: string;
      patch: Partial<{
        slug: string;
        title: string;
        body: string;
        isActive: boolean;
        showInNav: boolean;
        navSortOrder: number;
      }>;
    }) => (await api.patch<AdminSitePageRow>(`/admin/site-pages/${p.id}`, p.patch)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'site-pages'] });
      qc.invalidateQueries({ queryKey: ['public', 'site-pages'] });
      qc.invalidateQueries({ queryKey: ['public', 'site-nav'] });
      qc.invalidateQueries({ queryKey: ['public', 'site-page'] });
    },
  });
}

export function useAdminDeleteSitePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/admin/site-pages/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'site-pages'] });
      qc.invalidateQueries({ queryKey: ['public', 'site-pages'] });
      qc.invalidateQueries({ queryKey: ['public', 'site-nav'] });
      qc.invalidateQueries({ queryKey: ['public', 'site-page'] });
    },
  });
}

export function useAdminReplaceSiteFooter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminSiteFooterResponse) =>
      (await api.put<AdminSiteFooterResponse>('/admin/site-footer', body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'site-footer'] });
      qc.invalidateQueries({ queryKey: ['public', 'site-footer'] });
    },
  });
}

export function isAxios404(err: unknown): boolean {
  return err instanceof AxiosError && err.response?.status === 404;
}
