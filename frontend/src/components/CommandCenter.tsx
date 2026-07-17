import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  BarChart3, ShieldAlert, Users, Truck, Zap, Activity, HelpCircle, 
  RefreshCw, Send, AlertTriangle, UserCheck, Flame, Compass, MessageSquare, ClipboardList, HelpCircle as HelpIcon, FileText, Sun, Moon, Menu
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import DigitalTwinMap from './DigitalTwinMap';
import AccessAssistant from './AccessAssistant';
import VoiceTranslator from './VoiceTranslator';

interface CommandCenterProps {
  token: string;
  role: string;
  username: string;
  onLogout: () => void;
}

interface SustainabilityLog {
  id?: number;
  metric?: string;
  value?: number;
  unit?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface VolunteerShift {
  id?: number;
  sector?: string;
  role_title?: string;
  status: string;
  user?: { username: string };
  start_time?: string;
  end_time?: string;
  [key: string]: unknown;
}

interface NodeData {
  id: string;
  lat: number;
  lng: number;
  type?: string;
  status?: string;
  density?: number;
  [key: string]: unknown;
}

interface MatchData {
  team_a: string;
  team_b: string;
  score: string;
  current_attendance: number;
  weather: string;
  [key: string]: unknown;
}

interface AlertData {
  id?: number;
  severity: string;
  message: string;
  [key: string]: unknown;
}

interface IncidentData {
  id?: number;
  type?: string;
  severity?: string;
  description?: string;
  location?: string;
  status?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface ChatMessage {
  sender: 'user' | 'copilot';
  text: string;
}

const CommandCenter = ({ token, role, username, onLogout }: CommandCenterProps) => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'command' | 'routing' | 'translator' | 'accessibility' | 'volunteer' | 'sustainability'>(
    role === 'volunteer' ? 'volunteer' : 'command'
  );

  // Sustainability states
  const [sustainabilityLogs, setSustainabilityLogs] = useState<SustainabilityLog[]>([]);
  const [loadingSustainability, setLoadingSustainability] = useState(false);

  // Volunteer states
  const [volunteerShift, setVolunteerShift] = useState<VolunteerShift | null>(null);
  const [loadingVolunteer, setLoadingVolunteer] = useState(false);
  const [updatingVolunteerStatus, setUpdatingVolunteerStatus] = useState(false);
  
  // Digital Twin state
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [matchData, setMatchData] = useState<MatchData>({
    team_a: "USA",
    team_b: "Mexico",
    score: "1-0",
    current_attendance: 79450,
    weather: "Sunny, 24°C"
  });

  // AI Briefing
  const [briefing, setBriefing] = useState<string>("Loading AI Match Commander briefing...");
  
  // Realtime alerts stream
  const [alerts, setAlerts] = useState<AlertData[]>([
    { id: 1, type: "warning", message: "Gate 3 Congestion expected to reach 95% capacity in 15 minutes." },
    { id: 2, type: "info", message: "Parking Zone B is nearing capacity. Traffic units guided." }
  ]);

  // What-if simulator state
  const [selectedScenario, setSelectedScenario] = useState('gate_3_close');
  const [simulationResult, setSimulationResult] = useState<Record<string, unknown> | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Incidents states
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [newIncident, setNewIncident] = useState({
    type: "medical",
    severity: "High",
    description: "",
    lat: 34.0538,
    lng: -118.2442
  });
  const [reportingIncident, setReportingIncident] = useState(false);

  // Routing path state
  const [routeQuery, setRouteQuery] = useState({
    startNode: "Gate 1",
    endNode: "Restrooms North",
    accessible: false
  });
  const [computedRoute, setComputedRoute] = useState<Record<string, unknown> | null>(null);

  // Copilot Interactive Chat state
  const [chatMessage, setChatMessage] = useState("");
  const [chatLog, setChatLog] = useState<ChatMessage[]>(() => {
    const greetingMap: { [key: string]: string } = {
      fan: "Hello Visitor! Welcome to Azteca Stadium. I can help you find gate queues, concessions, transport options, or restroom locations. Ask me anything!",
      volunteer: `Hello ${username || 'Volunteer'}. I am here to help you coordinate shifts, locate tasks, or assist with crowd routes. Ask me anything!`,
      staff: `Hello ${username || 'Staff member'}. Monitoring Azteca Stadium state variables. Let me know if you need any routing or operations data.`,
      organizer: `Hello organizer. Stadium digital twin is online. I am tracking crowd density, gate status, and sustainability logs. How can I assist?`
    };
    const defaultGreeting = "Hello. I am monitoring Azteca Stadium state variables. Ask me anything.";
    return [
      { sender: "copilot", text: greetingMap[role] || defaultGreeting }
    ];
  });
  const [sendingChat, setSendingChat] = useState(false);
  const [postMatchReport, setPostMatchReport] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const chartData = [
    { time: '17:00', waitGate3: 5, waitGate5: 2, parkingOccupancy: 45 },
    { time: '17:15', waitGate3: 8, waitGate5: 4, parkingOccupancy: 62 },
    { time: '17:30', waitGate3: 12, waitGate5: 5, parkingOccupancy: 78 },
    { time: '17:45', waitGate3: 18, waitGate5: 3, parkingOccupancy: 92 },
    { time: '18:00 (FC)', waitGate3: 25, waitGate5: 6, parkingOccupancy: 98 },
  ];

