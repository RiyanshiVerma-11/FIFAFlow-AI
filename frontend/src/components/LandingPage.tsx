import React from 'react';
import { 
  Shield, Zap, Users, Languages, Compass, Activity, ArrowRight
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface LandingPageProps {
  onEnterTerminal: () => void;
  tokenExists: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterTerminal, tokenExists }) => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0f0f0f] text-neutral-800 dark:text-neutral-200 transition-colors duration-300 relative overflow-hidden">
      
      {/* Premium Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:18px_18px] pointer-events-none" />

      {/* Ambient background glows for dark mode */}
      <div className="hidden dark:block absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="hidden dark:block absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#2A9D8F]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Top Bar */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between relative z-10 border-b border-neutral-200/60 dark:border-neutral-800/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-md shadow-blue-500/25">
            FF
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
              FIFAFlow <span className="text-blue-600 dark:text-blue-400">AI</span>
            </h1>
            <p className="text-[10px] text-neutral-450 dark:text-neutral-500 uppercase font-semibold tracking-wider leading-none">
              Operations Center
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-6">
          <button
            onClick={onEnterTerminal}
            className="px-4.5 py-2 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-white border border-neutral-250 dark:border-neutral-800 rounded-lg text-sm font-semibold transition-all hover:shadow-sm"
          >
            {tokenExists ? "Go to Dashboard" : "Access Terminal"}
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/50 rounded-full text-xs text-blue-700 dark:text-blue-300 font-semibold shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              FIFA World Cup 2026 Ready
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-neutral-900 dark:text-white">
                Next-Gen AI Stadium <br />
                <span className="bg-gradient-to-r from-blue-600 via-[#2A9D8F] to-[#F4A261] bg-clip-text text-transparent">
                  Operations & Digital Twin
                </span>
              </h2>
              <p className="text-base text-neutral-500 dark:text-neutral-455 leading-relaxed max-w-xl">
                An event-driven command intelligence platform bridging physical telemetry, predictive flow modeling, and Gemini GenAI to coordinate spectator security, route access, and operations dispatch.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={onEnterTerminal}
                className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 flex items-center gap-2.5"
              >
                {tokenExists ? "Open Operations Console" : "Launch Control Deck"}
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Trust factors */}
            <div className="pt-4 grid grid-cols-3 gap-6 border-t border-neutral-200 dark:border-neutral-800">
              <div>
                <div className="text-2xl font-black text-neutral-900 dark:text-white">82k+</div>
                <div className="text-[11px] text-neutral-450 dark:text-neutral-550 font-medium mt-0.5">Capacity Managed</div>
              </div>
              <div>
                <div className="text-2xl font-black text-neutral-900 dark:text-white">&lt;5s</div>
                <div className="text-[11px] text-neutral-450 dark:text-neutral-550 font-medium mt-0.5">Telemetry Sync Latency</div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#2A9D8F]">99.2%</div>
                <div className="text-[11px] text-neutral-450 dark:text-neutral-550 font-medium mt-0.5">Accessible Routing</div>
              </div>
            </div>
          </div>

          {/* Hero Right Visual Showcase */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-[500px]">
              {/* Decorative accent gradients behind panel */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-3xl opacity-5 dark:opacity-10 blur-xl pointer-events-none" />

              {/* Main Floating Terminal Dashboard Mockup */}
              <div className="glass-panel relative border border-neutral-250 dark:border-neutral-850/80 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md rounded-3xl p-6 shadow-xl space-y-6 hover:shadow-2xl transition-shadow duration-300">
                
                {/* Simulated Header */}
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#E63946]"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F4A261]"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-[#2A9D8F]"></span>
                    <span className="text-[10px] text-neutral-455 dark:text-neutral-500 font-mono ml-2">Console Live Telemetry</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/30 text-[#2A9D8F] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2A9D8F] animate-pulse"></span>
                    SYNCED
                  </span>
                </div>

                {/* Score Widget */}
                <div className="p-4 bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-neutral-450 dark:text-neutral-500 uppercase">Live Match State</div>
                    <div className="text-sm font-bold text-neutral-900 dark:text-white mt-1">USA vs Mexico</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-neutral-450 dark:text-neutral-500 uppercase">Attendance</div>
                    <div className="text-sm font-bold text-neutral-900 dark:text-white mt-1">79,450 / 82,500</div>
                  </div>
                </div>

                {/* Simulated Node Congestion list */}
                <div className="space-y-3">
                  <div className="text-[10px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wider">Active Gate Statuses</div>
                  
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-700 dark:text-neutral-350">Gate 3 (Congested)</span>
                      <span className="text-[#E63946] font-bold">92% Occupancy</span>
                    </div>
                    <div className="w-full bg-neutral-250 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#E63946] h-full rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-700 dark:text-neutral-350">Gate 5 (Clear)</span>
                      <span className="text-[#2A9D8F] font-bold">35% Occupancy</span>
                    </div>
                    <div className="w-full bg-neutral-250 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#2A9D8F] h-full rounded-full" style={{ width: '35%' }} />
                    </div>
                  </div>
                </div>

                {/* Flow Recommendation Alert bubble */}
                <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 rounded-2xl flex gap-3 text-left">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-900 dark:text-blue-350">Gemini Match Briefing Recommendation</h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-450 mt-1">
                      Redirect arriving metro crowds from congested Gate 3 to Gate 5. Redeploy 4 standby perimeter volunteers to outer crosswalks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="bg-white dark:bg-[#131313] py-20 border-t border-b border-neutral-200 dark:border-neutral-850 relative z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
            <h3 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
              Engineered for High-Density Stadium Logistics
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              FIFAFlow AI merges four core operational technologies to transform venue safety from reactive incident handling to predictive command coordination.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-white dark:bg-[#1e1e1e]/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-left space-y-4 shadow-sm hover:shadow-lg hover:border-blue-500/30 dark:hover:border-blue-400/30 hover:-translate-y-1 transition-all duration-300 group">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-950/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Compass className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-neutral-950 dark:text-white text-base">Digital Twin Telemetry</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-450 leading-relaxed">
                Interact with high-fidelity coordinate-linked venue nodes. Monitor live gate congestion, queuing delays, and transport terminal capacities in real time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-white dark:bg-[#1e1e1e]/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-left space-y-4 shadow-sm hover:shadow-lg hover:border-emerald-500/30 dark:hover:border-emerald-400/30 hover:-translate-y-1 transition-all duration-300 group">
              <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-[#2A9D8F] dark:text-[#2A9D8F] group-hover:bg-[#2A9D8F] group-hover:text-white transition-all duration-300">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-neutral-950 dark:text-white text-base">What-If Surges Simulator</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-455 leading-relaxed">
                Evaluate stadium resilience by simulating sudden scenarios like gate closures, rainfall, or metro delays. View predictive wait impacts and staff deployment guidance.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-white dark:bg-[#1e1e1e]/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-left space-y-4 shadow-sm hover:shadow-lg hover:border-amber-500/30 dark:hover:border-amber-400/30 hover:-translate-y-1 transition-all duration-300 group">
              <div className="h-10 w-10 bg-amber-100 dark:bg-amber-950/40 rounded-xl flex items-center justify-center text-[#F4A261] dark:text-[#F4A261] group-hover:bg-[#F4A261] group-hover:text-white transition-all duration-300">
                <Shield className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-neutral-950 dark:text-white text-base">Gemini Operations Assistant</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-455 leading-relaxed">
                Get context-aware operational advice, automated incident severity classifications, responder dispatch procedures, and comprehensive post-match analytics.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-white dark:bg-[#1e1e1e]/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-left space-y-4 shadow-sm hover:shadow-lg hover:border-purple-500/30 dark:hover:border-purple-400/30 hover:-translate-y-1 transition-all duration-300 group">
              <div className="h-10 w-10 bg-purple-100 dark:bg-purple-950/40 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <Languages className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-neutral-950 dark:text-white text-base">Inclusive & Usable Design</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-455 leading-relaxed">
                Empower volunteers and visitors with live audio navigators, dyslexia fonts, contrast scales, and SVG colorblindness matrices (Protanopia/Deuteranopia/Tritanopia).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RBAC Showcase Section */}
      <section className="py-20 max-w-7xl mx-auto px-6 relative z-10 border-b border-neutral-200 dark:border-neutral-900">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 px-3 py-1 bg-blue-50 dark:bg-blue-950/30 rounded-full border border-blue-200/40 dark:border-blue-900/40">Role-Based Access Control (RBAC)</span>
          <h3 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
            Customized Console Experiences per Role
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            FIFAFlow AI dynamically adapts its entire interface based on user authorization levels. Try logging in or registering under these default operational roles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Organizer */}
          <div className="glass-panel p-6 bg-white dark:bg-[#1e1e1e]/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col justify-between text-left transition-all duration-300 hover:shadow-lg border-l-4 border-l-[#1a73e8]">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-[#1a73e8] dark:text-[#a8c7fa]">
                  <Shield className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-base">Organizer</h4>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                Full-scale operations commander responsible for stadium flow resilience, telemetry, simulation testing, and environmental monitoring.
              </p>
              <div className="space-y-2 mb-6">
                <div className="text-[10px] uppercase font-bold text-neutral-400">Key Dashboard Features:</div>
                <ul className="text-xs space-y-1.5 text-neutral-600 dark:text-neutral-350">
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-blue-500 rounded-full"></span>
                    Command Telemetry & Map
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-blue-500 rounded-full"></span>
                    What-If Simulation Sandbox
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-blue-500 rounded-full"></span>
                    Sustainability Logs & AI Audits
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-blue-500 rounded-full"></span>
                    Post-Match Analysis reports
                  </li>
                </ul>
              </div>
            </div>
            <div className="p-3 bg-neutral-50 dark:bg-neutral-950/40 rounded-xl border border-neutral-200 dark:border-neutral-800/80 text-[11px] font-mono">
              <div className="text-neutral-400">DEMO CREDENTIALS:</div>
              <div className="font-bold text-neutral-800 dark:text-neutral-200 mt-1">Username: <span className="text-blue-600 dark:text-blue-400 font-bold">organizer</span></div>
              <div className="font-bold text-neutral-800 dark:text-neutral-200">Password: <span className="text-blue-600 dark:text-blue-400 font-bold">organizer123</span></div>
            </div>
          </div>

          {/* Card 2: Staff */}
          <div className="glass-panel p-6 bg-white dark:bg-[#1e1e1e]/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col justify-between text-left transition-all duration-300 hover:shadow-lg border-l-4 border-l-[#d93025]">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl text-[#d93025] dark:text-[#f28b82]">
                  <Activity className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-base">Stadium Staff</h4>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                Front-line safety supervisor handling queue delays, responding to visitor tickets, and dispatching medical or emergency units.
              </p>
              <div className="space-y-2 mb-6">
                <div className="text-[10px] uppercase font-bold text-neutral-400">Key Dashboard Features:</div>
                <ul className="text-xs space-y-1.5 text-neutral-600 dark:text-neutral-350">
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-red-500 rounded-full"></span>
                    Command Telemetry & Map
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-red-500 rounded-full"></span>
                    Incident Triage Dispatch
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-red-500 rounded-full"></span>
                    Emergency Status Probes
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-red-500 rounded-full"></span>
                    Interactive Copilot Chat
                  </li>
                </ul>
              </div>
            </div>
            <div className="p-3 bg-neutral-50 dark:bg-neutral-950/40 rounded-xl border border-neutral-200 dark:border-neutral-800/80 text-[11px] font-mono">
              <div className="text-neutral-400">DEMO CREDENTIALS:</div>
              <div className="font-bold text-neutral-800 dark:text-neutral-200 mt-1">Username: <span className="text-red-650 dark:text-red-400 font-bold">staff1</span></div>
              <div className="font-bold text-neutral-800 dark:text-neutral-200">Password: <span className="text-red-650 dark:text-red-400 font-bold">staff123</span></div>
            </div>
          </div>

          {/* Card 3: Volunteer */}
          <div className="glass-panel p-6 bg-white dark:bg-[#1e1e1e]/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col justify-between text-left transition-all duration-300 hover:shadow-lg border-l-4 border-l-[#f9ab00]">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-[#f9ab00] dark:text-[#fdd663]">
                  <Users className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-base">Volunteer</h4>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                Field marshal assisting with navigation, translation, reporting live arena events, and executing zone-specific checklists.
              </p>
              <div className="space-y-2 mb-6">
                <div className="text-[10px] uppercase font-bold text-neutral-400">Key Dashboard Features:</div>
                <ul className="text-xs space-y-1.5 text-neutral-600 dark:text-neutral-350">
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-amber-500 rounded-full"></span>
                    My Shift & Assigned Zone Tracker
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-amber-500 rounded-full"></span>
                    Field Task Checklist
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-amber-500 rounded-full"></span>
                    Quick Incident Reporter
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-amber-500 rounded-full"></span>
                    Wayfinder Routing & Translate
                  </li>
                </ul>
              </div>
            </div>
            <div className="p-3 bg-neutral-50 dark:bg-neutral-950/40 rounded-xl border border-neutral-200 dark:border-neutral-800/80 text-[11px] font-mono">
              <div className="text-neutral-450">DEMO CREDENTIALS:</div>
              <div className="font-bold text-neutral-800 dark:text-neutral-200 mt-1">Username: <span className="text-amber-600 dark:text-amber-400 font-bold">volunteer1</span></div>
              <div className="font-bold text-neutral-800 dark:text-neutral-200">Password: <span className="text-amber-600 dark:text-amber-400 font-bold">volunteer123</span></div>
            </div>
          </div>

          {/* Card 4: Fan */}
          <div className="glass-panel p-6 bg-white dark:bg-[#1e1e1e]/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col justify-between text-left transition-all duration-300 hover:shadow-lg border-l-4 border-l-[#2A9D8F]">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-[#2A9D8F]">
                  <Compass className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-base">Tournament Fan</h4>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                Stadium visitor checking live match details, concession queue delays, multilingual translations, and custom accessible pathways.
              </p>
              <div className="space-y-2 mb-6">
                <div className="text-[10px] uppercase font-bold text-neutral-400">Key Dashboard Features:</div>
                <ul className="text-xs space-y-1.5 text-neutral-600 dark:text-neutral-350">
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-[#2A9D8F] rounded-full"></span>
                    Live Match Score & Weather
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-[#2A9D8F] rounded-full"></span>
                    Gate & Concession Queue checks
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-[#2A9D8F] rounded-full"></span>
                    Accessible Route Wayfinding
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-[#2A9D8F] rounded-full"></span>
                    AI Visitor Help Desk Assistant
                  </li>
                </ul>
              </div>
            </div>
            <div className="p-3 bg-neutral-50 dark:bg-neutral-950/40 rounded-xl border border-neutral-200 dark:border-neutral-800/80 text-[11px] font-mono">
              <div className="text-neutral-450">DEMO CREDENTIALS:</div>
              <div className="font-bold text-neutral-800 dark:text-neutral-200 mt-1">Username: <span className="text-[#2A9D8F] font-bold">fan1</span></div>
              <div className="font-bold text-neutral-800 dark:text-neutral-200">Password: <span className="text-[#2A9D8F] font-bold">fan123</span></div>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="py-12 max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-neutral-455 dark:text-neutral-550 border-t border-neutral-200 dark:border-neutral-900 text-xs relative z-10">
        <div>&copy; 2026 FIFA World Cup. Operations Terminal.</div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0 font-medium">
          <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>Secure operations terminal. Powered by FIFAFlow Enterprise AI.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
