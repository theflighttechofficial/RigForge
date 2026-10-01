import React from 'react';
import { SITE } from '../siteConfig';

// Keep these pages in step with what the code does: app.ts, store.ts, deviceAgent.ts,
// unixAgent.ts and every localStorage key. Update LAST_UPDATED whenever the text changes.
const LAST_UPDATED = '1 October 2026';


const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-lg font-semibold text-white">{title}</h2>
    <div className="space-y-3 text-sm leading-relaxed text-zinc-300">{children}</div>
  </section>
);

const Page: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <article className="max-w-3xl mx-auto space-y-8 py-4">
    <header className="space-y-1 border-b border-zinc-800 pb-4">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      <p className="text-xs font-mono text-zinc-500">Last updated {LAST_UPDATED}</p>
    </header>
    {children}
  </article>
);

const A: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
    {children}
  </a>
);

export const PrivacyPolicy: React.FC = () => (
  <Page title="Privacy Policy">
    <Section title="Summary">
      <p>
        There are no accounts and no advertising. Analytics run only if you allow them. Most of what you do stays in your own browser. The site only
        receives information about your computer if you start a hardware scan and agree to it.
      </p>
    </Section>

    <Section title="Hardware scan (My PC Specs)">
      <p>Nothing is read from your computer until you press "Allow and scan". Then:</p>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          On a hosted copy of the site, you run a small script yourself (PowerShell on Windows, a shell script on macOS and Linux). The script only
          reads hardware information and sends one report to this site.
        </li>
        <li>
          The report contains: system manufacturer and model, operating system version, computer name, processor, memory modules, drives, graphics
          cards, displays, and network adapters with their MAC addresses. If you are on Wi-Fi it also includes the network name (SSID), signal
          strength and band. On macOS, the system report also lists nearby Wi-Fi networks; the server discards that list without storing it.
        </li>
        <li>
          The full report is kept for up to 15 minutes so your browser tab can collect it, and then it is deleted automatically. It is linked to a
          random one-time code, not to you.
        </li>
        <li>
          Component models the site did not already know (for example a processor, RAM part number, drive or Wi-Fi card model) are added to a shared
          hardware list with their specifications and how many times they have been seen. Your computer name, MAC addresses and Wi-Fi network name
          are never added to that list.
        </li>
        <li>If you run the site on your own computer, the scan happens on that computer and nothing leaves it.</li>
      </ul>
    </Section>

    <Section title="Build Doctor">
      <p>
        When you run a diagnosis, the processor, graphics card and memory size you chose are sent to the site's server to produce the report. If the
        site operator has enabled AI reports, that same text is also sent to Google's Gemini API, under{' '}
        <A href="https://policies.google.com/privacy">Google's privacy policy</A>. Nothing else about you is included.
      </p>
    </Section>

    <Section title="Analytics (only with your permission)">
      <p>
        On your first visit a banner asks whether we may count page views. If you choose "Allow", the site loads Vercel Web Analytics, which records
        the page address, referring site, browser, operating system, device type and country. It sets no cookies, does not store your IP address and
        does not follow you across other sites. See <A href="https://vercel.com/docs/analytics/privacy-policy">Vercel's analytics privacy notes</A>.
      </p>
      <p>
        If you choose "No thanks", the analytics script is never loaded. You can change your choice at any time with "Analytics settings" in the
        footer.
      </p>
    </Section>

    <Section title="Stored in your browser only">
      <p>These are saved with your browser's local storage and never sent to the site:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Light or dark theme, whether you have opened the "More" menu, and your analytics choice</li>
        <li>Your saved rig presets, saved builds in the Build Gallery, and My Rig profiles</li>
        <li>A cached copy of the hardware catalog, to make pages load faster</li>
      </ul>
      <p>Clear your browser's site data to remove all of it.</p>
    </Section>

    <Section title="Hosting">
      <p>
        The site is hosted on Vercel, and scan sessions plus the shared hardware list are stored with Upstash. Like any web host, Vercel processes
        your IP address and request details to deliver pages and keep the service secure. See{' '}
        <A href="https://vercel.com/legal/privacy-policy">Vercel's privacy policy</A> and{' '}
        <A href="https://upstash.com/trust/privacy.pdf">Upstash's privacy policy</A>. Fonts and icons are served from this site, not from a
        third-party CDN.
      </p>
    </Section>

    <Section title="Outbound links">
      <p>
        "Check store" links open search pages on retailer websites such as Amazon.in and MDComputers. Those sites have their own privacy policies.
      </p>
    </Section>

    <Section title="Your choices and contact">
      <p>
        You can use every tool except the hardware scan without sending anything about your computer. To ask for an entry to be removed from the
        shared hardware list, or for any privacy question,{' '}
        {SITE.contactEmail ? (
          <>
            email <A href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</A> or{' '}
          </>
        ) : null}
        open an issue on the <A href={SITE.issuesUrl}>project's GitHub page</A>.
      </p>
    </Section>
  </Page>
);

export const TermsOfService: React.FC = () => (
  <Page title="Terms of Use">
    <Section title="What this site is">
      <p>
        Silicon Matrix is a free planning tool for PC builds. By using it you agree to these terms. If you do not agree, please do not use the site.
      </p>
    </Section>

    <Section title="Estimates, not guarantees">
      <ul className="list-disc pl-5 space-y-2">
        <li>
          Frame rates, bottleneck percentages, temperatures, power draw, running costs and upgrade advice come from models. Real results depend on
          your exact parts, drivers, game versions, cooling and settings.
        </li>
        <li>
          Prices are estimates based on catalog list prices. The retailer prices shown are modelled, not read live from those stores, and stock
          status is not shown. Check the retailer before you buy.
        </li>
        <li>Do not rely on this site alone for safety-related decisions such as power supply sizing or electrical work.</li>
      </ul>
    </Section>

    <Section title="The hardware scan script">
      <p>
        The scan script only reads hardware information and sends it to this site. You can read the full script before running it: open the download
        link in your browser instead of running the command. You run it on your own computer at your own choice.
      </p>
    </Section>

    <Section title="Acceptable use">
      <p>
        Do not attempt to disrupt the site, overload the scan service, submit false or harmful data to the shared hardware list, or use automated
        tools to scrape it at high volume.
      </p>
    </Section>

    <Section title="Trademarks and affiliation">
      <p>
        Product and company names such as AMD, Intel, NVIDIA and the retailers mentioned belong to their owners. This site is independent and is not
        endorsed by, sponsored by or affiliated with any of them. It earns nothing from store links.
      </p>
    </Section>

    <Section title="No warranty">
      <p>
        The site is provided "as is", without warranties of any kind. To the extent the law allows, the site's operators are not liable for any loss
        or damage arising from using it, including purchases made based on its estimates.
      </p>
    </Section>

    <Section title="Changes">
      <p>
        These terms may change. The date at the top shows the latest version. For questions, see the contact details on the Contact page or the{' '}
        <A href={SITE.issuesUrl}>project's GitHub page</A>.
      </p>
    </Section>
  </Page>
);
