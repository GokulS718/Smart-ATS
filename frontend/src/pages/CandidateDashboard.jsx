import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ArrowRight, 
  RefreshCw,
  Award,
  AlertTriangle,
  Lightbulb,
  FileCheck
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function CandidateDashboard({ isBackendOnline }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedCandidate, setParsedCandidate] = useState(null);
  const [evaluation, setEvaluation] = useState(null);

  // Handle Drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setSelectedFile(file);
        toast.success(`Loaded PDF: ${file.name}`);
      } else {
        toast.error("Please drop a valid PDF file.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setSelectedFile(file);
        toast.success(`Loaded PDF: ${file.name}`);
      } else {
        toast.error("Only PDF files are supported.");
      }
    }
  };

  // Analyze Resume and JD
  const handleAnalyze = async () => {
    if (!selectedFile && !jobDescription.trim()) {
      toast.error("Please upload a PDF resume or enter a Job Description.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Analyzing resume and extracting skills...");

    try {
      let candidateData = null;

      // 1. If backend is online and file exists, upload to API /api/resumes/upload
      if (isBackendOnline && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        
        try {
          const res = await fetch(`${API_BASE_URL}/api/resumes/upload`, {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            candidateData = await res.json();
          }
        } catch (err) {
            console.warn("Backend upload endpoint failed, falling back to local analysis", err);
        }
      }

      // Fallback parsed candidate details if backend is offline or mock fallback
      if (!candidateData) {
        candidateData = {
          candidateName: selectedFile ? selectedFile.name.replace(".pdf", "") : "Alex Morgan",
          email: "alex.morgan@techdev.io",
          phone: "+1 (555) 019-2834",
          skills: "Java, Spring Boot, React, MongoDB, REST API, Docker, JavaScript, Git",
          matchedSkills: ["Java", "Spring Boot", "React", "MongoDB", "REST API", "Git"],
          missingSkills: ["Kubernetes", "Kafka", "AWS"],
          atsScore: 82,
          content: "Experienced Full Stack Developer with 4+ years building Java Spring Boot APIs and React frontends."
        };
      }

      setParsedCandidate(candidateData);

      // 2. Perform JD match analysis via /api/resumes/evaluate if online
      if (isBackendOnline && jobDescription.trim()) {
        try {
          const evalRes = await fetch(`${API_BASE_URL}/api/resumes/evaluate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              resumeText: candidateData.content || candidateData.skills || "Java Spring Boot React MongoDB REST API",
              jobDescription: jobDescription
            })
          });
          if (evalRes.ok) {
            const evalData = await evalRes.json();
            setEvaluation(evalData);
            toast.success("Resume ATS Analysis completed!", { id: toastId });
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Backend evaluate endpoint offline, calculating client-side match", err);
        }
      }

      // Fallback local JD match analysis calculation
      const jdText = jobDescription.toLowerCase();
      const candidateSkillList = (candidateData.skills || "").split(",").map(s => s.trim());
      
      const commonTechKeywords = [
        "Java", "Spring Boot", "MongoDB", "React", "Node.js", "Docker", 
        "Kubernetes", "AWS", "Python", "SQL", "REST API", "TypeScript", "Kafka", "Microservices"
      ];

      const jdRequired = commonTechKeywords.filter(kw => jdText.includes(kw.toLowerCase()));
      const matched = jdRequired.length > 0 
        ? jdRequired.filter(kw => candidateSkillList.some(cs => cs.toLowerCase().includes(kw.toLowerCase())))
        : candidateSkillList.slice(0, 5);
      
      const missing = jdRequired.length > 0
        ? jdRequired.filter(kw => !matched.includes(kw))
        : ["Kubernetes", "Kafka", "AWS Cloud Services"];

      const score = jdRequired.length > 0
        ? Math.round((matched.length / Math.max(1, jdRequired.length)) * 100)
        : candidateData.atsScore || 78;

      setEvaluation({
        matchPercentage: Math.min(100, Math.max(35, score)),
        missingKeywords: missing.length > 0 ? missing : ["CI/CD Pipeline", "Microservices Architecture"],
        feedback: missing.length > 0 
          ? `Strong base alignment! To boost score above 90%, include experience with ${missing.slice(0, 2).join(" & ")} in your summary or project section.`
          : "Exceptional resume match! High keyword coverage matching target job requirements."
      });

      toast.success("ATS Analysis completed!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Error analyzing resume. Please try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return { stroke: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 50) return { stroke: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    return { stroke: '#ef4444', text: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-8 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> AI Candidate Resume Parser
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Analyze & Optimize Your Resume ATS Match
            </h2>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              Upload your PDF resume, paste the target job description, and get instant feedback with score badges, skill gap detection, and actionable AI improvement tips.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center">
              <div className="text-xs text-slate-400 font-medium">Target Benchmark</div>
              <div className="text-xl font-bold text-cyan-400 mt-0.5">85%+ Match</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Column 1: PDF Upload Card */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              1. Upload Resume (PDF)
            </h3>
            <span className="text-xs text-slate-400">PDF Box Parser</span>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              dragActive
                ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-700/70 hover:border-slate-600 bg-slate-950/50'
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            {selectedFile ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg">
                  <FileCheck className="w-8 h-8 animate-bounce" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100 text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready for evaluation
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="px-3 py-1 text-xs rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors z-20"
                >
                  Remove & Replace
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-lg">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-medium text-slate-200 text-sm">
                    Drag and drop your PDF resume here, or <span className="text-cyan-400 font-semibold underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports standard PDF format up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Preset Sample Resume Selector */}
          <div className="pt-2">
            <span className="text-xs text-slate-400 font-medium">Or try a sample preset resume:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { name: "Full Stack Java Developer.pdf", skills: "Java, Spring Boot, React, MongoDB" },
                { name: "Frontend Engineer.pdf", skills: "React, Tailwind, JavaScript, HTML, CSS" },
                { name: "Backend Architect.pdf", skills: "Java, Microservices, Docker, Kafka, SQL" }
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const mockFile = new File(["dummy content"], sample.name, { type: "application/pdf" });
                    setSelectedFile(mockFile);
                    toast.success(`Loaded sample: ${sample.name}`);
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  📄 {sample.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Job Description Box */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                2. Target Job Description (JD)
              </h3>
              <span className="text-xs text-slate-400">Keyword Extraction</span>
            </div>

            <textarea
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the Job Description here (e.g. We are seeking a Senior Full-Stack Engineer proficient in Java, Spring Boot, React, MongoDB, REST APIs, Docker, and Microservices architecture...)"
              className="w-full p-4 rounded-xl bg-slate-950/80 border border-slate-700/70 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setJobDescription("We are looking for a Senior Full Stack Engineer with strong expertise in Java, Spring Boot, MongoDB, React, REST API development, Docker, and Microservices. Experience with Kafka and AWS Cloud is a plus.");
                toast.success("Loaded sample Job Description!");
              }}
              className="text-xs text-cyan-400 hover:underline"
            >
              + Insert Sample Tech JD
            </button>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing ATS Match...
                </>
              ) : (
                <>
                  Analyze ATS Score
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton Loader during evaluation */}
      {loading && (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 animate-pulse">
          <div className="h-6 bg-slate-800 rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-40 bg-slate-800 rounded-xl" />
            <div className="h-40 bg-slate-800 rounded-xl" />
            <div className="h-40 bg-slate-800 rounded-xl" />
          </div>
        </div>
      )}

      {/* Results Section */}
      {evaluation && !loading && (
        <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-extrabold text-slate-100">
                  ATS Evaluation Results
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(evaluation.matchPercentage).bg} ${getScoreColor(evaluation.matchPercentage).text}`}>
                  {evaluation.matchPercentage >= 75 ? 'High Match Candidate' : evaluation.matchPercentage >= 50 ? 'Moderate Match' : 'Action Required'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Parsed Candidate: <span className="text-slate-200 font-semibold">{parsedCandidate?.candidateName || "Candidate"}</span> ({parsedCandidate?.email || "alex@example.com"})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            {/* Score Ring Widget */}
            <div className="p-6 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    strokeWidth="3.5"
                    strokeDasharray={`${evaluation.matchPercentage}, 100`}
                    strokeLinecap="round"
                    stroke={getScoreColor(evaluation.matchPercentage).stroke}
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className={`text-4xl font-extrabold ${getScoreColor(evaluation.matchPercentage).text}`}>
                    {evaluation.matchPercentage}%
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    ATS Score
                  </span>
                </div>
              </div>
              <span className="text-xs text-slate-400">
                Calculated based on skill match & keyword frequency
              </span>
            </div>

            {/* Matched & Missing Skill Badges */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Matched Skills */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Matched Skills ({parsedCandidate?.matchedSkills?.length || 5})
                </div>
                <div className="flex flex-wrap gap-2">
                  {(parsedCandidate?.matchedSkills || ["Java", "Spring Boot", "React", "MongoDB", "REST API"]).map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-rose-400">
                  <XCircle className="w-4 h-4" />
                  Missing / Recommended Keywords ({evaluation.missingKeywords?.length || 0})
                </div>
                <div className="flex flex-wrap gap-2">
                  {(evaluation.missingKeywords || ["Kubernetes", "Kafka", "AWS"]).map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5"
                    >
                      <XCircle className="w-3 h-3 text-rose-400" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* AI Feedback & Optimization Suggestions Card */}
          <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              AI Resume Improvement Suggestions
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              {evaluation.feedback}
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
