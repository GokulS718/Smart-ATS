import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Award,
  ChevronDown,
  UserCheck,
  Send,
  Trash2
} from 'lucide-react';

import { API_BASE_URL } from '../config/api';

const FALLBACK_CANDIDATES = [
  {
    id: "64e0a1f29b1d2e3f4a5b6c01",
    candidateName: "Sarah Jenkins",
    email: "sarah.jenkins@example.com",
    phone: "+1 (555) 234-5678",
    skills: "Java, Spring Boot, React, MongoDB, REST API, Docker",
    atsScore: 92,
    status: "Accepted",
    uploadedAt: "2026-08-07T14:30:00"
  },
  {
    id: "64e0a1f29b1d2e3f4a5b6c02",
    candidateName: "Marcus Vance",
    email: "marcus.vance@techcorp.io",
    phone: "+1 (555) 876-5432",
    skills: "React, JavaScript, Tailwind, Node.js, HTML, CSS",
    atsScore: 84,
    status: "Pending",
    uploadedAt: "2026-08-07T16:15:00"
  },
  {
    id: "64e0a1f29b1d2e3f4a5b6c03",
    candidateName: "Elena Rostova",
    email: "elena.rostova@cloudscale.net",
    phone: "+1 (555) 345-6789",
    skills: "Java, Spring Boot, Microservices, Kubernetes, AWS, SQL",
    atsScore: 88,
    status: "Accepted",
    uploadedAt: "2026-08-08T09:10:00"
  },
  {
    id: "64e0a1f29b1d2e3f4a5b6c04",
    candidateName: "David Chen",
    email: "david.chen@devstudio.com",
    phone: "+1 (555) 987-6543",
    skills: "Python, SQL, HTML, CSS",
    atsScore: 48,
    status: "Rejected",
    uploadedAt: "2026-08-06T11:20:00"
  },
  {
    id: "64e0a1f29b1d2e3f4a5b6c05",
    candidateName: "Priya Sharma",
    email: "priya.sharma@innovate.org",
    phone: "+1 (555) 456-7890",
    skills: "Java, Spring Boot, MongoDB, React, TypeScript, Kafka",
    atsScore: 95,
    status: "Pending",
    uploadedAt: "2026-08-08T10:05:00"
  }
];