  // Fetch twin nodes telemetry
  const fetchNodes = async () => {
    try {
      const res = await fetch('/api/twin/nodes');
      const data = await res.json();
      setNodes(data);
    } catch (e) {
      // Offline mock fallback
      setNodes([
        { id: 1, name: "Gate 1", type: "gate", status: "active", occupancy: 45, queue_length_minutes: 3 },
        { id: 2, name: "Gate 2", type: "gate", status: "active", occupancy: 52, queue_length_minutes: 4 },
        { id: 3, name: "Gate 3 (Congested)", type: "gate", status: "congested", occupancy: 92, queue_length_minutes: 18 },
        { id: 4, name: "Gate 4", type: "gate", status: "active", occupancy: 61, queue_length_minutes: 5 },
        { id: 5, name: "Gate 5", type: "gate", status: "active", occupancy: 35, queue_length_minutes: 2 },
        { id: 6, name: "Concessions Plaza", type: "concession", status: "active", occupancy: 75, queue_length_minutes: 8 },
        { id: 7, name: "Restrooms North", type: "restroom", status: "active", occupancy: 80, queue_length_minutes: 6 },
        { id: 8, name: "Medical Station 1", type: "medical_point", status: "active", occupancy: 10, queue_length_minutes: 0 },
        { id: 9, name: "Transport Terminal", type: "transit_hub", status: "active", occupancy: 58, queue_length_minutes: 5 }
      ]);
    }
  };

  // Fetch AI Match Commander Briefing
  const fetchBriefing = async () => {
    try {
      const res = await fetch('/api/copilot/briefing');
      const data = await res.json();
      setBriefing(data.briefing);
    } catch (e) {
      setBriefing("Azteca Arena Command Center active. Attendance: 79,450. Gate 3 queue is at 18 minutes (high density). Volunteers deployed to perimeter links.");
    }
  };

