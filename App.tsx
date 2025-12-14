import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/Toast';
import Layout from './components/Layout';
import AuthView from './views/AuthView';
import { AdminView } from './views/AdminView';
import { ProfileView } from './views/ProfileView';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import HelpModal from './components/HelpModal';
import { extractTextFromPDF } from './services/pdf';
import { generateAnswer } from './services/gemini';
import { saveSession, getSession, clearSession } from './services/storage';
import { ProcessedDocument, ChatMessage, UserRole, AIModelMode } from './types';
import { Bot, Loader2, Video, Sparkles, Zap, BrainCircuit } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('chat');
  const [document, setDocument] = useState<ProcessedDocument | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [modelMode, setModelMode] = useState<AIModelMode>('fast');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // Track initialization to prevent overwriting with empty state on initial render
  const [isInitialized, setIsInitialized] = useState(false);
  // Track initial restoration to prevent UI flash
  const [isRestoring, setIsRestoring] = useState(true);

  // 1. LOAD: Restore state from IndexedDB when User logs in or App mounts
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      if (isInitialized) {
        setIsRestoring(true);
      }

      if (!user?.id) {
        if (isMounted) setIsRestoring(false);
        return;
      }

      // Small delay for UI smoothness
      await new Promise(resolve => setTimeout(resolve, 50));

      try {
        const session = await getSession(user.id);

        if (isMounted) {
            if (session) {
                // Integrity check: if messages exist but no doc, it might be weird, but we allow it 
                // if the user cleared the doc. However, usually we want strict pairing.
                // If the stored document is null but we have messages, we probably want to reset unless it was a text-only chat (future feature)
                if (!session.document && session.messages.length > 0) {
                     // Check if messages imply a document was there (e.g. they reference it)
                     // For now, let's trust the DB.
                     setDocument(null);
                     setMessages([]);
                } else {
                    setDocument(session.document);
                    setMessages(session.messages);
                }
            } else {
                setDocument(null);
                setMessages([]);
            }
        }
      } catch (e) {
        console.error("Failed to restore session", e);
        if (isMounted) {
            setDocument(null);
            setMessages([]);
        }
      } finally {
        if (isMounted) {
          setIsInitialized(true);
          setIsRestoring(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [user?.id]); // Only re-run if user ID changes

  // 2. AUTO-SAVE: Persist Document & Chat History changes to IndexedDB
  useEffect(() => {
    if (user?.id && isInitialized) {
      // Debounce or just save. IDB is async so it won't block UI like localStorage might.
      saveSession(user.id, document, messages).catch(err => {
          console.error("Auto-save failed:", err);
      });
    }
  }, [document, messages, user?.id, isInitialized]);

  const handleFileProcess = async (file: File) => {
    setIsProcessing(true);
    try {
      let newDoc: ProcessedDocument | null = null;

      if (file.type === 'application/pdf') {
        // --- PDF Processing ---
        const extractedContent = await extractTextFromPDF(file);
        newDoc = {
          name: file.name,
          type: 'pdf',
          totalPages: extractedContent.length,
          content: extractedContent,
          uploadDate: Date.now()
        };
      } else if (file.type.startsWith('image/')) {
        // --- Image Processing ---
        const reader = new FileReader();
        // Wrap FileReader in promise to await it
        await new Promise<void>((resolve) => {
            reader.onload = (e) => {
                const result = e.target?.result as string;
                const base64Data = result.split(',')[1];
                
                newDoc = {
                    name: file.name,
                    type: 'image',
                    totalPages: 1,
                    content: [], 
                    inlineData: base64Data,
                    mimeType: file.type,
                    uploadDate: Date.now()
                };
                resolve();
            };
            reader.readAsDataURL(file);
        });
      } else if (file.type.startsWith('video/')) {
        // --- Video Processing ---
        const reader = new FileReader();
         // Wrap FileReader in promise to await it
        await new Promise<void>((resolve) => {
            reader.onload = (e) => {
                const result = e.target?.result as string;
                const base64Data = result.split(',')[1];

                newDoc = {
                    name: file.name,
                    type: 'video',
                    totalPages: 1,
                    content: [],
                    inlineData: base64Data,
                    mimeType: file.type,
                    uploadDate: Date.now()
                };
                resolve();
            };
            reader.readAsDataURL(file);
        });
      }

      if (newDoc) {
          setDocument(newDoc);
          
          // Add a system message to history to indicate upload
          const uploadMsg: ChatMessage = {
              id: Date.now().toString(),
              role: 'model',
              text: `I have processed **${file.name}**. You can now ask questions about this document.`,
              timestamp: Date.now()
          };
          setMessages([uploadMsg]);
      }

    } catch (error) {
      console.error("Failed to process file", error);
      alert("Failed to process file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewChat = async () => {
    if (user?.id) {
        await clearSession(user.id);
    }
    setDocument(null);
    setMessages([]);
    setCurrentView('chat');
  };

  const handleSendMessage = async (text: string) => {
    if (!document) return;

    // 1. Add User Message
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsChatLoading(true);

    try {
      // Prepare history for API (convert internal format to API format)
      // Filter out messages that might be purely system notifications if needed, 
      // but usually the model handles them fine if they are 'model' role.
      const apiHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Pass the selected modelMode (or force it for video in service)
      const response = await generateAnswer(document, text, apiHistory, modelMode);

      // 2. Add AI Response
      const newAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        citations: response.citations,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, newAiMsg]);
    } catch (error) {
      console.error("Chat Error", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I encountered an error while processing your request. Please check your API key or internet connection. If uploading video, ensure it's under 50MB.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const renderChatContent = () => {
    if (!document) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 h-full overflow-y-auto">
          <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-[#e1e3e1] text-google-blue mb-6 shadow-md shadow-blue-100">
              <Bot className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-normal text-[#1f1f1f] mb-4 tracking-tight">Welcome to DocuMind AI</h1>
            <p className="text-[#444746] max-w-lg mx-auto text-lg leading-relaxed">
              Upload PDFs, Images, or <span className="text-purple-600 font-medium">Videos</span> to analyze content instantly.
            </p>
            
            <button 
                onClick={() => setIsHelpOpen(true)}
                className="mt-6 px-6 py-2 bg-white border border-[#c4c7c5] rounded-full text-[#1f1f1f] font-medium text-sm hover:bg-[#f0f4f9] transition-colors"
            >
                How it works
            </button>
          </div>
          
          <div className="w-full max-w-2xl bg-white rounded-[32px] shadow-xl shadow-gray-100/50 p-8 border border-[#e1e3e1] animate-in fade-in zoom-in-95 duration-500 delay-100">
             <h2 className="text-lg font-medium text-[#1f1f1f] mb-6 px-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-google-blue" />
                Upload Content
             </h2>
             <FileUpload onFileProcess={handleFileProcess} isProcessing={isProcessing} />
          </div>

          <div className="mt-10 grid grid-cols-3 gap-8 max-w-2xl w-full">
              <div className="flex flex-col items-center text-center gap-2">
                 <div className="p-3 bg-[#e8f0fe] rounded-full text-google-blue">
                    <Zap className="w-5 h-5" />
                 </div>
                 <span className="text-xs font-medium text-[#444746]">Instant Analysis</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                 <div className="p-3 bg-[#f3e8fd] rounded-full text-purple-600">
                    <Video className="w-5 h-5" />
                 </div>
                 <span className="text-xs font-medium text-[#444746]">Video Support</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                 <div className="p-3 bg-[#e6f4ea] rounded-full text-google-green">
                    <BrainCircuit className="w-5 h-5" />
                 </div>
                 <span className="text-xs font-medium text-[#444746]">Deep Thinking</span>
              </div>
          </div>
        </div>
      );
    }

    return (
      <ChatInterface 
        document={document} 
        messages={messages} 
        onSendMessage={handleSendMessage}
        onClearChat={clearChat}
        isLoading={isChatLoading}
        modelMode={modelMode}
        onModeChange={setModelMode}
      />
    );
  };

  // Show loading spinner during initial session restoration to avoid UI flash
  if (isRestoring) {
    return (
      <Layout 
        user={user} 
        onLogout={logout} 
        currentView={currentView} 
        onNavigate={setCurrentView}
      >
        <div className="flex flex-col h-full items-center justify-center bg-gray-50 gap-4">
          <Loader2 className="w-10 h-10 text-google-blue animate-spin" />
          <p className="text-[#444746] text-sm font-medium animate-pulse">Loading conversation...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      user={user} 
      onLogout={logout} 
      currentView={currentView} 
      onNavigate={setCurrentView}
      onOpenHelp={() => setIsHelpOpen(true)}
      onNewChat={handleNewChat}
    >
      {currentView === 'admin' && user?.role === UserRole.ADMIN ? (
        <AdminView />
      ) : currentView === 'profile' ? (
        <ProfileView />
      ) : (
        renderChatContent()
      )}
      
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </Layout>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <AuthView />;
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
        <ToastContainer />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;