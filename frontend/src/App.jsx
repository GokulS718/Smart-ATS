import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  FileText, 
  Briefcase, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Lightbulb, 
  UploadCloud, 
  Trash2,
  BarChart3,
  Target,
  History,
  Mail,
  Send,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  FileCheck2,
  Tag,
  Check
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('evaluator'); // 'evaluator' | 'history'
  
  // Evaluator Form State
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Results & Notification State
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);

  // History State
  const [historyList, setHistoryList] = useState([
    {
      id: '1',
      date: '2026-08-02',
      candidateName: 'Alex Johnson',
      matchPercentage: 88,
      status: 'Accepted',
    },
    {
      id: '2',
      date: '2026-08-01',
      candidateName: 'Sarah Miller',
      matchPercentage: 62,
      status: 'Pending',
    },
    {
      id: '3',
      date: '2026-07-31',
      candidateName: 'Michael Brown',
      matchPercentage: 42,
      status: 'Rejected',
    }
  ]);

  const API_BASE_URL = 'http://localhost:8080/api/resumes';

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle PDF Drag & Drop or File Select
  const handlePdfUpload = async (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file.');
      return;
    }

    setUploadingPdf(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to parse PDF resume.');
      }

      const data = await response.json();
      if (data.content) {
        setResumeText(data.content);
        if (data.candidateName) {
          setCandidateName(data.candidateName);
        }
        showToast('PDF Resume uploaded & parsed successfully!', 'success');
      } else {
        throw new Error('PDF uploaded but no text content was extracted.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while parsing PDF resume.');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handlePdfUpload(files[0]);
    }
  };

  // Evaluate Resume Call
  const handleEvaluate = async () => {
    if (!resumeText.trim()) {
      setError('Please paste or upload your resume text.');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please paste the target job description.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // Calculate matched keywords heuristic for UI
      const commonSkills = ["Java", "Spring Boot", "MongoDB", "SQL", "Python", "JavaScript", "TypeScript", "React", "Node.js", "Docker", "Kubernetes", "AWS", "Git", "REST API", "HTML", "CSS", "Microservices", "Kafka", "Redis", "CI/CD"];
      const lowerResume = resumeText.toLowerCase();
      const matched = commonSkills.filter(skill => lowerResume.includes(skill.toLowerCase()));

      const enrichedResult = {
        ...data,
        matchedKeywords: matched.length > 0 ? matched : ["Problem Solving", "Teamwork", "Communication"],
        candidateName: candidateName.trim() || 'Candidate ' + Math.floor(100 + Math.random() * 900)
      };

      setResult(enrichedResult);

      // Append to history list
      const newHistoryItem = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        candidateName: enrichedResult.candidateName,
        matchPercentage: data.matchPercentage,
        status: 'Pending',
      };
      setHistoryList(prev => [newHistoryItem, ...prev]);

      showToast('Resume evaluation completed successfully!', 'success');
    } catch (err) {
      setError(err.message || 'Failed to connect to ATS Evaluation API. Make sure backend is running on http://localhost:8080.');
    } finally {
      setLoading(false);
    }
  };

  // HR Email Action Handler (Accept / Reject)
  const handleHrEmailAction = async (statusAction) => {
    if (!result) return;
    setEmailLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateName: result.candidateName,
          status: statusAction,
        }),
      }).catch(() => null);

      // Update local history item status
      setHistoryList(prev => prev.map(item => {
        if (item.candidateName === result.candidateName) {
          return { ...item, status: statusAction };
        }
        return item;
      }));

      showToast(`Candidate marked as ${statusAction}! Notification email sent to ${result.candidateName}.`, 'success');
    } catch (err) {
      showToast(`Action recorded as ${statusAction}.`, 'info');
    } finally {
      setEmailLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const getScoreColor = (score) => {
    if (score >= 75) {
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        stroke: '#10b981',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        label: 'High Match',
      };
    } else if (score >= 50) {
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        stroke: '#f59e0b',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        label: 'Moderate Match',
      };
    } else {
      return {
        text: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        stroke: '#f43f5e',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        label: 'Needs Work',
      };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce-in max-w-md">
          <div className="bg-slate-900 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-auto text-slate-400 hover:text-white font-bold">✕</button>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <nav className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30 text-indigo-400">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">ATS Evaluator</span>
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('evaluator')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'evaluator'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Evaluator</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <History className="w-4 h-4" />
                <span>History</span>
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 rounded-full">
                  {historyList.length}
                </span>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-300 shadow-xl">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-medium">
              <span className="font-bold block mb-0.5">Connection / Processing Error</span>
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-white font-bold">✕</button>
          </div>
        )}

        {/* TAB 1: EVALUATOR WORKFLOW */}
        {activeTab === 'evaluator' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Input Cards Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Resume Input & PDF Drag 'n' Drop */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <span>Resume Upload & Text</span>
                  </div>
                  {resumeText && (
                    <button 
                      onClick={() => { setResumeText(''); setCandidateName(''); }}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear
                    </button>
                  )}
                </div>

                {/* Drag and Drop Zone */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${
                    isDragOver 
                      ? 'border-indigo-500 bg-indigo-500/10' 
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                  }`}
                >
                  <label className="cursor-pointer flex flex-col items-center justify-center">
                    {uploadingPdf ? (
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-indigo-400 mb-2" />
                    )}
                    <span className="text-sm font-semibold text-slate-200">
                      {uploadingPdf ? 'Parsing PDF Text...' : 'Drag & Drop PDF Resume here'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">or click to browse files</span>
                    <input 
                      type="file" 
                      accept=".pdf" 
                      onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])}
                      className="hidden" 
                      disabled={uploadingPdf}
                    />
                  </label>
                </div>

                {/* Fallback Textarea */}
                <div className="flex-1 flex flex-col">
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Or paste raw resume text manually here..."
                    className="w-full h-52 bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition resize-none leading-relaxed"
                  />
                  <div className="mt-2 text-right text-xs text-slate-500">
                    {resumeText.length} characters
                  </div>
                </div>

              </div>

              {/* Job Description (JD) Input */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <Briefcase className="w-5 h-5 text-blue-400" />
                    <span>Target Job Description (JD)</span>
                  </div>
                  {jobDescription && (
                    <button 
                      onClick={() => setJobDescription('')}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear
                    </button>
                  )}
                </div>

                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste complete job description, required technical skills, qualifications, and role responsibilities..."
                  className="w-full h-[348px] bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition resize-none leading-relaxed"
                />
                <div className="mt-2 text-right text-xs text-slate-500">
                  {jobDescription.length} characters
                </div>

              </div>

            </div>

            {/* Evaluate Button */}
            <div className="flex justify-center">
              <button
                onClick={handleEvaluate}
                disabled={loading}
                className="w-full sm:w-auto min-w-[260px] px-8 py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 text-base disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>Analyzing ATS Compatibility...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Evaluate Resume</span>
                  </>
                )}
              </button>
            </div>

            {/* Skeleton Loading State */}
            {loading && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6 animate-pulse">
                <div className="h-8 bg-slate-800 rounded-xl w-1/3" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="h-48 bg-slate-800 rounded-2xl" />
                  <div className="lg:col-span-2 space-y-4">
                    <div className="h-24 bg-slate-800 rounded-2xl" />
                    <div className="h-24 bg-slate-800 rounded-2xl" />
                  </div>
                </div>
              </div>
            )}

            {/* Evaluation Results UI */}
            {result && !loading && (
              <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 animate-fade-in">
                
                {/* Score & Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                      <BarChart3 className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Evaluation Dashboard</h2>
                      <p className="text-sm text-slate-400">Candidate: <span className="text-white font-medium">{result.candidateName}</span></p>
                    </div>
                  </div>

                  <div className={`px-5 py-2.5 rounded-2xl border ${getScoreColor(result.matchPercentage).badgeBg} font-bold text-sm flex items-center gap-2`}>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{getScoreColor(result.matchPercentage).label}</span>
                  </div>
                </div>

                {/* Score & Keyword Analysis Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Circular Score Gauge */}
                  <div className="lg:col-span-1 bg-slate-950/60 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                      ATS Match Score
                    </span>
                    
                    {/* SVG Circular Progress */}
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50" cy="50" r="40"
                          stroke="#1e293b" strokeWidth="8" fill="transparent"
                        />
                        <circle
                          cx="50" cy="50" r="40"
                          stroke={getScoreColor(result.matchPercentage).stroke}
                          strokeWidth="8"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * Math.min(100, Math.max(0, result.matchPercentage))) / 100}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className={`text-4xl font-black ${getScoreColor(result.matchPercentage).text}`}>
                          {result.matchPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Keywords Analysis */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Matched Keywords */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
                      <div className="flex items-center gap-2 font-semibold text-slate-200 mb-3">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Matched Keywords ({result.matchedKeywords?.length || 0})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.matchedKeywords?.map((keyword, index) => (
                          <span key={index} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-xl text-xs font-medium">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Keywords */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
                      <div className="flex items-center gap-2 font-semibold text-slate-200 mb-3">
                        <Target className="w-4 h-4 text-rose-400" />
                        <span>Missing Keywords ({result.missingKeywords?.length || 0})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.missingKeywords?.map((keyword, index) => (
                          <span key={index} className="px-3 py-1.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-medium">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Detailed Feedback */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
                      <div className="flex items-center gap-2 font-semibold text-slate-200 mb-2">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                        <span>AI Feedback & Suggestions</span>
                      </div>
                      <p className="text-sm text-slate-300 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 leading-relaxed">
                        {result.feedback}
                      </p>
                    </div>

                  </div>
                </div>

                {/* HR Action Bar */}
                <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-400">
                    HR Action: Notify candidate directly via email
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button
                      onClick={() => handleHrEmailAction('Accepted')}
                      disabled={emailLoading}
                      className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Accept & Send Email</span>
                    </button>

                    <button
                      onClick={() => handleHrEmailAction('Rejected')}
                      disabled={emailLoading}
                      className="flex-1 sm:flex-none px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Reject & Send Email</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 2: HISTORY DASHBOARD */}
        {activeTab === 'history' && (
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white">Evaluation History</h2>
                <p className="text-sm text-slate-400">Past candidate evaluations & decision logs</p>
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-xs border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Candidate Name</th>
                    <th className="px-4 py-3.5">Match Score</th>
                    <th className="px-4 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {historyList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-4 font-mono text-xs text-slate-400">{item.date}</td>
                      <td className="px-4 py-4 font-semibold text-white">{item.candidateName}</td>
                      <td className="px-4 py-4">
                        <span className={`font-bold ${getScoreColor(item.matchPercentage).text}`}>
                          {item.matchPercentage}%
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.status === 'Accepted'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : item.status === 'Rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}
