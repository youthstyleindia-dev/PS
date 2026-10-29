import React from 'react';
import { useNavigate } from 'react-router-dom';

export const AboutPrinciplesPage: React.FC = () => {
  const navigate = useNavigate();

  const tenets = [
    {
      num: '01',
      icon: 'build',
      title: 'Useful over Flashy',
      desc: 'Software built to dissolve daily collegiate friction—finding late-night shuttles, sharing GPU compute, and discovering peer study cohorts—rather than bloated, bureaucratic administrative portals.',
      tag: 'HEURISTIC: MINIMAL_BLOAT'
    },
    {
      num: '02',
      icon: 'visibility',
      title: 'Transparent over Opaque',
      desc: 'No black-box algorithmic ranking or punitive behavioral scores. All shortest-path transit models and resource arbitration heuristics are open for peer review and academic inspection.',
      tag: 'AUDITABLE: OPEN_SCHEMAS'
    },
    {
      num: '03',
      icon: 'lock_clock',
      title: 'Privacy by Design',
      desc: 'Zero monetization of student traces. Cryptographic isolation via ephemeral keypairs, local SQLite WAL vaults, zero third-party commercial pixels, and strict client-side encryption.',
      tag: 'TELEMETRY: CLIENT_ENCRYPTED'
    },
    {
      num: '04',
      icon: 'person_check',
      title: 'Assistance before Automation',
      desc: 'Machine intelligence serves as an advisory copilot, not a judge. Algorithmic review flags context for human tribunal members; students always preserve sovereign human appeal.',
      tag: 'AGENT: HUMAN_IN_THE_LOOP'
    },
    {
      num: '05',
      icon: 'nature_people',
      title: 'Stewardship over Extraction',
      desc: 'Decentralized peer ride pooling and diurnal solar compute alignment prevent carbon waste. The university remains a community commons, not an extractive data monopoly.',
      tag: 'ECOSYSTEM: ZERO_COMMERCIAL_TAX'
    }
  ];

  const comparisonRows = [
    {
      dim: 'Data Sovereignty',
      legacy: 'Exfiltrated to third-party ad networks, vendor lock-in clouds, and commercial telemetry aggregators.',
      universe: 'Local-first SQLite storage in WAL mode. Zero tracking pixels, zero external telemetry.'
    },
    {
      dim: 'Ride Matching & Transit',
      legacy: 'Dynamic surge pricing, 30%+ middleman commission, opaque black-box driver dispatch.',
      universe: 'Deterministic Dijkstra topological route matcher with strict ≤ 35% detour envelope.'
    },
    {
      dim: 'Compute & Slurm Allocation',
      legacy: 'Peak grid carbon consumption; GPU jobs scheduled irrespective of local solar availability.',
      universe: 'Diurnal solar peak synchronization; non-linear power cap P(U) model minimizes emissions.'
    },
    {
      dim: 'Student Wellbeing',
      legacy: 'Behavioral addiction feeds, user surveillance, unconsented telemetry tracking.',
      universe: 'Client-side regex domain categorization; Laplace Differential Privacy (ε = 0.8) cohort analytics.'
    },
    {
      dim: 'Examination Review',
      legacy: 'Black-box facial biometrics, automated algorithmic flagging and punitive sanctions.',
      universe: 'Human-in-the-loop proctor tribunal requiring mandatory written justification and student rebuttals.'
    }
  ];

  return (
    <div className="w-full min-h-screen bg-background font-body-md text-on-surface flex flex-col">
      {/* Top Header Navigation */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant shadow-sm">
        <div className="h-16 w-full max-w-7xl mx-auto px-4 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              onClick={() => navigate('/')}
              className="font-headline-sm text-headline-sm tracking-tight text-primary font-bold uppercase cursor-pointer"
            >
              UniVerse
            </span>
            <span className="font-mono text-xs text-secondary uppercase px-1.5 py-0.5 border border-secondary font-bold">
              Principles &amp; Ethos
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 font-mono text-xs">
            <button onClick={() => navigate('/')} className="hover:text-secondary transition-colors">
              Platform
            </button>
            <button onClick={() => navigate('/how-it-works')} className="hover:text-secondary transition-colors">
              How It Works
            </button>
            <button onClick={() => navigate('/impact')} className="hover:text-secondary transition-colors">
              Impact
            </button>
            <button onClick={() => navigate('/about')} className="text-secondary font-bold">
              Principles
            </button>
            <button onClick={() => navigate('/architecture')} className="hover:text-secondary transition-colors">
              Architecture
            </button>
          </nav>

          <div className="flex items-center gap-3 font-mono text-xs">
            <button
              onClick={() => navigate('/login')}
              className="px-3 py-1.5 border border-primary text-primary hover:bg-surface-container font-bold uppercase transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/app')}
              className="px-4 py-1.5 bg-primary text-on-primary font-bold uppercase hover:bg-secondary transition-all shadow-[2px_2px_0px_#003fe1]"
            >
              Explore Console
            </button>
          </div>
        </div>
      </header>

      {/* Top Technical Header Stamp */}
      <section className="w-full px-4 md:px-12 py-2.5 border-b border-outline-variant bg-surface-container-lowest font-mono text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-outline">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-primary text-on-primary font-bold">DOC: 005_ABOUT</span>
            <span>ACADEMIC INTEGRITY // PHILOSOPHY &amp; ARCHITECTURE</span>
          </div>
          <div className="flex items-center gap-4">
            <span>COMMIT: 8F4E29A</span>
            <span className="hidden md:inline">AUDIT: VERIFIED_PEER_REVIEW</span>
            <span className="inline-flex items-center gap-1.5 text-secondary font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              AUTONOMOUS CAMPUS PROTOCOL
            </span>
          </div>
        </div>
      </section>

      {/* Editorial Introduction & Philosophy */}
      <section className="w-full px-4 md:px-12 py-12 md:py-16 bg-surface border-b border-outline-variant">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Editorial Headline & Meta */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 font-mono text-xs">
              <span className="text-secondary uppercase px-2 py-0.5 border border-secondary font-bold">
                Institutional Manifesto
              </span>
              <span className="text-outline">EDITION 2026.1</span>
            </div>

            <h1 className="font-headline-xl text-headline-xl text-primary font-extrabold tracking-tight leading-[1.05]">
              Rebuilding the digital university from the physical ground up.
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Modern campuses are increasingly fragmented across closed corporate silos, high-fee ride-hails, and predatory surveillance. UniVerse represents an alternative: an integrated, student-owned operating system rooted in local compute and collective intelligence.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 font-mono text-xs">
              <button
                onClick={() => navigate('/onboarding')}
                className="px-6 py-3 bg-primary text-on-primary font-bold uppercase hover:bg-secondary transition-all shadow-[2px_2px_0px_#003fe1]"
              >
                Join Campus Node
              </button>
              <button
                onClick={() => navigate('/architecture')}
                className="px-6 py-3 border border-outline text-primary font-bold uppercase hover:bg-surface-container transition-colors"
              >
                Inspect Source Code
              </button>
            </div>
          </div>

          {/* Right Column: Architectural Canvas */}
          <div className="lg:col-span-5 flex flex-col gap-3 font-mono">
            <div className="relative w-full aspect-[4/3] bg-primary border border-primary p-6 shadow-[5px_5px_0px_#003fe1] flex flex-col justify-between text-white">
              <div className="flex justify-between items-center text-xs border-b border-white/20 pb-2">
                <span className="bg-white/10 px-2 py-0.5 border border-white/20">COORD // 42.3601° N, 71.0942° W</span>
                <span className="bg-secondary px-2 py-0.5 font-bold">NODE_01_PRIMARY</span>
              </div>

              <div className="my-auto py-4">
                <span className="text-secondary-fixed text-xs font-bold block uppercase mb-1">
                  FIG. 01 — THE PHYSICAL-DIGITAL COMMONS
                </span>
                <p className="font-serif italic text-base leading-relaxed text-white/90">
                  &ldquo;A university is fundamentally a dense physical network of shared human knowledge, transit, and computing power—not a collection of software subscriptions.&rdquo;
                </p>
              </div>

              <div className="flex justify-between items-center text-[10px] text-white/60 pt-2 border-t border-white/20">
                <span>SURVEILLANCE_INDEX: ZERO</span>
                <span>AUTONOMOUS_OPERATING_SYSTEM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Five Foundational Tenets */}
      <section className="w-full px-4 md:px-12 py-16 bg-surface-container-low border-b border-outline-variant">
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="uppercase text-secondary font-bold">SECTION 02 // GOVERNING ETHOS</span>
              <span className="text-outline">/ /</span>
              <span className="text-outline uppercase">AXIOMS OF THE PROTOCOL</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
              Five Foundational Tenets
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Every line of code and route topology within UniVerse answers directly to these five non-negotiable standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {tenets.map((t) => (
              <div
                key={t.num}
                className="bg-surface border border-outline-variant p-6 flex flex-col justify-between hover:-translate-y-1 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-outline-variant pb-2 mb-3 font-mono text-xs">
                    <span className="font-bold text-secondary">TENET // {t.num}</span>
                    <span className="material-symbols-outlined text-outline text-[18px]">{t.icon}</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-2 font-bold">{t.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{t.desc}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-dashed border-outline-variant font-mono text-[10px] text-outline">
                  {t.tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: System Comparison Architecture Matrix */}
      <section className="w-full px-4 md:px-12 py-16 bg-surface border-b border-outline-variant">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase text-secondary font-bold">
              SECTION 03 // ARCHITECTURAL DIVERGENCE
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
              UniVerse vs. Proprietary Commercial Monopolies
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              A transparent comparison between extractive campus SaaS vendors and autonomous student infrastructure.
            </p>
          </div>

          <div className="overflow-x-auto border border-outline-variant bg-surface">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant font-mono text-xs">
                  <th className="p-4 text-outline font-bold uppercase w-1/4">System Dimension</th>
                  <th className="p-4 text-outline font-bold uppercase w-3/8">Commercial Campus Portals</th>
                  <th className="p-4 text-secondary font-bold uppercase w-3/8">UniVerse Local Node</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-4 font-mono text-xs font-bold text-primary">{row.dim}</td>
                    <td className="p-4 text-on-surface-variant font-sans">{row.legacy}</td>
                    <td className="p-4 text-primary font-sans font-medium bg-surface-container-low/20">
                      {row.universe}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Protocol Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant px-4 md:px-12 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-on-surface-variant">
          <div className="flex items-center gap-3">
            <span className="font-bold text-primary uppercase">UniVerse Principles</span>
            <span className="text-outline">|</span>
            <span>Charter for Collegiate Sovereignty</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/impact')} className="hover:text-primary transition-colors">
              Impact Telemetry
            </button>
            <button onClick={() => navigate('/app')} className="text-secondary font-bold">
              Access System Node →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPrinciplesPage;