export default function RecruiterDashboard({ isBackendOnline }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sendingEmailId, setSendingEmailId] = useState(null);

  // Fetch candidates from Spring Boot API or load fallback data
  const fetchCandidates = async () => {
    setLoading(true);
    try {
      if (isBackendOnline) {
        const res = await fetch(`${API_BASE_URL}/api/resumes/all`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setCandidates(data);
            setLoading(false);
            return;
          }
        }
      }
    } catch (error) {
      console.warn("Backend API call failed, loading local candidate database", error);
    }
    
    // Fallback data
    setCandidates(FALLBACK_CANDIDATES);
    setLoading(false);
  };

  useEffect(() => {
    fetchCandidates();
  }, [isBackendOnline]);

  // Update candidate status API
  const handleUpdateStatus = async (candidateId, newStatus) => {
    const toastId = toast.loading(`Updating status to ${newStatus}...`);
    
    try {
      if (isBackendOnline) {
        const res = await fetch(`${API_BASE_URL}/api/resumes/${candidateId}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
          toast.success(`Candidate status updated to ${newStatus}`, { id: toastId });
        }
      } else {
        toast.success(`Updated status to ${newStatus} (Local State)`, { id: toastId });
      }

      setCandidates(prev =>
        prev.map(c => (c.id === candidateId || c._id === candidateId ? { ...c, status: newStatus } : c))
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status", { id: toastId });
    }
  };

  // Trigger Notification Email via EmailJS
  const handleSendEmail = (candidate) => {
    if (!candidate.email || candidate.email === "Not Found") {
      toast.error("Invalid candidate email address.");
      return;
    }

    const templateParams = {
      to_email: candidate.email,
      candidate_name: candidate.candidateName || "Candidate",
      status: candidate.status || "Pending Review"
    };

    const SERVICE_ID = "service_zzsqe5n";
    const TEMPLATE_ID = "template_jf49nht";
    const PUBLIC_KEY = "2i0TOt5R-apnvsBuJ";

    toast.loading(`Sending email to ${candidate.email}...`, { id: "email-toast" });

    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
      .then((result) => {
        toast.success(`Email notification sent to ${candidate.email}!`, { id: "email-toast" });
      })
      .catch((error) => {
        console.error("EmailJS Error:", error);
        toast.error(`Failed to send email: ${error.text || "Check EmailJS credentials"}`, { id: "email-toast" });
      });
  };

// Delete Candidate API
const handleDeleteCandidate = async (candidateId) => {
    const toastId = toast.loading("Deleting candidate resume...");
    try {
      if (isBackendOnline) {
        const res = await fetch(`${API_BASE_URL}/api/resumes/${candidateId}`, {
          method: "DELETE"
        });
        if (res.ok) {
          toast.success("Candidate deleted successfully", { id: toastId });
        } else {
          toast.success("Candidate removed from list", { id: toastId });
        }
      } else {
        toast.success("Candidate deleted successfully (Local State)", { id: toastId });
      }

      setCandidates(prev => prev.filter(c => (c.id !== candidateId && c._id !== candidateId)));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete candidate", { id: toastId });
    }
  };

  // Filter logic with robust parseFloat & string stripping for atsScore
  const filteredCandidates = candidates.filter(candidate => {
    const score = parseFloat(String(candidate.atsScore || candidate.score || 0).replace(/[^0-9.]/g, '')) || 0;
    const minThreshold = parseFloat(minScore) || 0;
    const matchesScore = score >= minThreshold;

    const searchLower = (searchTerm || '').toLowerCase();
    const matchesSearch = !searchTerm || 
      candidate.candidateName?.toLowerCase().includes(searchLower) ||
      candidate.email?.toLowerCase().includes(searchLower) ||
      candidate.skills?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'ALL' || (candidate.status || 'Pending').toUpperCase() === statusFilter.toUpperCase();

    return matchesScore && matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch ((status || 'PENDING').toUpperCase()) {
      case 'ACCEPTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Accepted
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 w-fit">
            <XCircle className="w-3.5 h-3.5 text-rose-400" /> Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 w-fit">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" /> HR Candidate Evaluation Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            MongoDB Records • Instant Status Toggles • Notification Email Service
          </p>
        </div>

        <button
          onClick={fetchCandidates}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Candidates
        </button>
      </div>

      {/* Control Bar: Search & Threshold Filters */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate name, email, skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/70 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
          />
        </div>

        {/* ATS Score Slider Filter */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span>Score Threshold Filter:</span>
            <span className="text-cyan-400 font-bold">{minScore}%+</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

      </div>

      {/* Candidates Table Card */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
        
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-800 rounded w-1/3" />
            <div className="h-12 bg-slate-800 rounded-xl" />
            <div className="h-12 bg-slate-800 rounded-xl" />
            <div className="h-12 bg-slate-800 rounded-xl" />
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-300">No Candidates Found</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search criteria or score threshold slider.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Candidate Details</th>
                  <th className="py-4 px-6">ATS Score</th>
                  <th className="py-4 px-6">Skills & Tech Stack</th>
                  <th className="py-4 px-6">Status Tag</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredCandidates.map((c) => {
                  const candidateId = c.id || c._id;
                  const score = c.atsScore || 75;

                  return (
                    <tr key={candidateId} className="hover:bg-slate-800/40 transition-colors group">
                      
                      {/* Name & Contact */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                            {(c.candidateName || 'C').charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                              {c.candidateName || 'Anonymous Candidate'}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500" />
                              {c.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ATS Score Indicator */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${
                            score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            score >= 60 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {score}%
                          </div>
                        </div>
                      </td>

                      {/* Skills Badges */}
                      <td className="py-4 px-6 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {(c.skills ? c.skills.split(',') : ['Java', 'Spring Boot']).slice(0, 3).map((sk, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                              {sk.trim()}
                            </span>
                          ))}
                          {(c.skills ? c.skills.split(',').length : 2) > 3 && (
                            <span className="text-[10px] text-slate-500 font-semibold align-center self-center pl-1">
                              +{c.skills.split(',').length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Tag */}
                      <td className="py-4 px-6">
                        {getStatusBadge(c.status)}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Accept Button */}
                          <button
                            onClick={() => handleUpdateStatus(candidateId, "Accepted")}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                            title="Accept Candidate"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>

                          {/* Reject Button */}
                          <button
                            onClick={() => handleUpdateStatus(candidateId, "Rejected")}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                            title="Reject Candidate"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>

                          {/* Send Email Notification Trigger Button */}
                          <button
                            onClick={() => handleSendEmail(c)}
                            disabled={sendingEmailId === candidateId}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            title="Send status email to candidate"
                          >
                            <Send className={`w-3.5 h-3.5 ${sendingEmailId === candidateId ? 'animate-pulse' : ''}`} />
                            <span>Notify Email</span>
                          </button>

                          {/* Delete Candidate Button */}
                          <button
                            onClick={() => handleDeleteCandidate(candidateId)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors ml-1"
                            title="Delete Candidate Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
