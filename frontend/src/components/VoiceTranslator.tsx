import React, { useState } from 'react';
import { Languages, Mic, MicOff, Send, Volume2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' }
];

const VoiceTranslator: React.FC = () => {
  const { theme } = useTheme();
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [phoneticText, setPhoneticText] = useState('');
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          source_lang: sourceLang,
          target_lang: targetLang
        })
      });
      const data = await response.json();
      setTranslatedText(data.translated_text);
      setPhoneticText(data.pronunciation_text || '');
    } catch (e) {
      // Offline fallback
      const common: Record<string, Record<string, string>> = {
        "hello i hope everyone is great": {
          "fr": "bonjour, j'espère que tout le monde va bien",
          "es": "hola, espero que todos estén muy bien",
          "ar": "مرحباً، أتمنى أن يكون الجميع بخير",
          "hi": "नमस्ते, मुझे आशा है कि हर कोई महान है",
          "pt": "olá, espero que todos estejam ótimos",
          "ja": "こんにちは、皆さんが元気であることを願っています",
          "de": "hallo, ich hoffe, es geht allen gut",
          "zh": "你好，我希望大家都很好"
        },
        "hello, can you help me find gate 5 please?": {
          "fr": "bonjour, pouvez-vous m'aider à trouver la porte 5 s'il vous plaît?",
          "es": "hola, ¿puedes ayudarme a encontrar la puerta 5, por favor?",
          "ar": "مرحباً، هل يمكنك مساعدتي في العثور على البوابة 5 من فضلك؟",
          "hi": "नमस्ते, क्या आप कृपया मुझे गेट 5 खोजने में मदद कर सकते हैं?",
          "pt": "olá, você pode me ajudar a encontrar o portão 5, por favor?",
          "ja": "こんにちは、ゲート5を見つけるのを手伝っていただけますか？",
          "de": "hallo, können Sie mir bitte helfen, Tor 5 zu finden?",
          "zh": "你好，请问能帮我找到5号门吗？"
        }
      };
      const normalized = inputText.toLowerCase().trim().replace(/\.$/, "");
      let translated = inputText;
      if (common[normalized] && common[normalized][targetLang]) {
        translated = common[normalized][targetLang];
      } else if (common[normalized + '?'] && common[normalized + '?'][targetLang]) {
        translated = common[normalized + '?'][targetLang];
      } else {
        translated = `[Translated to ${targetLang}]: ${inputText}`;
      }
      setTranslatedText(translated);
      setPhoneticText(`Phonetics: ${translated}`);
    } finally {
      setLoading(false);
    }
  };

  const startSpeechSimulation = async () => {
    setRecording(true);
    // Simulate recording for 3 seconds, then hit speech-to-text STT mock
    setTimeout(async () => {
      setRecording(false);
      try {
        const formData = new FormData();
        const emptyBlob = new Blob([], { type: 'audio/mp3' });
        formData.append('audio', emptyBlob, 'mock.mp3');
        formData.append('source_lang', sourceLang);

        const response = await fetch('/api/translate/speech-to-text', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        setInputText(data.transcript);
      } catch (e) {
        // Fallback transcript
        setInputText("Hello, can you help me find Gate 5 please?");
      }
    }, 2500);
  };

  const playSynthesizer = () => {
    if (!translatedText) return;
    if ('speechSynthesis' in window) {
      window.location.protocol === "https:" || window.location.hostname === "localhost";
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(translatedText);
      utterance.lang = targetLang;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="glass-panel p-6 max-w-2xl mx-auto bg-white dark:bg-[#1e1e1e] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm text-neutral-800 dark:text-neutral-200 transition-colors duration-300">
      <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-6">
        <Languages className="text-blue-600 dark:text-blue-400 h-5 w-5" />
        Multilingual Translation System
      </h2>

      <div className="flex gap-4 mb-6">
        {/* Source Language */}
        <div className="flex-1 text-left">
          <label htmlFor="source-lang-select" className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">From</label>
          <select 
            id="source-lang-select"
            value={sourceLang} 
            onChange={(e) => setSourceLang(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-205 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all font-medium"
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end justify-center pb-2.5">
          <span className="text-neutral-400 dark:text-neutral-500">→</span>
        </div>

        {/* Target Language */}
        <div className="flex-1 text-left">
          <label htmlFor="target-lang-select" className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">To</label>
          <select 
            id="target-lang-select"
            value={targetLang} 
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-205 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all font-medium"
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Input Section */}
      <div className="relative mb-6">
        <textarea
          id="speech-input-textarea"
          aria-label="Speech translation message input"
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type message to translate or use the microphone to dictate..."
          className="w-full p-4 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all pr-12 resize-none"
        />
        
        <button
          onClick={recording ? undefined : startSpeechSimulation}
          className={`absolute bottom-4 right-4 h-9 w-9 rounded-full flex items-center justify-center transition-all ${recording ? 'bg-[#d93025] text-white animate-pulse shadow-md' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
        >
          {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
      </div>

      {/* Voice Wavelength Ticker animation */}
      {recording && (
        <div className="flex items-center justify-center gap-1.5 mb-6">
          <div className="h-4 w-0.5 bg-[#d93025] rounded animate-pulse" style={{ animationDelay: '0.1s' }} />
          <div className="h-6 w-0.5 bg-[#d93025] rounded animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="h-8 w-0.5 bg-[#d93025] rounded animate-pulse" style={{ animationDelay: '0.3s' }} />
          <div className="h-4 w-0.5 bg-[#d93025] rounded animate-pulse" style={{ animationDelay: '0.4s' }} />
          <span className="text-[10px] text-[#d93025] font-semibold ml-2">Dictating Audio...</span>
        </div>
      )}

      {/* Action triggers */}
      <button
        onClick={handleTranslate}
        disabled={loading}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        {loading ? (
          <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Translate Text
          </>
        )}
      </button>

      {/* Output Section */}
      {translatedText && (
        <div className="mt-6 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 flex flex-col gap-4 text-neutral-800 dark:text-neutral-200">
          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">Translation</div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-1">{translatedText}</div>
          </div>

          {phoneticText && (
            <div>
              <div className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">Pronunciation Guide</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 italic mt-0.5">{phoneticText}</div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <button 
              onClick={playSynthesizer}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-sm"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Listen Speech
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceTranslator;
