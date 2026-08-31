from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.parser_service import DocumentParser
from app.services.ats_engine import ATSEngine
from app.schemas.resume import AnalysisResponse
from app.core.db import get_database

router = APIRouter()

@router.post("/resume", response_model=AnalysisResponse)
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    user_id: str = Form("deepakraj_p")
):
    text = await DocumentParser.extract_text(resume)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Resume file is empty or unscannable.")

    analysis = ATSEngine.analyze(text, job_description)

    db = get_database()
    if db is not None:
        try:
            await db["history"].insert_one({
                "user_id": user_id,
                "file_name": resume.filename,
                "ats_score": analysis.ats_score,
                "score_status": "Very Good Match" if analysis.ats_score >= 80 else "Good Match" if analysis.ats_score >= 60 else "Needs Work",
                "matched_skills_count": analysis.matched_skills_count,
                "total_jd_skills": analysis.total_jd_skills,
                "resume_quality": analysis.resume_quality,
                "created_at": datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p")
            })
        except Exception as e:
            print(f"Failed to log history: {e}")

    return analysis

@router.get("/history")
async def get_history(user_id: str = "deepakraj_p"):
    db = get_database()
    if db is None:
        return []
    cursor = db["history"].find({"user_id": user_id}).sort("_id", -1).limit(10)
    records = []
    async for item in cursor:
        records.append({
            "id": str(item.get("_id")),
            "file_name": item.get("file_name", "Resume.pdf"),
            "ats_score": item.get("ats_score", 0),
            "score_status": item.get("score_status", "Analyzed"),
            "matched_skills_count": item.get("matched_skills_count", 0),
            "total_jd_skills": item.get("total_jd_skills", 0),
            "resume_quality": item.get("resume_quality", "Good"),
            "created_at": item.get("created_at", "Just now")
        })
    return records
