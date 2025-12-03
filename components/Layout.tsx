

import React, { useState, useEffect } from 'react';
import { User, UserRole, Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  activePage: string;
  onNavigate: (page: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  projectId: string;
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onClearNotifications?: () => void;
  notificationTrigger?: number; // Timestamp to trigger auto-open
}

// Internal Component for the Jet Fighter Animation
const JetFighter: React.FC<{ status: 'IDLE' | 'FLYING_IN' | 'HOVERING' | 'FLYING_OUT' }> = ({ status }) => {
  if (status === 'IDLE') return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden flex items-center justify-start">
      <style>
        {`
          @keyframes jet-in {
            0% { transform: translateX(-120vw) skewX(-10deg); }
            60% { transform: translateX(calc(50vw - 150px)) skewX(0deg); }
            80% { transform: translateX(calc(50vw - 100px)) skewX(5deg); } 
            100% { transform: translateX(calc(50vw - 120px)) skewX(0deg); }
          }
          @keyframes jet-out {
            0% { transform: translateX(calc(50vw - 120px)); opacity: 1; }
            100% { transform: translateX(120vw) scale(0.8); opacity: 0; }
          }
          @keyframes jet-hover {
            0% { transform: translateX(calc(50vw - 120px)) translateY(0px); }
            50% { transform: translateX(calc(50vw - 120px)) translateY(-10px); }
            100% { transform: translateX(calc(50vw - 120px)) translateY(0px); }
          }
          @keyframes sign-pop {
             0% { transform: translate(-50%, 20px) scale(0); opacity: 0; }
             70% { transform: translate(-50%, -20px) scale(1.1); opacity: 1; }
             100% { transform: translate(-50%, -10px) scale(1); opacity: 1; }
          }
        `}
      </style>
      
      {/* Jet Container */}
      <div 
        className="absolute top-1/2"
        style={{ 
            animation: status === 'FLYING_IN' ? 'jet-in 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' : 
                       status === 'FLYING_OUT' ? 'jet-out 1s ease-in forwards' : 
                       'jet-hover 2s ease-in-out infinite'
        }}
      >
        {/* Sign */}
        <div 
            className={`absolute -top-24 left-1/2 transform -translate-x-1/2 bg-white text-black px-4 py-2 rounded-lg border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] text-center w-48 transition-all duration-500 ${status === 'HOVERING' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
            style={status === 'HOVERING' ? { animation: 'sign-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' } : {}}
        >
            <div className="font-bold text-sm uppercase">Mission Complete</div>
            <div className="text-xs">Test Finished</div>
            <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-black rotate-45"></div>
        </div>

        {/* Jet SVG */}
        <svg width="200" height="80" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
            {/* Afterburner Flame */}
            <path d="M0 40L30 35L20 40L30 45L0 40Z" fill="#FF4400" className="animate-pulse" style={{ opacity: status === 'FLYING_OUT' || status === 'FLYING_IN' ? 1 : 0.5 }}/>
            {/* Body */}
            <path d="M180 40L140 30H60L40 35V45L60 50H140L180 40Z" fill="#1e293b" stroke="#475569" strokeWidth="2"/>
            {/* Cockpit */}
            <path d="M130 30L150 25H160L145 30H130Z" fill="#00C7FD" opacity="0.8"/>
            {/* Wings */}
            <path d="M110 30L90 10H120L140 30H110Z" fill="#334155" stroke="#475569" strokeWidth="2"/>
            <path d="M110 50L90 70H120L140 50H110Z" fill="#334155" stroke="#475569" strokeWidth="2"/>
            {/* Tail */}
            <path d="M50 35L30 20H50L60 35H50Z" fill="#334155" stroke="#475569" strokeWidth="2"/>
            <path d="M50 45L30 60H50L60 45H50Z" fill="#334155" stroke="#475569" strokeWidth="2"/>
        </svg>
      </div>
    </div>
  );
};


export const Layout: React.FC<LayoutProps> = ({ 
  children, user, onLogout, activePage, onNavigate, 
  isDarkMode, toggleDarkMode, projectId, 
  notifications = [], onNotificationClick, onClearNotifications,
  notificationTrigger = 0
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [jetStatus, setJetStatus] = useState<'IDLE' | 'FLYING_IN' | 'HOVERING' | 'FLYING_OUT'>('IDLE');
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Calculate unread Neural Assistance notifications for sidebar badge
  const unreadSupportCount = notifications.filter(n => 
      !n.read && (n.title.includes('Neural') || n.title.includes('Signal'))
  ).length;

  // Permissions
  const canAccessAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.LAB_CREW;
  const isViewer = user?.role === UserRole.VIEWER;

  // Animation Sequence Logic
  useEffect(() => {
    if (notificationTrigger > 0) {
        // 1. Fly In
        setJetStatus('FLYING_IN');
        
        // 2. Stop & Show Sign (after 1.5s flight)
        const t1 = setTimeout(() => {
            setJetStatus('HOVERING');
        }, 1500);

        // 3. Open Dropdown & Fly Away (after showing sign for 2.5s)
        const t2 = setTimeout(() => {
            setShowNotifications(true);
            setJetStatus('FLYING_OUT');
        }, 4000);

        // 4. Reset (after fly out)
        const t3 = setTimeout(() => {
            setJetStatus('IDLE');
        }, 5000);

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [notificationTrigger]);

  // REORDERED NAV ITEMS: My Dashboard first, then Dashboard
  const navItems = [
    { id: 'profile', label: 'My Dashboard', icon: '👤' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    
    // Neural Assistance (Available to all) - NOW WITH BADGE
    { id: 'support', label: 'Neural Assistance', icon: '🔮', badge: unreadSupportCount > 0 ? unreadSupportCount : undefined },

    // Hide Operational tabs for Viewers
    ...(!isViewer ? [
      { id: 'boards', label: 'Board Farm', icon: '🖥️' },
      { id: 'tests', label: 'Test Runner', icon: '🚀' }
    ] : []),

    { id: 'results', label: 'Results & AI', icon: '🧠' },
    
    // Only show admin link if admin or lab crew
    ...(canAccessAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: '⚙️' }] : []),
    
    // The "Boring" Game
    { id: 'boring', label: 'BORING', icon: '🐍' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex flex-row font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300 overflow-hidden relative">
      
      {/* Visual Effects Layer */}
      <JetFighter status={jetStatus} />

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 dark:bg-[#06080F] border-r border-slate-800 text-white flex flex-col shadow-2xl z-30">
        <div className="h-16 flex items-center px-6 border-b border-white/5 bg-slate-900 dark:bg-[#06080F]">
          <button 
            onClick={() => onNavigate('dashboard')} 
            className="flex items-center focus:outline-none group w-full text-left"
            title="Go to Dashboard"
          >
            <div className="relative w-8 h-8 mr-3 transition-transform group-hover:scale-110">
               <div className="absolute inset-0 rounded-full border-2 border-t-infra-accent border-r-transparent border-b-infra-purple border-l-transparent animate-spin-slow"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <svg className="w-5 h-5 text-infra-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                 </svg>
               </div>
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-infra-accent group-hover:text-white transition-colors">Infrasense AI</span>
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-md transition-all duration-200 group ${
                activePage === item.id
                  ? 'bg-gradient-to-r from-intel-blue/20 to-transparent border-l-4 border-infra-accent text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center">
                  <span className={`mr-3 text-xl transition-transform group-hover:scale-110 ${activePage === item.id ? 'text-infra-accent' : ''}`}>{item.icon}</span>
                  <span className="font-medium tracking-wide">{item.label}</span>
              </div>
              {item.badge && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {item.badge}
                  </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 bg-slate-800/30 border-t border-slate-800/50">
           {/* Dark Mode Toggle */}
           <div className="flex items-center justify-between mb-4 bg-black/20 p-2 rounded-lg">
             <span className="text-xs text-slate-400 font-medium">Theme</span>
             <button 
              onClick={toggleDarkMode}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${isDarkMode ? 'bg-infra-purple' : 'bg-slate-500'}`}
             >
                <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`}></span>
             </button>
           </div>

          <div className="flex items-center mb-3">
            {user?.photo ? (
                <img src={user.photo} alt="Profile" className="w-8 h-8 rounded-full object-cover shadow-lg border border-slate-600" />
            ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-intel-blue to-infra-purple flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {user?.name.charAt(0)}
                </div>
            )}
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-infra-accent uppercase tracking-wider">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-2 px-4 bg-slate-800 hover:bg-red-900/50 hover:text-red-400 text-slate-400 rounded text-xs font-bold uppercase tracking-wider transition-colors border border-slate-700 hover:border-red-900 mb-4"
          >
            Sign Out
          </button>
          <div className="text-center pt-2 border-t border-white/5">
             <p className="text-[10px] text-slate-600 dark:text-slate-500 font-mono tracking-widest">PROJ: {projectId}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-[#0B0F19] relative">
        {/* Background Grid for Dark Mode */}
        {isDarkMode && (
          <div className="absolute inset-0 pointer-events-none opacity-5">
             <div className="absolute w-full h-full bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          </div>
        )}

        <header className="h-16 bg-white dark:bg-[#151B2B] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shadow-sm z-20 transition-colors duration-300">
          <h1 className="text-xl font-light text-slate-800 dark:text-white capitalize tracking-wide">
            <span className="text-infra-accent mr-2">//</span>
            {activePage.replace('-', ' ')}
          </h1>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-green-900/20 px-3 py-1 rounded-full border border-green-900/30">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-fast"></span>
              <span className="text-xs font-medium text-green-700 dark:text-green-400">System Online</span>
            </div>

            {/* NOTIFICATION BELL */}
            <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)} 
                  className="p-2 text-slate-400 hover:text-infra-accent transition-colors relative focus:outline-none"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping border border-white dark:border-slate-900"></span>
                    )}
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
                    )}
                </button>

                {showNotifications && (
                    <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 z-20 overflow-hidden animate-fade-in">
                        <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <h3 className="font-bold text-sm text-slate-700 dark:text-white">Notifications ({unreadCount})</h3>
                            <div className="flex space-x-2">
                                <button onClick={onClearNotifications} className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Clear All</button>
                            </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-xs">No notifications</div>
                            ) : (
                                notifications.map(notif => (
                                    <div 
                                        key={notif.id}
                                        onClick={() => {
                                            if (onNotificationClick) onNotificationClick(notif);
                                            setShowNotifications(false);
                                        }}
                                        className={`p-3 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-2 border-l-intel-blue' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-bold ${notif.type === 'SUCCESS' ? 'text-green-600 dark:text-green-400' : notif.type === 'ERROR' ? 'text-red-500' : 'text-intel-blue'}`}>{notif.title}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{notif.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    </>
                )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative z-0">
          {children}
        </div>
      </main>
    </div>
  );
};