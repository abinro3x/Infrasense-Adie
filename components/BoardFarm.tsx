

import React, { useState, useEffect } from 'react';
import { Board, BoardStatus, BoardType, User, UserRole } from '../types';

interface BoardFarmProps {
  currentUser: User;
  boards: Board[];
  onAddBoard: (board: Board) => void;
  onUpdateBoard: (board: Board) => void;
}

const ARCHITECTURES = [
    // Data Center & AI
    { id: 'xeon-6-ap', name: 'Xeon 6 (Granite Rapids-AP)', cpu: 'Intel® Xeon® 6980P (128C/256T)', ram: '1TB DDR5-8800 MRDIMM', storage: '30TB NVMe Gen5 Cluster', category: 'Data Center' },
    { id: 'xeon-5-sp', name: 'Xeon Scalable 5th Gen (Emerald Rapids)', cpu: 'Intel® Xeon® Platinum 8592+ (64C/128T)', ram: '512GB DDR5-5600', storage: '16TB NVMe', category: 'Data Center' },
    { id: 'gaudi-3', name: 'Gaudi 3 AI Accelerator', cpu: 'Intel® Gaudi® 3 (1835 TFLOPS)', ram: '128GB HBM2e', storage: 'RoCEv2 High-Speed Fabric', category: 'AI Accelerator' },
    
    // Workstation
    { id: 'xeon-w-3400', name: 'Xeon W-3400 (Sapphire Rapids)', cpu: 'Intel® Xeon® w9-3495X (56C/112T)', ram: '256GB DDR5 ECC', storage: '4TB RAID0 NVMe', category: 'Workstation' },

    // Client Desktop
    { id: 'arrow-lake-s', name: 'Core Ultra 200S (Arrow Lake)', cpu: 'Intel® Core™ Ultra 9 285K', ram: '64GB DDR5-6400', storage: '2TB Gen5 NVMe', category: 'Desktop' },
    { id: 'raptor-lake-r', name: 'Core 14th Gen (Raptor Lake-R)', cpu: 'Intel® Core™ i9-14900KS', ram: '64GB DDR5-6000', storage: '2TB Gen4 NVMe', category: 'Desktop' },

    // Client Mobile
    { id: 'lunar-lake', name: 'Core Ultra 200V (Lunar Lake)', cpu: 'Intel® Core™ Ultra 7 268V', ram: '32GB LPDDR5x (MoP)', storage: '1TB NVMe', category: 'Mobile' },
    { id: 'meteor-lake', name: 'Core Ultra (Meteor Lake)', cpu: 'Intel® Core™ Ultra 7 165H', ram: '32GB LPDDR5x', storage: '1TB NVMe', category: 'Mobile' },

    // Edge / IoT
    { id: 'amston-lake', name: 'Atom x7000RE (Amston Lake)', cpu: 'Intel® Atom® x7433RE', ram: '16GB LPDDR5', storage: '128GB UFS', category: 'Edge' },
    { id: 'alder-lake-n', name: 'Processor N-series (Alder Lake-N)', cpu: 'Intel® Core™ i3-N305', ram: '8GB DDR4', storage: '256GB SSD', category: 'Edge' },
];

