import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, History, User, Settings, LogOut, 
  Upload, Download, CheckCircle, Circle, FileSpreadsheet, X, Loader2, ArrowLeft, Eye
} from 'lucide-react';
import axios from 'axios';
import { jsPDF } from 'jspdf';

interface SkillItem {
  skill: string;
  level: number;
}

interface HistoryItem {
  id: string;
  file_name: string;
  ats_score: number;
  score_status: string;
  matched_skills_count: number;
  total_jd_skills: number;
  resume_quality: string;
  created_at: string;
  full_data?: ATSAnalysisResult;
}

interface ATSAnalysisResult {
  ats_score: number;
  score_status: string;
  matched_skills_count: number;
  total_jd_skills: number;
  matched_skills_pct: number;
  missing_skills_count: number;
  missing_skills_pct: number;
  resume_quality: string;
  quality_subtext: string;
  skill_match_list: SkillItem[];
  missing_skills_list: string[];
  top_strengths: string[];
  resume_details: {
    fileName: string;
    totalPages: number;
    fileSize: string;
    analyzedOn: string;
  };
  matched_keywords: string[];
}

const DEFAULT_HISTORY: HistoryItem[] = [
  {
    id: "hist-1",
    file_name: "DEEPAKRAJ_P.pdf",
    ats_score: 84,
    score_status: "Very Good Match",
    matched_skills_count: 28,
    total_jd_skills: 34,
    resume_quality: "Good",
    created_at: "30 Aug 2026, 11:15 PM"
  },
  {
    id: "hist-2",
    file_name: "Cloud_DevOps_Resume.pdf",
    ats_score: 72,
    score_status: "Good Match",
    matched_skills_count: 22,
    total_jd_skills: 30,
    resume_quality: "Good",
    created_at: "28 Aug 2026, 04:30 PM"
  }
];

