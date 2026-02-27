from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    building_id: str
    meter_type: str
    date_range: str
    data: List[float]

class PredictionResponse(BaseModel):
    predicted: List[float]
    actual: List[float]
    kpis: dict
    weather: dict

@app.post("/predict", response_model=PredictionResponse)
def predict_energy(req: PredictionRequest):
    # Placeholder logic
    return PredictionResponse(
        predicted=[0.0]*len(req.data),
        actual=req.data,
        kpis={"savings": 0, "total": 0, "error": 0, "weather_impact": 0},
        weather={"avg_temp": 0, "cloud_coverage": 0, "wind_speed": 0}
    )

@app.post("/upload")
def upload_data(file: UploadFile = File(...)):
    # Placeholder for file upload
    return {"filename": file.filename}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

@app.get("/hello")
def hello():
    return {"message": "Hello, World!"}