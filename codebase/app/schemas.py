from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=20, max_length=8000)
    question: str = Field(default="", max_length=500)


class ActionItem(BaseModel):
    task: str
    owner: str | None = None
    due_date: str | None = None


class Analysis(BaseModel):
    summary: str
    decisions: list[str]
    action_items: list[ActionItem]
    risks: list[str]
    evidence: list[str]
    confidence: float = Field(ge=0, le=1)
    provider: str
