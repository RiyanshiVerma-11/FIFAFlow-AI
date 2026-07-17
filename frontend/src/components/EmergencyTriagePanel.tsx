import React from 'react';
import { Flame, FileText } from 'lucide-react';

export interface IncidentData {
  id?: number;
  type?: string;
  severity?: string;
  description?: string;
  location?: string;
  status?: string;
  timestamp?: string;
  created_at?: string;
  ai_response_recommendation?: string;
  [key: string]: any;
}

export const EmergencyReportForm: React.FC<{
  newIncident: any;
  setNewIncident: React.Dispatch<React.SetStateAction<any>>;
  handleReportIncident: (e: React.FormEvent) => void;
  reportingIncident: boolean;
}> = ({ newIncident, setNewIncident, handleReportIncident, reportingIncident }) => (
  <section className="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-glow-crimson" aria-label="Report Emergency Incident Form">
    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-4 flex items-center gap-2">
      <Flame className="text-crimson h-4 w-4 animate-pulse" />
      Report Emergency Incident
    </h3>
    <form onSubmit={handleReportIncident} className="space-y-4 text-sm flex-1 flex flex-col justify-between">
      <div className="text-left">
        <label htmlFor="incident-type-select" className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wide">Incident Type</label>
        <select 
          id="incident-type-select"
          value={newIncident.type}
          onChange={(e) => setNewIncident((prev: any) => ({ ...prev, type: e.target.value }))}
          className="w-full mt-1.5 bg-white/50 dark:bg-neutral-900/50 border border-neutral-300 dark:border-white/10 px-3 py-2.5 rounded-lg text-xs text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-crimson/50 focus:border-crimson transition-all backdrop-blur-md"
        >
          <option value="medical">Medical Emergency</option>
          <option value="fire">Fire / Smoke hazard</option>
          <option value="violence">Violence / Brawl</option>
          <option value="suspicious_object">Suspicious Object</option>
          <option value="lost_child">Lost Child</option>
        </select>
      </div>

      <div className="text-left">
        <label htmlFor="incident-severity-select" className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wide">Severity Level</label>
        <select 
          id="incident-severity-select"
          value={newIncident.severity}
          onChange={(e) => setNewIncident((prev: any) => ({ ...prev, severity: e.target.value }))}
          className="w-full mt-1.5 bg-white/50 dark:bg-neutral-900/50 border border-neutral-300 dark:border-white/10 px-3 py-2.5 rounded-lg text-xs text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-crimson/50 focus:border-crimson transition-all backdrop-blur-md"
        >
          <option value="Low">Low (Informational)</option>
          <option value="Medium">Medium (Local Staff)</option>
          <option value="High">High (Urgent Response)</option>
          <option value="Critical">Critical (First Responders)</option>
        </select>
      </div>

      <div className="text-left">
        <label htmlFor="incident-description-textarea" className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wide">Description Details</label>
        <textarea
          id="incident-description-textarea"
          rows={2}
          value={newIncident.description}
          onChange={(e) => setNewIncident((prev: any) => ({ ...prev, description: e.target.value }))}
          placeholder="State seating rows, details..."
          className="w-full mt-1.5 p-3 bg-white/50 dark:bg-neutral-900/50 border border-neutral-300 dark:border-white/10 rounded-lg text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-crimson/50 focus:border-crimson transition-all backdrop-blur-md resize-none"
          required
        />
      </div>

      <button
        type="submit"
        disabled={reportingIncident}
        className="w-full py-2.5 mt-2 bg-crimson hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-all shadow-glow-crimson disabled:opacity-70"
      >
        {reportingIncident ? 'Generating AI Triage...' : 'Report Incident to Copilot'}
      </button>
    </form>
  </section>
);

export const EmergencyLogs: React.FC<{
  incidents: IncidentData[];
  generatePostReport: () => void;
  generatingReport: boolean;
  postMatchReport: string | null;
  setPostMatchReport: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({ incidents, generatePostReport, generatingReport, postMatchReport, setPostMatchReport }) => (
  <section className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-full shadow-glow-gold relative" aria-label="Active Emergency Logs">
    <div className="flex-1 flex flex-col min-h-0">
      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-4 flex-shrink-0">
        Active Emergency Logs & AI Advisories
      </h3>
      
      <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 mb-4" role="log" aria-live="polite">
        {incidents.length === 0 ? (
          <div className="text-xs text-neutral-500 text-center py-6 font-medium">No active incidents. AI systems nominal.</div>
        ) : (
          incidents.map(inc => (
            <div key={inc.id} className="p-3 bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/5 rounded-xl text-xs space-y-2 backdrop-blur-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-wider ${inc.severity === 'Critical' ? 'bg-crimson animate-pulse' : inc.severity === 'High' ? 'bg-gold' : 'bg-neutral-600'}`}>
                    {inc.severity}
                  </span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-100 ml-2 capitalize">{inc.type}</span>
                </div>
                <span className="text-[9px] font-semibold text-neutral-500">{new Date(inc.created_at || '').toLocaleTimeString()}</span>
              </div>
              <p className="text-neutral-700 dark:text-neutral-300 italic border-l-2 border-neutral-300 dark:border-neutral-600 pl-2 text-[11px]">"{inc.description}"</p>
              {inc.ai_response_recommendation && (
                <div className="mt-2 p-2 bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-500/20 rounded-lg">
                  <span className="font-bold text-blue-700 dark:text-blue-300 text-[9px] uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
                    AI Recommendation:
                  </span>
                  <p className="text-neutral-800 dark:text-neutral-200 mt-0.5 text-[10px] font-medium">{inc.ai_response_recommendation}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>

    <div className="border-t border-neutral-200 dark:border-white/10 pt-4 flex-shrink-0">
      <button
        onClick={generatePostReport}
        disabled={generatingReport}
        className="w-full py-2 bg-white/50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-700 border border-neutral-300 dark:border-white/10 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg transition-all backdrop-blur-md"
      >
        {generatingReport ? 'Analyzing history...' : 'Generate Post-Match Report'}
      </button>
    </div>

    {postMatchReport && (
      <div className="mt-3 p-3 bg-white/60 dark:bg-black/40 border border-green-200 dark:border-green-900/50 rounded-xl max-h-[150px] overflow-y-auto text-xs backdrop-blur-xl absolute bottom-0 left-0 right-0 shadow-lg z-50 animate-fade-in-up m-5">
        <div className="flex justify-between items-center border-b border-green-200 dark:border-green-900/50 pb-2 mb-2">
          <span className="font-bold text-green-700 dark:text-green-400 flex items-center gap-1.5">
            <FileText className="h-3 w-3" /> Report
          </span>
          <button onClick={() => setPostMatchReport(null)} className="text-neutral-500 hover:text-neutral-800 text-[10px] font-bold px-2 py-1 bg-neutral-200/50 rounded-md">
            Dismiss
          </button>
        </div>
        <pre className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap font-sans text-[10px]">{postMatchReport}</pre>
      </div>
    )}
  </section>
);
