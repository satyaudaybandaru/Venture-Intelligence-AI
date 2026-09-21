import httpx
from .config import EXA_API_KEY

class ExaSearch:
    def __init__(self):
        self.enabled = bool(EXA_API_KEY)

    async def search(self, query: str, num_results: int = 8) -> list[dict]:
        if not self.enabled:
            return []
        url = "https://api.exa.ai/search"
        headers = {"x-api-key": EXA_API_KEY, "Content-Type": "application/json"}
        payload = {
            "query": query,
            "type": "auto",
            "numResults": num_results,
            "contents": {"highlights": {"maxCharacters": 1800}},
        }
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
        out = []
        for item in data.get("results", []):
            out.append({
                "title": item.get("title", "Untitled"),
                "url": item.get("url", ""),
                "published_date": item.get("publishedDate"),
                "text": " ".join(item.get("highlights", []) or [])[:1800],
            })
        return out
