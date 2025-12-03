import React, { useState, useRef } from 'react';
import { User, Board, BoardStatus, TestJob, TestStatus, Notification, UserRole } from '../types';

interface UserDashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
  boards: Board[];
  onNavigate: (page: string) => void;
  onReleaseBoard: (board: Board) => void;
  history: TestJob[];
  notifications: Notification[];
  onNotificationClick: (notif: Notification) => void;
  onClearNotifications: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ 
    user, 
    onUpdateUser, 
    boards, 
    onNavigate, 
    onReleaseBoard, 
    history,
    notifications,
    onNotificationClick,
    onClearNotifications
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    businessUnit: user.businessUnit || '',
    photo: user.photo || '',
    geosite: user.geosite || '',
    project: user.project || ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filterBoard, setFilterBoard] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const myReservations = boards.filter(b => b.status === BoardStatus.RESERVED && b.reservedBy === user.name);

  const handleProfileSave = () => {
    onUpdateUser({
      ...user,
      name: formData.name,
      businessUnit: formData.businessUnit,
      photo: formData.photo,
      geosite: formData.geosite,
      project: formData.project
    });
    setIsEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, photo: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredHistory = history.filter(job => {
    const matchBoard = filterBoard === 'ALL' || job.boardId.includes(filterBoard);
    const matchStatus = filterStatus === 'ALL' || job.status === filterStatus;
    return matchBoard && matchStatus;
  });

  const exportData = () => {
    const headers = "Job ID,Test Name,Board,Status,Date\n";
    const rows = filteredHistory.map(h => `${h.id},"${h.testName.join(';')}",${h.boardId.join(';')},${h.status},${h.startedAt}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_history_${Date.now()}.csv`;
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: TestStatus) => {
    switch (status) {
      case TestStatus.PASSED: return 'text-green-500 bg-green-500/10 border-green-500/20';
      case TestStatus.FAILED: return 'text-red-500 bg-red-500/10 border-red-500/20';
      case TestStatus.RUNNING: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-light text-slate-800 dark:text-white tracking-wide">
            User <span className="font-bold text-infra-accent">Dashboard</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Welcome back, {user.name}. System Status: <span className="text-green-500">Operational</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: PROFILE & NOTIFICATIONS */}
        <div className="space-y-6">
          {/* Profile Panel */}
          <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden relative">
            <div className="h-2 bg-gradient-to-r from-intel-blue to-infra-purple"></div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                    <div className="relative group">
                        {formData.photo || user.photo ? (
                             <img src={formData.photo || user.photo} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600 mr-4 shadow-sm" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-500 dark:text-slate-300 mr-4 shadow-inner">
                                {user.name.charAt(0)}
                            </div>
                        )}
                        {isEditing && (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-4 bg-slate-800 text-white p-1 rounded-full text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Upload Photo"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </button>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user.name}</h2>
                        <div className="flex items-center mt-1 space-x-2">
                            <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                ID: {user.id}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold border border-green-200 dark:border-green-800">
                                {user.status}
                            </span>
                        </div>
                    </div>
                </div>
                <button 
                  onClick={() => isEditing ? handleProfileSave() : setIsEditing(true)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${isEditing ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}
                >
                  {isEditing ? 'Save' : 'Edit'}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Role</label>
                  <p className="text-sm font-medium text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                    {user.role}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Business Unit</label>
                  {isEditing ? (
                    <input 
                      value={formData.businessUnit} 
                      onChange={(e) => setFormData({...formData, businessUnit: e.target.value})}
                      className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-intel-blue"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-800 dark:text-white p-2 border border-transparent">{user.businessUnit}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Site / Location</label>
                  {isEditing ? (
                    <input 
                      value={formData.geosite} 
                      onChange={(e) => setFormData({...formData, geosite: e.target.value})}
                      className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-intel-blue"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-800 dark:text-white p-2 border border-transparent">{user.geosite || 'Not Set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Current Project</label>
                  {isEditing ? (
                    <input 
                      value={formData.project} 
                      onChange={(e) => setFormData({...formData, project: e.target.value})}
                      className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-intel-blue"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-800 dark:text-white p-2 border border-transparent">{user.project || 'Not Set'}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Notifications Panel */}
          <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
             <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800 dark:text-white flex items-center">
                     <svg className="w-4 h-4 mr-2 text-infra-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                     Notifications ({notifications.filter(n => !n.read).length})
                 </h3>
                 {notifications.length > 0 && (
                     <button onClick={onClearNotifications} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Clear</button>
                 )}
             </div>
             <div className="max-h-60 overflow-y-auto">
                 {notifications.length === 0 ? (
                     <div className="p-6 text-center text-slate-500 text-xs">No notifications</div>
                 ) : (
                     notifications.map(notif => (
                        <div 
                            key={notif.id}
                            onClick={() => onNotificationClick(notif)}
                            className={`p-3 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/10 border-l-2 border-l-intel-blue' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-xs font-bold ${notif.type === 'SUCCESS' ? 'text-green-600' : notif.type === 'ERROR' ? 'text-red-500' : 'text-intel-blue'}`}>{notif.title}</span>
                                <span className="text-[10px] text-slate-400">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300">{notif.message}</p>
                        </div>
                     ))
                 )}
             </div>
          </section>
        </div>

        {/* RIGHT COLUMN: HISTORY & RESERVATIONS */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Active Reservations */}
            <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    My Reserved Boards
                </h3>
                {myReservations.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                        <p className="text-slate-500 text-sm">You have no active board reservations.</p>
                        <button onClick={() => onNavigate('boards')} className="mt-2 text-intel-blue text-sm font-bold hover:underline">Browse Board Farm</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myReservations.map(board => (
                            <div key={board.id} className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800 dark:text-white">{board.name}</h4>
                                    <span className="text-[10px] bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded">Active</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{board.ip}</p>
                                <p className="text-xs text-slate-500 mb-3">
                                    Ends: {board.reservationEnd ? new Date(board.reservationEnd).toLocaleString() : 'N/A'}
                                </p>
                                <button 
                                    onClick={() => onReleaseBoard(board)}
                                    className="w-full py-1.5 bg-white dark:bg-slate-800 text-red-500 border border-red-200 dark:border-red-900 rounded text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                >
                                    Release Now
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Validation History */}
            <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col h-[500px]">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        Validation History
                    </h3>
                    <div className="flex space-x-2">
                         <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="text-xs bg-slate-100 dark:bg-slate-900 border-none rounded px-3 py-1.5 text-slate-600 dark:text-slate-300 outline-none"
                        >
                            <option value="ALL">All Status</option>
                            <option value={TestStatus.PASSED}>Passed</option>
                            <option value={TestStatus.FAILED}>Failed</option>
                            <option value={TestStatus.RUNNING}>Running</option>
                        </select>
                        <select 
                            value={filterBoard}
                            onChange={(e) => setFilterBoard(e.target.value)}
                            className="text-xs bg-slate-100 dark:bg-slate-900 border-none rounded px-3 py-1.5 text-slate-600 dark:text-slate-300 outline-none max-w-[120px]"
                        >
                            <option value="ALL">All Boards</option>
                            {boards.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                        </select>
                        <button 
                            onClick={exportData}
                            className="bg-intel-blue text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-700 flex items-center"
                        >
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            CSV
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-auto">
                    {filteredHistory.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 text-sm">No validation history found matching filters.</div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4">Job ID</th>
                                    <th className="p-4">Test Name</th>
                                    <th className="p-4">Board</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredHistory.map(job => (
                                    <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="p-4 font-mono text-xs text-slate-500">{job.id}</td>
                                        <td className="p-4 font-medium text-slate-800 dark:text-white">{job.testName.join(', ')}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300 text-xs">{job.boardId.join(', ')}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(job.status)}`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-xs text-slate-400">
                                            {new Date(job.startedAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};
