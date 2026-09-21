import os
from dotenv import load_dotenv

load_dotenv()

EXA_API_KEY = os.getenv("EXA_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
CORS_ORIGINS = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if x.strip()]
MAX_JSON_RETRIES = int(os.getenv("MAX_JSON_RETRIES", "3"))

# Intentionally disabled in the demo. Keep these flags explicit so the future integrations
# can be enabled without changing the research orchestration contract.
REDDIT_ENABLED = False
GITHUB_ENABLED = False
