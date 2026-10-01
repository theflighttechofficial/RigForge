import React from 'react';
import { ActiveTab } from '../types';
import { SITE } from '../siteConfig';
import { OPEN_CONSENT_EVENT } from './ConsentBanner';

interface SiteFooterProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ onNavigate }) => (
  <footer className="w-full border-t border-zinc-800 mt-12 pb-16 sm:pb-0">
    <div className="max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-500">
      <p>Prices and performance figures are estimates. Check with the retailer before buying.</p>
      <nav aria-label="Site" className="flex flex-wrap gap-x-5 gap-y-2">
        <button onClick={() => onNavigate('contact')} className="hover:text-zinc-200 cursor-pointer">Contact</button>
        <button onClick={() => onNavigate('privacy')} className="hover:text-zinc-200 cursor-pointer">Privacy</button>
        <button onClick={() => onNavigate('terms')} className="hover:text-zinc-200 cursor-pointer">Terms</button>
        <button onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))} className="hover:text-zinc-200 cursor-pointer">
          Analytics settings
        </button>
        <a href={SITE.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-200">
          Source on GitHub
        </a>
      </nav>
    </div>
  </footer>
);
