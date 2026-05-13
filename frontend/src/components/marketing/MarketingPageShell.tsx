import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

function useHomeHashScrollIntoView() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (pathname !== '/' || !hash || hash === '#') return;
    const id = decodeURIComponent(hash.slice(1));
    if (!id) return;

    const scroll = () => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    requestAnimationFrame(() => {
      scroll();
      // Second frame: anchors may sit below lazily-painted content / layout
      requestAnimationFrame(scroll);
    });
  }, [pathname, hash]);
}

/** Sticky-bottom footer on short pages; normal flow when content exceeds viewport. */
export function MarketingPageShell({ children }: { children: ReactNode }) {
  useHomeHashScrollIntoView();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer className="mt-auto" />
    </div>
  );
}
