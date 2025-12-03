

import React, { useState } from 'react';
import { User, UserRole, UserStatus } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  // Mock function to register user in App state
  onRegister?: (user: User) => void;
  existingUsers?: User[];
}

type AuthMode = 'signin' | 'signup' | 'forgot-password';

const BUSINESS_UNITS = [
  'CCG - Client Computing',
  'DCAI - Data Center & AI',
  'NEX - Network & Edge',
  'AXG - Accelerated Computing',
  'IFS - Foundry Services',
  'SMG - Sales & Marketing',
  'IT - Information Technology',
  'Other'
];

const ROLE_STYLES = {
  [UserRole.ADMIN]: "text-red-600 dark:text-red-400 border-red-500",
  [UserRole.LAB_CREW]: "text-cyan-600 dark:text-cyan-400 border-cyan-500",
  [UserRole.TESTER]: "text-blue-600 dark:text-blue-400 border-blue-500",
  [UserRole.USER]: "text-amber-600 dark:text-amber-400 border-amber-500",
  [UserRole.VIEWER]: "text-slate-600 dark:text-slate-400 border-slate-500"
};

const ROLE_ICONS = {
  [UserRole.ADMIN]: (
    <svg className="w-6 h-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
  ),
  [UserRole.LAB_CREW]: (
     <svg className="w-6 h-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ),
  [UserRole.TESTER]: (
    <svg className="w-6 h-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
  ),
  [UserRole.USER]: (
    <svg className="w-6 h-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  ),
  [UserRole.VIEWER]: (
    <svg className="w-6 h-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
  )
};

const ROLE_DESCRIPTIONS = {
  [UserRole.VIEWER]: "Read-only access to dashboards, test results, and board status.",
  [UserRole.USER]: "Standard access. Can reserve boards for manual usage and view results.",
  [UserRole.TESTER]: "Operational access. Can execute test suites, reserve hardware, and upload test cases.",
  [UserRole.LAB_CREW]: "Senior operational access. Full control over labs, users, and tests, excluding database management.",
  [UserRole.ADMIN]: "Full system control. Manage users, configure board farm, and view audit logs."
};

export const Auth: React.FC<AuthProps> = ({ onLogin, onRegister, existingUsers = [] }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  
  // Form State
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Email or User ID
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessUnit, setBusinessUnit] = useState(BUSINESS_UNITS[0]);
  const [customBusinessUnit, setCustomBusinessUnit] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.VIEWER);
  
  // UI State
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [generatedId, setGeneratedId] = useState<string | null>(null);

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
    setGeneratedId(null);
    setPassword('');
    setConfirmPassword('');
    setRememberMe(false);
    setCustomBusinessUnit('');
    setBusinessUnit(BUSINESS_UNITS[0]);
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier) {
      setError("Please enter your email address.");
      return;
    }
    setError(null);
    setSuccessMsg(`Password reset link sent to ${loginIdentifier}. Check your inbox.`);
  };

  const validatePassword = (pwd: string) => {
    const minLength = 8;
    const hasNumber = /\d/;
    const hasAlphabet = /[a-zA-Z]/;
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/;

    if (pwd.length < minLength) return "Password must be at least 8 characters.";
    if (!hasNumber.test(pwd)) return "Password must contain at least one number.";
    if (!hasAlphabet.test(pwd)) return "Password must contain at least one letter.";
    if (!hasSymbol.test(pwd)) return "Password must contain at least one special symbol.";
    
    return null;
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    const finalBU = businessUnit === 'Other' ? customBusinessUnit : businessUnit;
    if (businessUnit === 'Other' && !customBusinessUnit.trim()) {
      setError("Please specify your Business Unit.");
      return;
    }

    // CUSTOM ID GENERATION LOGIC: 4 Letters of Name + 2 Numbers
    // e.g., ALICE -> ALIC88
    const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const namePart = cleanName.length >= 4 ? cleanName.substring(0, 4) : cleanName.padEnd(4, 'X'); 
    const numPart = Math.floor(10 + Math.random() * 90); // 10 to 99
    const newUserId = `${namePart}${numPart}`;

    const newUser: User = {
        id: newUserId,
        name: name,
        email: email,
        businessUnit: finalBU,
        role: role,
        status: UserStatus.PENDING, // Default to pending
    };

    if (onRegister) {
        onRegister(newUser);
    }

    setGeneratedId(newUserId);
    setSuccessMsg("Account registration pending!");
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!loginIdentifier || !password) {
      setError("Please enter both User ID/Email and Password.");
      return;
    }

    // Check against mock database
    const foundUser = existingUsers.find(u => u.id === loginIdentifier || u.email === loginIdentifier);

    if (foundUser) {
        if (foundUser.status === UserStatus.PENDING) {
            setError("Account is pending Admin approval. Please check your activation email.");
            return;
        }
        if (foundUser.status === UserStatus.REJECTED) {
            setError("Account has been rejected by Administrator.");
            return;
        }
        if (rememberMe) {
             localStorage.setItem('infrasense_user', JSON.stringify(foundUser));
        }
        onLogin(foundUser);
        return;
    }

    setError("Invalid credentials or user not found.");
  };

  const DEMO_ACCOUNTS = [
      { id: 'ADMI01', role: UserRole.ADMIN },
      { id: 'ALIC02', role: UserRole.TESTER },
      { id: 'LABC09', role: UserRole.LAB_CREW },
      { id: 'CHAR03', role: UserRole.USER },
      { id: 'BOBV04', role: UserRole.VIEWER },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0B0F19] p-4 relative overflow-hidden transition-colors duration-300">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-infra-accent rounded-full blur-[120px] opacity-10"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-infra-purple rounded-full blur-[120px] opacity-10"></div>
      </div>

      <div className="w-full max-w-lg bg-white dark:bg-infra-surface rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-10 transition-colors duration-300">
        
        <div className="p-8 pb-0 text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
             <div className="absolute inset-0 rounded-full border-2 border-t-infra-accent border-r-transparent border-b-infra-purple border-l-transparent animate-spin-slow"></div>
             <div className="absolute inset-0 flex items-center justify-center">
               <svg className="w-8 h-8 text-infra-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
             </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Infrasense AI</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Hardware Validation Intelligence</p>
        </div>

        {!generatedId && mode !== 'forgot-password' && (
          <div className="flex p-8 pb-4">
            <button 
              onClick={() => handleModeChange('signin')}
              className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${mode === 'signin' ? 'border-infra-accent text-infra-accent' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
            >
              Sign In
            </button>
            <button 
               onClick={() => handleModeChange('signup')}
               className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${mode === 'signup' ? 'border-infra-accent text-infra-accent' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
            >
              Sign Up
            </button>
          </div>
        )}

        {generatedId ? (
           <div className="p-8 text-center animate-fade-in">
             <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Approval Pending</h3>
             <p className="text-slate-400 text-sm mb-6">
               Your account has been created and is awaiting Admin approval. 
               <br/>
               An activation email has been sent to <span className="text-white">{email}</span>.
             </p>
             <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
               <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Your User ID</p>
               <p className="text-2xl font-mono text-infra-accent tracking-widest selection:bg-infra-accent selection:text-black">{generatedId}</p>
             </div>
             <button 
               onClick={() => {
                 setGeneratedId(null);
                 setMode('signin');
               }}
               className="w-full bg-slate-700 text-white font-bold py-3 rounded-lg hover:bg-slate-600 transition-colors"
             >
               Back to Login
             </button>
           </div>
        ) : (
          <div className="px-8 pb-8">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded flex items-center text-red-500 text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded flex items-center text-green-500 text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {successMsg}
              </div>
            )}

            {mode === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="space-y-5 animate-fade-in">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Reset Password</h3>
                <p className="text-sm text-slate-500">Enter your email to receive a reset link.</p>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-infra-accent transition-colors"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-infra-purple text-white font-bold py-3 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Send Reset Link
                </button>
                <button 
                  type="button"
                  onClick={() => handleModeChange('signin')}
                  className="w-full text-slate-500 hover:text-slate-300 text-sm py-2"
                >
                  Back to Sign In
                </button>
              </form>
            )}

            {mode === 'signin' && (
              <div className="animate-fade-in">
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                    <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Email or User ID</label>
                    <input 
                        type="text" 
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-infra-accent transition-colors"
                    />
                    </div>
                    <div>
                    <div className="flex justify-between mb-1">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Password</label>
                        <button type="button" onClick={() => handleModeChange('forgot-password')} className="text-xs text-infra-accent hover:underline">Forgot Password?</button>
                    </div>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-infra-accent transition-colors"
                    />
                    </div>
                    <div className="flex items-center">
                    <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-infra-accent bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-500 dark:text-slate-400">Remember me</label>
                    </div>
                    <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-intel-blue to-infra-purple text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
                    >
                    Login
                    </button>
                </form>

                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Demo Credentials</h4>
                    <p className="text-xs text-slate-400 mb-2">Click to copy User ID (any password works):</p>
                    <div className="grid grid-cols-2 gap-2">
                        {DEMO_ACCOUNTS.map(acc => (
                            <button 
                                key={acc.id}
                                onClick={() => { setLoginIdentifier(acc.id); setPassword('password123'); }}
                                className="text-left p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-infra-accent transition-colors"
                            >
                                <div className="font-mono text-xs font-bold text-slate-800 dark:text-white">{acc.id}</div>
                                <div className="text-[10px] text-slate-500 uppercase">{acc.role.replace('_', ' ')}</div>
                            </button>
                        ))}
                    </div>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Full Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-infra-accent transition-colors"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Business Unit</label>
                  <select value={businessUnit} onChange={(e) => setBusinessUnit(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-infra-accent">
                    {BUSINESS_UNITS.map(bu => (<option key={bu} value={bu}>{bu}</option>))}
                  </select>
                  {businessUnit === 'Other' && (
                     <input type="text" required value={customBusinessUnit} onChange={(e) => setCustomBusinessUnit(e.target.value)} placeholder="Enter Department" className="mt-2 w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-infra-accent animate-fade-in"/>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-infra-accent"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Password</label>
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ chars, #, A-z, !@#" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-infra-accent text-xs"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Confirm</label>
                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full bg-slate-50 dark:bg-slate-900/50 border rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none transition-colors text-xs ${confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}/>
                  </div>
                </div>
                
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Select Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(ROLE_DESCRIPTIONS).map(([roleKey, desc]) => (
                      <div 
                        key={roleKey}
                        onClick={() => setRole(roleKey as UserRole)}
                        className={`group relative p-3 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                          role === roleKey 
                          ? 'bg-slate-50 dark:bg-slate-800 ring-2 ring-opacity-50 ' + ROLE_STYLES[roleKey as UserRole]
                          : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {ROLE_ICONS[roleKey as UserRole]}
                        <span className={`font-bold text-xs uppercase ${role === roleKey ? '' : 'text-slate-500 dark:text-slate-400'}`}>{roleKey.replace('_', ' ')}</span>
                        
                        {/* Hover Tooltip - Visual Details */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-48 bg-slate-900 text-white text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30 text-center border border-slate-700 backdrop-blur-sm">
                          {desc}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-intel-blue to-infra-purple text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all mt-4">Create Account</button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};