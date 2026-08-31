import io
import docx
from pypdf import PdfReader
from fastapi import UploadFile, HTTPException

class DocumentParser:
    @staticmethod
    async def extract_text(file: UploadFile) -> str:
        contents = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".pdf"):
            try:
                reader = PdfReader(io.BytesIO(contents))
                text = "\n".join([page.extract_text() or "" for page in reader.pages])
                return text.strip()
            except Exception as exc:
                raise HTTPException(status_code=400, detail=f"PDF parsing error: {str(exc)}")
        elif filename.endswith((".docx", ".doc")):
            try:
                doc = docx.Document(io.BytesIO(contents))
                text = "\n".join([para.text for para in doc.paragraphs])
                return text.strip()
            except Exception as exc:
                raise HTTPException(status_code=400, detail=f"DOCX parsing error: {str(exc)}")
        else:
            raise HTTPException(status_code=400, detail="Invalid format. Please upload PDF or DOCX.")
