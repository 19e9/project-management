import { Navigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/marketing/Navbar';
import { Footer } from '../components/marketing/Footer';
import {
  isAxios404,
  isCmsReservedSlug,
  usePublicSitePage,
} from '../features/cms/hooks';

export default function PublicSitePage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const normalized = slug.trim().toLowerCase();

  if (!normalized || isCmsReservedSlug(normalized)) {
    return <Navigate to="/" replace />;
  }

  const q = usePublicSitePage(normalized);

  if (q.isLoading) {
    return (
      <div className="bg-white">
        <Navbar />
        <div className="container py-24">
          <div className="skeleton mx-auto max-w-2xl h-10 w-2/3" />
          <div className="skeleton mx-auto mt-8 max-w-2xl h-4 w-full" />
          <div className="skeleton mx-auto mt-3 max-w-2xl h-4 w-5/6" />
        </div>
        <Footer />
      </div>
    );
  }

  if (q.isError && isAxios404(q.error)) {
    return <Navigate to="/" replace />;
  }

  if (q.isError || !q.data) {
    return (
      <div className="bg-white">
        <Navbar />
        <div className="container py-24 text-center text-sm text-ink-600">
          Bu sayfa yüklenemedi. Ana sayfaya dönmeyi deneyin.
        </div>
        <Footer />
      </div>
    );
  }

  const { title, body } = q.data;

  return (
    <div className="bg-white">
      <Navbar />
      <article className="border-b border-ink-100">
        <div className="container max-w-3xl py-14 md:py-20">
          <h1 className="h-display text-3xl text-ink-900 md:text-4xl">{title}</h1>
          <div
            className="cms-body mt-8 space-y-4 text-base leading-relaxed text-ink-700 [&_a]:text-brand-700 [&_a]:underline [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink-900 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </div>
      </article>
      <Footer />
    </div>
  );
}
