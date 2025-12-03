

import React, { useState, useEffect } from 'react';
import { TestJob, TestStatus, AIAnalysis, AIModelType, UserRole } from '../types';
import { analyzeTestResult } from '../services/aiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface ResultsAnalysisProps {
    jobs: TestJob[];
    userRole?: UserRole;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

type ChartType = 'LINE' | 'BAR' | 'PIE' | 'HISTOGRAM';

// Helper to generate mock data based on test type
const generateMockData = (job: TestJob) => {
    const isStress = job.testName.some(n => n.toLowerCase().includes('stress'));
    const isIO = job.testName.some(n => n.toLowerCase().includes('pcie') || n.toLowerCase().includes('bandwidth'));
    
    if (isStress) {
        return Array.from({ length: 10 }, (_, i) => ({
            time: `${i * 10}s`,
            temp: 40 + Math.random() * 50,
            load: 10 + Math.random() * 90
        }));
    } else if (isIO) {
        return Array.from({ length: 6 }, (_, i) => ({
            time: `Run ${i + 1}`,
            read: 5000 + Math.random() * 2000,
            write: 3000 + Math.random() * 1000
        }));
    } else {
        // Generic Data
        return Array.from({ length: 5 }, (_, i) => ({
            time: `Step ${i + 1}`,
            value: Math.random() * 100,
            baseline: 50
        }));
    }
};

const generatePieData = (job: TestJob) => {
     if (job.status === TestStatus.PASSED) {
         return [
             { name: 'Compute', value: 60 },
             { name: 'Idle', value: 30 },
             { name: 'I/O Wait', value: 10 }
         ];
     }
     return [
        { name: 'Compute', value: 40 },
        { name: 'Idle', value: 20 },
        { name: 'Error State', value: 40 }
    ];
};

