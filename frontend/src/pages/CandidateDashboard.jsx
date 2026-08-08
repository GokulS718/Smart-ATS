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
  FileCheck,
  Layers,
  Trash2,
  ChevronRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://smart-ats-backend.onrender.com";

const JD_PRESETS = [
  {
    name: "Cloud Computing",
    description: "AWS, GCP, Docker, Kubernetes, Terraform, Microservices",
    text: "Seeking a Cloud Engineer with extensive experience in AWS, GCP, Docker, Kubernetes, Terraform, Microservices architecture, Linux systems, CI/CD automation, and high-availability cloud infrastructure."
  },
  {
    name: "FSWD - Full Stack Web Development",
    description: "React, Node.js, Spring Boot, MongoDB, REST APIs",
    text: "Looking for a Senior Full Stack Web Developer skilled in React, Node.js, Java Spring Boot, MongoDB, REST APIs, TypeScript, Docker, Tailwind CSS, and full lifecycle web application development."
  },
  {
    name: "AI - Artificial Intelligence",
    description: "LLMs, Gemini/OpenAI API, Prompt Engineering, Python, Vector DB",
    text: "Hiring an AI Engineer proficient in LLMs, Gemini/OpenAI API integration, Prompt Engineering, Python, Vector Databases (Pinecone, Chroma), LangChain, RAG architecture, and autonomous AI agents."
  },
  {
    name: "AI / ML - Machine Learning",
    description: "Scikit-Learn, PyTorch, TensorFlow, FastAPI, Model Deployment",
    text: "Seeking a Machine Learning Engineer with strong background in Scikit-Learn, PyTorch, TensorFlow, FastAPI, Model Deployment, feature engineering, data pipelines, and MLOps workflows."
  },
  {
    name: "DS - Data Science",
    description: "Python, Pandas, NumPy, Data Modeling, Predictive Analytics",
    text: "Looking for a Data Scientist experienced in Python, Pandas, NumPy, Data Modeling, Predictive Analytics, exploratory data analysis, statistical modeling, hypothesis testing, and machine learning."
  },
  {
    name: "Data Analytics",
    description: "SQL, Power BI, Excel, Data Visualization, Python",
    text: "Hiring a Data Analyst with solid expertise in SQL queries, Power BI dashboards, Advanced Excel, Data Visualization, Python data analysis, business intelligence reporting, and KPI tracking."
  }
];

