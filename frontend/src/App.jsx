import React, { useState } from 'react';
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
  FileCheck
} from 'lucide-react';

export default function App() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const API_EVALUATE_URL = 'http://localhost:8080/api/resumes/evaluate';
  const API_UPLOAD_URL = 'http://localhost:8080/api/resumes/upload';

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF file.');
      return;
    }

    setUploadingPdf(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(API_UPLOAD_URL, {
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
      } else {
        throw new Error('PDF uploaded but no text content was extracted.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while parsing PDF resume.');
    } finally {
      setUploadingPdf(false);
    }
  };

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
      const response = await fetch(API_EVALUATE_URL, {
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
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to ATS Evaluation API. Make sure backend is running on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColorClass = (score) => {
    if (score >= 75) {
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        progress: 'bg-emerald-500',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        label: 'High Match',
        icon: CheckCircle2,
      };
    } else if (score >= 50) {
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        progress: 'bg-amber-500',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        label: 'Moderate Match',
        icon: AlertTriangle,
      };
    } else {
      return {
        text: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        progress: 'bg-rose-500',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        label: 'Needs Work',
        icon: AlertCircle,
      };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background Subtle Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 text-indigo-400 shadow-lg shadow-indigo-500/10">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">ATS Evaluator</span>
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full">
                  AI Powered
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Benchmark candidate resumes against job descriptions with instant keyword analysis & score
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm font-medium transition cursor-pointer shadow-sm">
              {uploadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <UploadCloud className="w-4 h-4 text-indigo-400" />
              )}
              <span>{uploadingPdf ? 'Parsing PDF...' : 'Upload PDF Resume'}</span>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handlePdfUpload} 
                className="hidden" 
                disabled={uploadingPdf}
              />
            </label>
          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-300 shadow-lg shadow-rose-500/5 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-medium">
              <span className="font-semibold block mb-0.5">Evaluation Error</span>
              {error}
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-200 transition text-sm font-bold px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input Textareas Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Resume Textarea */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Resume Content</span>
              </div>
              {resumeText && (
                <button 
                  onClick={() => setResumeText('')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition"
                  title="Clear text"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste raw resume text here, or click 'Upload PDF Resume' above..."
              className="w-full h-64 sm:h-80 bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition resize-none leading-relaxed"
            />
            <div className="mt-2 text-right text-xs text-slate-500">
              {resumeText.length} characters
            </div>
          </div>

          {/* Job Description Textarea */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Briefcase className="w-5 h-5 text-blue-400" />
                <span>Job Description (JD)</span>
              </div>
              {jobDescription && (
                <button 
                  onClick={() => setJobDescription('')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition"
                  title="Clear text"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste target job requirements & duties here..."
              className="w-full h-64 sm:h-80 bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition resize-none leading-relaxed"
            />
            <div className="mt-2 text-right text-xs text-slate-500">
              {jobDescription.length} characters
            </div>
          </div>

        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-12">
          <button
            onClick={handleEvaluate}
            disabled={loading}
            className="w-full sm:w-auto min-w-[240px] px-8 py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Evaluating ATS Score...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Evaluate Now</span>
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 animate-fade-in">
            
            {/* Header / Score Overview */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Evaluation Results</h2>
                  <p className="text-sm text-slate-400">Analysis completed based on keyword matching & requirements</p>
                </div>
              </div>

              {/* Match Badge */}
              {(() => {
                const scoreDetails = getScoreColorClass(result.matchPercentage);
                const IconComponent = scoreDetails.icon;
                return (
                  <div className={`px-5 py-2.5 rounded-2xl border ${scoreDetails.badgeBg} flex items-center gap-2.5 font-bold text-sm shadow-md`}>
                    <IconComponent className="w-4 h-4" />
                    <span>{scoreDetails.label}</span>
                  </div>
                );
              })()}
            </div>

            {/* Score & Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Score Display Card */}
              <div className="lg:col-span-1 bg-slate-950/60 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  ATS Match Score
                </span>
                
                {(() => {
                  const scoreDetails = getScoreColorClass(result.matchPercentage);
                  return (
                    <div className="my-3 relative flex items-center justify-center">
                      <div className={`text-6xl sm:text-7xl font-black ${scoreDetails.text} tracking-tight`}>
                        {result.matchPercentage}%
                      </div>
                    </div>
                  );
                })()}

                {/* Score Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-3 mt-4 overflow-hidden p-0.5 border border-slate-700/50">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${getScoreColorClass(result.matchPercentage).progress}`} 
                    style={{ width: `${Math.min(100, Math.max(0, result.matchPercentage))}%` }}
                  />
                </div>
              </div>

              {/* Missing Keywords & Feedback Container */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Missing Keywords Card */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2 font-semibold text-slate-200 mb-3">
                    <Target className="w-4 h-4 text-rose-400" />
                    <span>Missing Keywords ({result.missingKeywords?.length || 0})</span>
                  </div>

                  {result.missingKeywords && result.missingKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.missingKeywords.map((keyword, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-medium shadow-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>No critical keywords missing! Great alignment.</span>
                    </div>
                  )}
                </div>

                {/* Feedback Card */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2 font-semibold text-slate-200 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>Improvement Suggestion</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5">
                    {result.feedback || 'No feedback generated.'}
                  </p>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
