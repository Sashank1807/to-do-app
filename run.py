import uvicorn

if __name__ == "__main__":
    print("Starting Animated Todo Web App Server on http://127.0.0.1:8080...")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8080, reload=True)