export default function CandidateDashboard({ isBackendOnline }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(0);
  
  // Single view & Batch Leaderboard states
  const [parsedCandidate, setParsedCandidate] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [batchResults, setBatchResults] = useState([]);

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

  const addFiles = (files) => {
    const validPdfs = Array.from(files).filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (validPdfs.length === 0) {
      toast.error("Please select valid PDF files.");
      return;
    }

    setSelectedFiles(prev => {
      const combined = [...prev, ...validPdfs];
      if (combined.length > 7) {
        toast.error("Maximum 7 resumes allowed per batch. Keeping the first 7.");
        return combined.slice(0, 7);
      }
      toast.success(`Added ${validPdfs.length} PDF resume(s). Total: ${combined.length}`);
      return combined;
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePresetSelect = (presetName) => {
    setSelectedPreset(presetName);
    const found = JD_PRESETS.find(p => p.name === presetName);
    if (found) {
      setJobDescription(found.text);
      toast.success(`Loaded preset: ${found.name}`);
    }
  };

  // Analyze Batch Resumes against JD
  const handleAnalyze = async () => {
    if (selectedFiles.length === 0 && !jobDescription.trim()) {
      toast.error("Please upload at least 1 PDF resume or enter a Job Description.");
      return;
    }

    setLoading(true);
    const filesToProcess = selectedFiles.length > 0 ? selectedFiles : [new File(["Sample Candidate"], "Alex Morgan Resume.pdf", { type: "application/pdf" })];
    const results = [];
    const toastId = toast.loading(`Analyzing batch of ${filesToProcess.length} resume(s)...`);

    const jdText = jobDescription.toLowerCase();
    const commonTechKeywords = [
      "Java", "Spring Boot", "MongoDB", "React", "Node.js", "Docker", 
      "Kubernetes", "AWS", "Python", "SQL", "REST API", "TypeScript", "Kafka", "Microservices",
      "Terraform", "GCP", "PyTorch", "TensorFlow", "Pandas", "Power BI", "Excel"
    ];
    const jdRequired = commonTechKeywords.filter(kw => jdText.includes(kw.toLowerCase()));

    for (let i = 0; i < filesToProcess.length; i++) {
      setProcessingIndex(i + 1);
      const currentFile = filesToProcess[i];
      let candidateData = null;
      let evalData = null;

      let initialScore = 85;
      if (jdRequired.length > 0) {
        initialScore = Math.min(100, Math.max(45, Math.round((Math.min(jdRequired.length, 5) / Math.max(1, jdRequired.length)) * 100)));
      }

      // 1. Upload to Backend API /api/resumes/upload
      if (isBackendOnline && currentFile.size > 0 && currentFile.name.endsWith(".pdf")) {
        const formData = new FormData();
        formData.append("file", currentFile);
        formData.append("atsScore", String(initialScore));

        try {
          const res = await fetch(`${API_BASE_URL}/api/resumes/upload`, {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            candidateData = await res.json();
          }
        } catch (err) {
          console.warn("Backend upload failed for file: " + currentFile.name, err);
        }
      }

      // Fallback parsed details if offline
      if (!candidateData) {
        const cleanName = currentFile.name ? currentFile.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " ") : "Candidate " + (i + 1);
        candidateData = {
          id: "local-" + (i + 1),
          candidateName: cleanName,
          email: `${cleanName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          phone: "+91 " + (7598200000 + i * 1111),
          skills: "Java, Spring Boot, React, MongoDB, REST API, Docker, JavaScript, Git",
          matchedSkills: ["Java", "Spring Boot", "React", "MongoDB", "REST API", "Git"],
          missingSkills: ["Kubernetes", "Kafka", "AWS"],
          atsScore: initialScore,
          content: `Experienced Software Engineer with background in Full-Stack development, APIs and Cloud systems.`
        };
      }

      // 2. Perform JD match analysis via /api/resumes/evaluate
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
            evalData = await evalRes.json();
          }
        } catch (err) {
          console.warn("Backend evaluate failed", err);
        }
      }

      // Fallback local JD match analysis calculation
      if (!evalData) {
        const candidateSkillList = (candidateData.skills || "").split(",").map(s => s.trim());
        const matched = jdRequired.length > 0 
          ? jdRequired.filter(kw => candidateSkillList.some(cs => cs.toLowerCase().includes(kw.toLowerCase())))
          : candidateSkillList.slice(0, 5);
        
        const missing = jdRequired.length > 0
          ? jdRequired.filter(kw => !matched.includes(kw))
          : ["Kubernetes", "Kafka", "AWS Cloud"];

        const score = jdRequired.length > 0
          ? Math.round((matched.length / Math.max(1, jdRequired.length)) * 100)
          : candidateData.atsScore || 85;

        const finalScore = Math.min(100, Math.max(35, score));
        evalData = {
          matchPercentage: finalScore,
          missingKeywords: missing.length > 0 ? missing : ["CI/CD Pipeline", "Microservices Architecture"],
          feedback: missing.length > 0 
            ? `Good foundation! To increase ATS score above 90%, add hands-on projects highlighting ${missing.slice(0, 2).join(" & ")}.`
            : "Outstanding alignment! Strong coverage across target job keywords."
        };
      }

      // Synchronize exact evaluated ATS score with backend
      const targetScore = evalData.matchPercentage;
      candidateData.atsScore = targetScore;

      const targetId = candidateData.id || candidateData._id;
      if (isBackendOnline && targetId && !String(targetId).startsWith("local-")) {
        fetch(`${API_BASE_URL}/api/resumes/${targetId}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Pending", atsScore: targetScore })
        }).catch(() => {});
      }

      results.push({
        fileName: currentFile.name,
        candidateData,
        evaluation: evalData,
        atsScore: targetScore
      });
    }

    // Sort results by ATS Score descending
    results.sort((a, b) => b.atsScore - a.atsScore);

    setBatchResults(results);
    if (results.length > 0) {
      setParsedCandidate(results[0].candidateData);
      setEvaluation(results[0].evaluation);
    }

    toast.success(`Completed ATS evaluation for ${results.length} resume(s)!`, { id: toastId });
    setLoading(false);
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
              <Sparkles className="w-3.5 h-3.5" /> AI Batch Resume Parser & ATS Matcher
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Multi-Resume ATS Match & Rank Optimizer
            </h2>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              Upload up to 7 PDF resumes simultaneously, select predefined tech job descriptions, and extract synchronized scores with automated candidate ranking.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center">
              <div className="text-xs text-slate-400 font-medium">Batch Limit</div>
              <div className="text-xl font-bold text-cyan-400 mt-0.5">Up to 7 PDFs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Column 1: Multi-PDF Batch Upload Card */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              1. Upload Resumes (Up to 7 PDFs)
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 font-semibold">
              {selectedFiles.length} / 7 Selected
            </span>
          </div>

          {/* Drag & Drop Multi-File Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
              dragActive
                ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                : selectedFiles.length > 0
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-700/70 hover:border-slate-600 bg-slate-950/50'
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-lg">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-200 text-sm">
                  Drag & drop multiple PDF resumes here, or <span className="text-cyan-400 underline">browse files</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Upload up to 7 resumes at once for batch evaluation
                </p>
              </div>
            </div>
          </div>

          {/* Selected File Chips list */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Selected Resumes Queue:</span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-rose-400 hover:underline"
                >
                  Clear All
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate font-medium">{file.name}</span>
                      <span className="text-[10px] text-slate-500">
                        ({(file.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors z-20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preset Sample Resume Selector */}
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium">Or add quick sample test resumes:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { name: "Vijay Kumar K.pdf" },
                { name: "Sarah Jenkins.pdf" },
                { name: "Marcus Vance.pdf" }
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const mockFile = new File(["Sample candidate resume content"], sample.name, { type: "application/pdf" });
                    addFiles([mockFile]);
                  }}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  + {sample.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Job Description Box with Presets */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                2. Target Job Description (JD)
              </h3>
              <span className="text-xs text-slate-400">Presets & Keywords</span>
            </div>

            {/* Preset Combobox Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Select Job Role Preset:</span>
                <span className="text-[10px] text-cyan-400">Auto-populates text</span>
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => handlePresetSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer font-medium"
              >
                <option value="" disabled>-- Choose Job Description Preset --</option>
                {JD_PRESETS.map((preset) => (
                  <option key={preset.name} value={preset.name} className="bg-slate-900 text-slate-200">
                    {preset.name} ({preset.description})
                  </option>
                ))}
              </select>
            </div>

            <textarea
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste custom Job Description or select a role from the dropdown above..."
              className="w-full p-4 rounded-xl bg-slate-950/80 border border-slate-700/70 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                handlePresetSelect("FSWD - Full Stack Web Development");
              }}
              className="text-xs text-cyan-400 hover:underline"
            >
              + Quick Full-Stack JD
            </button>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing {processingIndex}/{Math.max(1, selectedFiles.length)}...
                </>
              ) : (
                <>
                  Analyze ATS Batch ({Math.max(1, selectedFiles.length)})
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Batch Leaderboard Table if multiple files analyzed */}
      {batchResults.length > 1 && (
        <div className="p-6 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-100 text-lg">
              <Award className="w-5 h-5 text-amber-400" />
              Batch Evaluation Leaderboard ({batchResults.length} Candidates)
            </div>
            <span className="text-xs text-slate-400">Ranked by ATS Match Score</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4">Contact (Email & Phone)</th>
                  <th className="py-3 px-4">ATS Match</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {batchResults.map((item, index) => {
                  const isSelected = parsedCandidate?.email === item.candidateData.email;
                  return (
                    <tr 
                      key={index} 
                      className={`hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-cyan-500/10' : ''}`}
                    >
                      <td className="py-3 px-4 font-bold text-cyan-400">
                        #{index + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-100">
                        {item.candidateData.candidateName}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <div>{item.candidateData.email}</div>
                        <div className="text-[11px] text-slate-500">{item.candidateData.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-lg font-bold border ${getScoreColor(item.atsScore).bg} ${getScoreColor(item.atsScore).text}`}>
                          {item.atsScore}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {item.atsScore >= 75 ? 'Top Match' : 'Reviewed'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setParsedCandidate(item.candidateData);
                            setEvaluation(item.evaluation);
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-slate-700 font-semibold transition-all"
                        >
                          View Breakdown
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Candidate Detailed ATS Breakdown */}
      {evaluation && !loading && (
        <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-extrabold text-slate-100">
                  ATS Evaluation Details: {parsedCandidate?.candidateName || "Candidate"}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(evaluation.matchPercentage).bg} ${getScoreColor(evaluation.matchPercentage).text}`}>
                  {evaluation.matchPercentage >= 75 ? 'High Match Candidate' : evaluation.matchPercentage >= 50 ? 'Moderate Match' : 'Action Required'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Contact: <span className="text-slate-200 font-semibold">{parsedCandidate?.email || "N/A"}</span> • {parsedCandidate?.phone || "N/A"}
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
                Synchronized with Recruiter Hub & MongoDB
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
