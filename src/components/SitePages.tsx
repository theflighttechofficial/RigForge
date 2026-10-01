import React from 'react';
import { ActiveTab } from '../types';
import { SITE } from '../siteConfig';

const Shell: React.FC<{ eyebrow?: string; title: string; children: React.ReactNode }> = ({ eyebrow, title, children }) => (
  <div className="max-w-2xl mx-auto py-10 space-y-5">
    {eyebrow && <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">{eyebrow}</p>}
    <h1 className="text-3xl font-bold text-white">{title}</h1>
    {children}
  </div>
);

const PrimaryButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button onClick={onClick} className="px-4 py-2.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-sm cursor-pointer">
    {children}
  </button>
);

const SecondaryButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button onClick={onClick} className="px-4 py-2.5 rounded-md border border-zinc-700 hover:bg-zinc-800 text-zinc-100 font-semibold text-sm cursor-pointer">
    {children}
  </button>
);

export const NotFoundPage: React.FC<{ onNavigate: (tab: ActiveTab) => void }> = ({ onNavigate }) => (
  <Shell eyebrow="Error 404" title="This page does not exist">
    <p className="text-sm text-zinc-300 leading-relaxed">
      Nothing lives at <code className="font-mono text-cyan-300 break-all">{window.location.pathname}</code>. The link may be mistyped, or the page
      may have moved.
    </p>
    <div className="flex flex-wrap gap-2">
      <PrimaryButton onClick={() => onNavigate('intro')}>Go to the overview</PrimaryButton>
      <SecondaryButton onClick={() => onNavigate('builder')}>Plan a build</SecondaryButton>
      <SecondaryButton onClick={() => onNavigate('catalog')}>Browse the catalog</SecondaryButton>
    </div>
  </Shell>
);

export const ThanksPage: React.FC<{ onNavigate: (tab: ActiveTab) => void }> = ({ onNavigate }) => (
  <Shell eyebrow="Saved" title="Thanks, your build is saved">
    <p className="text-sm text-zinc-300 leading-relaxed">
      It is stored in this browser and now appears in the Build Gallery, where you can load it into Rig Architect, change parts or share it as text.
      Clearing your browser's site data removes it.
    </p>
    <div className="flex flex-wrap gap-2">
      <PrimaryButton onClick={() => onNavigate('community')}>View the gallery</PrimaryButton>
      <SecondaryButton onClick={() => onNavigate('builder')}>Plan another build</SecondaryButton>
    </div>
  </Shell>
);

export const ContactPage: React.FC = () => (
  <Shell title="Contact">
    <p className="text-sm text-zinc-300 leading-relaxed">
      Questions, wrong specs or prices, bug reports and privacy requests (such as removing an entry from the shared hardware list) are all welcome.
    </p>
    <dl className="divide-y divide-zinc-800 border-y border-zinc-800 text-sm">
      {SITE.contactEmail && (
        <div className="py-3 grid sm:grid-cols-[10rem_1fr] gap-1">
          <dt className="text-zinc-500">Email</dt>
          <dd>
            <a href={`mailto:${SITE.contactEmail}`} className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
              {SITE.contactEmail}
            </a>
          </dd>
        </div>
      )}
      <div className="py-3 grid sm:grid-cols-[10rem_1fr] gap-1">
        <dt className="text-zinc-500">Bugs and requests</dt>
        <dd>
          <a href={SITE.issuesUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
            Open an issue on GitHub
          </a>
        </dd>
      </div>
      <div className="py-3 grid sm:grid-cols-[10rem_1fr] gap-1">
        <dt className="text-zinc-500">Source code</dt>
        <dd>
          <a href={SITE.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
            {SITE.sourceUrl.replace('https://', '')}
          </a>
        </dd>
      </div>
    </dl>
  </Shell>
);
