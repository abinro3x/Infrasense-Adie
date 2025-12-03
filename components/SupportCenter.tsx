

import React, { useState, useEffect } from 'react';
import { User, UserRole, SupportRequest, SupportStatus, SupportMessage, Board, BoardStatus } from '../types';
import { LocalDb } from '../services/localDb';
import { analyzeSupportSignal } from '../services/aiService';

interface SupportCenterProps {
    currentUser: User;
    boards: Board[]; // Added to filter for reservation dropdown
}

export const SupportCenter: React.FC<SupportCenterProps> = ({ currentUser, boards }) => {
    const [requests, setRequests] = useState<SupportRequest[]>([]);
    const [activeTab, setActiveTab] = useState<'MY_SIGNALS' | 'GLOBAL_GRID' | 'NEW'>('MY_SIGNALS');
    const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);

    // New Request Form
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [targetNode, setTargetNode] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiSolution, setAiSolution] = useState<string | null>(null);

    // Chat
    const [newMessage, setNewMessage] = useState('');

    const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TESTER || currentUser.role === UserRole.LAB_CREW;

    // Filter available boards for the dropdown (boards reserved by current user)
    const myReservedBoards = boards.filter(b => 
        (b.status === BoardStatus.RESERVED || b.status === BoardStatus.BUSY) && b.reservedBy === currentUser.name
    );

    // Initial Load & Real-time Polling for Chat Sync
    useEffect(() => {
        refreshRequests();
        
        // Poll every 3 seconds to simulate real-time socket
        const interval = setInterval(() => {
            const latestRequests = LocalDb.getSupportRequests();
            setRequests(latestRequests);
            
            // If a request is currently selected, update it to show new messages
            if (selectedRequest) {
                const updatedSelected = latestRequests.find(r => r.id === selectedRequest.id);
                if (updatedSelected && updatedSelected.messages.length !== selectedRequest.messages.length) {
                    setSelectedRequest(updatedSelected);
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [selectedRequest]); // Depend on selectedRequest to correctly update the view inside the effect if needed

    const refreshRequests = () => {
        const all = LocalDb.getSupportRequests();
        setRequests(all);
    };

    const handleCreateSignal = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. AI Analysis
        setIsAnalyzing(true);
        setAiSolution(null);
        
        const aiResult = await analyzeSupportSignal(subject, description);
        
        setIsAnalyzing(false);

        if (aiResult.isSolvable && aiResult.solution) {
            setAiSolution(aiResult.solution);
            return; // Stop here, let user accept or reject
        }

        // If not solvable, create ticket immediately
        submitTicket();
    };

    const submitTicket = () => {
        const newReq = LocalDb.createSupportRequest({
            userId: currentUser.id,
            userName: currentUser.name,
            subject,
            description,
            targetNode: targetNode || 'General System',
            aiSuggestedSolution: aiSolution || undefined
        });
        
        refreshRequests();
        setActiveTab('MY_SIGNALS');
        setSubject('');
        setDescription('');
        setTargetNode('');
        setAiSolution(null);
        setSelectedRequest(newReq);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest || !newMessage.trim()) return;

        LocalDb.addSupportMessage(selectedRequest.id, {
            sender: currentUser.name,
            role: currentUser.role,
            message: newMessage
        });
        setNewMessage('');
        refreshRequests();
        
        // Update local selected request state to show new message immediately
        const updated = LocalDb.getSupportRequests().find(r => r.id === selectedRequest.id);
        if (updated) setSelectedRequest(updated);
    };

    const updateStatus = (status: SupportStatus) => {
        if (!selectedRequest) return;
        const updated = { ...selectedRequest, status };
        LocalDb.updateSupportRequest(updated);
        refreshRequests();
        setSelectedRequest(updated);
    };

    const filteredRequests = requests.filter(r => {
        if (activeTab === 'MY_SIGNALS') return r.userId === currentUser.id;
        if (activeTab === 'GLOBAL_GRID') return true; // Admins see all
        return false;
    });

    const getStatusColor = (status: SupportStatus) => {
        switch(status) {
            case SupportStatus.OPEN: return 'text-blue-400 border-blue-400';
            case SupportStatus.IN_PROGRESS: return 'text-orange-400 border-orange-400';
            case SupportStatus.RESOLVED: return 'text-green-400 border-green-400';
            case SupportStatus.CLOSED: return 'text-slate-500 border-slate-500';
        }
    };

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-light text-slate-800 dark:text-white tracking-wide">
                        Neural <span className="font-bold text-infra-accent">Assistance</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">AI-Augmented Issue Resolution Matrix</p>
                </div>
                <div className="flex space-x-2">
                    <button 
                        onClick={() => { setActiveTab('MY_SIGNALS'); setSelectedRequest(null); setAiSolution(null); }}
                        className={`px-4 py-2 rounded text-sm font-bold transition-all ${activeTab === 'MY_SIGNALS' ? 'bg-intel-blue text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        My Signals
                    </button>
                    {isAdmin && (
                        <button 
                            onClick={() => { setActiveTab('GLOBAL_GRID'); setSelectedRequest(null); setAiSolution(null); }}
                            className={`px-4 py-2 rounded text-sm font-bold transition-all ${activeTab === 'GLOBAL_GRID' ? 'bg-infra-purple text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            Global Grid
                        </button>
                    )}
                    <button 
                        onClick={() => { setActiveTab('NEW'); setSelectedRequest(null); setAiSolution(null); }}
                        className={`px-4 py-2 rounded text-sm font-bold transition-all flex items-center ${activeTab === 'NEW' ? 'bg-infra-accent text-black shadow-lg' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                    >
                        <span className="mr-2">+</span> Broadcast Signal
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex">
                
                {/* LEFT LIST OR FORM */}
                {activeTab === 'NEW' ? (
                    <div className="w-full max-w-2xl mx-auto p-8 overflow-y-auto">
                         <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Initiate Neural Distress Signal</h2>
                         
                         {aiSolution ? (
                             <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-xl p-6 border border-infra-accent mb-6 animate-fade-in">
                                 <div className="flex items-center mb-4">
                                     <div className="w-10 h-10 rounded-full bg-infra-accent flex items-center justify-center mr-4">
                                         <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                     </div>
                                     <div>
                                         <h3 className="text-white font-bold text-lg">AI Cortex Solution Found</h3>
                                         <p className="text-purple-200 text-xs">Confidence: 98.4%</p>
                                     </div>
                                 </div>
                                 <p className="text-white mb-6 text-sm leading-relaxed whitespace-pre-line">{aiSolution}</p>
                                 <div className="flex space-x-4">
                                     <button 
                                        onClick={() => { setAiSolution(null); setActiveTab('MY_SIGNALS'); }}
                                        className="flex-1 py-3 bg-green-500 text-white font-bold rounded hover:bg-green-600 transition-colors"
                                     >
                                         Solution Accepted (Close)
                                     </button>
                                     <button 
                                        onClick={submitTicket}
                                        className="flex-1 py-3 bg-slate-700 text-slate-300 font-bold rounded hover:bg-slate-600 transition-colors"
                                     >
                                         Ineffective - Escalate to Human
                                     </button>
                                 </div>
                             </div>
                         ) : (
                             <form onSubmit={handleCreateSignal} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Signal Subject</label>
                                    <input 
                                        required
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-3 text-slate-800 dark:text-white focus:border-infra-accent outline-none"
                                        placeholder="e.g., Connection Timeout on Node-5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Target Node (Reserved Boards)</label>
                                    <select 
                                        value={targetNode}
                                        onChange={e => setTargetNode(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-3 text-slate-800 dark:text-white focus:border-infra-accent outline-none"
                                    >
                                        <option value="">-- Select a reserved board --</option>
                                        {myReservedBoards.map(b => (
                                            <option key={b.id} value={b.name}>{b.name} ({b.ip})</option>
                                        ))}
                                        <option value="General">General System Issue (No specific board)</option>
                                    </select>
                                    {myReservedBoards.length === 0 && (
                                        <p className="text-[10px] text-orange-400 mt-1">You currently have no active reservations. Using "General System Issue" is recommended.</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Telemetry / Description</label>
                                    <textarea 
                                        required
                                        rows={6}
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-3 text-slate-800 dark:text-white focus:border-infra-accent outline-none font-mono text-sm"
                                        placeholder="Paste error logs or describe the anomaly..."
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isAnalyzing}
                                    className="w-full py-4 bg-gradient-to-r from-intel-blue to-blue-700 text-white font-bold rounded shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                >
                                    {isAnalyzing ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Analyzing Neural Patterns...
                                        </span>
                                    ) : 'Broadcast Signal'}
                                </button>
                             </form>
                         )}
                    </div>
                ) : (
                    <>
                        {/* LIST COLUMN */}
                        <div className={`${selectedRequest ? 'hidden lg:block lg:w-1/3' : 'w-full'} border-r border-slate-200 dark:border-slate-700 overflow-y-auto`}>
                            {filteredRequests.length === 0 ? (
                                <div className="p-10 text-center text-slate-500">No signals found.</div>
                            ) : (
                                filteredRequests.map(req => (
                                    <div 
                                        key={req.id}
                                        onClick={() => setSelectedRequest(req)}
                                        className={`p-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${selectedRequest?.id === req.id ? 'bg-blue-50 dark:bg-slate-700 border-l-4 border-l-intel-blue' : ''}`}
                                    >
                                        <div className="flex justify-between mb-1">
                                            <span className="font-mono text-xs text-slate-500">{req.id}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1 truncate">{req.subject}</h4>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${getStatusColor(req.status)}`}>
                                                {req.status.replace('_', ' ')}
                                            </span>
                                            {activeTab === 'GLOBAL_GRID' && (
                                                <span className="text-[10px] text-slate-500">{req.userName}</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* DETAIL COLUMN */}
                        {selectedRequest ? (
                            <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0B0F19]">
                                {/* Header */}
                                <div className="p-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{selectedRequest.subject}</h2>
                                            <div className="flex items-center space-x-3 mt-1 text-sm text-slate-500">
                                                <span>ID: {selectedRequest.id}</span>
                                                <span>•</span>
                                                <span>Node: {selectedRequest.targetNode}</span>
                                                <span>•</span>
                                                <span className={`font-bold ${getStatusColor(selectedRequest.status)}`}>{selectedRequest.status}</span>
                                            </div>
                                        </div>
                                        {isAdmin && (
                                            <select 
                                                value={selectedRequest.status}
                                                onChange={(e) => updateStatus(e.target.value as SupportStatus)}
                                                className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-3 py-1 text-xs font-bold outline-none"
                                            >
                                                {Object.values(SupportStatus).map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded text-sm text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700">
                                        {selectedRequest.description}
                                    </div>
                                </div>

                                {/* Chat Feed */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {selectedRequest.messages.length === 0 ? (
                                        <div className="text-center text-slate-400 text-sm mt-10">
                                            Signal initialized. Awaiting response from Neural Core or Admin.
                                        </div>
                                    ) : (
                                        selectedRequest.messages.map(msg => (
                                            <div key={msg.id} className={`flex flex-col ${msg.role === UserRole.ADMIN || msg.role === UserRole.TESTER || msg.role === UserRole.LAB_CREW ? 'items-end' : 'items-start'}`}>
                                                <div className={`max-w-[80%] p-4 rounded-lg shadow-sm ${
                                                    msg.role === UserRole.ADMIN || msg.role === UserRole.TESTER || msg.role === UserRole.LAB_CREW
                                                    ? 'bg-intel-blue text-white rounded-tr-none' 
                                                    : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-tl-none border border-slate-200 dark:border-slate-600'
                                                }`}>
                                                    <div className="flex justify-between items-center mb-1 text-[10px] opacity-70 border-b border-white/20 pb-1">
                                                        <span className="font-bold uppercase tracking-wider">{msg.sender}</span>
                                                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                                    </div>
                                                    <p className="text-sm">{msg.message}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Input */}
                                <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                                    <div className="flex space-x-2">
                                        <input 
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            placeholder="Transmit update..."
                                            disabled={selectedRequest.status === SupportStatus.CLOSED}
                                            className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-4 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-intel-blue"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={selectedRequest.status === SupportStatus.CLOSED || !newMessage.trim()}
                                            className="bg-infra-accent text-black font-bold px-6 py-2 rounded hover:bg-cyan-300 disabled:opacity-50"
                                        >
                                            Send
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="hidden lg:flex flex-1 items-center justify-center text-slate-400 flex-col">
                                <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                <p>Select a signal to view telemetry stream.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};