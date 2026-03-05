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
import requests
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
        'square_feet': float(np.log1p(area or 0)),
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


def fetch_weather_hourly(lat, lon, start_date, end_date, timezone='Asia/Kolkata'):
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "temperature_2m,dewpoint_2m,wind_speed_10m",
        "timezone": timezone
    }
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    df = pd.DataFrame({
        "time": data["hourly"]["time"],
        "temperature_2m": data["hourly"]["temperature_2m"],
        "dewpoint_2m": data["hourly"]["dewpoint_2m"],
        "wind_speed_10m": data["hourly"]["wind_speed_10m"]
    })
    df["time"] = pd.to_datetime(df["time"])
    df = df.set_index("time")
    return df


@app.post('/forecast')
def forecast(req: ForecastRequest):
    if not LOADED_MODELS:
        raise HTTPException(status_code=500, detail='No models loaded')
    print('Received forecast request for location:', req.location, 'coords:', req.coords, 'area:', req.area, 'yearBuilt:', req.yearBuilt, 'prevTwoMonthsUsage:', req.prevTwoMonthsUsage, 'prevTwoMonthsLabels:', req.prevTwoMonthsLabels)
    # determine coords
    lat = 22.7
    lon = 72.9
    if req.coords:
        lat = req.coords.get('latitude', lat)
        lon = req.coords.get('longitude', lon)

    # Determine date range for previous two months. If labels provided, try to infer.
    if req.prevTwoMonthsLabels and len(req.prevTwoMonthsLabels) >= 2:
        # try to map to months in current/previous year (best-effort)
        try:
            m1 = month_name_to_index(req.prevTwoMonthsLabels[0])
            m2 = month_name_to_index(req.prevTwoMonthsLabels[1])
            year = datetime.now().year
            # if m1 > m2 assume they span year boundary -> use previous year for first
            if m1 and m2 and m1 > m2:
                start_date = datetime(year-1, m1, 1).strftime('%Y-%m-%d')
                # end is last day of m2 in current year
                end_day = (datetime(year, m2 % 12 + 1, 1) - pd.Timedelta(days=1)).day
                end_date = datetime(year, m2, end_day).strftime('%Y-%m-%d')
            elif m1 and m2:
                start_date = datetime(year, m1, 1).strftime('%Y-%m-%d')
                end_day = (datetime(year, m2 % 12 + 1, 1) - pd.Timedelta(days=1)).day
                end_date = datetime(year, m2, end_day).strftime('%Y-%m-%d')
            else:
                start_date = (datetime.now() - pd.DateOffset(months=2)).strftime('%Y-%m-%d')
                end_date = (datetime.now() - pd.DateOffset(days=1)).strftime('%Y-%m-%d')
        except Exception:
            start_date = (datetime.now() - pd.DateOffset(months=2)).strftime('%Y-%m-%d')
            end_date = (datetime.now() - pd.DateOffset(days=1)).strftime('%Y-%m-%d')
    else:
        # default: last two calendar months from example
        start_date = '2025-12-01'
        end_date = '2026-01-31'

    # Fetch weather
    try:
        weather_df_curr_month = fetch_weather_hourly(lat, lon, m1, m2)
        df_1h = weather_df_curr_month
        rows = []
        timestamps = []
        for ts, row in df_1h.iterrows():
            month_idx = ts.month
            hour = ts.hour
            dow = ts.weekday()
            air_temp = float(row.get('temperature_2m', 20.0))
            dew_temp = float(row.get('dewpoint_2m', 10.0))
            feat = make_features_for_month(req.area or 0, req.yearBuilt or 0, {}, air_temp, dew_temp, month_idx, hour, dow)
            rows.append(feat)
            timestamps.append(ts)
            if not rows:
                raise HTTPException(status_code=400, detail='No weather rows to build features for current month')
        ratios_of_models = []
        results=[]
        for name,model in LOADED_MODELS.items():
            try:
                if isinstance(model, xgb.Booster):
                    dmat = xgb.DMatrix(pd.DataFrame(rows).values, feature_names=list(pd.DataFrame(rows).columns))
                    raw_preds = model.predict(dmat)
                else:
                    raw_preds = model.predict(pd.DataFrame(rows))
                raw_preds = np.asarray(raw_preds).ravel()
                preds_orig = np.expm1(raw_preds)
                total_pred = float(np.sum(preds_orig))
                if(name == 'xgb_model_final_nonoverfitting_bestest.json'):
                    total_pred = total_pred*(req.area or 1)  # scale back up by area if model was trained on log1p(area) as feature
                ratio = None
                if req.prevTwoMonthsUsage:
                    try:
                        ratio = float(total_pred) / float(req.prevTwoMonthsUsage)
                    except Exception:
                        ratio = None
                ratios_of_models.append({'model_name': name, 'predicted_total': total_pred, 'ratio_vs_given': ratio , 'raw_preds': raw_preds.tolist()})
            except Exception as e:
                ratios_of_models.append({'model_name': name, 'error': str(e)})
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f'Failed to fetch current month weather data: {e}')
    try:
        weather_df = fetch_weather_hourly(lat, lon, start_date, end_date)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f'Weather fetch failed: {e}')

    # Downsample to every 4 hours, then resample to 1h via linear interpolation
    
    df_1h = weather_df
    # Build feature rows for each timestamp and keep timestamps for later aggregation
    rows = []
    timestamps = []
    for ts, row in df_1h.iterrows():
        month_idx = ts.month
        hour = ts.hour
        dow = ts.weekday()
        air_temp = float(row.get('temperature_2m', 20.0))
        dew_temp = float(row.get('dewpoint_2m', 10.0))
        feat = make_features_for_month(req.area or 0, req.yearBuilt or 0, {}, air_temp, dew_temp, month_idx, hour, dow)
        rows.append(feat)
        timestamps.append(ts)

    if not rows:
        raise HTTPException(status_code=400, detail='No weather rows to build features')

    features_df = pd.DataFrame(rows)

    results = []
    ratios_of_models = []
    for name, model in LOADED_MODELS.items():
        try:
            if isinstance(model, xgb.Booster):
                dmat = xgb.DMatrix(features_df.values, feature_names=list(features_df.columns))
                raw_preds = model.predict(dmat)
            else:
                raw_preds = model.predict(features_df)
            raw_preds = np.asarray(raw_preds).ravel()
            # inverse transform each prediction from log1p -> original, then sum
            preds_orig = np.expm1(raw_preds)
            print(name)
            print('\n\n')
            if(name == 'xgb_model_final_nonoverfitting_bestest.json'):
                preds_orig = preds_orig*(req.area or 1) 
            total_pred = float(np.sum(preds_orig))
            hourly_predictions = []
            daily_predictions = []
            try:
                n_hours = len(timestamps)
                # Case A: model returned one value (total for period)
                if preds_orig.size == 1:
                    total_val = float(preds_orig.ravel()[0])
                    per_hour = total_val / max(1, n_hours)
                    for ts in timestamps:
                        hourly_predictions.append({'timestamp': pd.to_datetime(ts).isoformat(), 'value': float(per_hour)})
                    # daily aggregate
                    s = pd.Series([h['value'] for h in hourly_predictions], index=pd.to_datetime(timestamps))
                    daily = s.resample('D').sum()
                    for idx, val in daily.items():
                        daily_predictions.append({'date': idx.strftime('%Y-%m-%d'), 'value': float(val)})

                
                elif len(preds_orig) == n_hours:
                    for ts, val in zip(timestamps, preds_orig):
                        hourly_predictions.append({'timestamp': pd.to_datetime(ts).isoformat(), 'value': float(val)})
                    s = pd.Series(preds_orig, index=pd.to_datetime(timestamps))
                    daily = s.resample('D').sum()
                    for idx, val in daily.items():
                        daily_predictions.append({'date': idx.strftime('%Y-%m-%d'), 'value': float(val)})

                # Case C: model returned per-day predictions (one value per unique day)
                else:
                    # try to map preds to unique days
                    uniq_days = pd.to_datetime(timestamps).normalize().unique()
                    if preds_orig.size == len(uniq_days):
                        # assign each daily value across that day's hours evenly
                        day_vals = list(np.asarray(preds_orig).ravel())
                        for day, val in zip(sorted(uniq_days), day_vals):
                            day_str = pd.to_datetime(day).strftime('%Y-%m-%d')
                            # hours in that day present in timestamps
                            day_ts = [ts for ts in timestamps if pd.to_datetime(ts).strftime('%Y-%m-%d') == day_str]
                            per_hour = float(val) / max(1, len(day_ts))
                            for ts in day_ts:
                                hourly_predictions.append({'timestamp': pd.to_datetime(ts).isoformat(), 'value': float(per_hour)})
                            daily_predictions.append({'date': day_str, 'value': float(val)})
                    else:
                        # fallback: cannot align shapes — create equal distribution from total_pred
                        per_hour = total_pred / max(1, n_hours)
                        for ts in timestamps:
                            hourly_predictions.append({'timestamp': pd.to_datetime(ts).isoformat(), 'value': float(per_hour)})
                        s = pd.Series([h['value'] for h in hourly_predictions], index=pd.to_datetime(timestamps))
                        daily = s.resample('D').sum()
                        for idx, val in daily.items():
                            daily_predictions.append({'date': idx.strftime('%Y-%m-%d'), 'value': float(val)})
            except Exception:
                # if anything goes wrong, return empty lists (frontend will show message)
                hourly_predictions = []
                daily_predictions = []

            

            results.append({
                'model_name': name,
                'predicted_total_two_months': total_pred,
                'ratio_vs_given': ratios_of_models[name],
                'hourly_predictions': hourly_predictions,
                'daily_predictions': daily_predictions,
                'after_ration' :total_pred/ratios_of_models[name] if ratios_of_models[name] else None
            })
           
        except Exception as e:
            results.append({'model_name': name, 'error': str(e)})

    return {'results': results, 'start_date': start_date, 'end_date': end_date, }


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