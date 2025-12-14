import React, { ReactNode } from 'react';
import { LogOut, FileText, User as UserIcon, Shield, Menu, Sparkles, HelpCircle, Settings } from 'lucide-react';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: ReactNode;
  user: User | null;
  onLogout: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenHelp?: () => void;
  onNewChat?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentView, onNavigate, onOpenHelp, onNewChat }) => {
  return (
    <div className="flex h-screen bg-[#f0f4f9] overflow-hidden font-sans">
      {/* Sidebar - Gemini Style */}
      <aside className="w-72 bg-[#f0f4f9] hidden md:flex flex-col p-4 gap-2">
        <div className="px-4 py-3 flex items-center justify-between mb-2">
           <div className="flex items-center gap-2 text-[#444746] hover:text-[#1f1f1f] cursor-pointer transition-colors">
              <Menu className="w-6 h-6" />
           </div>
        </div>

        <button 
          onClick={() => onNewChat ? onNewChat() : onNavigate('chat')}
          className="flex items-center gap-3 px-4 py-3 bg-[#dde3ea] text-[#1f1f1f] rounded-2xl shadow-sm hover:shadow transition-all duration-200 mb-4"
        >
          <Sparkles className="w-5 h-5 text-google-blue" />
          <span className="font-medium text-sm">New Chat</span>
        </button>

        <div className="flex-1 overflow-y-auto space-y-1">
          <div className="px-4 py-2 text-xs font-medium text-[#444746] mb-1">Recent</div>
          
          <button 
            onClick={() => onNavigate('chat')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-full transition-colors ${
              currentView === 'chat' 
                ? 'bg-[#c2e7ff] text-[#001d35]' 
                : 'text-[#444746] hover:bg-[#e1e3e1]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="truncate">Document Chat</span>
          </button>

          {user?.role === UserRole.ADMIN && (
            <button 
              onClick={() => onNavigate('admin')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-full transition-colors ${
                currentView === 'admin' 
                  ? 'bg-[#c2e7ff] text-[#001d35]' 
                  : 'text-[#444746] hover:bg-[#e1e3e1]'
            }`}
            >
              <Shield className="w-4 h-4" />
              Admin Panel
            </button>
          )}
          
          <button 
            onClick={() => onNavigate('profile')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-full transition-colors ${
              currentView === 'profile' 
                ? 'bg-[#c2e7ff] text-[#001d35]' 
                : 'text-[#444746] hover:bg-[#e1e3e1]'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>

           {onOpenHelp && (
            <button 
              onClick={onOpenHelp}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-full transition-colors text-[#444746] hover:bg-[#e1e3e1]`}
            >
              <HelpCircle className="w-4 h-4" />
              How it Works
            </button>
          )}
        </div>

        <div className="mt-auto pt-4">
            <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#444746] hover:bg-[#e1e3e1] rounded-full transition-colors group"
            >
                <div className="w-8 h-8 rounded-full bg-google-blue text-white flex items-center justify-center text-sm font-medium overflow-hidden">
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        user?.name.charAt(0).toUpperCase()
                    )}
                </div>
                <div className="flex-1 text-left truncate">
                    <div className="text-[#1f1f1f] group-hover:text-google-blue transition-colors">{user?.name}</div>
                    <div className="text-xs text-[#444746] opacity-80 font-normal">Sign out</div>
                </div>
                <LogOut className="w-4 h-4" />
            </button>
            
            <div className="px-4 py-3 text-[10px] text-[#444746] flex flex-wrap gap-x-2">
                <span>• Privacy</span>
                <span>• Help</span>
                <span>• DocuMind</span>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative bg-white md:rounded-3xl md:my-4 md:mr-4 shadow-sm overflow-hidden border border-[#e1e3e1]">
        {/* Mobile Header */}
        <div className="md:hidden h-16 bg-[#f0f4f9] flex items-center justify-between px-4 sticky top-0 z-20">
           <div className="flex items-center gap-2 text-[#444746] font-bold text-lg">
            <Sparkles className="w-6 h-6 text-google-blue" />
            <span>DocuMind</span>
          </div>
          <div className="flex gap-2">
             <button onClick={() => onNavigate('profile')} className="p-2 text-[#444746] hover:bg-[#e1e3e1] rounded-full">
                <Settings className="w-5 h-5" />
             </button>
             {onOpenHelp && (
                <button onClick={onOpenHelp} className="p-2 text-[#444746] hover:bg-[#e1e3e1] rounded-full">
                   <HelpCircle className="w-5 h-5" />
                </button>
             )}
             <button onClick={onLogout} className="p-2 text-[#444746] hover:bg-[#e1e3e1] rounded-full">
                <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;