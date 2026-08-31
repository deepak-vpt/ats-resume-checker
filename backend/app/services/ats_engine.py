import re
from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.schemas.resume import AnalysisResponse, SkillBreakdownItem

TECH_DICTIONARY = [
    "python", "javascript", "typescript", "react", "fastapi", "flask", "node.js",
    "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ci/cd", "jenkins",
    "git", "linux", "sql", "mongodb", "postgresql", "rest api", "graphql", "devops",
    "microservices", "ansible", "redis", "nginx", "html", "css", "tailwind"
]

class ATSEngine:
    @classmethod
    def extract_skills(cls, text: str) -> List[str]:
        text_lower = text.lower()
        return [s for s in TECH_DICTIONARY if re.search(r'\b' + re.escape(s) + r'\b', text_lower)]

    @classmethod
    def analyze(cls, resume_text: str, jd_text: str) -> AnalysisResponse:
        resume_skills = set(cls.extract_skills(resume_text))
        jd_skills = set(cls.extract_skills(jd_text))
        
        if not jd_skills:
            jd_skills = resume_skills.copy() or {"python", "git", "linux"}

        matched = sorted(list(resume_skills.intersection(jd_skills)))
        missing = sorted(list(jd_skills.difference(resume_skills)))

        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([resume_text, jd_text])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

        skill_ratio = len(matched) / max(len(jd_skills), 1)
        raw_score = int(round((skill_ratio * 0.6 + similarity * 0.4) * 100))
        final_score = min(max(raw_score, 15), 98)

        quality = "Excellent" if final_score >= 80 else "Good" if final_score >= 60 else "Needs Improvement"

        skill_breakdown = [
            SkillBreakdownItem(
                skill=s.capitalize(),
                level=85.0 if s in matched else 20.0
            )
            for s in list(jd_skills)[:6]
        ]

        strengths = [f"Direct match on core skills: {', '.join(matched[:3]).title()}"] if matched else ["Clean document layout"]
        recommendations = [f"Add missing required skills: {', '.join(missing[:3]).title()}"] if missing else ["Add quantifiable metrics to experience bullets."]

        return AnalysisResponse(
            ats_score=final_score,
            matched_skills=[s.title() for s in matched],
            missing_skills=[s.title() for s in missing],
            matched_keywords=[s.title() for s in matched] + ["Agile", "REST Architecture"],
            total_jd_skills=len(jd_skills),
            matched_skills_count=len(matched),
            resume_quality=quality,
            top_strengths=strengths,
            recommendations=recommendations,
            skill_breakdown=skill_breakdown
        )
