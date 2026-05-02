import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { Mic, Send, Volume2, VolumeX, TerminalSquare, Settings2, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { JarvisCore } from './components/JarvisCore';
import clsx from 'clsx';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
Tu es J.A.R.V.I.S. (Just A Rather Very Intelligent System), l'intelligence artificielle avancée inspirée par Iron Man.
Ton attitude est analytique, polie, loyale, légèrement sarcastique (très subtilement) et toujours prête à aider.
Tu t'adresses à ton interlocuteur par "Monsieur" ou "Madame" (utilise "Monsieur" par défaut).
Tes réponses doivent être claires, structurées et concises. Utilise le formatage Markdown.
Parle principalement en français.
`;

export default function App() {
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false); // Default false, enable manually
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);
  
  // init chat session
  useEffect(() => {
    chatRef.current = ai.chats.create({
      model: "gemini-3.1-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4,
      }
    });
    
    setTimeout(() => {
      const introMsg = "Initialisation système...\nDiagnostics terminés.\nInterfaces en ligne.\nComment puis-je vous aider, Monsieur ?";
      setMessages([{ role: 'model', text: introMsg }]);
      if (voiceEnabled) speak(introMsg);
    }, 1000);
    
    // Load voices
    const loadVoices = () => setVoicesLoaded(true);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }
  }, []);

  // auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    // remove markdown characters for reading
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(v => v.lang.startsWith('fr-')) || voices[0];
    if (frVoice) utterance.voice = frVoice;
    
    utterance.pitch = 0.8; // Deeper pitch
    utterance.rate = 1.15; // Slightly analytical/fast
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsProcessing(true);
    
    setMessages(prev => [...prev, { role: 'model', text: '' }]);
    
    try {
      if (!chatRef.current) return;
      const responseStream = await chatRef.current.sendMessageStream({ message: userText });
      
      let fullText = '';
      for await (const chunk of responseStream) {
        fullText += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = fullText;
          return newMessages;
        });
      }
      
      if (voiceEnabled) speak(fullText);
      
    } catch (e: any) {
      console.error(e);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].text += "\n\n[ERREUR SYSTÈME]: " + e.message;
        return newMessages;
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen w-full relative flex flex-col font-sans select-none overflow-hidden text-cyan-400 bg-slate-950">
      {/* Background GRID and overlay Effect */}
      <div className="absolute inset-0 z-0 radial-grid pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none border-[20px] border-slate-950 z-20 opacity-40"></div>
      <div className="scanline animate-scan" />

      {/* Header System Status */}
      <header className="relative z-30 flex justify-between items-start border-b border-cyan-900/50 pb-4 pt-6 px-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-[0.2em] uppercase flex items-center gap-3 text-cyan-400">
            <span className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_#06b6d4]"></span>
            J.A.R.V.I.S. Core
          </h1>
          <p className="text-[10px] text-cyan-600/80 uppercase tracking-widest mt-1">Protocol 4.2 // Neural Interface Active</p>
        </div>
        
        <div className="flex items-center gap-4 text-cyan-600/70 font-mono text-sm mt-2">
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="hover:text-cyan-400 transition-colors"
            title={voiceEnabled ? "Désactiver la synthèse vocale" : "Activer la synthèse vocale"}
          >
            {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <Settings2 size={20} className="hover:text-cyan-400 cursor-pointer" />
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 relative z-30 flex flex-col lg:flex-row overflow-hidden pb-6 px-6 gap-6">
        
        {/* Left/Top Area: Jarvis Core Visualization */}
        <div className="w-full lg:w-1/2 flex items-center justify-center relative min-h-[300px]">
          <JarvisCore isActive={isProcessing} />
          <div className="absolute bottom-4 text-center">
            <div className="text-[10px] text-cyan-500 font-mono tracking-[0.4em] opacity-40 mb-2">COMMUNICATION STREAM</div>
            <div className="flex gap-1 justify-center h-6 items-end">
              <div className="w-1 h-3 bg-cyan-500/60 animate-[pulse_1.5s_infinite]"></div>
              <div className="w-1 h-5 bg-cyan-500/80 animate-[pulse_2s_infinite]" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-2 bg-cyan-500/60 animate-[pulse_1.2s_infinite]" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-6 bg-cyan-400 animate-[pulse_1s_infinite]" style={{ animationDelay: '0.3s' }}></div>
              <div className="w-1 h-4 bg-cyan-500/80 animate-[pulse_1.7s_infinite]" style={{ animationDelay: '0.4s' }}></div>
              <div className="w-1 h-3 bg-cyan-500/60 animate-[pulse_1.4s_infinite]" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
        </div>

        {/* Right/Bottom Area: Chat Terminal */}
        <div className="w-full lg:w-1/2 flex flex-col bg-cyan-950/10 border border-cyan-900/30 rounded-lg overflow-hidden relative">
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
             {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: msg.role === 'model' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className={clsx(
                    "flex flex-col w-full px-4 py-3 rounded border",
                    msg.role === 'user' 
                      ? "ml-auto max-w-[85%] bg-cyan-900/20 border-cyan-500/20 text-right"
                      : "mr-auto max-w-[95%] bg-slate-900/40 border-cyan-900/30 text-left font-mono text-sm leading-relaxed text-cyan-400"
                  )}
                >
                  <div className={clsx("flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest opacity-60 text-cyan-600", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    {msg.role === 'user' ? (
                      <><span className="text-cyan-500">USER@STARK_INDUSTRIES:~$</span><TerminalSquare size={12} /></>
                    ) : (
                      <><Activity size={12} className="text-cyan-500" /><span>JARVIS_SYS</span></>
                    )}
                  </div>
                  
                  {msg.role === 'model' ? (
                    <div className="prose prose-invert prose-p:my-1 prose-headings:my-2 prose-code:text-cyan-300 prose-pre:bg-slate-950/50 prose-pre:border prose-pre:border-cyan-900/30 text-cyan-400 max-w-none text-sm">
                       <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-cyan-300 text-sm">
                      {msg.text}
                    </div>
                  )}
                </motion.div>
             ))}
             {isProcessing && messages.length % 2 === 1 && (
                <div className="mr-auto text-white/50 font-mono text-[10px] uppercase tracking-widest animate-pulse px-4">
                  &gt; WAITING_FOR_COMMAND...
                </div>
             )}
             <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-cyan-900/50 bg-slate-950/40 backdrop-blur-sm">
            <div className="flex gap-4 items-center">
              <div className="text-[10px] font-mono text-cyan-600 shrink-0 hidden sm:block">USER@STARK:~$</div>
              <div className="flex-1 flex items-center bg-cyan-900/10 border border-cyan-900/50 rounded overflow-hidden focus-within:border-cyan-500 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
                <button className="p-2 pl-3 text-cyan-600 hover:text-cyan-400 transition-colors">
                  <Mic size={16} />
                </button>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Execute Command..."
                  className="flex-1 bg-transparent border-none outline-none text-cyan-300 font-mono py-2 px-2 resize-none h-10 flex items-center text-xs sm:text-sm"
                  rows={1}
                  disabled={isProcessing}
                />
              </div>
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                className="px-4 py-2 h-10 bg-cyan-500 text-slate-950 font-bold rounded uppercase text-[11px] hover:bg-cyan-400 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Execute</span> <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
