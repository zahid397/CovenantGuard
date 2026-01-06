from .schemas import ChatRequest, ChatResponse
from .data import loans_db

def process_chat(request: ChatRequest) -> ChatResponse:
    user_msg = request.message.lower()

    # Logic 1: Ask about Risk
    if "risk" in user_msg or "critical" in user_msg:
        risky_loans = [l["borrower_name"] for l in loans_db if l["covenants"][0]["status"] == "Critical"]
        if risky_loans:
            return ChatResponse(reply=f"⚠️ Critical Alert: {', '.join(risky_loans)} are currently at high risk due to covenant breaches.")
        else:
            return ChatResponse(reply="Good news! No critical risks detected in the portfolio.")

    # Logic 2: Ask about Safe loans
    elif "safe" in user_msg:
        safe_loans = [l["borrower_name"] for l in loans_db if l["covenants"][0]["status"] == "Safe"]
        return ChatResponse(reply=f"✅ Safe Loans: {', '.join(safe_loans)} are performing well.")

    # Logic 3: Default Greeting
    elif "hello" in user_msg or "hi" in user_msg:
        return ChatResponse(reply="Hello! I am CovenantGuard AI. Ask me about portfolio risks or specific loans.")

    # Fallback
    else:
        return ChatResponse(reply="I can analyze risks and covenant status. Try asking: 'Which loans are critical?'")
      
