

import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TestRunner } from './components/TestRunner';
import { ResultsAnalysis } from './components/ResultsAnalysis';
import { BoardFarm } from './components/BoardFarm';
import { Auth } from './components/Auth';
import { AdminPanel } from './components/AdminPanel';
import { WelcomeIntro } from './components/WelcomeIntro';
import { UserDashboard } from './components/UserDashboard';
import { SupportCenter } from './components/SupportCenter';
import { SnakeGame } from './components/SnakeGame'; // New Game Import
import { User, UserRole, Board, BoardStatus, TestJob, TestStatus, UserStatus, Notification } from './types';
import { LocalDb } from './services/localDb';

// System Identification
const PROJECT_ID = "INFRASENSE-LAB-001";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [showIntro, setShowIntro] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true); 

  // Global State (Fetched from LocalDb)
  const [users, setUsers] = useState<User[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [jobs, setJobs] = useState<TestJob[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Notification Auto-Open Trigger (timestamp)
  const [notificationTrigger, setNotificationTrigger] = useState<number>(0);

  // 1. Initialize DB and Load Data on Mount
  useEffect(() => {
    // Initialize DB with seed data if empty
    LocalDb.init();

    // Load Data
    refreshData();

    // Check for active session
    const storedUser = localStorage.getItem('infrasense_user');
    if (storedUser) {
      try {
        const parsedSession = JSON.parse(storedUser);
        // Verify user still exists and is active in DB
        const dbUsers = LocalDb.getUsers();
        const freshUser = dbUsers.find(u => u.id === parsedSession.id);
        
        if (freshUser && freshUser.status === UserStatus.ACTIVE) {
            setUser(freshUser);
            setIsAuthenticated(true);
            setShowIntro(false);
        } else {
            localStorage.removeItem('infrasense_user'); // Invalid session
        }
      } catch (e) {
        console.error("Failed to parse stored session", e);
        localStorage.removeItem('infrasense_user');
      }
    }
  }, []); 

  // Global Polling for Real-time Data Sync (User Roles, Boards, Tests)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
        refreshData(); 
    }, 2000); // 2 second polling to simulate real-time updates for all roles

    return () => clearInterval(interval);
  }, [user]);

  const refreshData = () => {
    setUsers(LocalDb.getUsers());
    setBoards(LocalDb.getBoards());
    setJobs(LocalDb.getJobs());
    if (user) {
        setNotifications(LocalDb.getNotifications(user.id));
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogin = (authenticatedUser: User) => {
    // Re-fetch latest user data from DB to ensure roles/status are current
    const dbUser = LocalDb.getUsers().find(u => u.id === authenticatedUser.id);
    
    if (dbUser && dbUser.status === UserStatus.ACTIVE) {
        setUser(dbUser);
        setIsAuthenticated(true);
        setNotifications(LocalDb.getNotifications(dbUser.id));
        if (dbUser.role === UserRole.USER) {
            setActivePage('profile');
        }
    } else {
        alert("Account is no longer active.");
    }
  };

  const handleRegister = (newUser: User) => {
      try {
        LocalDb.addUser(newUser);
        refreshData();
      } catch (e) {
        console.error("Registration failed", e);
      }
  };

  const handleLogout = () => {
    localStorage.removeItem('infrasense_user');
    setUser(null);
    setIsAuthenticated(false);
    setShowIntro(false); 
    setActivePage('dashboard');
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  // --- Board Actions (Persisted) ---

  const handleAddBoard = (newBoard: Board) => {
      LocalDb.addBoard(newBoard);
      refreshData();
  };

  const handleUpdateBoard = (updatedBoard: Board) => {
      LocalDb.updateBoard(updatedBoard);
      refreshData();
  };

  const handleDeleteBoard = (boardId: string) => {
      LocalDb.deleteBoard(boardId);
      refreshData();
  };

  const handleReleaseBoard = (board: Board) => {
     const updatedBoard = {
        ...board,
        status: BoardStatus.ONLINE,
        reservedBy: undefined,
        reservedUserId: undefined,
        reservationEnd: undefined
     };
     handleUpdateBoard(updatedBoard);
  };

  // --- User Actions (Persisted) ---

  const handleUpdateUserStatus = (userId: string, status: UserStatus) => {
      const targetUser = users.find(u => u.id === userId);
      if (targetUser) {
          const updated = { ...targetUser, status };
          LocalDb.updateUser(updated);
          refreshData();
      }
  };

  const handleUpdateUserProfile = (updatedUser: User) => {
    LocalDb.updateUser(updatedUser);
    refreshData();
    
    // Update session if it's the current user
    if (user && user.id === updatedUser.id) {
        setUser(updatedUser);
        localStorage.setItem('infrasense_user', JSON.stringify(updatedUser));
    }
  };

  const handleDeleteUser = (userId: string) => {
      LocalDb.deleteUser(userId);
      refreshData();
  };

  const handleNotificationClick = (notif: Notification) => {
      LocalDb.markNotificationRead(notif.id);
      refreshData();
      
      // Navigate based on context if possible (simple heuristic)
      if (notif.title.includes('Job')) setActivePage('results');
      else if (notif.title.includes('Board')) setActivePage('boards');
  };

  const handleClearNotifications = () => {
      if (user) {
        LocalDb.clearAllNotifications(user.id);
        refreshData();
      }
  };

  // --- Job Actions (Persisted) ---

  const handleRunJob = (jobPayload: Omit<TestJob, 'id'>) => {
    // 1. Create Job via LocalDb to get sequential ID
    const createdJob = LocalDb.createJob(jobPayload);
    refreshData();

    // 2. Simulate Job Completion Async
    setTimeout(() => {
        // Fetch fresh job list (in case changes happened)
        const currentJobs = LocalDb.getJobs();
        const jobToUpdate = currentJobs.find(j => j.id === createdJob.id);
        
        if (jobToUpdate) {
             const outcomes = [TestStatus.PASSED, TestStatus.PASSED, TestStatus.FAILED];
             const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
             
             const updatedJob = { 
                ...jobToUpdate, 
                status: outcome, 
                completedAt: new Date().toISOString(),
                logs: [
                    ...jobToUpdate.logs, 
                    `[INFO] Running step 5/5...`, 
                    outcome === TestStatus.FAILED ? `[ERROR] Assertion failed in module power_check` : `[SUCCESS] All checks passed.`
                ]
            };
            
            LocalDb.updateJob(updatedJob);

            // Trigger Notification
            LocalDb.addNotification({
              userId: updatedJob.userId,
              title: `Job ${updatedJob.id} Completed`,
              message: `Status: ${outcome}. Tests: ${updatedJob.testName.join(', ')}`,
              type: outcome === TestStatus.PASSED ? 'SUCCESS' : 'ERROR',
            });

            refreshData();
            // Force update notifications immediately and trigger the dropdown
            setNotificationTrigger(Date.now()); // Triggers auto-open in Layout
        }
    }, 5000); // 5 seconds test run
  };

  if (showIntro && !isAuthenticated) {
    return <WelcomeIntro onComplete={handleIntroComplete} />;
  }

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} onRegister={handleRegister} existingUsers={users} />;
  }

  // Strict Board Visibility Logic
  const getVisibleBoards = () => {
    // Admins, Testers, and Lab Crew see everything
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.TESTER || user?.role === UserRole.LAB_CREW) {
      return boards;
    }
    
    return boards.filter(b => {
      // Rule 1: Private boards are hidden unless reserved by the user
      // Use reservedUserId for strict matching, fall back to name if ID is missing (legacy data)
      const isReservedByUser = b.reservedUserId === user?.id || b.reservedBy === user?.name;
      
      if (b.visibility === 'PRIVATE' && !isReservedByUser) {
          return false;
      }

      // Rule 2: If reserved by someone else (or BUSY), hide it entirely from the list for standard users
      if ((b.status === BoardStatus.RESERVED || b.status === BoardStatus.BUSY) && !isReservedByUser) {
          return false;
      }
      
      return true;
    });
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'profile': return (
        <UserDashboard 
            user={user!} 
            onUpdateUser={handleUpdateUserProfile} 
            boards={boards} 
            onNavigate={setActivePage}
            onReleaseBoard={handleReleaseBoard}
            history={jobs.filter(j => j.userId === user?.id)} // Pass user specific history
            notifications={notifications} // Pass notifications prop for real-time sync
            onNotificationClick={handleNotificationClick}
            onClearNotifications={handleClearNotifications}
        />
      );
      case 'tests': return (
        <TestRunner 
            currentUserRole={user?.role} 
            currentUserName={user?.name}
            currentUserId={user?.id}
            availableBoards={getVisibleBoards()}
            onRunJob={handleRunJob}
        />
      );
      case 'results': return (
        <ResultsAnalysis 
            jobs={jobs} 
            userRole={user?.role}
        />
      );
      case 'boards': return (
        <BoardFarm 
            currentUser={user!} 
            boards={getVisibleBoards()} 
            onAddBoard={handleAddBoard} 
            onUpdateBoard={handleUpdateBoard} 
        />
      );
      case 'support': return (
        <SupportCenter currentUser={user!} boards={boards} />
      );
      case 'admin': return (
        <AdminPanel 
          projectId={PROJECT_ID}
          users={users} 
          boards={boards} 
          onUpdateUserStatus={handleUpdateUserStatus} 
          onDeleteUser={handleDeleteUser} 
          onAddBoard={handleAddBoard}
          onDeleteBoard={handleDeleteBoard}
          onUpdateBoard={handleUpdateBoard}
          currentUserRole={user?.role}
        />
      );
      case 'boring': return (
        <SnakeGame />
      );
      default: return <Dashboard />;
    }
  };

  return (
    <Layout 
      projectId={PROJECT_ID}
      user={user} 
      onLogout={handleLogout} 
      activePage={activePage} 
      onNavigate={setActivePage}
      isDarkMode={isDarkMode}
      toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
      onClearNotifications={handleClearNotifications}
      notificationTrigger={notificationTrigger}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;