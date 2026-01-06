from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import router

app = FastAPI(title="CovenantGuard AI Backend")

# ✅ CORS Setup (Allow Frontend to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (Render/Vercel)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include Routes
app.include_router(router, prefix="/api")

@app.get("/")
def home():
    return {"message": "CovenantGuard AI Backend is Running! 🚀"}
  
