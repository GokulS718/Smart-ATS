import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  BarChart3, 
  Sparkles, 
  ShieldCheck, 
  Cpu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ collapsed, setCollapsed, isBackendOnline }) {
  const navItems = [
    {
      path: '/candidate',
      label: 'Candidate Analyzer',
      desc: 'Resume & JD Matcher',
      icon: FileText,
      badge: 'AI Core'
    },
    {
      path: '/recruiter',
      label: 'HR Recruiter Hub',
      desc: 'Applicant Tracking & Email',
      icon: Users,
      badge: 'MongoDB'
    },
    {
      path: '/analytics',
      label: 'Placement Insights',
      desc: 'Skill Analytics & Rankings',
      icon: BarChart3,
      badge: 'Live'
    }
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 z-30 transition-all duration-300 flex flex-col justify-between ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div>
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20 text-white shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Smart<span className="text-cyan-400">ATS</span>
                </span>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                  Enterprise v2.0
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="p-3 space-y-2 mt-4">
          <div className={`px-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase ${collapsed ? 'text-center' : ''}`}>
            {collapsed ? 'Menu' : 'Dashboards'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent border border-cyan-500/30 text-cyan-300 font-semibold shadow-md shadow-cyan-950/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'}`} />
                    
                    {!collapsed && (
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm truncate">{item.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {item.badge}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 truncate group-hover:text-slate-400">
                          {item.desc}
                        </span>
                      </div>
                    )}

                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Footer System Status Badge */}
      <div className="p-3 border-t border-slate-800/80">
        <div className={`p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="relative flex items-center justify-center">
            <span className={`w-3 h-3 rounded-full ${isBackendOnline ? 'bg-emerald-500' : 'bg-amber-500'} inline-block`} />
            <span className={`absolute w-3 h-3 rounded-full ${isBackendOnline ? 'bg-emerald-400' : 'bg-amber-400'} animate-ping opacity-75`} />
          </div>

          {!collapsed && (
            <div className="flex flex-col text-xs min-w-0">
              <span className="font-medium text-slate-200 flex items-center gap-1">
                Backend API
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                {isBackendOnline ? 'Spring Boot 8080 Connected' : 'Offline (Fallback Mode)'}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
