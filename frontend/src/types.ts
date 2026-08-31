export interface SkillItem {
  skill: string;
  level: number;
}

export interface ResumeDetails {
  fileName: string;
  totalPages: number;
  fileSize: string;
  analyzedOn: string;
}

export interface ATSAnalysisResult {
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
  resume_details: ResumeDetails;
  matched_keywords: string[];
}
