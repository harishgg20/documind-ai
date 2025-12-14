import React, { useEffect, useState, useRef } from 'react';
import { Trash2, Shield, User as UserIcon, Mail, Activity, Database, Users, ShieldAlert, ShieldCheck, Search, AlertTriangle, Ban, Undo2, X, FileText, MessageSquare, Clock, Calendar, ChevronRight, ClipboardList, Zap, Cpu, Server, Camera, Upload } from 'lucide-react';
import { UserRole, User } from '../types';

interface AdminUser extends User {
  date: string;
  docCount?: number;
  lastSeenStatus: string;
  isOnline: boolean;
}

interface ConfirmationModalConfig {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  isDestructive: boolean;
}

export const AdminView: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeDocs: 0,
    systemHealth: 'Optimal'
  });
  const [modalConfig, setModalConfig] = useState<ConfirmationModalConfig | null>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-fetch data periodically to update "Last Seen" status in real-time
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatLastSeen = (timestamp: number | undefined) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 120) return 'Active now'; // < 2 mins
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  const loadData = () => {
    // 1. Get Registered Users from Storage
    const storedUsers = JSON.parse(localStorage.getItem('documind_registered_users') || '[]');
    
    // 2. Define System/Hardcoded Users
    const systemUsers: AdminUser[] = [
      { id: '1', name: 'Harish Gouda', email: 'harishgouda52001@gmail.com', role: UserRole.ADMIN, date: 'System', lastSeenStatus: '', isOnline: false, status: 'active' }
    ];

    // 3. Map Registered Users to AdminUser format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedStoredUsers: AdminUser[] = storedUsers.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || UserRole.USER,
      date: new Date(parseInt(u.id)).toLocaleDateString(),
      lastSeenStatus: '',
      isOnline: false,
      status: u.status || 'active'
    }));

    const allUsers = [...systemUsers, ...mappedStoredUsers];

    // 4. Load Activity Data & Avatars
    const activityMap = JSON.parse(localStorage.getItem('documind_user_activity') || '{}');
    const avatarMap = JSON.parse(localStorage.getItem('documind_user_avatars') || '{}');

    // 5. Enrich Users with Doc Count, Activity, and Avatar
    let docCount = 0;
    const enrichedUsers = allUsers.map(u => {
      // Document Check
      const docKey = `documind_doc_${u.id}`;
      const hasDoc = localStorage.getItem(docKey);
      if (hasDoc) docCount++;

      // Activity Check
      const lastActive = activityMap[u.email];
      const lastSeenText = formatLastSeen(lastActive);
      const isOnline = lastSeenText === 'Active now';

      return { 
        ...u, 
        docCount: hasDoc ? 1 : 0,
        lastSeenStatus: lastSeenText,
        isOnline: isOnline,
        avatarUrl: avatarMap[u.email]
      };
    });

    setUsers(enrichedUsers);
    setStats({
      totalUsers: enrichedUsers.length,
      activeDocs: docCount,
      systemHealth: 'Optimal'
    });
    
    // Update selected user if open to reflect changes
    if (selectedUser) {
        const updatedSelected = enrichedUsers.find(u => u.email === selectedUser.email);
        if (updatedSelected) {
            setSelectedUser(updatedSelected);
        }
    }
  };

  const handleRoleChangeRequest = (user: AdminUser) => {
    if (user.email === 'harishgouda52001@gmail.com') {
      alert("Cannot modify system users.");
      return;
    }

    const newRole = user.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;
    const isDemotion = newRole === UserRole.USER;
    const action = isDemotion ? "Demote to User" : "Promote to Admin";
    
    setModalConfig({
      isOpen: true,
      title: 'Update User Role',
      isDestructive: isDemotion,
      message: (
        <span>
            Are you sure you want to <strong>{action.toLowerCase()}</strong> for <strong>{user.name}</strong>? 
            <br/><br/>
            This will change their access permissions immediately.
        </span>
      ),
      confirmLabel: action,
      onConfirm: () => {
        const storedUsers = JSON.parse(localStorage.getItem('documind_registered_users') || '[]');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatedUsers = storedUsers.map((u: any) => {
          if (u.email === user.email) {
            return { ...u, role: newRole };
          }
          return u;
        });
        localStorage.setItem('documind_registered_users', JSON.stringify(updatedUsers));
        loadData();
        setModalConfig(null);
      }
    });
  };

  const handleSuspendRequest = (user: AdminUser) => {
    if (user.email === 'harishgouda52001@gmail.com') {
      alert("Cannot modify system users.");
      return;
    }
    
    const isSuspended = user.status === 'suspended';
    
    setModalConfig({
      isOpen: true,
      title: isSuspended ? 'Restore User Access' : 'Suspend User Access',
      isDestructive: !isSuspended,
      message: isSuspended 
        ? <span>Are you sure you want to restore access for <strong>{user.name}</strong>? They will be able to log in again immediately.</span>
        : <span>Are you sure you want to suspend <strong>{user.name}</strong>? They will be logged out and unable to access the system. Their data will remain preserved.</span>,
      confirmLabel: isSuspended ? 'Restore User' : 'Suspend User',
      onConfirm: () => {
        const storedUsers = JSON.parse(localStorage.getItem('documind_registered_users') || '[]');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatedUsers = storedUsers.map((u: any) => {
          if (u.email === user.email) {
            return { ...u, status: isSuspended ? 'active' : 'suspended' };
          }
          return u;
        });
        localStorage.setItem('documind_registered_users', JSON.stringify(updatedUsers));
        
        loadData();
        setModalConfig(null);
      }
    });
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedUser) return;

    if (file.size > 2 * 1024 * 1024) {
        alert("Image size too large. Please use an image under 2MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const result = e.target?.result as string;
        
        // Persist avatar separately
        const avatarMap = JSON.parse(localStorage.getItem('documind_user_avatars') || '{}');
        avatarMap[selectedUser.email] = result;
        localStorage.setItem('documind_user_avatars', JSON.stringify(avatarMap));
        
        // Reload data to refresh UI
        loadData();
    };
    reader.readAsDataURL(file);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-white h-full relative font-sans">
      
      {/* System Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 border border-[#e1e3e1]">
                <div className="p-6 border-b border-[#e1e3e1] flex items-center justify-between bg-[#f8f9fa]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#c2e7ff] text-[#001d35] rounded-xl">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-[#1f1f1f]">System Activity Log</h3>
                            <p className="text-xs text-[#444746]">Full history of authentication events</p>
                        </div>
                    </div>
                    <button onClick={() => setShowLogsModal(false)} className="text-[#444746] hover:text-[#1f1f1f]">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="overflow-y-auto flex-1 p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#f8f9fa] sticky top-0 z-10">
                            <tr className="text-xs font-medium text-[#444746] tracking-wider">
                                <th className="px-6 py-3 border-b border-[#e1e3e1]">Event</th>
                                <th className="px-6 py-3 border-b border-[#e1e3e1]">User</th>
                                <th className="px-6 py-3 border-b border-[#e1e3e1] text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e1e3e1]">
                            {(() => {
                                const logs = JSON.parse(localStorage.getItem('documind_auth_logs') || '[]').reverse();
                                if (logs.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-sm text-[#444746]">
                                                No logs found.
                                            </td>
                                        </tr>
                                    )
                                }
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                return logs.map((log: any, i: number) => (
                                    <tr key={i} className="hover:bg-[#f0f4f9]">
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                                                log.action === 'LOGIN' ? 'bg-[#e6f4ea] text-[#137333] border-transparent' :
                                                log.action === 'LOGOUT' ? 'bg-[#f1f3f4] text-[#444746] border-transparent' :
                                                'bg-[#e8f0fe] text-[#1967d2] border-transparent'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-[#1f1f1f] font-mono">
                                            {log.email}
                                        </td>
                                        <td className="px-6 py-3 text-right text-xs text-[#444746]">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
                
                <div className="p-4 bg-[#f8f9fa] border-t border-[#e1e3e1] text-right">
                    <button 
                        onClick={() => setShowLogsModal(false)}
                        className="px-6 py-2 bg-white border border-[#747775] text-google-blue font-medium rounded-full hover:bg-[#f0f4f9] transition-colors text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* System Health Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-[#e1e3e1]">
                {/* Header */}
                <div className="p-6 border-b border-[#e1e3e1] flex items-center justify-between bg-[#f8f9fa]">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-[#e6f4ea] text-[#137333] rounded-xl">
                            <Activity className="w-5 h-5" />
                         </div>
                         <div>
                            <h3 className="text-lg font-medium text-[#1f1f1f]">System Health Status</h3>
                            <p className="text-xs text-[#444746]">Real-time performance metrics</p>
                         </div>
                    </div>
                    <button onClick={() => setShowHealthModal(false)} className="text-[#444746] hover:text-[#1f1f1f]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Latency */}
                    <div className="p-4 bg-white rounded-2xl border border-[#e1e3e1] shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Zap className="w-4 h-4 text-google-yellow" />
                            <span className="text-sm font-medium text-[#444746]">API Latency</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-normal text-[#1f1f1f]">245ms</span>
                            <span className="text-xs text-google-green font-medium mb-1">▼ 12ms</span>
                        </div>
                        <div className="w-full bg-[#f1f3f4] h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-google-yellow h-full rounded-full" style={{ width: '35%' }}></div>
                        </div>
                    </div>
                    
                     {/* Error Rate */}
                    <div className="p-4 bg-white rounded-2xl border border-[#e1e3e1] shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle className="w-4 h-4 text-google-red" />
                            <span className="text-sm font-medium text-[#444746]">Error Rate</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-normal text-[#1f1f1f]">0.12%</span>
                            <span className="text-xs text-[#444746] font-medium mb-1">Last 24h</span>
                        </div>
                        <div className="w-full bg-[#f1f3f4] h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-google-red h-full rounded-full" style={{ width: '2%' }}></div>
                        </div>
                    </div>

                    {/* CPU Usage */}
                    <div className="p-4 bg-white rounded-2xl border border-[#e1e3e1] shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Cpu className="w-4 h-4 text-google-blue" />
                            <span className="text-sm font-medium text-[#444746]">Server Load</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-normal text-[#1f1f1f]">42%</span>
                            <span className="text-xs text-[#444746] font-medium mb-1">4 Cores Active</span>
                        </div>
                         <div className="w-full bg-[#f1f3f4] h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-google-blue h-full rounded-full" style={{ width: '42%' }}></div>
                        </div>
                    </div>

                     {/* Uptime */}
                     <div className="p-4 bg-white rounded-2xl border border-[#e1e3e1] shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Server className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium text-[#444746]">System Uptime</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-normal text-[#1f1f1f]">99.98%</span>
                            <span className="text-xs text-google-green font-medium mb-1">Stable</span>
                        </div>
                        <div className="w-full bg-[#f1f3f4] h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-purple-400 h-full rounded-full" style={{ width: '99%' }}></div>
                        </div>
                    </div>
                </div>
                
                <div className="px-6 pb-6">
                    <h4 className="text-xs font-medium text-[#444746] uppercase tracking-wider mb-3">Recent Alerts</h4>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-[#e6f4ea] border border-[#a8dab5] rounded-lg text-sm">
                            <span className="flex items-center gap-2 text-[#137333]">
                                <ShieldCheck className="w-4 h-4" />
                                System backup completed successfully
                            </span>
                            <span className="text-xs text-[#137333]">2 mins ago</span>
                        </div>
                         <div className="flex items-center justify-between p-3 bg-[#fef7e0] border border-[#fdd663] rounded-lg text-sm">
                            <span className="flex items-center gap-2 text-[#b06000]">
                                <Activity className="w-4 h-4" />
                                High traffic detected on API endpoint
                            </span>
                            <span className="text-xs text-[#b06000]">1 hour ago</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-[#f8f9fa] border-t border-[#e1e3e1] text-right">
                    <button 
                        onClick={() => setShowHealthModal(false)}
                        className="px-6 py-2 bg-white border border-[#747775] text-google-blue font-medium rounded-full hover:bg-[#f0f4f9] transition-colors text-sm"
                    >
                        Close Report
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {modalConfig?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-[#e1e3e1]">
            <div className="p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                modalConfig.isDestructive ? 'bg-[#fce8e6] text-[#b3261e]' : 'bg-[#e8f0fe] text-[#1967d2]'
              }`}>
                {modalConfig.isDestructive ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
              
              <h3 className="text-xl font-normal text-[#1f1f1f] mb-2">{modalConfig.title}</h3>
              <p className="text-[#444746] text-sm leading-relaxed mb-8">
                {modalConfig.message}
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setModalConfig(null)}
                  className="px-6 py-2.5 text-google-blue font-medium rounded-full hover:bg-[#f0f4f9] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={modalConfig.onConfirm}
                  className={`px-6 py-2.5 text-white font-medium rounded-full transition-colors shadow-sm ${
                    modalConfig.isDestructive 
                      ? 'bg-[#b3261e] hover:bg-[#8c1d18]' 
                      : 'bg-[#0b57d0] hover:bg-[#0842a0]'
                  }`}
                >
                  {modalConfig.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Side Panel */}
      {selectedUser && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedUser(null)}
          />
          
          {/* Panel */}
          <div className="relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto border-l border-[#e1e3e1] animate-in slide-in-from-right duration-300">
             <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-[#e1e3e1] p-6 z-10">
                <div className="flex items-start justify-between mb-6">
                    <button 
                      onClick={() => setSelectedUser(null)}
                      className="p-2 -ml-2 text-[#444746] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    {selectedUser.status === 'suspended' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#fce8e6] text-[#b3261e]">
                           Suspended
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4">
                   <div className="relative group">
                       <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-medium overflow-hidden border-2 border-white shadow-md ${
                          selectedUser.role === 'ADMIN' ? 'bg-[#f3e8fd] text-[#6e24b7]' : 'bg-[#c2e7ff] text-[#001d35]'
                       }`}>
                           {selectedUser.avatarUrl ? (
                               <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="w-full h-full object-cover" />
                           ) : (
                               selectedUser.name.charAt(0).toUpperCase()
                           )}
                       </div>
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md border border-[#e1e3e1] text-[#444746] hover:text-google-blue transition-colors"
                         title="Upload Avatar"
                       >
                           <Camera className="w-3 h-3" />
                       </button>
                       <input 
                          type="file" 
                          ref={fileInputRef}
                          className="hidden" 
                          accept="image/*"
                          onChange={handleAvatarUpload}
                       />
                   </div>
                   <div>
                       <h2 className="text-xl font-normal text-[#1f1f1f]">{selectedUser.name}</h2>
                       <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            selectedUser.role === 'ADMIN' ? 'bg-[#f3e8fd] text-[#6e24b7]' : 'bg-[#c2e7ff] text-[#001d35]'
                          }`}>
                             {selectedUser.role}
                          </span>
                          <span className="text-xs text-[#444746]">{selectedUser.email}</span>
                       </div>
                   </div>
                </div>
             </div>

             <div className="p-6 space-y-8">
                {/* 1. Document Section */}
                <section>
                   <h3 className="text-xs font-medium text-[#444746] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Active Document
                   </h3>
                   {(() => {
                      const docKey = `documind_doc_${selectedUser.id}`;
                      const savedDoc = localStorage.getItem(docKey);
                      if (savedDoc) {
                         const doc = JSON.parse(savedDoc);
                         return (
                            <div className="bg-[#f8f9fa] border border-[#e1e3e1] rounded-2xl p-4">
                               <div className="flex items-center gap-3">
                                  <div className="p-2 bg-white rounded-xl border border-[#e1e3e1] text-google-blue">
                                     <FileText className="w-6 h-6" />
                                  </div>
                                  <div>
                                     <p className="font-medium text-[#1f1f1f] text-sm">{doc.name}</p>
                                     <p className="text-xs text-[#444746]">{doc.totalPages} pages • Uploaded {new Date(doc.uploadDate).toLocaleDateString()}</p>
                                  </div>
                               </div>
                            </div>
                         );
                      }
                      return (
                         <div className="text-center p-6 bg-[#f8f9fa] rounded-2xl border border-[#e1e3e1] border-dashed">
                            <p className="text-sm text-[#444746]">No document currently uploaded.</p>
                         </div>
                      );
                   })()}
                </section>

                {/* 2. Chat History Section */}
                <section>
                   <h3 className="text-xs font-medium text-[#444746] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Recent Conversation
                   </h3>
                   <div className="space-y-3">
                      {(() => {
                         const msgKey = `documind_msgs_${selectedUser.id}`;
                         const savedMsgs = localStorage.getItem(msgKey);
                         if (savedMsgs) {
                            const msgs = JSON.parse(savedMsgs);
                            if (msgs.length > 0) {
                               // Show last 3 messages
                               // eslint-disable-next-line @typescript-eslint/no-explicit-any
                               return msgs.slice(-3).map((m: any) => (
                                  <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                     <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${
                                        m.role === 'user' ? 'bg-[#c2e7ff] text-[#001d35]' : 'bg-[#e6f4ea] text-[#137333]'
                                     }`}>
                                        {m.role === 'user' ? 'U' : 'AI'}
                                     </div>
                                     <div className={`p-3 rounded-xl text-xs max-w-[85%] ${
                                        m.role === 'user' ? 'bg-[#f0f4f9] text-[#1f1f1f]' : 'bg-white border border-[#e1e3e1] text-[#1f1f1f]'
                                     }`}>
                                        <p className="line-clamp-3">{m.text}</p>
                                        <p className="text-[10px] text-[#444746] mt-1 text-right">{new Date(m.timestamp).toLocaleTimeString()}</p>
                                     </div>
                                  </div>
                               ));
                            }
                         }
                         return <p className="text-sm text-[#444746] italic pl-2">No chat history available.</p>;
                      })()}
                   </div>
                </section>

                {/* 3. Activity Log Section */}
                <section>
                   <h3 className="text-xs font-medium text-[#444746] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Activity Log
                   </h3>
                   <div className="relative border-l-2 border-[#e1e3e1] ml-2 space-y-6">
                      {(() => {
                         const allLogs = JSON.parse(localStorage.getItem('documind_auth_logs') || '[]');
                         // eslint-disable-next-line @typescript-eslint/no-explicit-any
                         const userLogs = allLogs.filter((l: any) => l.email === selectedUser.email).reverse().slice(0, 10);
                         
                         if (userLogs.length === 0) {
                            return <div className="pl-6 text-sm text-[#444746]">No activity recorded.</div>
                         }

                         // eslint-disable-next-line @typescript-eslint/no-explicit-any
                         return userLogs.map((log: any, idx: number) => (
                            <div key={idx} className="relative pl-6">
                               <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                  log.action === 'LOGIN' ? 'bg-google-green' : 
                                  log.action === 'LOGOUT' ? 'bg-gray-400' : 'bg-google-blue'
                               }`}></div>
                               <div className="flex flex-col">
                                  <span className="text-sm font-medium text-[#1f1f1f]">
                                    {log.action === 'LOGIN' ? 'Logged In' : 
                                     log.action === 'LOGOUT' ? 'Logged Out' : 'Account Created'}
                                  </span>
                                  <span className="text-xs text-[#444746] flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(log.timestamp).toLocaleString()}
                                  </span>
                               </div>
                            </div>
                         ));
                      })()}
                   </div>
                </section>
             </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
            <h1 className="text-3xl font-normal text-[#1f1f1f] flex items-center gap-3">
                <Shield className="w-8 h-8 text-google-blue" />
                Admin Dashboard
            </h1>
            <p className="text-[#444746] mt-2">System overview and user management.</p>
            </div>
            <button
                onClick={() => setShowLogsModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#747775] text-google-blue rounded-full hover:bg-[#f0f4f9] transition-colors shadow-sm font-medium"
            >
                <ClipboardList className="w-4 h-4" />
                View System Logs
            </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#f0f4f9] p-6 rounded-[24px] shadow-sm flex items-center gap-4">
            <div className="p-3 bg-[#c2e7ff] text-[#001d35] rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[#444746] font-medium">Total Users</p>
              <h3 className="text-2xl font-normal text-[#1f1f1f]">{stats.totalUsers}</h3>
            </div>
          </div>

          <div className="bg-[#f3e8fd] p-6 rounded-[24px] shadow-sm flex items-center gap-4">
            <div className="p-3 bg-white text-[#6e24b7] rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[#444746] font-medium">Active Documents</p>
              <h3 className="text-2xl font-normal text-[#1f1f1f]">{stats.activeDocs}</h3>
            </div>
          </div>

          <div 
             onClick={() => setShowHealthModal(true)}
             className="bg-[#e6f4ea] p-6 rounded-[24px] shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow group"
          >
            <div className="p-3 bg-white text-[#137333] rounded-xl group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#444746] font-medium">System Health</p>
                <ChevronRight className="w-4 h-4 text-[#137333]" />
              </div>
              <h3 className="text-2xl font-normal text-[#1f1f1f]">{stats.systemHealth}</h3>
            </div>
          </div>
        </div>

        {/* User Management Table */}
        <div className="bg-white rounded-[24px] shadow-sm border border-[#e1e3e1] overflow-hidden">
          <div className="p-6 border-b border-[#e1e3e1] bg-white flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
             <div className="flex items-center gap-4">
               <h2 className="text-lg font-normal text-[#1f1f1f]">User Management</h2>
               <span className="text-xs font-medium text-[#444746] bg-[#f0f4f9] px-3 py-1 rounded-full">
                  {filteredUsers.length} Users
               </span>
             </div>

             <div className="relative group">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#444746]" />
                <input
                  type="text"
                  placeholder="Search users"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-6 py-2.5 text-sm bg-[#f0f4f9] rounded-full focus:outline-none focus:bg-[#e1e3e1] transition-colors w-full sm:w-64 placeholder-[#444746]"
                />
             </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-[#e1e3e1] text-xs font-medium text-[#444746] tracking-wider">
                  <th className="px-6 py-4">User Identity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Role & Access</th>
                  <th className="px-6 py-4">Data Usage</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1e3e1]">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr 
                      key={user.email} 
                      onClick={(e) => {
                        // Prevent opening panel if clicking action buttons
                        if ((e.target as HTMLElement).closest('button')) return;
                        setSelectedUser(user);
                      }}
                      className={`hover:bg-[#f0f4f9] transition-colors group cursor-pointer ${user.status === 'suspended' ? 'bg-[#fce8e6]/30' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden ${
                            user.status === 'suspended' ? 'bg-[#f1f3f4] text-[#444746]' :
                            user.role === 'ADMIN' 
                              ? 'bg-[#f3e8fd] text-[#6e24b7]' 
                              : 'bg-[#c2e7ff] text-[#001d35]'
                          }`}>
                             {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                             ) : (
                                user.name.charAt(0).toUpperCase()
                             )}
                          </div>
                          <div>
                            <p className={`font-medium ${user.status === 'suspended' ? 'text-[#444746]' : 'text-[#1f1f1f]'} flex items-center gap-1`}>
                              {user.name}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-[#444746]">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         {user.status === 'suspended' ? (
                             <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#fce8e6] text-[#b3261e]">
                                <Ban className="w-3 h-3" /> Suspended
                             </span>
                         ) : (
                             <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-google-green animate-pulse' : 'bg-[#c4c7c5]'}`}></div>
                                <span className={`text-sm ${user.isOnline ? 'text-[#137333] font-medium' : 'text-[#444746]'}`}>
                                    {user.lastSeenStatus}
                                </span>
                             </div>
                         )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN' 
                              ? 'bg-[#f3e8fd] text-[#6e24b7]' 
                              : 'bg-[#e6f4ea] text-[#137333]'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#444746]">
                        {user.docCount ? (
                           <span className="inline-flex items-center gap-1 text-google-blue bg-[#e8f0fe] px-3 py-1 rounded-full text-xs font-medium">
                              <Database className="w-3 h-3" /> 1 Document
                           </span>
                        ) : (
                          <span className="text-[#444746] text-xs">No data</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#444746] font-mono">
                        {user.date}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleRoleChangeRequest(user)}
                            disabled={user.email === 'harishgouda52001@gmail.com' || user.status === 'suspended'}
                            className={`p-2 rounded-full transition-colors ${
                              user.role === UserRole.ADMIN
                                ? 'text-[#6e24b7] hover:bg-[#f3e8fd]'
                                : 'text-google-blue hover:bg-[#e8f0fe]'
                            } disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed`}
                            title={user.role === UserRole.ADMIN ? "Demote to User" : "Promote to Admin"}
                          >
                            {user.role === UserRole.ADMIN ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                          </button>
                          
                          {/* Suspend / Restore Button */}
                          <button 
                            onClick={() => handleSuspendRequest(user)}
                            className={`p-2 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed ${
                                user.status === 'suspended'
                                ? 'text-google-green hover:bg-[#e6f4ea]'
                                : 'text-[#444746] hover:text-[#b3261e] hover:bg-[#fce8e6]'
                            }`}
                            title={user.status === 'suspended' ? "Restore Access" : "Suspend Access"}
                            disabled={user.email === 'harishgouda52001@gmail.com'}
                          >
                            {user.status === 'suspended' ? <Undo2 className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#444746]">
                       <div className="flex flex-col items-center justify-center gap-2">
                          <div className="p-4 bg-[#f0f4f9] rounded-full">
                             <Search className="w-6 h-6 text-[#444746]" />
                          </div>
                          <p className="font-medium">No users found</p>
                          <p className="text-xs">Try adjusting your search terms</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};