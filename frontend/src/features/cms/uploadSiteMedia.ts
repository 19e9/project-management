import { api, apiBaseUrl } from '../../lib/api-client';

export async function uploadSitePageMedia(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post<{ filename: string }>('/admin/cms/site-media', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const base = apiBaseUrl.replace(/\/$/, '');
  return `${base}/public/site-media/${encodeURIComponent(data.filename)}`;
}
