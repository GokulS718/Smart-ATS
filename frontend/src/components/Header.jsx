import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  BarChart3, 
  RefreshCw, 
  Server, 
  Database,
  Search,
  Bell
} from 'lucide-react';

export default function Header({ isBackendOnline, checkBackendStatus }) {
  const location = useLocation();

  const getPageDetails = () => {
    switch (location.pathname) {
      case '/candidate':
        return {
          title: 'Candidate Resume Analyzer',
          subtitle: 'Upload PDF resumes & match skills against Job Descriptions',
          icon: FileText,
          color: 'text-cyan-400'
        };
      case '/recruiter':
        return {
          title: 'HR Recruiter Dashboard',
          subtitle: 'Manage MongoDB candidates, score threshold filter & email triggers',
          icon: Users,
          color: 'text-indigo-400'
        };
      case '/analytics':
        return {
          title: 'Placement & Skill Analytics',
          subtitle: 'Real-time charts, average match scores & candidate leaderboards',
          icon: BarChart3,
          color: 'text-emerald-400'
        };
      default:
        return {
          title: 'Smart ATS Workstation',
          subtitle: 'Next-Gen Resume Processing Engine',
          icon: FileText,
          color: 'text-cyan-400'
        };
    }
  };

  const page = getPageDetails();
  const Icon = page.icon;

  return (
    <header className="sticky top-0 z-20 h-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between">
      {/* Left: Page Title and Breadcrumb */}
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 ${page.color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            {page.title}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            {page.subtitle}
          </p>
        </div>
      </div>

      {/* Right Actions & Status Pill */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>MongoDB: <span className="font-semibold text-emerald-400">Connected</span></span>
        </div>

        <button
          onClick={checkBackendStatus}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isBackendOnline
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
          }`}
          title="Click to check backend status"
        >
          <Server className="w-3.5 h-3.5" />
          <span>{isBackendOnline ? 'API Active' : 'Retry API Connection'}</span>
          <RefreshCw className="w-3 h-3 text-slate-400" />
        </button>

        <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        </div>
      </div>
    </header>
  );
}
