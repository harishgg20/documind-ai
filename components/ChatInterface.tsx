import React, { useRef, useEffect, useState } from 'react';
import { Send, Volume2, Trash2, Bot, User, FileText, Image as ImageIcon, Zap, BrainCircuit, Sparkles, ChevronDown, Mic, MicOff, Palette, CheckCircle, ArrowRight, Download, Copy, Check, Info, Video } from 'lucide-react';
import { ChatMessage, ProcessedDocument, AIModelMode } from '../types';
import { useToast } from '../contexts/ToastContext';

interface ChatInterfaceProps {
  document: ProcessedDocument;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  isLoading: boolean;
  modelMode: AIModelMode;
  onModeChange: (mode: AIModelMode) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  document, 
  messages, 
  onSendMessage, 
  onClearChat, 
  isLoading,
  modelMode,
  onModeChange
}) => {
  const { showToast } = useToast();
  const [input, setInput] = useState('');
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const inputBaseRef = useRef('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
      inputRef.current?.focus();
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognitionRef.current.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map((result: any) => result[0])
                    .map((result) => result.transcript)
                    .join('');
                
                // Append transcript to the text that existed before listening started
                const baseText = inputBaseRef.current;
                const newText = baseText ? `${baseText} ${transcript}` : transcript;
                setInput(newText);
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    showToast('Microphone Access Denied', 'Please allow microphone permissions in your browser settings.', 'error');
                } else if (event.error === 'no-speech') {
                    // Silent failure for no speech
                    setIsListening(false);
                } else {
                    showToast('Voice Input Error', `Error: ${event.error}`, 'error');
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };
  }, [showToast]);

  const toggleListening = () => {
      if (!recognitionRef.current) {
          showToast('Not Supported', 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.', 'error');
          return;
      }

      if (isListening) {
          recognitionRef.current.stop();
          setIsListening(false);
      } else {
          try {
            // Capture current input as base to append to
            inputBaseRef.current = input;
            recognitionRef.current.start();
            setIsListening(true);
            inputRef.current?.focus();
          } catch (e) {
            console.error("Failed to start speech recognition", e);
            setIsListening(false);
            showToast('Error', 'Failed to start voice input.', 'error');
          }
      }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModeDropdownOpen(false);
      }
    };
    window.document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
      // Stop listening if sending
      if (isListening && recognitionRef.current) {
          recognitionRef.current.stop();
          setIsListening(false);
      }
    }
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.text = text.replace(/\[Page \d+\]/g, ''); 
      window.speechSynthesis.speak(utterance);
    } else {
      showToast('Not Supported', 'Text-to-speech is not available in this browser.', 'error');
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        showToast('Copied', 'Message copied to clipboard', 'success');
    } catch (err) {
        console.error('Failed to copy:', err);
        showToast('Error', 'Failed to copy message', 'error');
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    
    const chatHeader = `DocuMind AI Chat Log\nDocument: ${document.name}\nDate: ${new Date().toLocaleString()}\n-------------------\n\n`;
    const chatBody = messages.map(m => {
      const role = m.role === 'user' ? 'You' : 'AI';
      const time = new Date(m.timestamp).toLocaleString();
      return `[${time}] ${role}:\n${m.text}\n`;
    }).join('\n');

    const blob = new Blob([chatHeader + chatBody], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.name.replace(/\s+/g, '_')}_chat_history.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported', 'Chat history exported successfully', 'success');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getModeLabel = (mode: AIModelMode) => {
    if (document.type === 'video') return { label: 'Video Pro', icon: <Video className="w-4 h-4" /> };
    switch(mode) {
      case 'fast': return { label: 'Flash', icon: <Zap className="w-4 h-4" /> };
      case 'pro': return { label: 'Pro', icon: <Sparkles className="w-4 h-4" /> };
      case 'thinking': return { label: 'Thinking', icon: <BrainCircuit className="w-4 h-4" /> };
    }
  };

  const getSuggestions = () => {
    if (document.type === 'pdf') {
        return [
            { text: "Summarize this document", color: "bg-blue-100 text-blue-800", icon: <FileText className="w-4 h-4" /> },
            { text: "Key takeaways", color: "bg-green-100 text-green-800", icon: <Sparkles className="w-4 h-4" /> },
            { text: "List action items", color: "bg-yellow-100 text-yellow-800", icon: <CheckCircle className="w-4 h-4" /> },
            { text: "Explain main concepts", color: "bg-purple-100 text-purple-800", icon: <Info className="w-4 h-4" /> }
        ];
    } else if (document.type === 'image') {
        return [
            { text: "Describe this image", color: "bg-blue-100 text-blue-800", icon: <ImageIcon className="w-4 h-4" /> },
            { text: "Extract text from image", color: "bg-green-100 text-green-800", icon: <FileText className="w-4 h-4" /> },
            { text: "Analyze style", color: "bg-purple-100 text-purple-800", icon: <Palette className="w-4 h-4" /> }
        ];
    } else {
        // Video
        return [
            { text: "Summarize the video", color: "bg-blue-100 text-blue-800", icon: <Video className="w-4 h-4" /> },
            { text: "What are the key events?", color: "bg-green-100 text-green-800", icon: <Sparkles className="w-4 h-4" /> },
            { text: "Describe the visual style", color: "bg-purple-100 text-purple-800", icon: <Palette className="w-4 h-4" /> }
        ];
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Top Bar: Minimalist */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#e1e3e1] z-10">
        <div 
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0f4f9] ${document.type !== 'video' ? 'hover:bg-[#e1e3e1] cursor-pointer' : ''} transition-colors`}
          onClick={() => document.type !== 'video' && setIsModeDropdownOpen(!isModeDropdownOpen)}
          ref={dropdownRef}
        >
          <span className="text-google-blue">{getModeLabel(modelMode).icon}</span>
          <span className="text-sm font-medium text-[#444746]">{document.name}</span>
          {document.type !== 'video' && <ChevronDown className="w-3 h-3 text-[#444746]" />}
          
           {isModeDropdownOpen && document.type !== 'video' && (
                <div className="absolute left-6 top-14 w-64 bg-white rounded-xl shadow-google-hover border border-[#e1e3e1] overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                   <div className="p-2 space-y-1">
                      <div className="px-3 py-2 text-xs font-bold text-[#444746] uppercase tracking-wider">Model Selection</div>
                      <button 
                        onClick={() => { onModeChange('fast'); setIsModeDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-3 text-sm rounded-lg transition-colors ${modelMode === 'fast' ? 'bg-[#c2e7ff] text-[#001d35]' : 'hover:bg-[#f0f4f9] text-[#1f1f1f]'}`}
                      >
                         <Zap className="w-5 h-5 text-orange-500" />
                         <div className="text-left">
                            <p className="font-medium">Flash Lite</p>
                            <p className="text-xs opacity-70">Fastest response</p>
                         </div>
                      </button>
                      <button 
                        onClick={() => { onModeChange('pro'); setIsModeDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-3 text-sm rounded-lg transition-colors ${modelMode === 'pro' ? 'bg-[#c2e7ff] text-[#001d35]' : 'hover:bg-[#f0f4f9] text-[#1f1f1f]'}`}
                      >
                         <Sparkles className="w-5 h-5 text-google-blue" />
                         <div className="text-left">
                            <p className="font-medium">Pro 2.0</p>
                            <p className="text-xs opacity-70">Complex reasoning</p>
                         </div>
                      </button>
                      <button 
                        onClick={() => { onModeChange('thinking'); setIsModeDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-3 text-sm rounded-lg transition-colors ${modelMode === 'thinking' ? 'bg-[#c2e7ff] text-[#001d35]' : 'hover:bg-[#f0f4f9] text-[#1f1f1f]'}`}
                      >
                         <BrainCircuit className="w-5 h-5 text-purple-500" />
                         <div className="text-left">
                            <p className="font-medium">Thinking</p>
                            <p className="text-xs opacity-70">Deep analysis</p>
                         </div>
                      </button>
                   </div>
                </div>
              )}
        </div>
        
        <div className="flex items-center gap-2">
           <button 
            onClick={handleExportChat}
            disabled={messages.length === 0}
            className="text-[#444746] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] p-2 rounded-full transition-colors disabled:opacity-30"
            title="Export"
          >
            <Download className="w-5 h-5" />
          </button>
           <button 
            onClick={onClearChat}
            className="text-[#444746] hover:text-[#b3261e] hover:bg-[#fce8e6] p-2 rounded-full transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 bg-white scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-[#1f1f1f] animate-fade-in">
            <div className="mb-6">
               <div className="text-4xl md:text-5xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-google-blue via-purple-500 to-google-red tracking-tight mb-4 py-2">
                  Hello, Human.
               </div>
               <p className="text-xl text-[#444746] font-normal">How can I help you with <span className="font-medium text-[#1f1f1f]">{document.name}</span> today?</p>
            </div>

            {/* Smart Suggestions Chips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
                {getSuggestions().map((suggestion, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSendMessage(suggestion.text)}
                        className="flex items-center justify-between p-4 bg-[#f0f4f9] hover:bg-[#e1e3e1] rounded-2xl transition-all text-left group"
                    >
                        <span className="text-sm font-medium text-[#1f1f1f]">{suggestion.text}</span>
                        <div className={`p-2 rounded-full ${suggestion.color} group-hover:scale-110 transition-transform`}>
                            {suggestion.icon}
                        </div>
                    </button>
                ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
             {/* Model Icon if AI */}
             {msg.role === 'model' && (
                <div className="w-8 h-8 mr-4 mt-1 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-google-blue animate-pulse" />
                </div>
             )}

            <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              <div 
                className={`text-base leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-[#f0f4f9] text-[#1f1f1f] px-5 py-3 rounded-3xl rounded-br-sm' 
                    : 'text-[#1f1f1f] px-0 py-0'
                }`}
              >
                {msg.text}
              </div>
              
              {/* Metadata Row */}
              <div className="flex items-center gap-2 mt-2 px-1">
                  {/* Citations */}
                   {msg.role === 'model' && msg.citations && msg.citations.length > 0 && (
                      <div className="flex gap-2 flex-wrap mr-2">
                          {msg.citations.map(page => (
                              <span key={page} className="px-2 py-1 bg-[#e1e3e1] text-[#444746] text-[10px] rounded-lg font-medium hover:bg-[#c2e7ff] hover:text-[#001d35] cursor-pointer transition-colors">
                                  Page {page}
                              </span>
                          ))}
                      </div>
                   )}
                   
                   <span 
                      className="text-[10px] text-[#444746] opacity-80 select-none"
                      title={new Date(msg.timestamp).toLocaleString()}
                   >
                       {formatTime(msg.timestamp)}
                   </span>

                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                           onClick={() => handleCopy(msg.text, msg.id)}
                           className="p-1 text-[#444746] hover:text-google-blue transition-colors rounded hover:bg-[#f0f4f9]"
                           title="Copy"
                       >
                           {copiedId === msg.id ? <Check className="w-3 h-3 text-google-green" /> : <Copy className="w-3 h-3" />}
                       </button>
                       {msg.role === 'model' && (
                           <button 
                               onClick={() => handleSpeak(msg.text)}
                               className="p-1 text-[#444746] hover:text-google-blue transition-colors rounded hover:bg-[#f0f4f9]"
                               title="Listen"
                           >
                               <Volume2 className="w-3 h-3" />
                           </button>
                       )}
                   </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start w-full animate-in fade-in duration-300">
             <div className="w-8 h-8 mr-4 mt-1 rounded-full flex items-center justify-center flex-shrink-0">
                 <Sparkles className="w-6 h-6 text-google-blue animate-spin" />
             </div>
             <div className="px-4 py-2 rounded-2xl bg-white border border-[#e1e3e1] shadow-sm flex items-center gap-2">
                 <span className="text-sm text-[#444746] font-medium">Generating response</span>
                 <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-google-blue rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-google-blue rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-google-blue rounded-full animate-bounce"></div>
                 </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Area (Gemini Style) */}
      <div className="p-4 bg-white/90 backdrop-blur-sm sticky bottom-0 z-20">
        <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative bg-[#f0f4f9] rounded-full transition-shadow hover:shadow-md focus-within:shadow-md border border-transparent focus-within:border-[#e1e3e1] flex items-center pr-2 pl-4 py-2">
            
            <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Enter a prompt here"}
                className={`flex-1 bg-transparent border-none focus:ring-0 text-[#1f1f1f] placeholder-[#444746] h-10 px-2 ${isListening ? 'placeholder-google-red animate-pulse' : ''}`}
                disabled={isLoading}
            />

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-2 rounded-full transition-colors ${
                        isListening 
                            ? 'bg-google-red text-white animate-pulse shadow-md' 
                            : 'text-[#1f1f1f] hover:bg-[#d3e3fd]'
                    }`}
                    title="Voice Input"
                >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                
                <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2 text-[#1f1f1f] hover:bg-[#d3e3fd] rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
            </form>
            <div className="text-center mt-2">
                 <p className="text-[10px] text-[#444746]">
                    DocuMind may display inaccurate info, including about people, so double-check its responses.
                 </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;