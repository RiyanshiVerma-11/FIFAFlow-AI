import React, { useState } from 'react';
import { Shield, Lock, User as UserIcon, AlertCircle, Sun, Moon, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import CommandCenter from './components/CommandCenter';
import LandingPage from './components/LandingPage';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

const MainApp: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<string>(localStorage.getItem('role') || 'fan');
  const [username, setUsername] = useState<string>(localStorage.getItem('username') || '');
  const [view, setView] = useState<'landing' | 'auth' | 'app'>(localStorage.getItem('token') ? 'app' : 'landing');
  const [isLoginTab, setIsLoginTab] = useState(true);

  // Login inputs
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  // Registration inputs
  const [regUser, setRegUser] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regRole, setRegRole] = useState('fan');

  const [error, setError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRegSuccess('');
    setLoading(true);
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', loginUser);
      formData.append('password', loginPass);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        setRole(data.role);
        setUsername(data.username);
        
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('username', data.username);
        setView('app');
      } else {
        const err = await res.json();
        setError(err.detail || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setError("Failed to establish connection to operations server.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRegSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUser,
          email: regEmail,
          password: regPass,
          role: regRole
        })
      });

      if (res.ok) {
        setRegSuccess('Registration successful! You can now sign in.');
        setLoginUser(regUser);
        setLoginPass(regPass);
        
        // Reset fields
        setRegUser('');
        setRegEmail('');
        setRegPass('');
        setRegRole('fan');
        setIsLoginTab(true);
      } else {
        const err = await res.json();
        setError(err.detail || 'Registration failed. Please check user parameters.');
      }
    } catch (err) {
      setError('Connection to backend failed. Registration unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (user: string, pass: string) => {
    setLoginUser(user);
    setLoginPass(pass);
    // Auto submit
    setTimeout(() => {
      const btn = document.getElementById('submit-btn');
      if (btn) btn.click();
    }, 100);
  };

  const handleLogout = () => {
    setToken(null);
    setRole('fan');
    setUsername('');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setView('landing');
  };

  if (view === 'app' && token) {
    return (
      <CommandCenter 
        token={token} 
        role={role} 
        username={username} 
        onLogout={handleLogout} 
      />
    );
  }

  if (view === 'landing') {
    return (
      <LandingPage 
        onEnterTerminal={() => setView(token ? 'app' : 'auth')}
        tokenExists={!!token}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0f0f0f] flex flex-col justify-between p-6 relative overflow-hidden transition-colors duration-300">
      
      {/* Top Navigation Bar inside Auth */}
      <div className="w-full flex justify-between items-center max-w-5xl mx-auto z-10">
        <button
          onClick={() => setView('landing')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-neutral-600 dark:text-neutral-450 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1e1e1e] transition-colors"
          aria-label="Back to landing page"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Landing Page</span>
        </button>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2.5 rounded-full hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1e1e1e] shadow-sm"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      {/* Main card */}
      <div className="w-full max-w-[460px] mx-auto my-auto space-y-6 z-10">
        <div className="bg-white dark:bg-[#1e1e1e] border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-8 shadow-sm space-y-6">
          {/* Header branding logo */}
          <div className="text-center space-y-2">
            <div className="mx-auto h-11 w-11 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-sm">
              FF
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                FIFAFlow Operations
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Enter your credentials or register a volunteer/staff account.
              </p>
            </div>
          </div>

          {/* Login / Register Toggle tabs */}
          <div className="flex border-b border-neutral-200 dark:border-neutral-800" role="tablist">
            <button
              onClick={() => {
                setIsLoginTab(true);
                setError('');
                setRegSuccess('');
              }}
              role="tab"
              aria-selected={isLoginTab}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
                isLoginTab 
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                  : 'border-transparent text-neutral-500 dark:text-neutral-450 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLoginTab(false);
                setError('');
                setRegSuccess('');
              }}
              role="tab"
              aria-selected={!isLoginTab}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
                !isLoginTab 
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                  : 'border-transparent text-neutral-500 dark:text-neutral-450 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              Register
            </button>
          </div>

          {/* Success Banner */}
          {regSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg flex items-center gap-2.5 text-xs text-[#2A9D8F] font-semibold">
              <CheckCircle className="h-4.5 w-4.5 flex-shrink-0" />
              <span>{regSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg flex items-center gap-2.5 text-xs text-red-650 dark:text-red-400">
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoginTab ? (
            /* LOGIN VIEW */
            <form className="space-y-4 pt-1" onSubmit={handleLogin}>
              <div className="space-y-1 text-left">
                <label htmlFor="login-username-input" className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">Username</label>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    id="login-username-input"
                    type="text"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    placeholder="e.g. organizer"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-550 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label htmlFor="login-password-input" className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">Password</label>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="login-password-input"
                    type="password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Enter security password"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-550 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                id="submit-btn"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm flex justify-center items-center mt-2"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          ) : (
            /* REGISTER VIEW */
            <form className="space-y-4 pt-1" onSubmit={handleRegister}>
              <div className="space-y-1 text-left">
                <label htmlFor="reg-username-input" className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">Username</label>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    id="reg-username-input"
                    type="text"
                    value={regUser}
                    onChange={(e) => setRegUser(e.target.value)}
                    placeholder="Create a username"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-550 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label htmlFor="reg-email-input" className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">Email Address</label>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="reg-email-input"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. name@fifa.org"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-550 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label htmlFor="reg-password-input" className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">Security Password</label>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="reg-password-input"
                    type="password"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-550 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Role Selection Card Grid */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">Platform Access Role</span>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Role selector">
                  {[
                    { key: 'fan', label: 'Visitor / Fan', desc: 'Stadium routes & translators' },
                    { key: 'volunteer', label: 'Volunteer', desc: 'Zones & task schedules' },
                    { key: 'staff', label: 'Supervisor', desc: 'Triage reported incidents' },
                    { key: 'organizer', label: 'Administrator', desc: 'Command console & simulator' }
                  ].map(roleItem => (
                    <button
                      key={roleItem.key}
                      type="button"
                      onClick={() => setRegRole(roleItem.key)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        regRole === roleItem.key 
                          ? 'border-blue-600 bg-blue-50/20 dark:border-blue-400 dark:bg-blue-950/20' 
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                      }`}
                    >
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">{roleItem.label}</span>
                      <span className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-0.5 leading-tight">{roleItem.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm flex justify-center items-center mt-4"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}

          {/* Quick login accounts selector - Only show on login screen */}
          {isLoginTab && (
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-5 space-y-3">
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Demo Account Selection
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleQuickLogin('organizer', 'organizer123')}
                  className="p-2 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 border border-neutral-200 dark:border-neutral-800 rounded-xl transition text-left flex flex-col justify-between"
                >
                  <span className="font-semibold text-[10px] text-neutral-850 dark:text-neutral-200">Admin</span>
                  <span className="text-[8px] text-neutral-450 dark:text-neutral-500 font-mono mt-0.5">organizer (organizer123)</span>
                </button>
                
                <button 
                  onClick={() => handleQuickLogin('volunteer1', 'volunteer123')}
                  className="p-2 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 border border-neutral-200 dark:border-neutral-800 rounded-xl transition text-left flex flex-col justify-between"
                >
                  <span className="font-semibold text-[10px] text-neutral-855 dark:text-neutral-200">Volunteer</span>
                  <span className="text-[8px] text-neutral-450 dark:text-neutral-550 font-mono mt-0.5">volunteer1 (volunteer123)</span>
                </button>

                <button 
                  onClick={() => handleQuickLogin('staff1', 'staff123')}
                  className="p-2 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 border border-neutral-200 dark:border-neutral-800 rounded-xl transition text-left flex flex-col justify-between"
                >
                  <span className="font-semibold text-[10px] text-neutral-855 dark:text-neutral-200">Staff</span>
                  <span className="text-[8px] text-neutral-450 dark:text-neutral-555 font-mono mt-0.5">staff1 (staff123)</span>
                </button>

                <button 
                  onClick={() => handleQuickLogin('fan1', 'fan123')}
                  className="p-2 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 border border-neutral-200 dark:border-neutral-800 rounded-xl transition text-left flex flex-col justify-between"
                >
                  <span className="font-semibold text-[10px] text-neutral-855 dark:text-neutral-200">Fan</span>
                  <span className="text-[8px] text-neutral-450 dark:text-neutral-555 font-mono mt-0.5">fan1 (fan123)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer details */}
      <div className="w-full text-center text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-1.5 pt-4 z-10">
        <Shield className="h-3.5 w-3.5" />
        <span>Secure operations terminal. Powered by FIFAFlow Enterprise AI.</span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
};

export default App;
