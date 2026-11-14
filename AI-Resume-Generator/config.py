import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory of the project (AI-Resume-Generator/)
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from the .env file in the project root
load_dotenv(BASE_DIR / ".env")


class Config:
    """Central configuration for the AI-Powered Resume Generator."""

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

    # Database and generated PDF storage paths
    DATABASE_PATH = str(BASE_DIR / os.getenv("DATABASE_PATH", "database/resume_app.db"))
    GENERATED_RESUMES_DIR = str(BASE_DIR / "generated_resumes")

    # Limit incoming request payload size (2 MB) for basic protection
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024
