# AI ATS Resume Analyzer 🚀

A full-stack, machine-learning-powered ATS (Applicant Tracking System) resume analyzer that evaluates resumes against job descriptions, computes cosine similarity scores, extracts missing technical keywords, and provides actionable improvement feedback.

🔗 **Live Demo:** [https://ats-deepak.netlify.app/](https://ats-deepak.netlify.app/)

---

## 🛠 Tech Stack

- **Frontend:** React (Vite, TypeScript, Tailwind CSS, Lucide Icons)
- **Backend:** Python FastAPI, Uvicorn
- **NLP & Matching:** Scikit-Learn (TF-IDF Vectorization & Cosine Similarity), PyPDF, Python-docx
- **Database:** MongoDB Atlas (Motor Async Driver)
- **Deployment:** Netlify (Frontend) & Render (Backend)

---

## ⚡ Key Features

- **Multi-format Parsing:** Supports PDF and DOCX resume extraction.
- **ATS Match Algorithm:** Computes mathematical cosine similarity between candidate experience and JD requirements.
- **Keyword Gap Analysis:** Automatically surfaces missing skills and industry-specific keywords.
- **Cloud Persistence:** Stores and tracks score history via MongoDB Atlas.
