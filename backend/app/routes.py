from fastapi import APIRouter
from typing import List
from .schemas import Loan, ChatRequest, ChatResponse
from .data import loans_db
from .chat import process_chat

router = APIRouter()

# 1. Get All Loans
@router.get("/loans", response_model=List[Loan])
def get_loans():
    return loans_db

# 2. Chat with AI
@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    return process_chat(request)
  