export const ResultsAnalysis: React.FC<ResultsAnalysisProps> = ({ jobs, userRole }) => {
  const [selectedJob, setSelectedJob] = useState<TestJob | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeChart, setActiveChart] = useState<ChartType>('LINE');
  const [selectedModelForAnalysis, setSelectedModelForAnalysis] = useState<AIModelType>(AIModelType.AUTO);

  // Auto-select latest job
  useEffect(() => {
    if (jobs.length > 0 && !selectedJob) {
        setSelectedJob(jobs[0]);
    }
  }, [jobs, selectedJob]);

  // Reset analysis when job changes
  useEffect(() => {
    setAnalysis(null);
    if (selectedJob && selectedJob.selectedAiModel) {
        setSelectedModelForAnalysis(selectedJob.selectedAiModel);
    }
  }, [selectedJob]);

  const runAI = async () => {
    if (!selectedJob) return;
    setLoadingAI(true);
    // Pass the selected model explicitly
    const result = await analyzeTestResult(selectedJob, selectedModelForAnalysis); 
    setAnalysis(result);
    setLoadingAI(false);
  };

  const handleDownloadLogs = (format: 'txt' | 'csv') => {
    if (!selectedJob) return;

    let content = '';
    let mimeType = '';
    let extension = '';

    if (format === 'txt') {
        content = selectedJob.logs.join('\n');
        mimeType = 'text/plain';
        extension = 'txt';
    } else {
        // CSV Format: Line,Type,Message
        const header = "Line,Type,Message\n";
        const rows = selectedJob.logs.map((log, index) => {
            // Simple extraction of [TYPE] if exists
            const match = log.match(/^\[(INFO|WARN|ERROR|FATAL|SUCCESS)\]\s*(.*)/);
            const type = match ? match[1] : 'LOG';
            const message = match ? match[2] : log;
            // Escape quotes in message
            const safeMessage = message.replace(/"/g, '""');
            return `${index + 1},${type},"${safeMessage}"`;
        }).join('\n');
        content = header + rows;
        mimeType = 'text/csv';
        extension = 'csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `job_${selectedJob.id}_logs.${extension}`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const currentData = selectedJob ? generateMockData(selectedJob) : [];
  const currentPieData = selectedJob ? generatePieData(selectedJob) : [];

  const isViewer = userRole === UserRole.VIEWER;

  const getSanitizedLog = (log: string) => {
    if (!isViewer) return log;
    // Mask specific patterns for viewers
    if (log.includes('Job initialized by')) {
        return log.replace(/by .*/, 'by [REDACTED USER]');
    }
    return log;
  };

  const renderChart = () => {
    if (!selectedJob) return null;

    switch (activeChart) {
        case 'LINE':
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={currentData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="time" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', color: '#fff' }} />
                        <Legend />
                        <Line type="monotone" dataKey={Object.keys(currentData[0])[1]} stroke="#ef4444" strokeWidth={2} dot={false} />
                        {Object.keys(currentData[0])[2] && <Line type="monotone" dataKey={Object.keys(currentData[0])[2]} stroke="#3b82f6" strokeWidth={2} dot={false} />}
                    </LineChart>
                </ResponsiveContainer>
            );
        case 'BAR':
        case 'HISTOGRAM': // Styling reuse for histogram
             return (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentData} barGap={activeChart === 'HISTOGRAM' ? 0 : 4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="time" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', color: '#fff' }} />
                        <Legend />
                        <Bar dataKey={Object.keys(currentData[0])[1]} fill="#8884d8" name="Metric A" />
                        {Object.keys(currentData[0])[2] && <Bar dataKey={Object.keys(currentData[0])[2]} fill="#82ca9d" name="Metric B" />}
                    </BarChart>
                </ResponsiveContainer>
            );
        case 'PIE':
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={currentPieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {currentPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', color: '#fff' }} />
                    </PieChart>
                </ResponsiveContainer>
            );
    }
  };

  if (jobs.length === 0) {
      return (
          <div className="text-center p-12 text-slate-500">
              No test jobs found. Run a test first to see results.
          </div>
      );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Sidebar Job Selection */}
      <div className="lg:w-1/4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-700 dark:text-slate-200">Recent Jobs</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
              {jobs.map(job => (
                  <div 
                    key={job.id} 
                    onClick={() => setSelectedJob(job)}
                    className={`p-3 rounded cursor-pointer transition-colors border ${selectedJob?.id === job.id ? 'bg-blue-50 dark:bg-blue-900/30 border-intel-blue' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                  >
                      <div className="flex justify-between items-start mb-1">
                          <span className="font-mono text-xs text-slate-500">{job.id}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              job.status === TestStatus.PASSED ? 'bg-green-100 text-green-700' :
                              job.status === TestStatus.FAILED ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>{job.status}</span>
                      </div>
                      <div className="text-sm font-medium text-slate-800 dark:text-white truncate">{job.testName.join(', ')}</div>
                      <div className="text-xs text-slate-500 mt-1 truncate">{job.boardId.join(', ')}</div>
                  </div>
              ))}
          </div>
      </div>

      {/* Main Analysis Area */}
      {selectedJob && (
        <div className="flex-1 space-y-6 overflow-y-auto pr-2">
            <div className="flex justify-between items-end">
                <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Analysis: {selectedJob.id}</h2>
                <p className="text-slate-500 text-sm">
                    {new Date(selectedJob.startedAt).toLocaleString()} 
                    <span className="mx-2">•</span> 
                    Execution Model: <span className="font-bold text-infra-purple">{selectedJob.selectedAiModel}</span>
                </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Logs Console */}
                <div className="bg-slate-900 rounded-lg shadow-lg overflow-hidden flex flex-col h-[400px] border border-slate-700">
                <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                    <span className="text-slate-300 font-mono text-sm">system_output.log</span>
                    <div className="flex space-x-2">
                        <button onClick={() => handleDownloadLogs('txt')} className="text-xs text-slate-400 hover:text-white flex items-center bg-slate-700 px-2 py-1 rounded transition-colors hover:bg-slate-600" title="Download as Text">
                            TXT
                        </button>
                        <button onClick={() => handleDownloadLogs('csv')} className="text-xs text-intel-blue hover:text-white flex items-center bg-slate-700 px-2 py-1 rounded transition-colors hover:bg-slate-600" title="Download as CSV">
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            CSV
                        </button>
                    </div>
                </div>
                <div className="p-4 font-mono text-sm text-slate-300 overflow-auto flex-1 space-y-1">
                    {selectedJob.logs.map((line, i) => (
                    <div key={i} className={`${line.includes('ERROR') || line.includes('FATAL') ? 'text-red-400' : line.includes('WARN') ? 'text-yellow-400' : ''}`}>
                        <span className="opacity-50 mr-3">{i + 1}</span>
                        {getSanitizedLog(line)}
                    </div>
                    ))}
                    {selectedJob.status === TestStatus.RUNNING && <div className="animate-pulse text-slate-500">_</div>}
                </div>
                </div>

                {/* Visualization */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[400px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Metrics Visualization</h3>
                        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded">
                            {(['LINE', 'BAR', 'PIE', 'HISTOGRAM'] as ChartType[]).map(type => (
                                <button 
                                    key={type}
                                    onClick={() => setActiveChart(type)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${activeChart === type ? 'bg-white dark:bg-slate-700 shadow text-intel-blue' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1">
                        {renderChart()}
                    </div>
                </div>

                {/* AI Analysis Panel */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                            <span className="mr-2">🧠</span> Deep Learning Insight
                        </h3>
                    </div>
                    
                    {!analysis && (
                        <div className="space-y-4">
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Select an AI model architecture to analyze the logs for root cause and predictions.
                            </p>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Select Model</label>
                                    <select
                                        value={selectedModelForAnalysis}
                                        onChange={(e) => setSelectedModelForAnalysis(e.target.value as AIModelType)}
                                        className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:ring-1 focus:ring-intel-blue outline-none"
                                    >
                                        {Object.values(AIModelType).map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={runAI}
                                    disabled={loadingAI}
                                    className="flex-1 mt-auto py-2.5 bg-gradient-to-r from-intel-blue to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded font-bold shadow-md transition-all self-end"
                                >
                                    {loadingAI ? 'Running Neural Network Inference...' : 'Generate AI Report'}
                                </button>
                            </div>
                        </div>
                    )}

                    {analysis && (
                    <div className="mt-4 space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                             <span>Model Used: <span className="font-bold text-infra-purple">{selectedModelForAnalysis}</span></span>
                             <button onClick={() => setAnalysis(null)} className="text-intel-blue hover:underline">Re-run Analysis</button>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-intel-blue rounded-r">
                        <h4 className="font-bold text-intel-dark dark:text-blue-300 text-sm uppercase mb-1">Summary</h4>
                        <p className="text-slate-800 dark:text-slate-200">{analysis.summary}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase mb-1">Root Cause</h4>
                            <p className="font-medium text-slate-800 dark:text-white">{analysis.rootCause}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase mb-1">Prediction</h4>
                            <p className="font-medium text-slate-800 dark:text-white">{analysis.prediction}</p>
                        </div>
                        </div>

                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                        <h4 className="font-bold text-green-800 dark:text-green-300 text-sm uppercase mb-1">Recommended Action</h4>
                        <p className="text-green-900 dark:text-green-100 font-medium">{analysis.recommendedAction}</p>
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
