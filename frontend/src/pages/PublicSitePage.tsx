import { Navigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/marketing/Navbar';
import { Footer } from '../components/marketing/Footer';
import {
  isAxios404,
  isCmsReservedSlug,
  usePublicSitePage,
} from '../features/cms/hooks';
import { CMS_BODY_HTML_CLASS } from '../features/cms/cmsHtmlClasses';

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
          <div className={CMS_BODY_HTML_CLASS} dangerouslySetInnerHTML={{ __html: body }} />
        </div>
      </article>
      <Footer />
    </div>
  );
}
