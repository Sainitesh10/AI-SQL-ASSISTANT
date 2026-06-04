from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
import pandas as pd
import sqlite3
import io
import os

# Load env variables
load_dotenv()

from core.sql_agent import SQLAgent

app = FastAPI(title="AI SQL Assistant API")

# Setup CORS (Note: allow_origins=["*"] is used here for demonstration purposes. 
# In a real production deployment, this MUST be locked down to your specific frontend domains to prevent CSRF and unauthorized API access.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SQL Agent
try:
    sql_agent = SQLAgent()
except Exception as e:
    print(f"Warning: Failed to initialize SQL Agent. Missing API Key? {str(e)}")
    sql_agent = None

# Request Model
class QueryRequest(BaseModel):
    query: str

@app.post("/api/query")
async def process_query(request: QueryRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    
    if not sql_agent:
        raise HTTPException(status_code=500, detail="SQL Agent failed to initialize. Check GOOGLE_API_KEY in .env")

    try:
        # Generate and execute SQL
        result = sql_agent.process_query(request.query)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    if not sql_agent:
        raise HTTPException(status_code=500, detail="SQL Agent not initialized.")
        
    try:
        contents = await file.read()
        
        # Security Guard: 10MB limit for file uploads to prevent memory exhaustion and DoS attacks
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Please upload a file smaller than 10MB.")
            
        filename = file.filename.lower()
        
        # Parse CSV or Excel
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV or Excel.")
            
        # Clean table name (remove extension and invalid chars)
        table_name = os.path.splitext(file.filename)[0]
        table_name = "".join(c if c.isalnum() else "_" for c in table_name).lower()
        
        # Save to SQLite
        db_path = os.path.join(os.path.dirname(__file__), "database", "ecommerce.db")
        conn = sqlite3.connect(db_path)
        df.to_sql(table_name, conn, if_exists="replace", index=False)
        conn.close()
        
        # Refresh the Langchain Database Schema
        sql_agent.refresh_schema()
        
        return {"message": f"Successfully uploaded '{file.filename}' as table '{table_name}'.", "table_name": table_name, "rows": len(df)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

# Mount frontend static files
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
