from fastapi import FastAPI

app = FastAPI(title="LangChain API", version="0.1.0")

@app.get("/health")
async def health():
    return {"status": "ok"}

# Placeholder for future chain endpoints
