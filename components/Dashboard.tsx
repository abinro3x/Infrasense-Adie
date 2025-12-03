
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const data = [
  { name: 'Mon', passed: 40, failed: 2, error: 1 },
  { name: 'Tue', passed: 30, failed: 5, error: 0 },
  { name: 'Wed', passed: 55, failed: 3, error: 2 },
  { name: 'Thu', passed: 45, failed: 1, error: 0 },
  { name: 'Fri', passed: 60, failed: 4, error: 1 },
];

const comparativeData = [
  { name: 'Week 1', current: 85, historical: 82 },
  { name: 'Week 2', current: 88, historical: 83 },
  { name: 'Week 3', current: 92, historical: 84 },
  { name: 'Week 4', current: 90, historical: 85 },
];

const pieData = [
  { name: 'Sanity', value: 400 },
  { name: 'Stress', value: 300 },
  { name: 'Power', value: 300 },
  { name: 'I/O', value: 200 },
];

const COLORS = ['#0068B5', '#00C7FD', '#FFBB28', '#FF8042'];

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Boards', value: '12/15', color: 'border-l-4 border-green-500' },
          { label: 'Tests Running', value: '8', color: 'border-l-4 border-intel-blue' },
          { label: 'Pass Rate (7d)', value: '94.2%', color: 'border-l-4 border-intel-light' },
          { label: 'Failures (24h)', value: '3', color: 'border-l-4 border-red-500' },
        ].map((kpi, idx) => (
          <div key={idx} className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm ${kpi.color}`}>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">{kpi.label}</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Test Execution Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="passed" stackId="a" fill="#0068B5" name="Passed" />
                <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" />
                <Bar dataKey="error" stackId="a" fill="#eab308" name="Error" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comparative Graphic Visual */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Comparative Performance</h3>
             <span className="text-xs bg-infra-purple text-white px-2 py-1 rounded">AI Insight</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">Comparing Current Week vs Historical Average Pass Rates</p>
          <div className="h-60">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={comparativeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis domain={[70, 100]} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', color: '#fff' }} />
                  <Legend />
                  <Line type="monotone" dataKey="current" stroke="#00C7FD" strokeWidth={3} name="Current Wk" />
                  <Line type="monotone" dataKey="historical" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="Historical Avg" />
               </LineChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
