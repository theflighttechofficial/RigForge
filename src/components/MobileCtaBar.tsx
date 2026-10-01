import React from 'react';
import { ActiveTab } from '../types';
import { ScanLine, Wrench } from './icons';

// Pages that are themselves the main action, or where a CTA would distract
const HIDDEN_ON: ActiveTab[] = ['myspecs', 'builder', 'privacy', 'terms', 'contact', 'thanks'];

// Phone-only bar pinned to the bottom of the screen with the two main actions
export const MobileCtaBar: React.FC<{ activeTab: ActiveTab; onNavigate: (tab: ActiveTab) => void }> = ({ activeTab, onNavigate }) => {
  if (HIDDEN_ON.includes(activeTab)) return null;
  return (
    <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onNavigate('myspecs')}
          className="flex items-center justify-center gap-2 py-2.5 rounded-md bg-cyan-500 text-zinc-950 font-semibold text-sm cursor-pointer"
        >
          <ScanLine className="w-4 h-4" /> Scan my PC
        </button>
        <button
          onClick={() => onNavigate('builder')}
          className="flex items-center justify-center gap-2 py-2.5 rounded-md border border-zinc-700 text-zinc-100 font-semibold text-sm cursor-pointer"
        >
          <Wrench className="w-4 h-4" /> Plan a build
        </button>
      </div>
    </div>
  );
};
