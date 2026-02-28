from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import joblib
import json
import numpy as np
import pandas as pd
import xgboost as xgb
from datetime import datetime

APP_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(os.path.dirname(APP_DIR), 'ml_model')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ForecastRequest(BaseModel):
    location: Optional[str]
    coords: Optional[dict]
    area: Optional[float]
    floor: Optional[int]
    yearBuilt: Optional[int]
    prevTwoMonthsUsage: Optional[float]
    prevTwoMonthsLabels: Optional[List[str]]


class ForecastResponse(BaseModel):
    model_name: str
    predictions: List[float]
    labels: List[str]


# Load models at startup
LOADED_MODELS = {}

def load_models():
    if not os.path.isdir(MODEL_DIR):
        return
    for fn in os.listdir(MODEL_DIR):
        path = os.path.join(MODEL_DIR, fn)
        name = fn
        try:
            if fn.endswith('.pkl'):
                LOADED_MODELS[name] = joblib.load(path)
            elif fn.endswith('.json'):
                booster = xgb.Booster()
                booster.load_model(path)
                LOADED_MODELS[name] = booster
        except Exception as e:
            print('Failed to load', fn, e)


load_models()


def month_name_to_index(name):
    names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    try:
        return names.index(name) + 1
    except Exception:
        # try full month names
        try:
            return datetime.strptime(name, '%B').month
        except Exception:
            return None


def make_features_for_month(area, yearBuilt, primary_use_dict, air_temp, dew_temp, month_idx, hour=12, dow=0):
    # compute building_age
    curr_year = datetime.now().year
    building_age = (curr_year - yearBuilt) if yearBuilt else 0

    meter_reading = 0.0
    # use defaults for weather if not provided
    if air_temp is None:
        air_temp = 20.0
    if dew_temp is None:
        dew_temp = 10.0

    hour_sin = np.sin(2 * np.pi * hour / 24)
    hour_cos = np.cos(2 * np.pi * hour / 24)
    dow_sin = np.sin(2 * np.pi * dow / 7)
    dow_cos = np.cos(2 * np.pi * dow / 7)
    month_sin = np.sin(2 * np.pi * (month_idx - 1) / 12)
    month_cos = np.cos(2 * np.pi * (month_idx - 1) / 12)

    # Build feature row (meter_reading is the target, not an input)
    row = {
        'square_feet': area or 0,
        'building_age': building_age,
        'air_temperature': air_temp,
        'dew_temperature': dew_temp,
    }
    # primary uses (expected keys)
    primary_keys = ['primary_use_Education','primary_use_Entertainment/public assembly','primary_use_Food sales and service','primary_use_Healthcare','primary_use_Lodging/residential','primary_use_Manufacturing/industrial','primary_use_Office','primary_use_Other','primary_use_Parking','primary_use_Public services','primary_use_Religious worship','primary_use_Retail','primary_use_Services','primary_use_Technology/science','primary_use_Utility','primary_use_Warehouse/storage']
    for k in primary_keys:
        row[k] = 1.0 if primary_use_dict.get(k, False) else 0.0

    row['hour_sin'] = float(hour_sin)
    row['hour_cos'] = float(hour_cos)
    row['dow_sin'] = float(dow_sin)
    row['dow_cos'] = float(dow_cos)
    row['month_sin'] = float(month_sin)
    row['month_cos'] = float(month_cos)

    return row


@app.post('/forecast')
def forecast(req: ForecastRequest):
    if not LOADED_MODELS:
        raise HTTPException(status_code=500, detail='No models loaded')

    
    
    
    return {'results': ForecastRequest}


@app.post("/upload")
def upload_data(file: UploadFile = File(...)):
    # Placeholder for file upload
    return {"filename": file.filename}


@app.get("/hello")
def hello():
    return {"message": "Hello, World!"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)