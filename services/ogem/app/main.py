from fastapi import FastAPI
from pydantic import BaseModel
import os

app = FastAPI(title="Ogem Service", version="0.1.0")

class ChatRequest(BaseModel):
    prompt: str

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/chat")
async def chat(req: ChatRequest):
    # Placeholder echo logic; integrate model routing later
    return {"response": f"echo: {req.prompt}"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("OGEM_PORT", "4500"))
    uvicorn.run(app, host="0.0.0.0", port=port)