const INITIAL_DATA: ATSAnalysisResult = {
  ats_score: 84,
  score_status: "Very Good Match",
  matched_skills_count: 28,
  total_jd_skills: 34,
  matched_skills_pct: 82,
  missing_skills_count: 6,
  missing_skills_pct: 18,
  resume_quality: "Good",
  quality_subtext: "Well structured and formatted",
  skill_match_list: [
    { skill: "Python", level: 100 },
    { skill: "FastAPI", level: 100 },
    { skill: "React", level: 90 },
    { skill: "JavaScript", level: 80 },
    { skill: "SQL", level: 100 },
    { skill: "MongoDB", level: 90 },
    { skill: "AWS", level: 70 },
    { skill: "Docker", level: 60 },
    { skill: "Git", level: 100 },
    { skill: "REST API", level: 100 }
  ],
  missing_skills_list: [
    "TypeScript", "Next.js", "AWS Lambda", "Kubernetes", "CI/CD", "GraphQL"
  ],
  top_strengths: [
    "Strong technical skills",
    "Good project experience",
    "Relevant certifications",
    "Well structured resume",
    "Good use of keywords"
  ],
  resume_details: {
    fileName: "DEEPAKRAJ_P.pdf",
    totalPages: 2,
    fileSize: "512.34 KB",
    analyzedOn: "30 Aug 2026, 11:15 PM"
  },
  matched_keywords: [
    "python", "fastapi", "api", "sql", "mongodb", "aws", "docker", "git",
    "rest api", "linux", "pandas", "numpy", "html", "css", "javascript",
    "react", "problem solving", "data structures", "communication"
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'analyze' | 'history'>('analyze');
  const [data, setData] = useState<ATSAnalysisResult>(INITIAL_DATA);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('ats_scan_history');
    return saved ? JSON.parse(saved) : DEFAULT_HISTORY;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (data.ats_score / 100) * circumference;

  useEffect(() => {
    localStorage.setItem('ats_scan_history', JSON.stringify(history));
  }, [history]);

  const fetchBackendHistory = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || ''}/api/v1/analyze/history`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setHistory(res.data);
      }
    } catch {
      // Keep local state if backend route is in-memory
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchBackendHistory();
    }
  }, [activeTab]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !jd.trim()) {
      setErr('Please select a resume file (PDF/DOCX) and paste the Job Description.');
      return;
    }
    try {
      setLoading(true);
      setErr('');
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('job_description', jd);

      const res = await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/v1/analyze/resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const raw = res.data;
      const formatted: ATSAnalysisResult = {
        ats_score: raw.ats_score,
        score_status: raw.ats_score >= 80 ? 'Very Good Match' : raw.ats_score >= 60 ? 'Good Match' : 'Needs Work',
        matched_skills_count: raw.matched_skills_count,
        total_jd_skills: raw.total_jd_skills,
        matched_skills_pct: Math.round((raw.matched_skills_count / (raw.total_jd_skills || 1)) * 100),
        missing_skills_count: raw.missing_skills.length,
        missing_skills_pct: Math.round((raw.missing_skills.length / (raw.total_jd_skills || 1)) * 100),
        resume_quality: raw.resume_quality,
        quality_subtext: 'Well structured and formatted',
        skill_match_list: raw.skill_breakdown || [
          { skill: 'Python', level: 100 },
          { skill: 'FastAPI', level: 100 },
          { skill: 'React', level: 90 }
        ],
        missing_skills_list: raw.missing_skills.length > 0 ? raw.missing_skills : ['TypeScript', 'Kubernetes', 'CI/CD'],
        top_strengths: raw.top_strengths.length > 0 ? raw.top_strengths : ['Strong technical skills', 'Good project experience'],
        resume_details: {
          fileName: file.name,
          totalPages: 2,
          fileSize: `${(file.size / 1024).toFixed(2)} KB`,
          analyzedOn: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        },
        matched_keywords: raw.matched_keywords
      };

      const newHistoryItem: HistoryItem = {
        id: `scan-${Date.now()}`,
        file_name: file.name,
        ats_score: formatted.ats_score,
        score_status: formatted.score_status,
        matched_skills_count: formatted.matched_skills_count,
        total_jd_skills: formatted.total_jd_skills,
        resume_quality: formatted.resume_quality,
        created_at: formatted.resume_details.analyzedOn,
        full_data: formatted
      };

      setHistory(prev => [newHistoryItem, ...prev]);
      setData(formatted);
      setIsModalOpen(false);
      setActiveTab('analyze');
    } catch (error: any) {
      setErr(error?.response?.data?.detail || 'Failed to analyze. Please verify FastAPI is active on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('AI ATS Resume Analysis Report', 14, 22);

    doc.setFontSize(12);
    doc.text(`Candidate File: ${data.resume_details.fileName}`, 14, 34);
    doc.text(`ATS Score: ${data.ats_score}% (${data.score_status})`, 14, 42);
    doc.text(`Matched Skills: ${data.matched_skills_count} / ${data.total_jd_skills}`, 14, 50);
    doc.text(`Resume Quality: ${data.resume_quality}`, 14, 58);

    doc.setFontSize(14);
    doc.text('Missing Skills to Add:', 14, 72);
    doc.setFontSize(11);
    data.missing_skills_list.forEach((s, idx) => {
      doc.text(`• ${s}`, 18, 80 + idx * 7);
    });

    const kwY = 85 + data.missing_skills_list.length * 7;
    doc.setFontSize(14);
    doc.text('Matched Keywords:', 14, kwY);
    doc.setFontSize(10);
    doc.text(data.matched_keywords.join(', '), 14, kwY + 8, { maxWidth: 180 });

    doc.save(`${data.resume_details.fileName.replace(/\.[^/.]+$/, "")}_ATS_Report.pdf`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#080E1A', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* SIDEBAR */}
      <aside style={{ width: '260px', backgroundColor: '#0D1527', borderRight: '1px solid #1B2742', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', marginBottom: '24px' }}>
            <div style={{ color: '#60A5FA' }}>
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', margin: 0 }}>Resume Analyzer</h1>
              <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>AI Powered ATS Checker</p>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button 
              onClick={() => setActiveTab('analyze')} 
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: '#94A3B8', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <LayoutDashboard size={17} /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('analyze')} 
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: activeTab === 'analyze' ? '600' : '500', color: '#FFFFFF', backgroundColor: activeTab === 'analyze' ? '#1A365D' : 'transparent', border: activeTab === 'analyze' ? '1px solid rgba(59, 130, 246, 0.3)' : 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <FileText size={17} color="#60A5FA" /> Analyze Resume
            </button>
            <button 
              onClick={() => setActiveTab('history')} 
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: activeTab === 'history' ? '600' : '500', color: '#FFFFFF', backgroundColor: activeTab === 'history' ? '#1A365D' : 'transparent', border: activeTab === 'history' ? '1px solid rgba(59, 130, 246, 0.3)' : 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <History size={17} color="#60A5FA" /> History ({history.length})
            </button>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: '#94A3B8', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <User size={17} /> Profile
            </button>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: '#94A3B8', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <Settings size={17} /> Settings
            </button>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: '#94A3B8', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <LogOut size={17} /> Logout
            </button>
          </nav>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', backgroundColor: 'rgba(8, 14, 26, 0.6)', borderRadius: '12px', border: '1px solid #1B2742', marginBottom: '16px' }}>
            <div style={{ height: '36px', width: '36px', backgroundColor: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: '#FFF' }}>
              DP
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#FFF', margin: 0 }}>Deepakraj P</p>
              <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>deepakraj11520@gmail.com</p>
            </div>
          </div>
          <div>
            <p style={{ fontSize: '10px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>Tech Stack</p>
            <div style={{ display: 'flex', gap: '12px', padding: '0 4px', fontSize: '16px' }}>
              <span>🐍</span>
              <span>⚡</span>
              <span>⚛️</span>
              <span>🍃</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {activeTab === 'analyze' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFF', margin: 0 }}>Resume Analysis Report</h1>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0 0' }}>Detailed ATS analysis of your resume against the job description</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setIsModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#131D33', color: '#E2E8F0', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', border: '1px solid #223354', cursor: 'pointer' }}
                >
                  <Upload size={14} /> Upload New
                </button>
                <button
                  onClick={handleDownloadPDF}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563EB', color: '#FFF', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}
                >
                  <Download size={14} /> Download Report
                </button>
              </div>
            </div>

            {/* 4 STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '500', color: '#94A3B8', marginBottom: '8px' }}>ATS Score</span>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                  <svg style={{ width: '96px', height: '96px', transform: 'rotate(-90deg)' }}>
                    <circle cx="48" cy="48" r={radius} stroke="#1E293B" strokeWidth="6" fill="transparent" />
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      stroke="#22C55E"
                      strokeWidth="6"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                  </svg>
                  <span style={{ position: 'absolute', fontSize: '20px', fontWeight: '900', color: '#FFF' }}>{data.ats_score}%</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#4ADE80', marginTop: '4px' }}>{data.score_status}</span>
              </div>

              <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '500', color: '#94A3B8', marginBottom: '8px' }}>Matched Skills</span>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#F8FAFC', margin: '4px 0' }}>
                  <span style={{ color: '#4ADE80' }}>{data.matched_skills_count}</span>
                  <span style={{ color: '#94A3B8', fontSize: '22px', fontWeight: '300' }}> / {data.total_jd_skills}</span>
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: '600', color: '#4ADE80' }}>{data.matched_skills_pct}%</div>
                <span style={{ fontSize: '11px', color: 'rgba(74, 222, 128, 0.8)' }}>Skills Matched</span>
              </div>

              <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '500', color: '#94A3B8', marginBottom: '8px' }}>Missing Skills</span>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#F43F5E', margin: '4px 0' }}>
                  {data.missing_skills_count}
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: '600', color: '#FB7185' }}>{data.missing_skills_pct}%</div>
                <span style={{ fontSize: '11px', color: 'rgba(244, 63, 94, 0.8)' }}>Skills Missing</span>
              </div>

              <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '500', color: '#94A3B8', marginBottom: '8px' }}>Resume Quality</span>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#38BDF8', margin: '4px 0' }}>
                  {data.resume_quality}
                </div>
                <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px', maxWidth: '140px', lineHeight: '1.3' }}>
                  {data.quality_subtext}
                </p>
              </div>
            </div>

            {/* MIDDLE SECTION */}
            <div style={{ display: 'grid', gridTemplateColumns: '5fr 3fr 4fr', gap: '20px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', margin: 0 }}>Skill Match</h2>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4ADE80' }}><Circle size={6} fill="#4ADE80" /> Matched</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FB7185' }}><Circle size={6} fill="#FB7185" /> Missing</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {data.skill_match_list.map((item) => (
                      <div key={item.skill} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: '#CBD5E1', width: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.skill}</span>
                        <div style={{ flex: 1, margin: '0 12px', backgroundColor: '#1E293B', height: '6px', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ backgroundColor: '#22C55E', height: '100%', width: `${item.level}%`, borderRadius: '999px', transition: 'width 0.6s ease' }} />
                        </div>
                        <span style={{ color: '#94A3B8', fontFamily: 'monospace', fontSize: '10px', width: '32px', textAlign: 'right' }}>{item.level}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button style={{ width: '100%', marginTop: '16px', padding: '8px', backgroundColor: 'rgba(30, 58, 138, 0.5)', color: '#60A5FA', fontSize: '12px', fontWeight: '600', borderRadius: '10px', border: '1px solid rgba(30, 64, 175, 0.4)', cursor: 'pointer' }}>
                  View All Skills
                </button>
              </div>

              <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', margin: '0 0 16px 0' }}>Missing Skills</h2>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                    {data.missing_skills_list.map((skill) => (
                      <li key={skill} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#CBD5E1' }}>
                        <span style={{ color: '#F43F5E', fontWeight: 'bold' }}>•</span>
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button style={{ width: '100%', marginTop: '16px', padding: '8px', backgroundColor: 'rgba(30, 58, 138, 0.5)', color: '#60A5FA', fontSize: '12px', fontWeight: '600', borderRadius: '10px', border: '1px solid rgba(30, 64, 175, 0.4)', cursor: 'pointer' }}>
                  How to Improve?
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '16px' }}>
                  <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', margin: '0 0 12px 0' }}>Top Strengths</h2>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                    {data.top_strengths.map((str, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#CBD5E1' }}>
                        <CheckCircle size={14} color="#4ADE80" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '16px' }}>
                  <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', margin: '0 0 12px 0' }}>Resume Details</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94A3B8' }}>File Name</span>
                      <span style={{ color: '#E2E8F0', fontFamily: 'monospace' }}>{data.resume_details.fileName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94A3B8' }}>Total Pages</span>
                      <span style={{ color: '#E2E8F0' }}>{data.resume_details.totalPages}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94A3B8' }}>File Size</span>
                      <span style={{ color: '#E2E8F0' }}>{data.resume_details.fileSize}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94A3B8' }}>Analyzed On</span>
                      <span style={{ color: '#E2E8F0' }}>{data.resume_details.analyzedOn}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MATCHED KEYWORDS */}
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '20px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', margin: '0 0 12px 0' }}>Matched Keywords</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {data.matched_keywords.map((kw) => (
                  <span
                    key={kw}
                    style={{ padding: '4px 12px', backgroundColor: '#13221B', border: '1px solid rgba(6, 95, 70, 0.5)', color: '#4ADE80', borderRadius: '6px', fontSize: '11px', fontWeight: '500' }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* HISTORY TAB */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFF', margin: 0 }}>Analysis History</h1>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0 0' }}>Previous resume scans and score logs</p>
              </div>
              <button
                onClick={() => setActiveTab('analyze')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1A365D', color: '#60A5FA', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(59, 130, 246, 0.3)', cursor: 'pointer' }}
              >
                <ArrowLeft size={14} /> Back to Dashboard
              </button>
            </div>

            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1E293B', backgroundColor: '#131D33', color: '#94A3B8' }}>
                    <th style={{ padding: '14px 20px' }}>File Name</th>
                    <th style={{ padding: '14px 20px' }}>ATS Score</th>
                    <th style={{ padding: '14px 20px' }}>Skills Match</th>
                    <th style={{ padding: '14px 20px' }}>Quality</th>
                    <th style={{ padding: '14px 20px' }}>Date</th>
                    <th style={{ padding: '14px 20px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #1E293B' }}>
                      <td style={{ padding: '14px 20px', fontWeight: '600', color: '#E2E8F0' }}>{h.file_name}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ color: h.ats_score >= 80 ? '#4ADE80' : h.ats_score >= 60 ? '#60A5FA' : '#F43F5E', fontWeight: 'bold' }}>
                          {h.ats_score}%
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#CBD5E1' }}>
                        {h.matched_skills_count} / {h.total_jd_skills}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#38BDF8' }}>{h.resume_quality}</td>
                      <td style={{ padding: '14px 20px', color: '#94A3B8' }}>{h.created_at}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          onClick={() => {
                            if (h.full_data) {
                              setData(h.full_data);
                            }
                            setActiveTab('analyze');
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#1E293B', color: '#60A5FA', border: '1px solid #334155', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                        >
                          <Eye size={12} /> View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* UPLOAD MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#111A2E', border: '1px solid #334155', width: '100%', maxWidth: '480px', borderRadius: '16px', padding: '24px', position: 'relative', color: '#F8FAFC' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', color: '#94A3B8', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={18} color="#3B82F6" /> Upload & Analyze Resume
            </h2>
            {err && <div style={{ marginBottom: '16px', padding: '10px', backgroundColor: 'rgba(127, 29, 29, 0.5)', border: '1px solid #991B1B', color: '#FCA5A5', fontSize: '12px', borderRadius: '8px' }}>{err}</div>}
            <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Resume File (PDF / DOCX)</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  style={{ width: '100%', fontSize: '12px', color: '#CBD5E1', backgroundColor: '#0B1120', padding: '10px', borderRadius: '10px', border: '1px solid #334155' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Job Description</label>
                <textarea
                  rows={4}
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the job description here..."
                  style={{ width: '100%', backgroundColor: '#0B1120', border: '1px solid #334155', borderRadius: '10px', padding: '10px', fontSize: '12px', color: '#F1F5F9', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '10px', backgroundColor: '#2563EB', color: '#FFF', fontWeight: '600', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : 'Analyze Resume'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
