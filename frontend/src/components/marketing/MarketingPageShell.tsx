import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

/** Sticky-bottom footer on short pages; normal flow when content exceeds viewport. */
export function MarketingPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer className="mt-auto" />
    </div>
  );
}
