import json
import os
import re
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

from .schemas import Analysis, AnalyzeRequest, ActionItem

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
app = FastAPI(title="Insight Copilot API", version="0.1.0")

SYSTEM_PROMPT = """You extract reliable insights from meeting notes. Return ONLY valid JSON with keys: summary (string), decisions (array of strings), action_items (array of {task, owner, due_date}), risks (array of strings), evidence (array of exact verbatim excerpts from the input), confidence (number 0..1). Do not invent facts. Use Vietnamese when the input is Vietnamese."""


def mock_analysis(text: str) -> Analysis:
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    action_markers = ("c?n", "s?", "chu?n b?", "g?i", "li?n h?", "ph?i")
    risk_markers = ("r?i ro", "ch?a", "lo ng?i", "v?n ??", "kh?ng ")
    decision_markers = ("ch?t", "??ng ?", "quy?t ??nh", "ho?n", "ra m?t")
    actions = [s for s in sentences if any(m in s.lower() for m in action_markers)]
    risks = [s for s in sentences if any(m in s.lower() for m in risk_markers)]
    decisions = [s for s in sentences if any(m in s.lower() for m in decision_markers)]
    evidence = list(dict.fromkeys((decisions + actions + risks)[:5])) or sentences[:2]
    return Analysis(
        summary=" ".join(sentences[:2])[:500],
        decisions=decisions[:5],
        action_items=[ActionItem(task=item) for item in actions[:5]],
        risks=risks[:5],
        evidence=evidence,
        confidence=0.45,
        provider="mock",
    )


async def openai_analysis(payload: AnalyzeRequest) -> Analysis:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(503, "OPENAI_API_KEY is not configured. Use AI_PROVIDER=mock for offline development.")
    user_prompt = f"NOTE:\n{payload.text}\n\nQUESTION:\n{payload.question or 'Extract the important insights.'}"
    body = {
        "model": os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        "input": [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": user_prompt}],
        "text": {"format": {"type": "json_object"}},
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post("https://api.openai.com/v1/responses", headers={"Authorization": f"Bearer {api_key}"}, json=body)
        response.raise_for_status()
        raw = response.json().get("output_text", "")
        data = json.loads(raw)
        data["provider"] = "openai"
        return Analysis.model_validate(data)
    except (httpx.HTTPError, json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(502, "The AI provider returned an invalid response. Please retry.") from exc


@app.get("/", include_in_schema=False)
async def index() -> FileResponse:
    return FileResponse(Path(__file__).parent / "static" / "index.html")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "provider": os.getenv("AI_PROVIDER", "mock").lower()}


@app.post("/api/analyze", response_model=Analysis)
async def analyze(payload: AnalyzeRequest) -> Analysis:
    if os.getenv("AI_PROVIDER", "mock").lower() == "openai":
        return await openai_analysis(payload)
    return mock_analysis(payload.text)
