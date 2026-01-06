from pydantic import BaseModel
from typing import List, Optional

# Covenant Model
class Covenant(BaseModel):
    name: str
    threshold: float
    actual: float
    status: str      # Safe, Watch, Critical
    insight: str     # AI Explanation

# Loan Model
class Loan(BaseModel):
    id: int
    borrower_name: str
    amount: float
    covenants: List[Covenant]

# Chat Models
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
  