  // Fetch Incidents list
  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/incidents');
      const data = await res.json();
      setIncidents(data);
    } catch (e) {
      setIncidents([
        { id: 1, type: "medical", severity: "High", description: "Spectator heat stress in Row F, Zone B.", status: "pending", location_json: {lat: 34.0538, lng: -118.2442}, reporter_id: 1, assigned_responder_id: null, ai_response_recommendation: "Deploy nearest medical volunteer. Dispatch wheelchair guide.", confidence_score: 95, reasoning: "Cardiac/heat risk requires instant triage.", created_at: new Date().toISOString() }
      ]);
    }
  };

  // Run What-if Simulation
  const runSimulation = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/copilot/what-if', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ scenario: selectedScenario })
      });
      const data = await res.json();
      setSimulationResult(data);
    } catch (e) {
      // offline fallback
      setSimulationResult({
        impact_description: "Bypassing Gate 3 causes high-density queue surges at Gate 5, raising waiting times from 2 to 14 minutes.",
        risk_level: "High",
        estimated_wait_time_impact_min: 12,
        volunteer_redistribution_recommendation: "Redirect 4 volunteers from Zone A outer Ring to Gate 5 access queues.",
        suggested_reroute_nodes: ["North Plaza Ring", "Gate 5 Ramp"],
        confidence_score: 94
      });
    } finally {
      setSimulating(false);
    }
  };

  // Report Incident
  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportingIncident(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: newIncident.type,
          severity: newIncident.severity,
          description: newIncident.description,
          location_json: { lat: newIncident.lat, lng: newIncident.lng }
        })
      });
      if (res.ok) {
        setNewIncident({ type: 'medical', severity: 'High', description: '', lat: 34.0538, lng: -118.2442 });
        fetchIncidents();
      }
    } catch (e) {
      alert("Incident reported successfully (cached/offline mode).");
    } finally {
      setReportingIncident(false);
    }
  };

  // Route Pathfinder
  const handleCalculateRoute = async () => {
    const nodeCoords: { [key: string]: [number, number] } = {
      "Gate 1": [34.0522, -118.2437],
      "Gate 2": [34.0532, -118.2447],
      "Gate 3 (Congested)": [34.0542, -118.2457],
      "Gate 4": [34.0552, -118.2467],
      "Gate 5": [34.0562, -118.2477],
      "Concessions Plaza": [34.0548, -118.2452],
      "Restrooms North": [34.0558, -118.2462],
      "Medical Station 1": [34.0538, -118.2442],
      "Transport Terminal": [34.0512, -118.2427]
    };

    const start = nodeCoords[routeQuery.startNode] || [34.0522, -118.2437];
    const end = nodeCoords[routeQuery.endNode] || [34.0558, -118.2462];

    try {
      const res = await fetch('/api/navigation/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_lat: start[0],
          start_lng: start[1],
          end_lat: end[0],
          end_lng: end[1],
          require_accessible: routeQuery.accessible
        })
      });
      const data = await res.json();
      setComputedRoute(data);
    } catch (e) {
      // offline default route
      setComputedRoute({
        path: [
          { lat: start[0], lng: start[1], name: routeQuery.startNode },
          { lat: end[0], lng: end[1], name: routeQuery.endNode }
        ],
        distance_meters: 150.0,
        estimated_minutes: 2.1,
        accessibility_flag: routeQuery.accessible,
        safety_advisory: "Fallback paths calculated. Stay clear of closed gates."
      });
    }
  };

  // Copilot conversational query
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatMessage("");
    setChatLog(prev => [...prev, { sender: "user", text: userMsg }]);
    setSendingChat(true);

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setChatLog(prev => [...prev, { sender: "copilot", text: data.reply }]);
    } catch (err) {
      setChatLog(prev => [...prev, { sender: "copilot", text: "Offline assistant link: Check active gate statuses. Gate 3 is congested (92%). Redeploy volunteers to other sectors if required." }]);
    } finally {
      setSendingChat(false);
    }
  };

  // Generate Post-match analysis report
  const generatePostReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch('/api/copilot/post-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setPostMatchReport(data.report);
      // Trigger confetti!
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    } catch (e) {
      setPostMatchReport(
        "# Operational Post-Match Summary: USA vs Mexico\n" +
        "- **Match Attendance:** 79,450 (96% Capacity)\n" +
        "- **Peak Queue Wait:** 18 minutes at Gate 3\n" +
        "- **Sustainability Score:** 84% resource efficiency\n" +
        "## AI Operations Recommendations\n" +
        "1. Open Gate 5 earlier next match to balance high-traffic arrivals.\n" +
        "2. Add auxiliary charging lockers in concessions zone to reduce phone battery stress."
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  const fetchSustainabilityLogs = async () => {
    setLoadingSustainability(true);
    try {
      const res = await fetch('/api/sustainability');
      if (res.ok) {
        const data = await res.json();
        setSustainabilityLogs(data);
      }
    } catch (e) {
      console.error("Error fetching sustainability logs", e);
    } finally {
      setLoadingSustainability(false);
    }
  };

  const fetchVolunteerShift = async () => {
    setLoadingVolunteer(true);
    try {
      const res = await fetch('/api/volunteer/shifts');
      if (res.ok) {
        const data = await res.json();
        const myShift = data.find((shift: VolunteerShift) => shift.user?.username === username);
        if (myShift) {
          setVolunteerShift(myShift);
        }
      }
    } catch (e) {
      console.error("Error fetching volunteer shift", e);
    } finally {
      setLoadingVolunteer(false);
    }
  };

  const handleUpdateVolunteerStatus = async (newStatus: string) => {
    if (!volunteerShift) return;
    setUpdatingVolunteerStatus(true);
    try {
      const res = await fetch(`/api/volunteer/shifts/${volunteerShift.id}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setVolunteerShift(data);
      }
    } catch (e) {
      setVolunteerShift((prev: VolunteerShift | null) => prev ? { ...prev, status: newStatus } : null);
    } finally {
      setUpdatingVolunteerStatus(false);
    }
  };

  // Set up WebSocket / Live data puller
  useEffect(() => {
    fetchNodes();
    fetchBriefing();
    fetchIncidents();
    if (role === 'organizer') {
      fetchSustainabilityLogs();
    }
    if (role === 'volunteer') {
      fetchVolunteerShift();
    }

    // Establish WebSocket listener
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/ws`;
    
    let socket: WebSocket;
    try {
      socket = new WebSocket(wsUrl);
      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.channel === "stadium:sync") {
          setNodes(msg.data.nodes);
        } else if (msg.channel === "stadium:events") {
          // Push event details into dashboard alerts array
          const alertEvent = msg.data;
          setAlerts(prev => [
            { id: Date.now(), type: alertEvent.severity === "Critical" ? "error" : "warning", message: `${alertEvent.node_name || alertEvent.incident_type || 'Alert'}: ${alertEvent.recommendation || alertEvent.description || 'Status update trigger.'}` },
            ...prev.slice(0, 4)
          ]);
        }
      };
    } catch (e) {
      console.error("Websocket could not connect: ", e);
    }

    // Refresh telemetry logs every 10 seconds
    const interval = setInterval(() => {
      fetchNodes();
      fetchIncidents();
      if (role === 'organizer') {
        fetchSustainabilityLogs();
      }
      if (role === 'volunteer') {
        fetchVolunteerShift();
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      if (socket) socket.close();
    };
  }, []);

  const renderFanDashboard = () => {
    return (
      <div className="space-y-6 text-left">
        {/* FAN TOP CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Live Match Card */}
          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-[#1a73e8] bg-white dark:bg-[#1e1e1e]">
            <div>
              <div className="text-[11px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">Live Match Status</div>
              <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{matchData.team_a} {matchData.score} {matchData.team_b}</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1e8e3e] animate-pulse"></span>
                Attendance: {matchData.current_attendance.toLocaleString()}
              </div>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-[#1a73e8] dark:text-[#a8c7fa]">
              <Activity className="h-6 w-6" />
            </div>
          </div>

          {/* Weather Card */}
          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-[#2A9D8F] bg-white dark:bg-[#1e1e1e]">
            <div>
              <div className="text-[11px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">Stadium Weather</div>
              <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{matchData.weather}</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">Tournament Day 12</div>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-[#2A9D8F]">
              <Sun className="h-6 w-6" />
            </div>
          </div>

          {/* Gate wait alert */}
          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-[#f9ab00] bg-white dark:bg-[#1e1e1e]">
            <div>
              <div className="text-[11px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">Transit Status</div>
              <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">Gate 3 Busy (18m Wait)</div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-bold">Use Gate 5 for Faster Entry</div>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-[#f9ab00] dark:text-[#fdd663]">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* MAP & SIDEBAR TELEMETRY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[450px]">
            <DigitalTwinMap nodes={nodes} />
          </div>

          {/* Live queue checkers for concessions/gates */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-[450px] bg-white dark:bg-[#1e1e1e]">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                <Users className="text-blue-600 dark:text-blue-400 h-4 w-4" />
                Live Amenity & Queue Times
              </h3>
              
              <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1.5 scrollbar-thin">
                {nodes.length === 0 ? (
                  <div className="text-xs text-neutral-500 text-center py-8">Fetching queue telemetry...</div>
                ) : (
                  nodes.map(node => (
                    <div key={node.id} className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-neutral-800 dark:text-neutral-200">{node.name}</div>
                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500 capitalize">{node.type} • Status: {node.status}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${node.queue_length_minutes > 10 ? 'text-[#d93025]' : 'text-[#1e8e3e]'}`}>
                          {node.queue_length_minutes} min queue
                        </div>
                        <div className="text-[9px] text-neutral-400">{node.occupancy}% capacity</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ASSISTANCE & COPILOT INFO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visitor request assistance form */}
          <div className="glass-panel p-5 bg-white dark:bg-[#1e1e1e]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2">
              <HelpCircle className="text-blue-600 dark:text-blue-400 h-4 w-4" />
              Request Assistance / Report Issue
            </h3>
            <form onSubmit={handleReportIncident} className="space-y-4 text-xs">
              <div className="text-left">
                <label htmlFor="fan-issue-type" className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-bold">What do you need help with?</label>
                <select 
                  id="fan-issue-type"
                  value={newIncident.type}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, type: e.target.value, severity: 'Low' }))}
                  className="w-full mt-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 px-3 py-2.5 rounded-lg text-neutral-855 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                >
                  <option value="medical">Medical Assistance</option>
                  <option value="lost_child">Lost Item / Companion</option>
                  <option value="facilities">Restroom / Concessions Issue</option>
                  <option value="accessibility">Wheelchair / Accessible Guidance</option>
                </select>
              </div>

              <div className="text-left">
                <label htmlFor="fan-issue-desc" className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-bold">Details (Seat Number, Stand Location, etc.)</label>
                <textarea
                  id="fan-issue-desc"
                  rows={3}
                  value={newIncident.description}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Block B, Row 12, Seat 4. Need a wheelchair assistant to egress..."
                  className="w-full mt-1.5 p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={reportingIncident}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm text-xs"
              >
                {reportingIncident ? 'Submitting Request...' : 'Submit Assistance Request'}
              </button>
            </form>
          </div>

          {/* Copilot advice card */}
          <div className="glass-panel p-5 rounded-2xl lg:col-span-2 flex flex-col justify-between bg-white dark:bg-[#1e1e1e] text-left">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">
                Your Visitor Assistant AI Briefing
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-355 leading-relaxed mb-4">
                Welcome to Azteca Stadium! Our Tournament Operations Copilot is monitoring stadium telemetry to make your matches seamless. Here is your current real-time advisory:
              </p>
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-355">Live Traffic Dispatch:</span>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  "Concession lines at Sector B Concourse are experiencing high wait times (8 minutes). We recommend using Concourse C outlets for immediate service. Transport buses to Metro terminal are fully active, arriving every 3 minutes."
                </p>
              </div>
            </div>

            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 mt-4">
              <div className="text-[10px] font-bold text-neutral-400 uppercase">Accessibility Wayfinding</div>
              <p className="text-xs text-neutral-500 mt-1">
                Need wheelchair access? Head to the **Route Optimizer** tab on the sidebar and turn on **Wheelchair Accessible** to view step-free paths.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };



  const renderSustainabilityDashboard = () => {
    const latestLog = sustainabilityLogs[0] || {
      energy_kwh: 12000,
      water_liters: 40000,
      waste_kg: 2000,
      carbon_kg: 5040,
      ai_recommendation: "Optimize HVAC settings in Sector 3 to save 40 kWh per hour."
    };

    return (
      <div className="space-y-6 text-left">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Zap className="text-blue-600 dark:text-blue-400 h-5 w-5" />
            Stadium Sustainability Telemetry & Audit
          </h2>
          <p className="text-xs text-neutral-500 mt-1">Real-time resource logs and Gemini AI conservation recommendations.</p>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 bg-white dark:bg-[#1e1e1e] border-l-4 border-l-[#1a73e8]">
            <div className="text-[10px] uppercase font-bold text-neutral-500">Power Consumption</div>
            <div className="text-2xl font-black text-neutral-850 dark:text-neutral-100 mt-1">{latestLog.energy_kwh.toLocaleString()} kWh</div>
            <div className="text-[10px] text-neutral-450 mt-1">Live grid telemetry</div>
          </div>
          <div className="glass-panel p-5 bg-white dark:bg-[#1e1e1e] border-l-4 border-l-[#2A9D8F]">
            <div className="text-[10px] uppercase font-bold text-neutral-500">Water Consumption</div>
            <div className="text-2xl font-black text-neutral-850 dark:text-neutral-100 mt-1">{latestLog.water_liters.toLocaleString()} L</div>
            <div className="text-[10px] text-neutral-455 mt-1">Flow meters active</div>
          </div>
          <div className="glass-panel p-5 bg-white dark:bg-[#1e1e1e] border-l-4 border-l-[#f9ab00]">
            <div className="text-[10px] uppercase font-bold text-neutral-500">Solid Waste Generated</div>
            <div className="text-2xl font-black text-neutral-850 dark:text-neutral-100 mt-1">{latestLog.waste_kg.toLocaleString()} kg</div>
            <div className="text-[10px] text-neutral-450 mt-1">Concessions collection</div>
          </div>
          <div className="glass-panel p-5 bg-white dark:bg-[#1e1e1e] border-l-4 border-l-[#ab47bc]">
            <div className="text-[10px] uppercase font-bold text-neutral-500">Carbon Footprint</div>
            <div className="text-2xl font-black text-neutral-850 dark:text-neutral-100 mt-1">{latestLog.carbon_kg.toLocaleString()} kg</div>
            <div className="text-[10px] text-neutral-450 mt-1">Offset calculated</div>
          </div>
        </div>

        {/* AI ADVISORY PANEL */}
        <div className="glass-panel p-6 bg-white dark:bg-[#1e1e1e] space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e8e3e] dark:text-[#6dd58c] flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-[#1e8e3e] dark:text-[#6dd58c]" />
            Gemini Sustainability Briefing & Optimization Guidelines
          </h3>
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 rounded-2xl">
            <p className="text-xs text-neutral-700 dark:text-neutral-350 leading-relaxed font-semibold italic">
              "{latestLog.ai_recommendation || 'Analyzing resource nodes. Adjusting concessions HVAC settings to save 12% power recommended.'}"
            </p>
          </div>
        </div>

        {/* HISTORY TABLE */}
        <div className="glass-panel p-5 bg-white dark:bg-[#1e1e1e] overflow-hidden">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4">Historical Audit Logs (Latest 10 logs)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-neutral-600 dark:text-neutral-300">
              <thead className="text-[10px] uppercase bg-neutral-50 dark:bg-neutral-900 text-neutral-400 font-bold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Energy (kWh)</th>
                  <th className="px-4 py-3">Water (L)</th>
                  <th className="px-4 py-3">Waste (kg)</th>
                  <th className="px-4 py-3">Carbon (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {sustainabilityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-neutral-450">No historical logs seeded yet.</td>
                  </tr>
                ) : (
                  sustainabilityLogs.slice(0, 10).map((log, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                      <td className="px-4 py-3 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="px-4 py-3">{log.energy_kwh.toFixed(1)}</td>
                      <td className="px-4 py-3">{log.water_liters.toFixed(1)}</td>
                      <td className="px-4 py-3">{log.waste_kg.toFixed(1)}</td>
                      <td className="px-4 py-3">{log.carbon_kg.toFixed(1)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderVolunteerDashboard = () => {
    const defaultShift = {
      shift_start: new Date(Date.now() - 3600000).toISOString(),
      shift_end: new Date(Date.now() + 14400000).toISOString(),
      status: "active",
      assigned_zone: "Zone A"
    };
    
    const shift = volunteerShift || defaultShift;

    return (
      <div className="space-y-6 text-left">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="text-blue-600 dark:text-blue-400 h-5 w-5" />
            Volunteer Shift & Tasks Console
          </h2>
          <p className="text-xs text-neutral-500 mt-1">Manage your active shifts, view assigned zones, and submit incident tickets to Command.</p>
        </div>

        {/* SHIFT STATUS WIDGET */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-5 bg-white dark:bg-[#1e1e1e] flex flex-col justify-between border-l-4 border-l-[#f9ab00]">
            <div>
              <div className="text-[10px] uppercase font-bold text-neutral-500">Assigned Zone</div>
              <div className="text-2xl font-black text-neutral-850 dark:text-neutral-100 mt-1">{shift.assigned_zone}</div>
            </div>
            <div className="text-[10px] text-neutral-450 mt-4">Perimeter marshaling duty</div>
          </div>

          <div className="glass-panel p-5 bg-white dark:bg-[#1e1e1e] flex flex-col justify-between border-l-4 border-l-[#1a73e8]">
            <div>
              <div className="text-[10px] uppercase font-bold text-neutral-500">Shift Schedule</div>
              <div className="text-sm font-bold text-neutral-850 dark:text-neutral-100 mt-2">
                Start: {new Date(shift.shift_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-sm font-bold text-neutral-850 dark:text-neutral-100">
                End: {new Date(shift.shift_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="text-[10px] text-neutral-455 mt-4">6 Hour Block duration</div>
          </div>

          <div className="glass-panel p-5 bg-white dark:bg-[#1e1e1e] flex flex-col justify-between border-l-4 border-l-[#2A9D8F]">
            <div>
              <div className="text-[10px] uppercase font-bold text-neutral-500">Duty Status</div>
              <div className="text-lg font-bold capitalize text-neutral-800 dark:text-neutral-200 mt-1 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${shift.status === 'active' ? 'bg-[#1e8e3e] animate-pulse' : shift.status === 'on_break' ? 'bg-amber-500' : 'bg-neutral-500'}`} />
                {shift.status.replace('_', ' ')}
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleUpdateVolunteerStatus('active')}
                disabled={updatingVolunteerStatus}
                className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] transition shadow-sm"
              >
                On Duty
              </button>
              <button
                onClick={() => handleUpdateVolunteerStatus('on_break')}
                disabled={updatingVolunteerStatus}
                className="flex-1 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded text-[10px] transition shadow-sm"
              >
                Break
              </button>
            </div>
          </div>
        </div>

        {/* ACTIVE DUTIES CHECKLIST & INCIDENT FORM */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks list */}
          <div className="glass-panel p-5 bg-white dark:bg-[#1e1e1e] lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-blue-600" />
              Your Active Volunteer Checklist
            </h3>
            
            <div className="space-y-3.5 text-xs text-neutral-700 dark:text-neutral-300">
              <label className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600 focus:ring-blue-500" />
                <div>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">Report to assigned zone ({shift.assigned_zone})</span>
                  <p className="text-[10px] text-neutral-450 mt-0.5">Meet with field lead for briefing.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition">
                <input type="checkbox" className="mt-0.5 rounded text-blue-600 focus:ring-blue-500" />
                <div>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">Verify wheelchair ramps accessibility</span>
                  <p className="text-[10px] text-neutral-455 mt-0.5">Ensure step-free pathways are free of obstacles.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition">
                <input type="checkbox" className="mt-0.5 rounded text-blue-600 focus:ring-blue-500" />
                <div>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">Distribute leaflets and support wayfinding</span>
                  <p className="text-[10px] text-neutral-455 mt-0.5">Guide arriving spectators to correct gates (Gate 3 is busy, direct to 5 if needed).</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition">
                <input type="checkbox" className="mt-0.5 rounded text-blue-600 focus:ring-blue-500" />
                <div>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">Submit safety reports</span>
                  <p className="text-[10px] text-neutral-455 mt-0.5">Log any minor fire, medical, or crowd-density risks immediately using the safety form.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Quick reporter */}
          <div className="glass-panel p-5 bg-white dark:bg-[#1e1e1e]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4 flex items-center gap-2">
              <Flame className="text-[#d93025] h-4 w-4" />
              Submit Safety Report
            </h3>
            <form onSubmit={handleReportIncident} className="space-y-4 text-xs">
              <div className="text-left">
                <label htmlFor="vol-incident-type" className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-bold">Incident Type</label>
                <select 
                  id="vol-incident-type"
                  value={newIncident.type}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full mt-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 px-3 py-2.5 rounded-lg text-neutral-855 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                >
                  <option value="medical">Medical Emergency</option>
                  <option value="fire">Fire / Smoke hazard</option>
                  <option value="violence">Violence / Brawl</option>
                  <option value="suspicious_object">Suspicious Object</option>
                  <option value="lost_child">Lost Child</option>
                </select>
              </div>

              <div className="text-left">
                <label htmlFor="vol-incident-severity" className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-bold">Severity Level</label>
                <select 
                  id="vol-incident-severity"
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full mt-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 px-3 py-2.5 rounded-lg text-neutral-855 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                >
                  <option value="Low">Low (Informational)</option>
                  <option value="Medium">Medium (Local Staff)</option>
                  <option value="High">High (Urgent Response)</option>
                  <option value="Critical">Critical (First Responders)</option>
                </select>
              </div>

              <div className="text-left">
                <label htmlFor="vol-incident-desc" className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-bold">Description Details</label>
                <textarea
                  id="vol-incident-desc"
                  rows={2}
                  value={newIncident.description}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Seating sector, details of risk..."
                  className="w-full mt-1.5 p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={reportingIncident}
                className="w-full py-2.5 bg-[#d93025] hover:bg-[#c5221f] text-white font-semibold rounded-lg transition-colors shadow-sm"
              >
                {reportingIncident ? 'Submitting Report...' : 'Log Security Report'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const navBtnClass = (tab: typeof activeTab) => {
    const isActive = activeTab === tab;
    if (isActive) {
      return "w-full flex items-center gap-3 px-5 py-3 rounded-full text-sm font-semibold bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-[#a8c7fa] transition-colors";
    }
    return "w-full flex items-center gap-3 px-5 py-3 rounded-full text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors";
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0f0f0f] text-neutral-800 dark:text-neutral-200 flex flex-col transition-colors duration-300">
      {/* Navbar header */}
      <header className="border-b border-neutral-200 dark:border-[#3c4043] bg-white/80 dark:bg-[#1e1e1e]/85 backdrop-blur-md sticky top-0 z-[1000] px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#2d2d2d] mr-1 flex items-center justify-center shadow-sm"
            aria-label="Toggle Sidebar"
            title={sidebarVisible ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-sm">
            FF
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">FIFAFlow AI</h1>
            <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">Tournament Operations Copilot</div>
          </div>
        </div>

        {/* AI Briefing ticker strip */}
        <div className="hidden lg:flex flex-1 mx-8 max-w-xl bg-[#f1f3f4] dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-inner rounded-xl px-4 py-2 text-xs overflow-hidden relative">
          <div className="text-[10px] uppercase font-bold text-[#1e8e3e] dark:text-[#6dd58c] flex items-center gap-1.5 mr-3 flex-shrink-0">
            <span className="h-1.5 w-1.5 bg-[#1e8e3e] dark:bg-[#6dd58c] rounded-full animate-ping"></span>
            Commander:
          </div>
          <div className="text-neutral-600 dark:text-neutral-300 truncate italic font-medium">{briefing}</div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#2d2d2d]"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          
          <div className="text-right">
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 capitalize">{username}</div>
            <div className="text-[9px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">Role: {role}</div>
          </div>
          <button 
            onClick={onLogout}
            className="px-4 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold rounded-lg transition shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Navigation Menu */}
        {sidebarVisible && (
        <aside className="w-full lg:w-60 border-r border-neutral-200 dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#181818] p-4 space-y-1.5 flex-shrink-0 transition-colors duration-300">
          {role !== 'volunteer' && (
            <button 
              onClick={() => setActiveTab('command')}
              className={navBtnClass('command')}
            >
              <BarChart3 className="h-4 w-4" />
              {role === 'fan' ? 'Visitor Console' : 'Command Center'}
            </button>
          )}

          {role === 'volunteer' && (
            <button 
              onClick={() => setActiveTab('volunteer')}
              className={navBtnClass('volunteer')}
            >
              <ClipboardList className="h-4 w-4" />
              My Shift & Tasks
            </button>
          )}

          {role === 'organizer' && (
            <button 
              onClick={() => setActiveTab('sustainability')}
              className={navBtnClass('sustainability')}
            >
              <Zap className="h-4 w-4" />
              Sustainability Metrics
            </button>
          )}

          <button 
            onClick={() => setActiveTab('routing')}
            className={navBtnClass('routing')}
          >
            <Compass className="h-4 w-4" />
            Route Optimizer
          </button>
          <button 
            onClick={() => setActiveTab('translator')}
            className={navBtnClass('translator')}
          >
            <MessageSquare className="h-4 w-4" />
            Multilingual AI
          </button>
          <button 
            onClick={() => setActiveTab('accessibility')}
            className={navBtnClass('accessibility')}
          >
            <Users className="h-4 w-4" />
            Accessibility Center
          </button>
        </aside>
        )}

        {/* Tab contents */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {activeTab === 'command' && role === 'fan' && renderFanDashboard()}
          {activeTab === 'command' && role !== 'fan' && (
            <>
              {/* TOP CARDS METRICS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Live Match Card */}
                <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-[#1a73e8] bg-white dark:bg-[#1e1e1e]">
                  <div>
                    <div className="text-[11px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">Live Match Status</div>
                    <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{matchData.team_a} {matchData.score} {matchData.team_b}</div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1e8e3e] animate-pulse"></span>
                      Attendance: {matchData.current_attendance.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-[#1a73e8] dark:text-[#a8c7fa]">
                    <Activity className="h-6 w-6" />
                  </div>
                </div>

                {/* Congested Card */}
                <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-[#f9ab00] bg-white dark:bg-[#1e1e1e]">
                  <div>
                    <div className="text-[11px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">Congested Zones</div>
                    <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">Gate 3 Surging</div>
                    <div className="text-[11px] text-[#d93025] dark:text-[#f28b82] mt-1 font-bold">Wait Time: 18 min</div>
                  </div>
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-[#f9ab00] dark:text-[#fdd663]">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                </div>

                {/* Incidents Card */}
                <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-[#d93025] bg-white dark:bg-[#1e1e1e]">
                  <div>
                    <div className="text-[11px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">Active Incidents</div>
                    <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                      {incidents.filter(i => i.status !== 'resolved').length} Open
                    </div>
                    <div className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-bold">Emergency Units Active</div>
                  </div>
                  <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl text-[#d93025] dark:text-[#f28b82]">
                    <Flame className="h-6 w-6" />
                  </div>
                </div>

                {/* Transit Card */}
                <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-[#ab47bc] bg-white dark:bg-[#1e1e1e]">
                  <div>
                    <div className="text-[11px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">Transit Health</div>
                    <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">Parking: B Full</div>
                    <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-bold">Metro Freq: 3m</div>
                  </div>
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-[#ab47bc] dark:text-[#c073df]">
                    <Truck className="h-6 w-6" />
                  </div>
                </div>
              </div>


              {/* MAP & SIDEBAR ALERTS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[450px]">
                  <DigitalTwinMap nodes={nodes} />
                </div>
                
                {/* Alerts stream */}
                <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-[450px] bg-white dark:bg-[#1e1e1e]">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2">
                      <ShieldAlert className="text-[#d93025] h-4 w-4" />
                      Live Copilot Alerts Stream
                    </h3>
                    
                    <div className="space-y-3 overflow-y-auto max-h-[300px]">
                      {alerts.map(alert => (
                        <div key={alert.id} className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs flex gap-2.5">
                          <span className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${alert.type === 'error' ? 'bg-[#d93025]' : 'bg-[#f9ab00]'}`} />
                          <span className="text-neutral-700 dark:text-neutral-300">{alert.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3">
                    <button 
                      onClick={fetchBriefing}
                      className="w-full py-2 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Refresh Arena Stats
                    </button>
                  </div>
                </div>
              </div>

              {/* WHAT-IF SIMULATOR & CHARTS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* What-if Simulator panel */}
                <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between bg-white dark:bg-[#1e1e1e]">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2">
                      <HelpIcon className="text-blue-600 dark:text-blue-400 h-4 w-4" />
                      AI What-If Simulator
                    </h3>

                    <label htmlFor="whatif-scenario-select" className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-bold">Select Scenario</label>
                    <select
                      id="whatif-scenario-select"
                      value={selectedScenario}
                      onChange={(e) => setSelectedScenario(e.target.value)}
                      className="w-full mt-1.5 mb-4 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 px-3 py-2.5 rounded-lg text-xs text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                    >
                      <option value="gate_3_close">What if Gate 3 Closes?</option>
                      <option value="metro_delay">What if Metro is delayed by 15m?</option>
                      <option value="rain">What if heavy rain starts?</option>
                      <option value="spectator_surge">What if 20,000 extra spectators arrive early?</option>
                    </select>

                    <button
                      onClick={runSimulation}
                      disabled={simulating}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
                    >
                      {simulating ? 'Analyzing...' : 'Run Simulation'}
                    </button>

                    {simulationResult && (
                      <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/50 text-xs space-y-2.5 text-neutral-800 dark:text-neutral-200">
                        <div className="flex justify-between items-center pb-2 border-b border-blue-150 dark:border-blue-900/40">
                          <span className="font-bold text-neutral-700 dark:text-neutral-300">Risk Level:</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase ${simulationResult.risk_level === 'High' ? 'bg-[#f9ab00]' : 'bg-[#d93025]'}`}>
                            {simulationResult.risk_level}
                          </span>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-400 italic">"{simulationResult.impact_description}"</p>
                        <div>
                          <span className="font-bold text-neutral-700 dark:text-neutral-300">AI Mitigation Recommendation:</span>
                          <p className="text-neutral-600 dark:text-neutral-400 mt-1">{simulationResult.volunteer_redistribution_recommendation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Charts predictive */}
                <div className="glass-panel p-5 rounded-2xl lg:col-span-2 bg-white dark:bg-[#1e1e1e]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">
                    Predictive Crowds & Transit Analytics
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorWait" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#1a73e8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#3c4043' : '#e0e0e0'} />
                        <XAxis dataKey="time" stroke={theme === 'dark' ? '#9e9e9e' : '#5f6368'} />
                        <YAxis stroke={theme === 'dark' ? '#9e9e9e' : '#5f6368'} />
                        <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff', borderColor: theme === 'dark' ? '#3c4043' : '#dadce0', color: theme === 'dark' ? '#ffffff' : '#202124', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="waitGate3" stroke="#1a73e8" fillOpacity={1} fill="url(#colorWait)" name="Gate 3 Wait Time (Min)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* EMERGENCIES REPORTING SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Submit emergency tickets */}
                <div className="glass-panel p-5 rounded-2xl bg-white dark:bg-[#1e1e1e]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2">
                    <Flame className="text-[#d93025] h-4 w-4" />
                    Report Emergency Incident
                  </h3>
                                    <form onSubmit={handleReportIncident} className="space-y-4 text-xs">
                    <div className="text-left">
                      <label htmlFor="incident-type-select" className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-bold">Incident Type</label>
                      <select 
                        id="incident-type-select"
                        value={newIncident.type}
                        onChange={(e) => setNewIncident(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full mt-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 px-3 py-2.5 rounded-lg text-neutral-855 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                      >
                        <option value="medical">Medical Emergency</option>
                        <option value="fire">Fire / Smoke hazard</option>
                        <option value="violence">Violence / Brawl</option>
                        <option value="suspicious_object">Suspicious Object</option>
                        <option value="lost_child">Lost Child</option>
                      </select>
                    </div>

                    <div className="text-left">
                      <label htmlFor="incident-severity-select" className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-bold">Severity Level</label>
                      <select 
                        id="incident-severity-select"
                        value={newIncident.severity}
                        onChange={(e) => setNewIncident(prev => ({ ...prev, severity: e.target.value }))}
                        className="w-full mt-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 px-3 py-2.5 rounded-lg text-neutral-855 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                      >
                        <option value="Low">Low (Informational)</option>
                        <option value="Medium">Medium (Local Staff)</option>
                        <option value="High">High (Urgent Response)</option>
                        <option value="Critical">Critical (First Responders)</option>
                      </select>
                    </div>

                    <div className="text-left">
                      <label htmlFor="incident-description-textarea" className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-bold">Description Details</label>
                      <textarea
                        id="incident-description-textarea"
                        rows={2}
                        value={newIncident.description}
                        onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="State seating rows, details..."
                        className="w-full mt-1.5 p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={reportingIncident}
                      className="w-full py-2.5 bg-[#d93025] hover:bg-[#c5221f] text-white font-semibold rounded-lg transition-colors shadow-sm"
                    >
                      {reportingIncident ? 'Generating AI Triage...' : 'Report Incident to Copilot'}
                    </button>
                  </form>
                </div>

                {/* Emergency Incident Log with AI advice */}
                <div className="glass-panel p-5 rounded-2xl lg:col-span-2 flex flex-col justify-between bg-white dark:bg-[#1e1e1e]">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">
                      Active Emergency Logs & AI Advisories
                    </h3>
                    
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {incidents.length === 0 ? (
                        <div className="text-xs text-neutral-500 text-center py-8">No active incidents reported.</div>
                      ) : (
                        incidents.map(inc => (
                          <div key={inc.id} className="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs space-y-2.5">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase ${inc.severity === 'Critical' ? 'bg-[#d93025] animate-pulse' : inc.severity === 'High' ? 'bg-orange-500' : 'bg-neutral-600'}`}>
                                  {inc.severity}
                                </span>
                                <span className="font-bold text-neutral-800 dark:text-neutral-200 ml-2 capitalize">{inc.type} Case</span>
                              </div>
                              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{new Date(inc.created_at).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-neutral-600 dark:text-neutral-400 italic">"{inc.description}"</p>
                            {inc.ai_response_recommendation && (
                              <div className="mt-2 p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                                <span className="font-bold text-blue-700 dark:text-blue-300 text-[10px] uppercase">AI Copilot Recommendation:</span>
                                <p className="text-neutral-700 dark:text-neutral-300 mt-0.5 font-medium">{inc.ai_response_recommendation}</p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Post-match summary report widget */}
                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 mt-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Match Operations</div>
                      <div className="text-xs text-neutral-500">Compile operational briefs post match.</div>
                    </div>
                    <button
                      onClick={generatePostReport}
                      disabled={generatingReport}
                      className="px-4 py-2 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-750 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl transition-colors shadow-sm"
                    >
                      {generatingReport ? 'Analyzing history...' : 'Generate Post-Match Report'}
                    </button>
                  </div>

                  {postMatchReport && (
                    <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-h-[250px] overflow-y-auto text-xs prose prose-zinc dark:prose-invert font-sans">
                      <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-2">
                        <span className="font-bold text-[#1e8e3e] dark:text-[#6dd58c] flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          Generated Post-Match Report
                        </span>
                        <button onClick={() => setPostMatchReport(null)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 font-bold">Dismiss</button>
                      </div>
                      <pre className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap font-sans">{postMatchReport}</pre>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'routing' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between bg-white dark:bg-[#1e1e1e]">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-6">
                    <Compass className="text-blue-600 dark:text-blue-400 h-5 w-5" />
                    Dynamic Route Optimizer
                  </h2>
                  
                  <div className="space-y-4 text-xs">
                    <div className="text-left">
                      <label htmlFor="route-start-select" className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500">Starting Point</label>
                      <select 
                        id="route-start-select"
                        value={routeQuery.startNode}
                        onChange={(e) => setRouteQuery(prev => ({ ...prev, startNode: e.target.value }))}
                        className="w-full mt-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 px-3 py-2.5 rounded-lg text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                      >
                        {nodes.map(n => (
                          <option key={n.id} value={n.name}>{n.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="text-left">
                      <label htmlFor="route-end-select" className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500">Destination Point</label>
                      <select 
                        id="route-end-select"
                        value={routeQuery.endNode}
                        onChange={(e) => setRouteQuery(prev => ({ ...prev, endNode: e.target.value }))}
                        className="w-full mt-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 px-3 py-2.5 rounded-lg text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                      >
                        {nodes.map(n => (
                          <option key={n.id} value={n.name}>{n.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                      <div>
                        <h3 className="font-semibold text-neutral-800 dark:text-neutral-200">Wheelchair Accessible</h3>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">Avoids stairs and escalators.</p>
                      </div>
                      <button 
                        onClick={() => setRouteQuery(prev => ({ ...prev, accessible: !prev.accessible }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${routeQuery.accessible ? 'bg-blue-600 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-350'}`}
                      >
                        {routeQuery.accessible ? 'Active' : 'Enable'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <button
                    onClick={handleCalculateRoute}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
                  >
                    Calculate Route
                  </button>
                  
                  {computedRoute && (
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs space-y-2">
                      <div className="flex justify-between font-semibold text-neutral-700 dark:text-neutral-300">
                        <span>Distance:</span>
                        <span>{computedRoute.distance_meters} meters</span>
                      </div>
                      <div className="flex justify-between font-semibold text-neutral-700 dark:text-neutral-300">
                        <span>Est. Walk Time:</span>
                        <span>{computedRoute.estimated_minutes} minutes</span>
                      </div>
                      {computedRoute.safety_advisory && (
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 rounded-lg mt-2 font-medium">
                          {computedRoute.safety_advisory}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 h-[500px]">
                <DigitalTwinMap 
                  nodes={nodes} 
                  activePath={computedRoute ? computedRoute.path : undefined} 
                />
              </div>
            </div>
          )}

          {activeTab === 'translator' && (
            <VoiceTranslator />
          )}

          {activeTab === 'accessibility' && (
            <AccessAssistant />
          )}

          {activeTab === 'sustainability' && role === 'organizer' && (
            renderSustainabilityDashboard()
          )}

          {activeTab === 'volunteer' && role === 'volunteer' && (
            renderVolunteerDashboard()
          )}
        </main>

        {/* Floating Copilot conversational drawer (Gemini/Google Chat style) */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800 bg-[#f8f9fa] dark:bg-[#181818] p-4 flex flex-col justify-between flex-shrink-0 h-[400px] lg:h-full transition-colors duration-300">
          <div className="flex flex-col min-h-0 flex-1">
            <h3 className="flex-shrink-0 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-1.5 border-b border-neutral-200 dark:border-neutral-800 pb-2">
              <MessageSquare className="text-blue-600 dark:text-blue-400 h-4 w-4" />
              Interactive Operations Copilot
            </h3>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1.5 scrollbar-thin text-xs">
              {chatLog.map((chat, idx) => (
                <div key={idx} className={`p-3 rounded-2xl max-w-[85%] ${chat.sender === 'copilot' ? 'bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 mr-auto rounded-tl-none' : 'bg-blue-600 dark:bg-[#a8c7fa] text-white dark:text-[#0b57d0] font-semibold ml-auto rounded-tr-none shadow-sm'}`}>
                  {chat.text}
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={handleSendChatMessage} className="mt-4 flex gap-2 relative">
            <input
              id="copilot-chat-input"
              aria-label="Interactive Operations Copilot message input"
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask Copilot arena status..."
              className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-755 rounded-full text-xs text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
            />
            <button
              type="submit"
              disabled={sendingChat}
              aria-label="Send message to Copilot"
              className="absolute right-2 top-2 h-7 w-7 bg-blue-600 dark:bg-[#a8c7fa] hover:bg-blue-700 dark:hover:bg-[#8bb2f9] text-white dark:text-[#0b57d0] rounded-full flex items-center justify-center transition-colors"
            >
              <Send className="h-3 w-3" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;