from pydantic import BaseModel
from typing import List

class SkillBreakdownItem(BaseModel):
    skill: str
    level: float

class AnalysisResponse(BaseModel):
    ats_score: int
    matched_skills: List[str]
    missing_skills: List[str]
    matched_keywords: List[str]
    total_jd_skills: int
    matched_skills_count: int
    resume_quality: str
    top_strengths: List[str]
    recommendations: List[str]
    skill_breakdown: List[SkillBreakdownItem]
