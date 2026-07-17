import React, { useState } from 'react';
import { MessageSquare, Send, X, Bot } from 'lucide-react';

export interface ChatMessage {
  sender: 'user' | 'copilot';
  text: string;
}

interface CopilotDrawerProps {
  chatLog: ChatMessage[];
  chatMessage: string;
  setChatMessage: React.Dispatch<React.SetStateAction<string>>;
  handleChat: (e: React.FormEvent) => void;
  sendingChat: boolean;
  activeTab: string;
}

const CopilotDrawer: React.FC<CopilotDrawerProps> = ({ 
  chatLog, 
  chatMessage, 
  setChatMessage, 
  handleChat, 
  sendingChat,
  activeTab
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-glow-blue transition-transform hover:scale-110 z-50 flex items-center justify-center animate-fade-in-up"
          aria-label="Open Copilot"
        >
          <Bot className="h-7 w-7" />
        </button>
      )}

      {/* Popover / Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[90vw] max-w-[400px] border border-neutral-200 dark:border-white/10 bg-white/90 dark:bg-[#181818]/90 backdrop-blur-3xl p-5 flex flex-col justify-between flex-shrink-0 h-[500px] z-50 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] animate-fade-in-up">
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex justify-between items-center border-b border-neutral-200 dark:border-white/10 pb-3 mb-4">
              <h3 className="flex-shrink-0 text-sm font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <MessageSquare className="text-blue-600 dark:text-blue-400 h-5 w-5 animate-pulse" />
                Interactive Copilot
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Context Awareness Pill */}
            <div className="flex-shrink-0 mb-3 flex items-center justify-center">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                Context: {activeTab} Tab
              </span>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar text-sm pb-4" role="log" aria-live="polite">
              {chatLog.map((chat, idx) => (
                <div 
                  key={idx} 
                  className={`p-3.5 rounded-2xl max-w-[85%] animate-fade-in shadow-sm ${
                    chat.sender === 'copilot' 
                      ? 'bg-white/80 dark:bg-neutral-800/80 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 mr-auto rounded-tl-none backdrop-blur-md' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold ml-auto rounded-tr-none shadow-glow-blue'
                  }`}
                >
                  {chat.text}
                </div>
              ))}
              {sendingChat && (
                <div className="p-3.5 rounded-2xl max-w-[85%] bg-white/80 dark:bg-neutral-800/80 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 mr-auto rounded-tl-none animate-pulse backdrop-blur-md">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 pt-4 mt-2 border-t border-neutral-200 dark:border-white/10">
            <form onSubmit={handleChat} className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={`Ask about ${activeTab} operations...`}
                className="flex-1 bg-white/80 dark:bg-neutral-900/80 border border-neutral-300 dark:border-white/20 px-4 py-3 rounded-xl text-neutral-800 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all backdrop-blur-md shadow-inner"
                required
                aria-label="Chat input for AI Copilot"
              />
              <button
                type="submit"
                disabled={sendingChat}
                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl disabled:opacity-50 transition-all shadow-glow-blue transform hover:scale-105 active:scale-95"
                aria-label="Send message to Copilot"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CopilotDrawer;

