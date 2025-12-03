

import React, { useState, useEffect } from 'react';
import { Board, TestCase, UserRole, AIModelType, TestJob, TestStatus, BoardStatus } from '../types';
import { generateAiTestCase } from '../services/aiService';
import { LocalDb } from '../services/localDb';

const EXAMPLE_PROMPTS = [
  "Stress test CPU cores for 30 mins and log temps",
  "Verify PCIe Gen5 link width and speed",
  "Check memory bandwidth using STREAM benchmark",
  "Monitor power rail stability during heavy IO"
];

interface TestRunnerProps {
    currentUserRole?: UserRole;
    currentUserName?: string;
    currentUserId?: string;
    availableBoards: Board[];
    // Changed signature to accept partial job without ID
    onRunJob: (job: Omit<TestJob, 'id'>) => void; 
}

export const TestRunner: React.FC<TestRunnerProps> = ({ currentUserRole, currentUserName, currentUserId, availableBoards, onRunJob }) => {
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedAiModel, setSelectedAiModel] = useState<AIModelType>(AIModelType.AUTO);
  
  const [customVars, setCustomVars] = useState<string>('{"ITERATIONS": 10}');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  // Test Management State
  const [tests, setTests] = useState<TestCase[]>([]);
  const [activeTab, setActiveTab] = useState<'RUN' | 'CREATE' | 'UPLOAD'>('RUN');
  
  // AI Create State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTest, setGeneratedTest] = useState<TestCase | null>(null);

  // Manual Upload State
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<'SANITY' | 'STRESS' | 'POWER' | 'IO' | 'CUSTOM'>('CUSTOM');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');

  const canCreateTests = currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.TESTER || currentUserRole === UserRole.USER || currentUserRole === UserRole.LAB_CREW;
  const isAdmin = currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.LAB_CREW;
  const isViewer = currentUserRole === UserRole.VIEWER;

  useEffect(() => {
    refreshTests();
  }, [currentUserId]);

  const refreshTests = () => {
    const allTests = LocalDb.getTestCases();
    // Filter tests: Show PUBLIC tests AND PRIVATE tests owned by the current user
    // Note: Admin also only sees their own private tests in this logic, which is standard "Private" behavior.
    const visibleTests = allTests.filter(t => 
        t.visibility === 'PUBLIC' || t.ownerId === currentUserId
    );
    setTests(visibleTests);
  };

  // STRICT RULE: Only show boards RESERVED by the current user
  const runnableBoards = availableBoards.filter(b => 
      b.status === BoardStatus.RESERVED && b.reservedBy === currentUserName
  );

  const handleBoardToggle = (id: string) => {
    setSelectedBoards(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  const handleTestToggle = (id: string) => {
    setSelectedTests(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleRun = () => {
    if (isViewer) return;
    if (selectedBoards.length === 0 || selectedTests.length === 0) return;
    setIsSubmitting(true);
    
    // Create Job Object (Partial)
    const testNames = tests.filter(t => selectedTests.includes(t.id)).map(t => t.name);
    const boardNames = runnableBoards.filter(b => selectedBoards.includes(b.id)).map(b => b.name);
    
    // Parent will assign sequential ID
    const newJobPayload = {
        userId: currentUserId || 'unknown',
        testName: testNames,
        boardId: boardNames,
        startedAt: new Date().toISOString(),
        status: TestStatus.RUNNING,
        logs: [
            `[INFO] Job initialized by ${currentUserName}`,
            `[INFO] Allocating reserved boards: ${boardNames.join(', ')}`,
            `[INFO] Loading AI Model: ${selectedAiModel}`,
            `[INFO] Starting execution of ${testNames.length} tests...`
        ],
        selectedAiModel: selectedAiModel
    };

    // Simulate Network Delay
    setTimeout(() => {
      onRunJob(newJobPayload);
      setIsSubmitting(false);
      setLastMessage("Job submitted successfully. ID assigned by system.");
      // Reset selections
      setSelectedBoards([]);
      setSelectedTests([]);
    }, 1500);
  };

  const handleGenerateTest = async () => {
      if (!aiPrompt.trim()) return;
      setIsGenerating(true);
      try {
        const newTest = await generateAiTestCase(aiPrompt, currentUserName || 'Unknown');
        setGeneratedTest(newTest);
      } catch (e) {
        console.error(e);
      } finally {
        setIsGenerating(false);
      }
  };

  const saveGeneratedTest = () => {
      if (generatedTest) {
          LocalDb.addTestCase({
              ...generatedTest,
              ownerId: currentUserId,
              visibility: 'PRIVATE' // AI tests default to private
          });
          setGeneratedTest(null);
          setAiPrompt('');
          refreshTests();
          setActiveTab('RUN');
      }
  };

  const handleManualUpload = (e: React.FormEvent) => {
      e.preventDefault();
      
      const newTest: TestCase = {
          id: `custom-${Date.now()}`,
          name: uploadName,
          category: uploadCategory,
          description: uploadDesc,
          scriptPath: 'uploads/custom_script.sh',
          yamlContent: uploadContent,
          author: currentUserName,
          ownerId: currentUserId,
          visibility: uploadVisibility,
          isCustom: true
      };
      
      LocalDb.addTestCase(newTest);
      refreshTests();
      
      // Reset Form
      setUploadName('');
      setUploadDesc('');
      setUploadContent('');
      setUploadVisibility('PRIVATE');
      setActiveTab('RUN');
  };

  const handleDeleteTest = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm("Are you sure you want to delete this test case?")) {
          LocalDb.deleteTestCase(id);
          refreshTests();
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex space-x-6 border-b border-slate-200 dark:border-slate-700">
            <button 
                onClick={() => setActiveTab('RUN')}
                className={`pb-2 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'RUN' ? 'border-intel-blue text-intel-blue' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
                Execute Tests
            </button>
            {!isViewer && (
             <>
                 <button 
                    onClick={() => setActiveTab('CREATE')}
                    className={`pb-2 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'CREATE' ? 'border-infra-purple text-infra-purple' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    AI Generator
                </button>
                <button 
                    onClick={() => setActiveTab('UPLOAD')}
                    className={`pb-2 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'UPLOAD' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    Upload Script
                </button>
             </>
            )}
      </div>

      {activeTab === 'RUN' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Board Selection */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
                    <h2 className="text-xl font-light text-slate-800 dark:text-white">1. Select Target Boards</h2>
                    <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-2 py-1 rounded font-bold">RESERVED ONLY</span>
                </div>
                
                {runnableBoards.length === 0 ? (
                    <div className="text-center p-12 text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900/50">
                        <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        <p className="mb-2 font-bold text-slate-700 dark:text-slate-300">No Reserved Boards Found</p>
                        <p className="text-xs max-w-sm mx-auto mb-4">You must reserve a board before you can run tests on it. This ensures exclusive access during execution.</p>
                        <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-intel-blue hover:underline text-sm font-bold">Go to Board Farm to Reserve</a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {runnableBoards.map(board => (
                        <div 
                            key={board.id}
                            onClick={() => !isViewer && handleBoardToggle(board.id)}
                            className={`p-4 rounded border-2 transition-all relative cursor-pointer ${
                            selectedBoards.includes(board.id) 
                                ? 'border-intel-blue bg-blue-50 dark:bg-blue-900/20' 
                                : 'border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700'
                            } ${isViewer ? 'cursor-not-allowed opacity-75' : ''}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <h3 className="font-bold text-slate-700 dark:text-white">{board.name}</h3>
                                        <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-1.5 rounded">RESERVED</span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{board.specs.cpu}</p>
                                    <p className="text-xs text-slate-400 mt-1">{board.ip}</p>
                                </div>
                                {selectedBoards.includes(board.id) && (
                                    <div className="absolute top-2 right-2 text-intel-blue">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </div>
                        </div>
                        ))}
                    </div>
                )}
                </section>

                {/* Test Selection */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-light text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">2. Select Test Case(s)</h2>
                {tests.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 italic">No tests available. Upload one or generate via AI.</div>
                ) : (
                    <div className="space-y-2">
                        {tests.map(test => (
                        <label key={test.id} className={`flex items-center p-3 rounded group transition-colors ${selectedTests.includes(test.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''} ${!isViewer ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50' : 'cursor-not-allowed opacity-75'}`}>
                            <input 
                            type="checkbox" 
                            value={test.id}
                            disabled={isViewer}
                            checked={selectedTests.includes(test.id)}
                            onChange={() => handleTestToggle(test.id)}
                            className="w-4 h-4 text-intel-blue focus:ring-intel-blue rounded disabled:opacity-50"
                            />
                            <div className="ml-3 flex-1">
                            <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                        <span className="block text-sm font-medium text-slate-700 dark:text-white">{test.name} </span>
                                        {test.visibility === 'PRIVATE' && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded flex items-center"><svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>Private</span>}
                                        {test.isCustom && <span className="text-[10px] bg-infra-purple text-white px-1.5 py-0.5 rounded">CUSTOM</span>}
                                    </div>
                                    {/* Delete button only for owner or admin */}
                                    {(test.ownerId === currentUserId || isAdmin) && test.isCustom && (
                                        <button 
                                            onClick={(e) => handleDeleteTest(test.id, e)}
                                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                            title="Delete Test Case"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                            </div>
                            <span className="block text-xs text-slate-500 dark:text-slate-400">{test.description}</span>
                            </div>
                        </label>
                        ))}
                    </div>
                )}
                </section>
            </div>

            {/* Execution Details */}
            <div className="space-y-8">
                <section className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border-t-4 border-intel-blue">
                <h2 className="text-xl font-light text-slate-800 dark:text-white mb-4">3. Execution Details</h2>
                
                {/* AI Model Selection */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">AI Prediction Model</label>
                    <select 
                        disabled={isViewer}
                        value={selectedAiModel}
                        onChange={(e) => setSelectedAiModel(e.target.value as AIModelType)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm outline-none focus:ring-1 focus:ring-intel-blue disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {Object.values(AIModelType).map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">Select the Deep Learning architecture for result analysis. 'Auto-Select' allows the system to choose based on data topology.</p>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Ansible Variables (JSON)</label>
                    <textarea 
                    disabled={isViewer}
                    className="w-full h-24 p-3 border border-slate-300 dark:border-slate-600 rounded text-sm font-mono focus:ring-1 focus:ring-intel-blue focus:border-intel-blue outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    value={customVars}
                    onChange={(e) => setCustomVars(e.target.value)}
                    />
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded mb-6 text-sm text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between mb-1">
                        <span className="font-semibold">Target Boards:</span> 
                        <span>{selectedBoards.length}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span className="font-semibold">Tests Selected:</span> 
                        <span>{selectedTests.length}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">AI Model:</span> 
                        <span className="text-xs text-infra-purple font-bold">{selectedAiModel.split(' ')[0]}</span>
                    </div>
                </div>

                <button
                    onClick={handleRun}
                    disabled={isSubmitting || isViewer || selectedBoards.length === 0 || selectedTests.length === 0}
                    className={`w-full py-3 px-4 rounded text-white font-bold tracking-wide transition-all ${
                    isSubmitting || isViewer || selectedBoards.length === 0 || selectedTests.length === 0
                        ? 'bg-slate-400 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-intel-blue to-blue-700 hover:shadow-lg'
                    }`}
                >
                    {isViewer ? 'Execution Disabled (Viewer Role)' : isSubmitting ? (
                         <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Queuing Job...
                         </span>
                    ) : 'LAUNCH TEST BATCH'}
                </button>
                </section>

                {lastMessage && !isSubmitting && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg animate-fade-in">
                    <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <h3 className="font-bold text-green-800 dark:text-green-300">Batch Queued Successfully</h3>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">{lastMessage} Check Results tab.</p>
                </div>
                )}
            </div>
        </div>
      )}

      {/* MANUAL UPLOAD TAB */}
      {activeTab === 'UPLOAD' && (
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 animate-fade-in">
              <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Upload Custom Test Script</h2>
                    <p className="text-sm text-slate-500">Your script will be securely stored and only visible to you.</p>
                  </div>
                  <div className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded text-xs font-bold uppercase">
                      Manual Entry
                  </div>
              </div>

              <form onSubmit={handleManualUpload} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Test Name</label>
                          <input 
                              required
                              value={uploadName}
                              onChange={(e) => setUploadName(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2.5 text-slate-800 dark:text-white focus:border-green-500 outline-none"
                              placeholder="e.g., My Custom Memory Check"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Category</label>
                          <select 
                              value={uploadCategory}
                              onChange={(e) => setUploadCategory(e.target.value as any)}
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2.5 text-slate-800 dark:text-white focus:border-green-500 outline-none"
                          >
                              <option value="CUSTOM">Custom</option>
                              <option value="SANITY">Sanity</option>
                              <option value="STRESS">Stress</option>
                              <option value="IO">I/O</option>
                              <option value="POWER">Power</option>
                          </select>
                      </div>
                  </div>

                  <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Description</label>
                      <input 
                          required
                          value={uploadDesc}
                          onChange={(e) => setUploadDesc(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2.5 text-slate-800 dark:text-white focus:border-green-500 outline-none"
                          placeholder="Brief explanation of what this test does..."
                      />
                  </div>

                  {/* VISIBILITY TOGGLE (ADMIN ONLY) */}
                  {isAdmin && (
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded border border-purple-200 dark:border-purple-800">
                          <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 uppercase mb-2">Visibility (Admin Privilege)</label>
                          <div className="flex items-center space-x-4">
                              <label className="flex items-center cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="visibility" 
                                    value="PRIVATE"
                                    checked={uploadVisibility === 'PRIVATE'}
                                    onChange={() => setUploadVisibility('PRIVATE')}
                                    className="mr-2 text-purple-600 focus:ring-purple-500"
                                  />
                                  <span className="text-sm text-slate-700 dark:text-slate-200">Private (Only Me)</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="visibility" 
                                    value="PUBLIC"
                                    checked={uploadVisibility === 'PUBLIC'}
                                    onChange={() => setUploadVisibility('PUBLIC')}
                                    className="mr-2 text-purple-600 focus:ring-purple-500"
                                  />
                                  <span className="text-sm text-slate-700 dark:text-slate-200">Public (All Users)</span>
                              </label>
                          </div>
                      </div>
                  )}

                  <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Script Content (Shell/YAML/Python)</label>
                      <textarea 
                          required
                          rows={10}
                          value={uploadContent}
                          onChange={(e) => setUploadContent(e.target.value)}
                          className="w-full bg-slate-900 text-green-400 font-mono text-sm border border-slate-700 rounded p-4 focus:border-green-500 outline-none"
                          placeholder="#!/bin/bash&#10;echo 'Running custom diagnostics...'"
                      />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button 
                          type="button" 
                          onClick={() => setActiveTab('RUN')}
                          className="px-6 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                      >
                          Cancel
                      </button>
                      <button 
                          type="submit" 
                          className="px-6 py-2 bg-green-600 text-white font-bold rounded shadow hover:bg-green-700 transition-colors"
                      >
                          Save & Add to Library
                      </button>
                  </div>
              </form>
          </div>
      )}

      {/* AI GENERATOR TAB */}
      {activeTab === 'CREATE' && (
        canCreateTests ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-light text-slate-800 dark:text-white mb-4">Generative Test Creation</h2>
                <p className="text-sm text-slate-500 mb-4">
                    Describe the validation logic you need. The AI will generate an Ansible playbook and metadata for you.
                    <br/>
                    <span className="text-xs text-infra-purple mt-1 block">Local NLP Mode Active: Capable of generating Stress, I/O, Network, and Memory tests offline.</span>
                </p>
                <textarea 
                    className="w-full h-40 p-4 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-1 focus:ring-infra-purple outline-none mb-4"
                    placeholder="E.g., Write a test that copies a 10GB file 50 times to the NVMe drive and monitors temperature every 5 seconds..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                />
                
                {/* Quick Prompts */}
                <div className="mb-6">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Try these prompts:</p>
                    <div className="flex flex-wrap gap-2">
                        {EXAMPLE_PROMPTS.map((prompt, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setAiPrompt(prompt)}
                                className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full transition-colors border border-slate-200 dark:border-slate-600"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={handleGenerateTest}
                    disabled={isGenerating || !aiPrompt}
                    className="w-full py-3 bg-gradient-to-r from-infra-purple to-pink-600 text-white font-bold rounded shadow-lg hover:opacity-90 disabled:opacity-50 transition-all flex justify-center items-center"
                >
                    {isGenerating ? (
                        <>
                         <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         Generating Logic...
                        </>
                    ) : '✨ Generate Test Case'}
                </button>
            </div>

            {generatedTest && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 animate-fade-in flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Preview: {generatedTest.name}</h3>
                            <span className="text-[10px] text-slate-400 uppercase">{generatedTest.category}</span>
                        </div>
                        <span className="text-xs bg-infra-purple text-white px-2 py-1 rounded">AI Generated</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 italic">"{generatedTest.description}"</p>
                    
                    <div className="flex-1 bg-slate-900 rounded p-4 overflow-auto mb-4 border border-slate-700 custom-scrollbar max-h-96">
                        <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">
                            {generatedTest.yamlContent || `# Ansible Playbook Generated for ${generatedTest.name}
- name: Execute Logic
  hosts: all
  tasks:
    - name: Run logic
      shell: ./run.sh
`}
                        </pre>
                    </div>

                    <div className="flex space-x-3">
                        <button onClick={() => setGeneratedTest(null)} className="flex-1 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-white">Discard</button>
                        <button onClick={saveGeneratedTest} className="flex-1 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700">Save to Library</button>
                    </div>
                </div>
            )}
        </div>
        ) : (
            <div className="p-12 text-center text-slate-500">
                You do not have permission to create new test cases.
            </div>
        )
      )}
    </div>
  );
};