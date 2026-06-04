import os
import sqlite3
from langchain_community.utilities import SQLDatabase
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "ecommerce.db")

class SQLAgent:
    def __init__(self):
        # We use Gemini 2.5 Flash as it is universally available and very fast
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0, # Deterministic outputs for SQL generation
        )
        # Connect to SQLite Database
        self.db = SQLDatabase.from_uri(f"sqlite:///{DB_PATH}")
        
        # Create a manual SQL Query Chain (more robust against LangChain version changes)
        prompt = PromptTemplate.from_template(
            "You are a SQLite expert. Given an input question, create a syntactically correct SQLite query to run.\n"
            "Only return the SQL query, do not include any markdown formatting like ```sql.\n\n"
            "Here is the database schema:\n"
            "{schema}\n\n"
            "Question: {question}\n"
            "SQL Query:"
        )
        self.chain = prompt | self.llm | StrOutputParser()

    def refresh_schema(self):
        """Reloads the database connection to detect newly uploaded tables."""
        self.db = SQLDatabase.from_uri(f"sqlite:///{DB_PATH}")

    def process_query(self, natural_language_query: str):
        """
        Takes a natural language query, generates SQL, executes it, and returns the result.
        """
        if not natural_language_query.strip():
            return {"error": "Query cannot be empty."}

        try:
            # 1. Generate the SQL Query
            schema = self.db.get_table_info()
            generated_sql = self.chain.invoke({
                "question": natural_language_query,
                "schema": schema
            })
            
            # Clean up the output in case Gemini returns markdown (e.g. ```sql ... ```)
            clean_sql = generated_sql.strip()
            if clean_sql.startswith("```sql"):
                clean_sql = clean_sql[6:]
            if clean_sql.startswith("```"):
                clean_sql = clean_sql[3:]
            if clean_sql.endswith("```"):
                clean_sql = clean_sql[:-3]
            clean_sql = clean_sql.strip()

            # 2. Execute the SQL Query
            # Connect directly to sqlite3 to run the generated query and fetch column names
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(clean_sql)
            
            # Fetch results
            rows = cursor.fetchall()
            
            # Format results into a list of dictionaries for easy JSON serialization
            data = []
            columns = [description[0] for description in cursor.description] if cursor.description else []
            for row in rows:
                data.append(dict(row))
                
            conn.close()

            return {
                "sql": clean_sql,
                "data": data,
                "columns": columns
            }

        except Exception as e:
            return {"error": str(e), "generated_sql": clean_sql if 'clean_sql' in locals() else None}