export const BoardFarm: React.FC<BoardFarmProps> = ({ currentUser, boards, onAddBoard, onUpdateBoard }) => {
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  
  // Reservation Date State
  const [reserveStartTime, setReserveStartTime] = useState('');
  const [reserveEndTime, setReserveEndTime] = useState('');

  const [showSSH, setShowSSH] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  // Filter States
  const [filterType, setFilterType] = useState<'ALL' | 'AI' | 'PHYSICAL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<BoardStatus | 'ALL'>('ALL'); // Added Status Filter
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchName, setSearchName] = useState('');

  // Add Board Modal State
  const [showAddBoardModal, setShowAddBoardModal] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [newSshUser, setNewSshUser] = useState('');
  const [newSshPass, setNewSshPass] = useState('');
  const [newSshKey, setNewSshKey] = useState('');
  const [newVisibility, setNewVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC'); 
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>(''); 

  // Virtual Board Modal State
  const [showVirtualModal, setShowVirtualModal] = useState(false);
  const [selectedArchId, setSelectedArchId] = useState('arrow-lake-s');
  const [successMsg, setSuccessMsg] = useState('');

  const canReserve = currentUser.role !== UserRole.VIEWER;
  const canManage = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TESTER || currentUser.role === UserRole.LAB_CREW;
  const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.LAB_CREW; 
  const canCreateVirtual = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TESTER || currentUser.role === UserRole.USER || currentUser.role === UserRole.LAB_CREW;

  const categories = Array.from(new Set(ARCHITECTURES.map(a => a.category)));

  // Helper to get local ISO string for datetime-local input
  const toLocalISO = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  // Initialize reservation times when modal opens
  useEffect(() => {
    if (selectedBoard) {
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        setReserveStartTime(toLocalISO(now));
        setReserveEndTime(toLocalISO(oneHourLater));
    }
  }, [selectedBoard]);


  const filteredBoards = boards.filter(board => {
    if (filterType === 'AI' && board.type !== BoardType.VIRTUAL) return false;
    if (filterType === 'PHYSICAL' && board.type !== BoardType.PHYSICAL) return false;
    if (filterStatus !== 'ALL' && board.status !== filterStatus) return false; // Filter by Status
    if (searchName && !board.name.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (filterCategory !== 'ALL') {
        const specsString = `${board.specs.cpu} ${board.specs.ram} ${board.specs.storage}`.toLowerCase();
        const keywords: Record<string, string[]> = {
            'Data Center': ['xeon', 'gaudi', 'scalable'],
            'Desktop': ['core', 'i9', 'ultra 9', 'desktop'],
            'Mobile': ['ultra 7', 'mobile', 'laptop'],
            'Edge': ['atom', 'n-series'],
            'Workstation': ['w9', 'w-3400']
        };
        const relevantKeywords = keywords[filterCategory];
        if (relevantKeywords && !relevantKeywords.some(k => specsString.includes(k.toLowerCase()))) {
            return false;
        }
    }
    return true;
  });

  const toggleBoardVisibility = (board: Board) => {
    onUpdateBoard({
        ...board,
        visibility: board.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC'
    });
  };

  useEffect(() => {
    const checkReservations = () => {
        const now = new Date();
        boards.forEach(board => {
            if (board.status === BoardStatus.RESERVED && board.reservationEnd) {
                if (new Date(board.reservationEnd) <= now) {
                    onUpdateBoard({
                        ...board,
                        status: BoardStatus.ONLINE,
                        reservedBy: undefined,
                        reservedUserId: undefined,
                        reservationStart: undefined,
                        reservationEnd: undefined
                    });
                }
            }
        });
    };
    checkReservations();
    const interval = setInterval(checkReservations, 5000); 
    return () => clearInterval(interval);
  }, [boards, onUpdateBoard]);

  const handleVirtualSubmit = () => {
    const arch = ARCHITECTURES.find(a => a.id === selectedArchId) || ARCHITECTURES[0];
    const id = Math.floor(Math.random() * 1000).toString();
    const isRestricted = currentUser.role === UserRole.USER;
    
    const newBoard: Board = {
        id: `v-${id}`,
        name: `Sim-${arch.name.split('(')[0].trim().replace(/\s+/g, '-')}-${id}`,
        ip: `10.0.10.${id}`,
        type: BoardType.VIRTUAL,
        status: isRestricted ? BoardStatus.PENDING_APPROVAL : BoardStatus.ONLINE,
        visibility: 'PUBLIC',
        location: 'AI Server Farm (Simulated)',
        specs: { cpu: arch.cpu, ram: arch.ram, storage: arch.storage },
        access: { sshUser: 'sim_admin', sshKey: 'ssh-rsa-sim...' },
        requestedBy: isRestricted ? currentUser.name : undefined
    };
    
    onAddBoard(newBoard);
    
    if (isRestricted) {
        setSuccessMsg("Virtual board request sent to Admin for approval.");
        setTimeout(() => { setSuccessMsg(''); setShowVirtualModal(false); }, 2000);
    } else {
        setShowVirtualModal(false);
    }
  };

  const handleAddBoardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    setScanStatus('Initializing simulated handshake...');

    // Simulate scanning without backend
    setTimeout(() => {
            const newBoard: Board = {
            id: `phy-${Date.now()}`,
            name: `node-${newIp.split('.').pop()}`,
            ip: newIp,
            type: BoardType.PHYSICAL,
            status: BoardStatus.ONLINE,
            visibility: newVisibility,
            location: 'Local Network',
            specs: {
                cpu: 'Intel® Core™ i9-13900K (Simulated)',
                ram: '64GB',
                storage: '1TB NVMe'
            },
            access: {
                sshUser: newSshUser,
                sshPassword: newSshPass,
                sshKey: newSshKey
            }
        };

        onAddBoard(newBoard);
        setIsScanning(false);
        setShowAddBoardModal(false);
        resetForm();
    }, 1500);
  };

  const resetForm = () => {
    setNewIp('');
    setNewSshUser('');
    setNewSshPass('');
    setNewSshKey('');
    setNewVisibility('PUBLIC');
    setScanStatus('');
  };

  const confirmReservation = () => {
    if (!selectedBoard) return;
    
    const start = new Date(reserveStartTime);
    const end = new Date(reserveEndTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        alert("Please select valid start and end times.");
        return;
    }

    if (end <= start) {
        alert("End time must be after start time.");
        return;
    }
    
    onUpdateBoard({
        ...selectedBoard,
        status: BoardStatus.RESERVED,
        reservedBy: currentUser.name,
        reservedUserId: currentUser.id,
        reservationStart: start.toISOString(),
        reservationEnd: end.toISOString()
    });
    setSelectedBoard(null);
  };

  const handleRelease = (board: Board) => {
    if (!window.confirm("Are you sure you want to release this board?")) return;
    onUpdateBoard({
        ...board,
        status: BoardStatus.ONLINE,
        reservedBy: undefined,
        reservedUserId: undefined,
        reservationStart: undefined,
        reservationEnd: undefined
    });
  };

  const toggleMaintenance = (board: Board) => {
    const isMaintenance = board.status === BoardStatus.MAINTENANCE;
    if (!isMaintenance && board.status === BoardStatus.RESERVED) {
        if (!window.confirm(`Board is currently reserved by ${board.reservedBy}. Force maintenance mode?`)) return;
    }
    const newStatus = isMaintenance ? BoardStatus.ONLINE : BoardStatus.MAINTENANCE;
    onUpdateBoard({
        ...board,
        status: newStatus,
        reservedBy: newStatus === BoardStatus.MAINTENANCE ? undefined : board.reservedBy,
        reservedUserId: newStatus === BoardStatus.MAINTENANCE ? undefined : board.reservedUserId,
        reservationStart: newStatus === BoardStatus.MAINTENANCE ? undefined : board.reservationStart,
        reservationEnd: newStatus === BoardStatus.MAINTENANCE ? undefined : board.reservationEnd
    });
  };

  const getStatusColor = (status: BoardStatus) => {
    switch(status) {
      case BoardStatus.ONLINE: return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case BoardStatus.OFFLINE: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      case BoardStatus.BUSY: return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case BoardStatus.MAINTENANCE: return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case BoardStatus.RESERVED: return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800';
      case BoardStatus.PENDING_APPROVAL: return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatReservationTime = (startStr?: string, endStr?: string) => {
    if (!endStr) return '';
    const start = startStr ? new Date(startStr) : new Date();
    const end = new Date(endStr);
    
    // If same day
    if (start.toDateString() === end.toDateString()) {
        return `${start.toLocaleDateString()} (${start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})`;
    }
    return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${end.toLocaleDateString()} ${end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
  };

  return (
    <div className="space-y-6">
       {/* Modal for Reservation */}
       {selectedBoard && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-[32rem] animate-fade-in border border-slate-200 dark:border-slate-700 relative overflow-hidden">
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center">
                Reserve {selectedBoard.name} 
                {selectedBoard.type === BoardType.VIRTUAL && <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded ml-2 align-middle">VIRTUAL</span>}
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Start Time</label>
                    <input 
                        type="datetime-local"
                        value={reserveStartTime}
                        onChange={(e) => setReserveStartTime(e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">End Time</label>
                    <input 
                        type="datetime-local"
                        value={reserveEndTime}
                        onChange={(e) => setReserveEndTime(e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none text-sm"
                    />
                </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 italic">Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
            
            <div className="mb-6">
                 <button onClick={() => setShowSSH(!showSSH)} className="text-xs text-intel-blue hover:underline mb-2 flex items-center">
                    {showSSH ? 'Hide Access Details' : 'Show SSH Credentials'}
                 </button>
                 {showSSH && (
                     <div className="p-3 bg-slate-900 rounded border border-slate-700 text-xs font-mono text-green-400 break-all">
                        <p className="opacity-50 mb-1"># Connect via Terminal</p>
                        <p>ssh {selectedBoard.access?.sshUser}@{selectedBoard.ip}</p>
                     </div>
                 )}
            </div>

            <div className="flex justify-end space-x-3">
              <button onClick={() => setSelectedBoard(null)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-sm font-medium">Cancel</button>
              <button onClick={confirmReservation} className="px-4 py-2 bg-intel-blue text-white rounded hover:bg-blue-700 text-sm font-medium">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Virtual Board Selection */}
      {showVirtualModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl border border-slate-200 dark:border-slate-700 animate-fade-in overflow-hidden max-h-[90vh] flex flex-col">
                <div className="bg-purple-600 p-4 border-b border-purple-500 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-white flex items-center text-lg">
                            <span className="mr-2">✨</span> AI Virtual Board Generator
                        </h3>
                    </div>
                    <button onClick={() => setShowVirtualModal(false)} className="text-purple-200 hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                {successMsg ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{successMsg}</h3>
                    </div>
                ) : (
                    <>
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">Select a target Intel platform.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ARCHITECTURES.map((arch) => (
                                <div 
                                    key={arch.id}
                                    onClick={() => setSelectedArchId(arch.id)}
                                    className={`cursor-pointer rounded-lg p-4 border-2 transition-all relative overflow-hidden group ${
                                        selectedArchId === arch.id 
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                                        : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                    }`}
                                >
                                    <h4 className="font-bold">{arch.name}</h4>
                                    <p className="text-xs">{arch.cpu}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end space-x-3 flex-shrink-0">
                        <button onClick={() => setShowVirtualModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 rounded text-sm font-medium">Cancel</button>
                        <button onClick={handleVirtualSubmit} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded text-sm font-bold shadow-lg">Generate Environment</button>
                    </div>
                    </>
                )}
            </div>
        </div>
      )}

      {/* Modal for Add Physical Board */}
      {showAddBoardModal && (
         <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-white">Provision Physical Node</h3>
                    <button onClick={() => setShowAddBoardModal(false)} className="text-slate-400 hover:text-slate-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                {isScanning ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="relative w-16 h-16 mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-t-intel-blue border-r-transparent border-b-purple-500 border-l-transparent animate-spin"></div>
                        </div>
                        <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Connecting...</h4>
                         <div className="text-left bg-slate-100 dark:bg-slate-900 p-3 rounded font-mono text-xs text-slate-600 dark:text-slate-400 w-full max-w-xs space-y-1">
                             <p className="text-green-600">&gt; Target: {newIp}</p>
                             <p className="text-slate-400">{scanStatus}</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleAddBoardSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">IP Address</label>
                            <input 
                                type="text" 
                                required 
                                value={newIp}
                                onChange={(e) => setNewIp(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-intel-blue font-mono text-sm"
                                placeholder="192.168.x.x"
                            />
                        </div>
                        
                        {isAdmin && (
                             <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Visibility</label>
                                <select 
                                    value={newVisibility}
                                    onChange={(e) => setNewVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-intel-blue text-sm"
                                >
                                    <option value="PUBLIC">Public</option>
                                    <option value="PRIVATE">Private</option>
                                </select>
                             </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">SSH Username</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newSshUser}
                                    onChange={(e) => setNewSshUser(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-intel-blue text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">SSH Password</label>
                                <input 
                                    type="password" 
                                    value={newSshPass}
                                    onChange={(e) => setNewSshPass(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-intel-blue text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">SSH Private Key (Optional)</label>
                            <textarea 
                                rows={2}
                                value={newSshKey}
                                onChange={(e) => setNewSshKey(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-intel-blue font-mono text-xs"
                                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                            />
                        </div>

                        <div className="flex space-x-3 pt-2">
                             <button 
                                type="button" 
                                onClick={() => setShowAddBoardModal(false)}
                                className="flex-1 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-sm font-medium"
                             >
                                Cancel
                             </button>
                             <button 
                                type="submit" 
                                className="flex-1 py-2 bg-intel-blue text-white rounded font-bold shadow-md hover:bg-blue-700 transition-all text-sm"
                             >
                                Scan & Provision
                             </button>
                        </div>
                    </form>
                )}
            </div>
         </div>
       )}

      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h2 className="text-2xl font-light text-slate-800 dark:text-white">Board Farm</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage physical hardware and AI-simulated virtual boards.</p>
        </div>
        <div className="flex space-x-2">
            {canCreateVirtual && (
                <button 
                    onClick={() => setShowVirtualModal(true)}
                    className="px-3 py-2 bg-purple-600 text-white rounded text-sm shadow-sm hover:bg-purple-700 flex items-center"
                >
                    <span className="mr-2">✨</span> Create Virtual Board (AI)
                </button>
            )}
            {isAdmin && (
                <button 
                    onClick={() => setShowAddBoardModal(true)}
                    className="px-3 py-2 bg-intel-blue text-white rounded text-sm shadow-sm hover:bg-blue-700"
                >
                    Add Physical Board
                </button>
            )}
        </div>
      </div>
      
      {/* FILTER CONTROLS */}
      <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 mb-4 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 items-center">
         <div className="flex bg-slate-100 dark:bg-slate-900 rounded p-1 mr-4">
             <button onClick={() => setViewMode('GRID')} className={`p-1.5 rounded transition-colors ${viewMode === 'GRID' ? 'bg-white dark:bg-slate-700 shadow text-intel-blue' : 'text-slate-400'}`}>GRID</button>
             <button onClick={() => setViewMode('LIST')} className={`p-1.5 rounded transition-colors ${viewMode === 'LIST' ? 'bg-white dark:bg-slate-700 shadow text-intel-blue' : 'text-slate-400'}`}>LIST</button>
         </div>
         <div className="flex items-center w-full md:w-auto space-x-2">
             <div className="flex bg-slate-100 dark:bg-slate-900 rounded p-1">
                 {(['ALL', 'AI', 'PHYSICAL'] as const).map((type) => (
                     <button key={type} onClick={() => setFilterType(type)} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${filterType === type ? 'bg-white dark:bg-slate-700 shadow text-intel-blue' : 'text-slate-500'}`}>{type}</button>
                 ))}
             </div>
             {/* STATUS FILTER */}
             <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value as BoardStatus | 'ALL')}
                className="bg-slate-100 dark:bg-slate-900 border-none text-xs rounded px-3 py-1.5 text-slate-600 dark:text-slate-300 outline-none"
             >
                <option value="ALL">All Statuses</option>
                <option value={BoardStatus.ONLINE}>Online</option>
                <option value={BoardStatus.RESERVED}>Reserved</option>
                <option value={BoardStatus.OFFLINE}>Offline</option>
                <option value={BoardStatus.MAINTENANCE}>Maintenance</option>
                <option value={BoardStatus.BUSY}>Busy</option>
             </select>
         </div>
         <div className="relative w-full md:w-64">
             <input type="text" value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="Search..." className="w-full bg-slate-100 dark:bg-slate-900 border-none text-xs rounded px-3 py-1.5 pl-8" />
         </div>
         <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full md:w-auto bg-slate-100 dark:bg-slate-900 border-none text-xs rounded px-2 py-1.5">
             <option value="ALL">All Categories</option>
             {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
         </select>
      </div>

      {filteredBoards.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
            <p className="text-slate-500 dark:text-slate-400">No boards match your filters.</p>
        </div>
      ) : (
        <>
            {viewMode === 'GRID' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBoards.map(board => (
                    <div key={board.id} className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-all flex flex-col relative ${board.type === BoardType.VIRTUAL ? 'border-purple-200 dark:border-purple-900' : 'border-slate-200 dark:border-slate-700'}`}>
                        {board.type === BoardType.VIRTUAL && <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl">AI MIMIC</div>}
                        
                        {isAdmin && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); toggleBoardVisibility(board); }}
                                className={`absolute top-0 left-0 text-[10px] font-bold px-2 py-1 rounded-br border-r border-b border-slate-600 hover:opacity-80 transition-opacity z-20 ${board.visibility === 'PRIVATE' ? 'bg-slate-800 text-white' : 'bg-green-600 text-white'}`}
                            >
                                {board.visibility}
                            </button>
                        )}
                        
                        {board.status === BoardStatus.PENDING_APPROVAL && (
                            <div className="absolute top-0 left-0 right-0 bottom-0 bg-slate-900/50 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-white">
                                <div className="bg-orange-600 px-4 py-2 rounded-full font-bold shadow-lg animate-pulse">Pending Approval</div>
                            </div>
                        )}

                        <div className="p-5 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white mt-2">{board.name}</h3>
                                <span className={`px-2 py-1 rounded text-xs font-bold border mt-2 ${getStatusColor(board.status)}`}>{board.status}</span>
                            </div>
                            
                            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 mb-6">
                                <div className="flex justify-between border-b border-slate-50 dark:border-slate-700 pb-2">
                                    <span className="text-slate-400">IP Address</span>
                                    <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1 rounded">{board.ip}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 dark:border-slate-700 pb-2">
                                    <span className="text-slate-400">Specs</span>
                                    <div className="text-right">
                                        <div className="font-medium text-slate-800 dark:text-white">{board.specs.cpu}</div>
                                        <div className="text-xs opacity-80">{board.specs.ram}</div>
                                    </div>
                                </div>
                                
                                {board.status === BoardStatus.RESERVED && board.reservedBy && (
                                <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-100 dark:border-indigo-800">
                                    <p className="text-xs text-indigo-600 dark:text-indigo-300 font-semibold uppercase mb-1">Reserved By</p>
                                    <p className="text-indigo-900 dark:text-indigo-100 font-medium">{board.reservedBy}</p>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                                        {formatReservationTime(board.reservationStart, board.reservationEnd)}
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-700 flex flex-col space-y-2">
                            {canReserve && board.status === BoardStatus.ONLINE && (
                                <button 
                                onClick={() => { setSelectedBoard(board); setShowSSH(false); }}
                                className="w-full py-2 bg-white dark:bg-slate-800 border border-intel-blue text-intel-blue rounded hover:bg-intel-blue hover:text-white transition-colors font-medium text-sm shadow-sm"
                                >
                                Reserve Board
                                </button>
                            )}
                            
                            {((isAdmin && board.status === BoardStatus.RESERVED) || 
                            (board.status === BoardStatus.RESERVED && board.reservedBy === currentUser.name)) ? (
                                <button 
                                onClick={() => handleRelease(board)}
                                className="w-full py-2 bg-white dark:bg-slate-800 border border-red-500 text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 transition-colors font-medium text-sm shadow-sm"
                                >
                                Release Reservation
                                </button>
                            ) : null}

                            {canManage && (
                                <button
                                    onClick={() => toggleMaintenance(board)}
                                    className={`w-full py-2 rounded text-sm font-medium border transition-colors shadow-sm ${
                                        board.status === BoardStatus.MAINTENANCE
                                        ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {board.status === BoardStatus.MAINTENANCE ? 'Set Online' : 'Maintenance Mode'}
                                </button>
                            )}
                        </div>
                    </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredBoards.map(board => (
                        <div key={board.id} className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border flex items-center p-4 transition-all hover:shadow-md ${board.type === BoardType.VIRTUAL ? 'border-purple-200 dark:border-purple-900/50' : 'border-slate-200 dark:border-slate-700'}`}>
                             <div className={`w-1.5 self-stretch rounded-full mr-4 ${board.status === BoardStatus.ONLINE ? 'bg-green-500' : board.status === BoardStatus.RESERVED ? 'bg-indigo-500' : board.status === BoardStatus.MAINTENANCE ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                             <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                 <div>
                                     <h3 className="font-bold text-slate-800 dark:text-white flex items-center">
                                         {board.name}
                                         {isAdmin && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); toggleBoardVisibility(board); }}
                                                className={`ml-2 text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${board.visibility === 'PRIVATE' ? 'bg-slate-700 text-white' : 'bg-green-100 text-green-700'}`}
                                            >
                                                {board.visibility}
                                            </button>
                                         )}
                                     </h3>
                                     <div className="text-xs text-slate-500 font-mono mt-0.5">{board.ip}</div>
                                 </div>
                                 <div className="text-sm">
                                     <div className="text-slate-800 dark:text-slate-200 font-medium truncate">{board.specs.cpu}</div>
                                     <div className="text-xs text-slate-500">{board.specs.ram}</div>
                                 </div>
                                 <div>
                                     <span className={`inline-block px-2 py-1 rounded text-xs font-bold border ${getStatusColor(board.status)}`}>
                                        {board.status}
                                     </span>
                                     {board.reservationStart && board.reservationEnd && (
                                         <div className="text-[10px] text-slate-500 mt-1 font-mono">
                                            {formatReservationTime(board.reservationStart, board.reservationEnd)}
                                         </div>
                                     )}
                                 </div>
                                 <div className="flex justify-end space-x-2">
                                     {canReserve && board.status === BoardStatus.ONLINE && (
                                        <button onClick={() => { setSelectedBoard(board); setShowSSH(false); }} className="px-3 py-1.5 bg-intel-blue text-white rounded text-xs font-bold hover:bg-blue-700 transition-colors">Reserve</button>
                                     )}
                                     {((isAdmin && board.status === BoardStatus.RESERVED) || (board.status === BoardStatus.RESERVED && board.reservedBy === currentUser.name)) && (
                                        <button onClick={() => handleRelease(board)} className="px-3 py-1.5 border border-red-500 text-red-500 rounded text-xs font-bold">Release</button>
                                     )}
                                 </div>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </>
      )}
    </div>
  );
};