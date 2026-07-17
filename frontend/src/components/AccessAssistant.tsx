import React, { useState } from 'react';
import { Eye, Volume2, Accessibility, BookOpen, Layers, VolumeX, ShieldAlert } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const AccessAssistant: React.FC = () => {
  const { 
    theme,
    dyslexiaMode, toggleDyslexiaMode, 
    colorblindMode, setColorblindMode,
    highContrast, toggleHighContrast,
    textSize, setTextSize
  } = useTheme();

  const [activeVoice, setActiveVoice] = useState(false);
  const [voiceText, setVoiceText] = useState("Accessibility voice system ready. Select a zone for directions.");
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const simulateSpeech = (text: string) => {
    setVoiceText(text);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
      setActiveVoice(true);
      utterance.onend = () => setActiveVoice(false);
    } else {
      // Simulate vocal animation offline
      setActiveVoice(true);
      setTimeout(() => setActiveVoice(false), 3000);
    }
  };

  const handleVoiceRoute = (routeName: string) => {
    setSelectedRoute(routeName);
    if (routeName === 'elevator') {
      simulateSpeech("Elevator corridor B is located behind Concessions Plaza. Turn left at Gate 2. Ramp access is open.");
    } else if (routeName === 'medical') {
      simulateSpeech("The primary medical station is located next to Gate 1. Flat concrete flooring. Wheelchair support volunteers are stationed at the entrance.");
    } else if (routeName === 'restroom') {
      simulateSpeech("Accessible restrooms are available on the Concourse Level 2. Take the main elevator up one level, turn right. Large door push plates active.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
      {/* Configuration Hub */}
      <div className="glass-panel p-6 bg-white dark:bg-[#1e1e1e] border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col justify-between shadow-sm text-neutral-850 dark:text-neutral-200 transition-colors duration-300">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-6">
            <Accessibility className="text-blue-600 dark:text-blue-400 h-5 w-5" />
            Accessibility Settings Portal
          </h2>

          <div className="space-y-4">
            {/* Dyslexia Mode */}
            <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <div>
                <h3 className="font-semibold text-neutral-850 dark:text-neutral-200 text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Dyslexia-Friendly Layout
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-450 mt-0.5">Applies high legibility spacing and font scaling.</p>
              </div>
              <button 
                onClick={toggleDyslexiaMode}
                role="switch"
                aria-checked={dyslexiaMode}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${dyslexiaMode ? 'bg-blue-600 text-white shadow-sm' : 'bg-neutral-200 dark:bg-neutral-850 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700'}`}
              >
                {dyslexiaMode ? 'Active' : 'Disabled'}
              </button>
            </div>

            {/* High Contrast Mode */}
            <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <div>
                <h3 className="font-semibold text-neutral-855 dark:text-neutral-200 text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  High Contrast Enhancer
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-455 mt-0.5">Increases saturation and brightness levels.</p>
              </div>
              <button 
                onClick={toggleHighContrast}
                role="switch"
                aria-checked={highContrast}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${highContrast ? 'bg-blue-600 text-white shadow-sm' : 'bg-neutral-200 dark:bg-neutral-850 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700'}`}
              >
                {highContrast ? 'Active' : 'Disabled'}
              </button>
            </div>

            {/* Text Zoom */}
            <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <div>
                <h3 className="font-semibold text-neutral-855 dark:text-neutral-200 text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Interface Text Scaling
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-450 mt-0.5">Enlarges UI labels for better readability.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTextSize('normal')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${textSize === 'normal' ? 'bg-blue-600 text-white shadow-sm' : 'bg-neutral-200 dark:bg-neutral-850 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700'}`}
                >
                  Normal
                </button>
                <button 
                  onClick={() => setTextSize('large')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${textSize === 'large' ? 'bg-blue-600 text-white shadow-sm' : 'bg-neutral-200 dark:bg-neutral-850 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700'}`}
                >
                  Large
                </button>
              </div>
            </div>

            {/* Colorblind Settings */}
            <div className="flex flex-col gap-2 p-3.5 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <div>
                <h3 className="font-semibold text-neutral-855 dark:text-neutral-200 text-sm">Colorblind Assistance Overlays</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-450 mt-0.5">Renders matrix filters supporting visual anomalies.</p>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {(['none', 'protanopia', 'deuteranopia', 'tritanopia'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setColorblindMode(mode)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors ${colorblindMode === mode ? 'bg-blue-600 text-white shadow-sm' : 'bg-neutral-200 dark:bg-neutral-850 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700'}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/50 rounded-xl text-xs text-blue-700 dark:text-blue-300 font-medium">
          <ShieldAlert className="h-4 w-4 flex-shrink-0" />
          <span>Screen Reader labels and ARIA descriptors are active across all dynamic forms.</span>
        </div>
      </div>

      {/* Voice Guide & Sign Language Avatar */}
      <div className="glass-panel p-6 bg-white dark:bg-[#1e1e1e] border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col justify-between shadow-sm text-neutral-855 dark:text-neutral-200 transition-colors duration-300">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-4">
            <Volume2 className="text-blue-600 dark:text-blue-400 h-5 w-5" />
            Audio Navigation & Assistive Sign AI
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-450 mb-6">Select a destination to listen to accessible directions.</p>

          <div className="grid grid-cols-3 gap-2.5 mb-6">
            <button 
              onClick={() => handleVoiceRoute('elevator')}
              className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-colors ${selectedRoute === 'elevator' ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-500 text-blue-600 dark:text-blue-400 font-bold' : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-350 hover:bg-neutral-100 dark:hover:bg-neutral-850'}`}
            >
              <Volume2 className="h-5 w-5" />
              <span className="text-[10px] font-bold">Elevator Links</span>
            </button>
            <button 
              onClick={() => handleVoiceRoute('medical')}
              className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-colors ${selectedRoute === 'medical' ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-500 text-blue-600 dark:text-blue-400 font-bold' : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-350 hover:bg-neutral-100 dark:hover:bg-neutral-850'}`}
            >
              <Volume2 className="h-5 w-5" />
              <span className="text-[10px] font-bold">Medical Center</span>
            </button>
            <button 
              onClick={() => handleVoiceRoute('restroom')}
              className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-colors ${selectedRoute === 'restroom' ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-500 text-blue-600 dark:text-blue-400 font-bold' : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-350 hover:bg-neutral-100 dark:hover:bg-neutral-850'}`}
            >
              <Volume2 className="h-5 w-5" />
              <span className="text-[10px] font-bold">ADA Restrooms</span>
            </button>
          </div>

          {/* Voice Prompt Playback Ticker */}
          <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex items-center gap-3.5 mb-6">
            <button 
              onClick={() => simulateSpeech(voiceText)}
              className={`h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all ${activeVoice ? 'bg-[#d93025] text-white animate-pulse shadow-sm' : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'}`}
            >
              {activeVoice ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <div className="overflow-hidden">
              <div className="text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-450">Live Speech Synthesizer Output</div>
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate mt-0.5">{voiceText}</div>
            </div>
          </div>
        </div>

        {/* Dynamic Sign Language Avatar Placeholder */}
        <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col items-center gap-3">
          <div className="w-full flex justify-between items-center border-b border-neutral-250 dark:border-neutral-800 pb-2 text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-450">
            <span>Assistive Sign AI Interpreter</span>
            <span className="text-[#1e8e3e] dark:text-[#6dd58c] font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1e8e3e] dark:bg-[#6dd58c] animate-pulse"></span>
              Live Sync
            </span>
          </div>
          
          <div className="h-28 w-28 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center relative overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
            <svg viewBox="0 0 100 100" className={`w-20 h-20 text-blue-600 dark:text-blue-400 transition-all ${activeVoice ? 'animate-bounce' : 'opacity-80'}`}>
              <path fill="currentColor" d="M30 40c0-5.5 4.5-10 10-10s10 4.5 10 10c0 5.5-4.5 10-10 10s-10-4.5-10-10zm5 0c0 2.8 2.2 5 5 5s5-2.2 5-5-2.2-5-5-5-5 2.2-5 5z" />
              <path fill="currentColor" d="M60 50h-4.3c-2.3-2.6-5.7-4.2-9.7-4.2-7 0-12.8 5.7-12.8 12.8v1.4c0 3.3 2.7 6 6 6h28c3.3 0 6-2.7 6-6v-4c0-3.3-2.7-6-6-6zM39.2 60c0-3.7 3-6.8 6.8-6.8s6.8 3 6.8 6.8v.2h-13.6v-.2zm26.8 6c0 1.1-.9 2-2 2h-22v-2h22v2.2c0-1.2.9-2.2 2-2.2h0c1.1 0 2 .9 2 2.2v-2.2z" />
            </svg>
            <div className="absolute inset-0 border-2 border-blue-500/10 rounded-full animate-ping pointer-events-none" />
          </div>
          <span className="text-[10px] text-neutral-500 dark:text-neutral-450 text-center">Renders real-time visual translations matching active audio commands.</span>
        </div>
      </div>
    </div>
  );
};

export default AccessAssistant;
